-- P09 · fn_create_practice_session simplified selection tests (§27.3 subset)

begin;

select plan(7);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000011',
  'authenticated', 'authenticated', 'sel-student@test.com',
  crypt('password', gen_salt('bf')), timezone('utc', now()),
  timezone('utc', now()), timezone('utc', now()),
  '', '', '', ''
);

do $$
declare
  v_topic uuid;
  v_objective uuid;
begin
  select t.id, so.id into v_topic, v_objective
  from public.topics t
  join public.specific_objectives so on so.topic_id = t.id
  where t.syllabus_code = 'V2027'
    and not exists (
      select 1
      from public.question_objectives qo
      join public.questions q on q.id = qo.question_id
      where qo.specific_objective_id = so.id
        and q.status = 'published'
    )
  order by t.sequence, so.sequence
  limit 1;

  perform set_config('test.sel_topic', v_topic::text, true);
  perform set_config('test.sel_objective', v_objective::text, true);
end;
$$;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000011"}', true);

select throws_ok(
  $$ select public.fn_create_practice_session(
    'topic'::public.practice_mode,
    'objective',
    array['00000000-0000-0000-0000-000000000099']::uuid[],
    5::smallint,
    'mixed',
    null
  ) $$,
  '22023',
  null,
  'scope_empty raises for unknown objective'
);

select throws_ok(
  $$ select public.fn_create_practice_session(
    'topic'::public.practice_mode,
    'topic',
    array[ current_setting('test.sel_topic')::uuid ],
    5::smallint,
    'mixed',
    null
  ) $$,
  'P0003',
  null,
  'no_questions_available when topic has no published questions'
);

reset role;

alter table public.questions disable trigger trg_question_status_transition;

insert into public.questions (
  id, question_type, provenance, difficulty_band, status, is_free, current_version_id
) values (
  'a1000000-0000-0000-0000-000000000011',
  'numeric', 'original_authored', 4, 'published', true,
  'a2000000-0000-0000-0000-000000000011'
);

insert into public.question_versions (
  id, question_id, version_no, stem_blocks, stem_plain, answer_spec,
  concepts_required, strategy_blocks, final_answer_blocks, why_this_works, exam_tip,
  quick_check, cognitive_level, normalised_hash, verification, published_at
) values (
  'a2000000-0000-0000-0000-000000000011',
  'a1000000-0000-0000-0000-000000000011',
  1,
  '[{"type":"text","value":"Selection test"}]'::jsonb,
  'Selection test',
  '{"answerType":"numeric_exact","canonicalValue":"1","displayValue":"1","acceptedForms":["1"],"normalisation":"numeric_default"}'::jsonb,
  '[{"objectiveId":"00000000-0000-0000-0000-000000000001","code":"T","label":"T"}]'::jsonb,
  '[{"type":"text","value":"S"}]'::jsonb,
  '[{"type":"text","value":"F"}]'::jsonb,
  '[{"type":"text","value":"W"}]'::jsonb,
  '[{"type":"text","value":"E"}]'::jsonb,
  '{"promptBlocks":[{"type":"text","value":"Q"}],"answerSpec":{"answerType":"boolean","canonicalValue":"true","displayValue":"true","acceptedForms":["true"],"normalisation":"default"}}'::jsonb,
  'CK',
  'sel-hash-1',
  'verified',
  timezone('utc', now())
);

insert into public.question_objectives (question_id, specific_objective_id, is_primary)
values (
  'a1000000-0000-0000-0000-000000000011',
  current_setting('test.sel_objective')::uuid,
  true
);

insert into public.question_payloads (
  question_version_id, question_id, payload, payload_bytes, content_version, is_free
) values (
  'a2000000-0000-0000-0000-000000000011',
  'a1000000-0000-0000-0000-000000000011',
  '{"stemBlocks":[]}'::jsonb,
  16,
  1,
  true
);

set constraints all immediate;
alter table public.questions enable trigger trg_question_status_transition;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000011"}', true);

select ok(
  (public.fn_create_practice_session(
    'topic'::public.practice_mode,
    'topic',
    array[ current_setting('test.sel_topic')::uuid ],
    1::smallint,
    'mixed',
    42
  ) ->> 'delivered_count')::integer >= 1,
  'session delivers at least one question when eligible'
);

select ok(
  (public.fn_create_practice_session(
    'topic'::public.practice_mode,
    'topic',
    array[ current_setting('test.sel_topic')::uuid ],
    1::smallint,
    'challenge',
    42
  ) -> 'items' -> 0 ->> 'question_id') is not null,
  'challenge mode returns an item'
);

reset role;

insert into public.student_daily_usage (student_id, usage_date, questions_served)
values ('a0000000-0000-0000-0000-000000000011', current_date, 10)
on conflict (student_id, usage_date) do update
set questions_served = 10;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000011"}', true);

select throws_ok(
  $$ select public.fn_create_practice_session(
    'topic'::public.practice_mode,
    'topic',
    array[ current_setting('test.sel_topic')::uuid ],
    5::smallint,
    'mixed',
    null
  ) $$,
  'P0001',
  null,
  'entitlement_exhausted when daily allowance is zero'
);

select ok(
  public.fn_resolve_scope(
    'topic',
    array[ current_setting('test.sel_topic')::uuid ],
    'V2027'::public.syllabus_code
  ) is not null,
  'fn_resolve_scope returns objectives for a topic'
);

select ok(
  public.fn_check_daily_allowance('a0000000-0000-0000-0000-000000000011', 5::smallint) = 0,
  'fn_check_daily_allowance returns zero when exhausted'
);

select * from finish();

rollback;
