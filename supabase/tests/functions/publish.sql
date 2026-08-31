-- P09 · fn_publish_question precondition failures

begin;

select plan(11);

-- fixture users
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  'f0000000-0000-0000-0000-000000000001',
  'authenticated', 'authenticated', 'reviewer@test.com',
  crypt('password', gen_salt('bf')), timezone('utc', now()),
  timezone('utc', now()), timezone('utc', now()),
  '', '', '', ''
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  'f0000000-0000-0000-0000-000000000002',
  'authenticated', 'authenticated', 'content-admin@test.com',
  crypt('password', gen_salt('bf')), timezone('utc', now()),
  timezone('utc', now()), timezone('utc', now()),
  '', '', '', ''
);

update public.profiles set role = 'reviewer'
where id = 'f0000000-0000-0000-0000-000000000001';

update public.profiles set role = 'content_admin'
where id = 'f0000000-0000-0000-0000-000000000002';

alter table public.questions disable trigger trg_question_status_transition;

insert into public.questions (
  id, question_type, provenance, difficulty_band, status, is_free, created_by
) values (
  'f1000000-0000-0000-0000-000000000001',
  'numeric', 'original_authored', 2, 'approved', true,
  'f0000000-0000-0000-0000-000000000002'
);

insert into public.question_versions (
  id, question_id, version_no, stem_blocks, stem_plain, answer_spec,
  concepts_required, strategy_blocks, final_answer_blocks, why_this_works, exam_tip,
  quick_check, cognitive_level, normalised_hash, verification, validation_report
) values (
  'f2000000-0000-0000-0000-000000000001',
  'f1000000-0000-0000-0000-000000000001',
  1,
  '[{"type":"text","value":"Test stem"}]'::jsonb,
  'Test stem',
  '{
    "answerType": "numeric_exact",
    "canonicalValue": "42",
    "displayValue": "42",
    "acceptedForms": ["42"],
    "normalisation": "numeric_default"
  }'::jsonb,
  '[{"objectiveId":"00000000-0000-0000-0000-000000000001","code":"X","label":"Test"}]'::jsonb,
  '[{"type":"text","value":"Strategy"}]'::jsonb,
  '[{"type":"text","value":"Final"}]'::jsonb,
  '[{"type":"text","value":"Why"}]'::jsonb,
  '[{"type":"text","value":"Tip"}]'::jsonb,
  '{"promptBlocks":[{"type":"text","value":"Quick"}],"answerSpec":{"answerType":"boolean","canonicalValue":"true","displayValue":"true","acceptedForms":["true"],"normalisation":"default"}}'::jsonb,
  'CK',
  'pub-hash-1',
  'verified',
  '{"status":"passed"}'::jsonb
);

insert into public.solution_steps (
  question_version_id, step_no, instruction, working_blocks, result_blocks
) values (
  'f2000000-0000-0000-0000-000000000001', 1, 'Step one', '[]'::jsonb, '[]'::jsonb
);

insert into public.common_errors (
  question_version_id, wrong_value, misconception, corrective_note
) values
  ('f2000000-0000-0000-0000-000000000001', '41', 'Off by one', 'Check arithmetic'),
  ('f2000000-0000-0000-0000-000000000001', '43', 'Off by one other', 'Check again');

