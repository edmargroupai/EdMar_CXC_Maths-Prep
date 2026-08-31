-- P13 · Onboarding practice pool — three published free MCQ questions (original_authored)
begin;

insert into public.skills (id, code, name, description, is_active)
values (
  'b3000000-0000-0000-0000-000000000001',
  'ONBOARD_NUM_SETS',
  'Identify number sets',
  'Recognise whole numbers, integers, and related sets.',
  true
)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  is_active = excluded.is_active;

alter table public.questions disable trigger trg_question_status_transition;

-- Question 1
insert into public.questions (
  id, question_type, provenance, rights_status, difficulty_band, status, is_free, current_version_id
) values (
  'b1000000-0000-0000-0000-000000000001',
  'multiple_choice', 'original_authored', 'edmar_owned', 1, 'published', true,
  'b2000000-0000-0000-0000-000000000001'
);

insert into public.question_versions (
  id, question_id, version_no, stem_blocks, stem_plain, answer_spec,
  concepts_required, strategy_blocks, final_answer_blocks, why_this_works, exam_tip,
  quick_check, cognitive_level, normalised_hash, verification, published_at
) values (
  'b2000000-0000-0000-0000-000000000001',
  'b1000000-0000-0000-0000-000000000001',
  1,
  '[{"type":"text","value":"Which of the following is a whole number?"}]'::jsonb,
  'Which of the following is a whole number?',
  '{"answerType":"option_id","canonicalValue":"A","displayValue":"A","acceptedForms":["A","a"],"normalisation":"default"}'::jsonb,
  '[{"objectiveId":"00000000-0000-0000-0000-000000000001","code":"M1-1.1","label":"Number sets"}]'::jsonb,
  '[{"type":"text","value":"Whole numbers include 0 and the positive counting numbers."}]'::jsonb,
  '[{"type":"text","value":"0 is a whole number."}]'::jsonb,
  '[{"type":"text","value":"Whole numbers are non-negative integers."}]'::jsonb,
  '[{"type":"text","value":"Remember that 0 is included in the whole numbers."}]'::jsonb,
  '{"promptBlocks":[{"type":"text","value":"Is 0 a whole number?"}],"answerSpec":{"answerType":"boolean","canonicalValue":"true","displayValue":"true","acceptedForms":["true"],"normalisation":"default"}}'::jsonb,
  'CK',
  'onboard-hash-1',
  'verified',
  timezone('utc', now())
);

insert into public.question_options (
  question_version_id, option_key, content_blocks, content_plain, is_correct, sequence
) values
  ('b2000000-0000-0000-0000-000000000001', 'A', '[{"type":"text","value":"0"}]'::jsonb, '0', true, 1),
  ('b2000000-0000-0000-0000-000000000001', 'B', '[{"type":"text","value":"-3"}]'::jsonb, '-3', false, 2),
  ('b2000000-0000-0000-0000-000000000001', 'C', '[{"type":"text","value":"1/2"}]'::jsonb, '1/2', false, 3),
  ('b2000000-0000-0000-0000-000000000001', 'D', '[{"type":"text","value":"√2"}]'::jsonb, '√2', false, 4);

-- Question 2
insert into public.questions (
  id, question_type, provenance, rights_status, difficulty_band, status, is_free, current_version_id
) values (
  'b1000000-0000-0000-0000-000000000002',
  'multiple_choice', 'original_authored', 'edmar_owned', 2, 'published', true,
  'b2000000-0000-0000-0000-000000000002'
);

insert into public.question_versions (
  id, question_id, version_no, stem_blocks, stem_plain, answer_spec,
  concepts_required, strategy_blocks, final_answer_blocks, why_this_works, exam_tip,
  quick_check, cognitive_level, normalised_hash, verification, published_at
) values (
  'b2000000-0000-0000-0000-000000000002',
  'b1000000-0000-0000-0000-000000000002',
  1,
  '[{"type":"text","value":"What is 2³?"}]'::jsonb,
  'What is 2³?',
  '{"answerType":"option_id","canonicalValue":"C","displayValue":"C","acceptedForms":["C","c"],"normalisation":"default"}'::jsonb,
  '[{"objectiveId":"00000000-0000-0000-0000-000000000001","code":"M1-1.2","label":"Powers"}]'::jsonb,
  '[{"type":"text","value":"Evaluate the power by repeated multiplication."}]'::jsonb,
  '[{"type":"text","value":"2³ = 8."}]'::jsonb,
  '[{"type":"text","value":"2³ means 2 × 2 × 2."}]'::jsonb,
  '[{"type":"text","value":"Write out the factors when unsure."}]'::jsonb,
  '{"promptBlocks":[{"type":"text","value":"Is 2³ equal to 6?"}],"answerSpec":{"answerType":"boolean","canonicalValue":"false","displayValue":"false","acceptedForms":["false"],"normalisation":"default"}}'::jsonb,
  'CK',
  'onboard-hash-2',
  'verified',
  timezone('utc', now())
);

