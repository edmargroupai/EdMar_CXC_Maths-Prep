-- P07 acceptance: representative §5.2 / §27.4 RLS cases.

begin;

select plan(8);

-- ── fixture users (postgres bypasses RLS) ───────────────────────────────────

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-0000-0000-000000000001',
    'authenticated', 'authenticated', 'student-a@test.com',
    crypt('password', gen_salt('bf')), timezone('utc', now()),
    timezone('utc', now()), timezone('utc', now()),
    '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-0000-0000-000000000002',
    'authenticated', 'authenticated', 'student-b@test.com',
    crypt('password', gen_salt('bf')), timezone('utc', now()),
    timezone('utc', now()), timezone('utc', now()),
    '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-0000-0000-000000000003',
    'authenticated', 'authenticated', 'support@test.com',
    crypt('password', gen_salt('bf')), timezone('utc', now()),
    timezone('utc', now()), timezone('utc', now()),
    '', '', '', ''
  );

update public.profiles set role = 'support'
where id = 'a0000000-0000-0000-0000-000000000003';

update public.entitlements
set tier = 'premium', status = 'active'
where student_id = 'a0000000-0000-0000-0000-000000000002';

-- ── fixture questions & payloads ─────────────────────────────────────────────

alter table public.questions disable trigger trg_question_status_transition;

insert into public.questions (
  id, question_type, provenance, difficulty_band, status, is_free
) values
  (
    'b0000000-0000-0000-0000-000000000001',
    'numeric', 'original_authored', 2, 'draft', false
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'numeric', 'original_authored', 2, 'draft', true
  ),
  (
    'b0000000-0000-0000-0000-000000000003',
    'numeric', 'original_authored', 3, 'draft', false
  );

insert into public.question_versions (
  id, question_id, version_no, stem_blocks, stem_plain, answer_spec,
  cognitive_level, normalised_hash, published_at
) values
  (
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000002',
    1, '[]'::jsonb, 'free published',
    '{
      "answerType": "numeric_exact",
      "canonicalValue": "1",
      "displayValue": "1",
      "acceptedForms": ["1"],
      "normalisation": "numeric_default"
    }'::jsonb,
    'CK', 'hash-free-pub', timezone('utc', now())
  ),
  (
    'c0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000003',
    1, '[]'::jsonb, 'premium published',
    '{
      "answerType": "numeric_exact",
      "canonicalValue": "2",
      "displayValue": "2",
      "acceptedForms": ["2"],
      "normalisation": "numeric_default"
    }'::jsonb,
    'CK', 'hash-premium-pub', timezone('utc', now())
  );

update public.questions
set
  status = 'published',
  current_version_id = 'c0000000-0000-0000-0000-000000000001'
where id = 'b0000000-0000-0000-0000-000000000002';

update public.questions
set
  status = 'published',
  current_version_id = 'c0000000-0000-0000-0000-000000000002'
where id = 'b0000000-0000-0000-0000-000000000003';

set constraints all immediate;

alter table public.questions enable trigger trg_question_status_transition;

insert into public.question_payloads (
  question_version_id, question_id, payload, payload_bytes, content_version, is_free
) values
  (
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000002',
    '{"stem": "free"}'::jsonb, 12, 1, true
  ),
  (
    'c0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000003',
    '{"stem": "premium"}'::jsonb, 16, 1, false
  );

insert into public.attempts (
  client_attempt_id, student_id, question_id, question_version_id,
  is_correct, difficulty_band
) values
  (
    'd0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000001',
    true, 2
  ),
  (
    'd0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000001',
    false, 2
  );

-- ── student A: cannot see draft questions ───────────────────────────────────

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000001"}', true);

select is_empty(
  $$ select 1 from public.questions where id = 'b0000000-0000-0000-0000-000000000001' $$,
  'student cannot read a draft question'
);

select isnt_empty(
  $$ select 1 from public.questions where id = 'b0000000-0000-0000-0000-000000000002' $$,
  'student can read a published question'
);

select isnt_empty(
  $$ select 1 from public.question_payloads where question_id = 'b0000000-0000-0000-0000-000000000002' $$,
  'free student can read a free published payload'
);

select is_empty(
  $$ select 1 from public.question_payloads where question_id = 'b0000000-0000-0000-0000-000000000003' $$,
  'free student cannot read a premium payload'
);

select is_empty(
  $$ select 1 from public.attempts where student_id = 'a0000000-0000-0000-0000-000000000002' $$,
  'student cannot read another student''s attempts'
);

select is_empty(
  $$ update public.attempts set is_correct = false where student_id = auth.uid() returning 1 $$,
  'student cannot update attempts (zero rows affected)'
);

reset role;
select set_config('request.jwt.claims', 'null', true);

-- ── premium student B ───────────────────────────────────────────────────────

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000002"}', true);

select isnt_empty(
  $$ select 1 from public.question_payloads where question_id = 'b0000000-0000-0000-0000-000000000003' $$,
  'premium student can read a premium payload'
);

reset role;
select set_config('request.jwt.claims', 'null', true);

-- ── support cannot update entitlements to self-grant premium ─────────────────

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000001"}', true);

select is_empty(
  $$ update public.entitlements set tier = 'premium' where student_id = auth.uid() returning 1 $$,
  'student cannot grant themselves premium'
);

reset role;
select set_config('request.jwt.claims', 'null', true);

select * from finish();

rollback;