insert into public.question_reviews (
  question_id, question_version_id, reviewer_id, decision, note
) values (
  'f1000000-0000-0000-0000-000000000001',
  'f2000000-0000-0000-0000-000000000001',
  'f0000000-0000-0000-0000-000000000001',
  'approved', 'Looks good'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-000000000001"}', true);

select throws_ok(
  $$ select public.fn_publish_question(
    'f1000000-0000-0000-0000-000000000001',
    'f2000000-0000-0000-0000-000000000001',
    'test'
  ) $$,
  'P0001',
  null,
  'reviewer cannot publish'
);

reset role;

select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-000000000002"}', true);
set local role authenticated;

select throws_ok(
  $$ select public.fn_publish_question(
    'f1000000-0000-0000-0000-000000000001',
    'f2000000-0000-0000-0000-000000000001',
    'test'
  ) $$,
  'P0011',
  null,
  'publish refuses missing objectives'
);

reset role;

insert into public.skills (id, code, name)
values ('f3000000-0000-0000-0000-000000000001', 'PUB_TEST_SKILL', 'Publish test skill')
on conflict (code) do nothing;

-- pick a real objective from seed
insert into public.question_objectives (question_id, specific_objective_id, is_primary)
select
  'f1000000-0000-0000-0000-000000000001',
  so.id,
  true
from public.specific_objectives so
order by so.code
limit 1;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-000000000002"}', true);

select throws_ok(
  $$ select public.fn_publish_question(
    'f1000000-0000-0000-0000-000000000001',
    'f2000000-0000-0000-0000-000000000001',
    'test'
  ) $$,
  'P0012',
  null,
  'publish refuses missing skills'
);

reset role;

insert into public.question_skills (question_id, skill_id)
values ('f1000000-0000-0000-0000-000000000001', 'f3000000-0000-0000-0000-000000000001');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-000000000002"}', true);

update public.question_versions
set verification = 'unverified'
where id = 'f2000000-0000-0000-0000-000000000001';

select throws_ok(
  $$ select public.fn_publish_question(
    'f1000000-0000-0000-0000-000000000001',
    'f2000000-0000-0000-0000-000000000001',
    'test'
  ) $$,
  'P0013',
  null,
  'publish refuses unverified version'
);

update public.question_versions set verification = 'verified' where id = 'f2000000-0000-0000-0000-000000000001';

update public.questions set rights_status = 'third_party_unlicensed'
where id = 'f1000000-0000-0000-0000-000000000001';

select throws_ok(
  $$ select public.fn_publish_question(
    'f1000000-0000-0000-0000-000000000001',
    'f2000000-0000-0000-0000-000000000001',
    'test'
  ) $$,
  'P0013',
  null,
  'publish refuses uncleared rights'
);

update public.questions set rights_status = 'edmar_owned'
where id = 'f1000000-0000-0000-0000-000000000001';

update public.solution_steps
set instruction = 'AUTO-DERIVED placeholder'
where question_version_id = 'f2000000-0000-0000-0000-000000000001';

select throws_ok(
  $$ select public.fn_publish_question(
    'f1000000-0000-0000-0000-000000000001',
    'f2000000-0000-0000-0000-000000000001',
    'test'
  ) $$,
  'P0013',
  null,
  'publish refuses AUTO-DERIVED solution steps'
);

reset role;

update public.solution_steps
set instruction = 'Real authored step'
where question_version_id = 'f2000000-0000-0000-0000-000000000001';

alter table public.question_versions disable trigger trg_validate_answer_spec;

update public.question_versions
set answer_spec = '{"answerType":"numeric_exact","canonicalValue":"99","displayValue":"42","acceptedForms":["42"],"normalisation":"numeric_default"}'::jsonb
where id = 'f2000000-0000-0000-0000-000000000001';

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-000000000002"}', true);

select throws_ok(
  $$ select public.fn_publish_question(
    'f1000000-0000-0000-0000-000000000001',
    'f2000000-0000-0000-0000-000000000001',
    'test'
  ) $$,
  'P0013',
  null,
  'publish refuses round-trip failure'
);

reset role;

alter table public.question_versions enable trigger trg_validate_answer_spec;

update public.question_versions
set answer_spec = '{
  "answerType": "numeric_exact",
  "canonicalValue": "42",
  "displayValue": "42",
  "acceptedForms": ["42"],
  "normalisation": "numeric_default"
}'::jsonb
where id = 'f2000000-0000-0000-0000-000000000001';

delete from public.common_errors
where question_version_id = 'f2000000-0000-0000-0000-000000000001'
  and wrong_value = '43';

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-000000000002"}', true);

select throws_ok(
  $$ select public.fn_publish_question(
    'f1000000-0000-0000-0000-000000000001',
    'f2000000-0000-0000-0000-000000000001',
    'test'
  ) $$,
  'P0013',
  null,
  'publish refuses fewer than two common errors'
);

insert into public.common_errors (
  question_version_id, wrong_value, misconception, corrective_note
) values (
  'f2000000-0000-0000-0000-000000000001', '43', 'Off by one other', 'Check again'
);

reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-000000000002"}', true);

select public.fn_publish_question(
  'f1000000-0000-0000-0000-000000000001',
  'f2000000-0000-0000-0000-000000000001',
  'integration test publish'
);

select ok(
  exists (
    select 1 from public.question_payloads
    where question_version_id = 'f2000000-0000-0000-0000-000000000001'
  ),
  'successful publish creates payload row'
);

select ok(
  not (public.fn_build_question_payload('f2000000-0000-0000-0000-000000000001') ? 'solutionSteps'),
  'pre-answer payload excludes solutionSteps'
);

select ok(
  not (public.fn_build_question_payload('f2000000-0000-0000-0000-000000000001') ? 'commonErrors'),
  'pre-answer payload excludes commonErrors'
);

select * from finish();

rollback;