insert into public.question_options (
  question_version_id, option_key, content_blocks, content_plain, is_correct, sequence
) values
  ('b2000000-0000-0000-0000-000000000002', 'A', '[{"type":"text","value":"4"}]'::jsonb, '4', false, 1),
  ('b2000000-0000-0000-0000-000000000002', 'B', '[{"type":"text","value":"6"}]'::jsonb, '6', false, 2),
  ('b2000000-0000-0000-0000-000000000002', 'C', '[{"type":"text","value":"8"}]'::jsonb, '8', true, 3),
  ('b2000000-0000-0000-0000-000000000002', 'D', '[{"type":"text","value":"9"}]'::jsonb, '9', false, 4);

-- Question 3
insert into public.questions (
  id, question_type, provenance, rights_status, difficulty_band, status, is_free, current_version_id
) values (
  'b1000000-0000-0000-0000-000000000003',
  'multiple_choice', 'original_authored', 'edmar_owned', 2, 'published', true,
  'b2000000-0000-0000-0000-000000000003'
);

insert into public.question_versions (
  id, question_id, version_no, stem_blocks, stem_plain, answer_spec,
  concepts_required, strategy_blocks, final_answer_blocks, why_this_works, exam_tip,
  quick_check, cognitive_level, normalised_hash, verification, published_at
) values (
  'b2000000-0000-0000-0000-000000000003',
  'b1000000-0000-0000-0000-000000000003',
  1,
  '[{"type":"text","value":"Which value is an integer?"}]'::jsonb,
  'Which value is an integer?',
  '{"answerType":"option_id","canonicalValue":"B","displayValue":"B","acceptedForms":["B","b"],"normalisation":"default"}'::jsonb,
  '[{"objectiveId":"00000000-0000-0000-0000-000000000001","code":"M1-1.1","label":"Number sets"}]'::jsonb,
  '[{"type":"text","value":"Integers include negative numbers, zero, and positive whole numbers."}]'::jsonb,
  '[{"type":"text","value":"-5 is an integer."}]'::jsonb,
  '[{"type":"text","value":"Integers have no fractional part."}]'::jsonb,
  '[{"type":"text","value":"Fractions and surds are not integers."}]'::jsonb,
  '{"promptBlocks":[{"type":"text","value":"Is -5 an integer?"}],"answerSpec":{"answerType":"boolean","canonicalValue":"true","displayValue":"true","acceptedForms":["true"],"normalisation":"default"}}'::jsonb,
  'CK',
  'onboard-hash-3',
  'verified',
  timezone('utc', now())
);

insert into public.question_options (
  question_version_id, option_key, content_blocks, content_plain, is_correct, sequence
) values
  ('b2000000-0000-0000-0000-000000000003', 'A', '[{"type":"text","value":"3/4"}]'::jsonb, '3/4', false, 1),
  ('b2000000-0000-0000-0000-000000000003', 'B', '[{"type":"text","value":"-5"}]'::jsonb, '-5', true, 2),
  ('b2000000-0000-0000-0000-000000000003', 'C', '[{"type":"text","value":"0.75"}]'::jsonb, '0.75', false, 3),
  ('b2000000-0000-0000-0000-000000000003', 'D', '[{"type":"text","value":"π"}]'::jsonb, 'π', false, 4);

insert into public.question_objectives (question_id, specific_objective_id, is_primary)
select q.id, so.id, true
from (
  values
    ('b1000000-0000-0000-0000-000000000001'::uuid),
    ('b1000000-0000-0000-0000-000000000002'::uuid),
    ('b1000000-0000-0000-0000-000000000003'::uuid)
) as q(id),
lateral (
  select so.id
  from public.specific_objectives so
  join public.topics t on t.id = so.topic_id
  where t.syllabus_code = 'V2027'::public.syllabus_code
    and t.code = 'M1-T1'
  order by so.sequence
  limit 1
) so;

insert into public.question_skills (question_id, skill_id)
select q.id, 'b3000000-0000-0000-0000-000000000001'::uuid
from (
  values
    ('b1000000-0000-0000-0000-000000000001'::uuid),
    ('b1000000-0000-0000-0000-000000000002'::uuid),
    ('b1000000-0000-0000-0000-000000000003'::uuid)
) as q(id);

insert into public.question_payloads (
  question_version_id, question_id, payload, payload_bytes, content_version, is_free
)
select
  v.id,
  q.id,
  public.fn_build_question_payload(v.id),
  octet_length(public.fn_build_question_payload(v.id)::text),
  coalesce((select (value #>> '{}')::bigint from public.app_config where key = 'content_version'), 1),
  true
from public.questions q
join public.question_versions v on v.id = q.current_version_id
where q.id in (
  'b1000000-0000-0000-0000-000000000001',
  'b1000000-0000-0000-0000-000000000002',
  'b1000000-0000-0000-0000-000000000003'
)
on conflict (question_version_id) do update set
  payload = excluded.payload,
  payload_bytes = excluded.payload_bytes,
  is_free = excluded.is_free;

set constraints all immediate;
alter table public.questions enable trigger trg_question_status_transition;

commit;
