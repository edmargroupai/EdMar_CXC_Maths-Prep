-- P15 · Onboarding questions — solution_steps, common_errors, explanation for reveal
begin;

alter table public.question_versions disable trigger trg_qv_immutable;

-- Question 1: whole numbers
update public.question_versions
set explanation = 'Whole numbers are the set {0, 1, 2, 3, …}. They include zero and all positive counting numbers, but not fractions, decimals that are not whole, or negative numbers.'
where id = 'b2000000-0000-0000-0000-000000000001';

insert into public.solution_steps (
  question_version_id, step_no, instruction, working_blocks, result_blocks, marks
) values (
  'b2000000-0000-0000-0000-000000000001',
  1,
  'Recall the definition of whole numbers',
  '[{"type":"text","value":"Whole numbers start at 0 and continue 1, 2, 3, … without fractions or negatives."}]'::jsonb,
  '[{"type":"text","value":"0 is a whole number."}]'::jsonb,
  1
)
on conflict (question_version_id, step_no) do update set
  instruction = excluded.instruction,
  working_blocks = excluded.working_blocks,
  result_blocks = excluded.result_blocks,
  marks = excluded.marks;

insert into public.common_errors (
  question_version_id, wrong_option_key, misconception, corrective_note
) values
  (
    'b2000000-0000-0000-0000-000000000001',
    'B',
    'Treated a negative integer as a whole number.',
    'Whole numbers are not negative — -3 is an integer, not a whole number.'
  ),
  (
    'b2000000-0000-0000-0000-000000000001',
    'C',
    'Selected a fraction instead of a whole number.',
    '1/2 is a rational number, not a whole number.'
  )
on conflict do nothing;

-- Question 2: powers
update public.question_versions
set explanation = 'An exponent tells you how many times to multiply the base. For 2³, multiply 2 by itself three times: 2 × 2 × 2 = 8. Do not add the base and exponent.'
where id = 'b2000000-0000-0000-0000-000000000002';

insert into public.solution_steps (
  question_version_id, step_no, instruction, working_blocks, result_blocks, marks
) values (
  'b2000000-0000-0000-0000-000000000002',
  1,
  'Write 2³ as repeated multiplication',
  '[{"type":"text","value":"2³ = 2 × 2 × 2"}]'::jsonb,
  '[{"type":"text","value":"2 × 2 = 4, then 4 × 2 = 8."}]'::jsonb,
  1
)
on conflict (question_version_id, step_no) do update set
  instruction = excluded.instruction,
  working_blocks = excluded.working_blocks,
  result_blocks = excluded.result_blocks,
  marks = excluded.marks;

insert into public.common_errors (
  question_version_id, wrong_option_key, misconception, corrective_note
) values
  (
    'b2000000-0000-0000-0000-000000000002',
    'B',
    'Added the base and exponent instead of multiplying.',
    '2³ is not 2 + 3. Exponents mean repeated multiplication.'
  ),
  (
    'b2000000-0000-0000-0000-000000000002',
    'A',
    'Squared 2 instead of cubing it.',
    '2² = 4, but 2³ requires one more factor of 2.'
  )
on conflict do nothing;

-- Question 3: integers
update public.question_versions
set explanation = 'Integers include negative numbers, zero, and positive whole numbers. They never have a fractional or decimal part — values like 3/4, 0.75, and π are not integers.'
where id = 'b2000000-0000-0000-0000-000000000003';

insert into public.solution_steps (
  question_version_id, step_no, instruction, working_blocks, result_blocks, marks
) values (
  'b2000000-0000-0000-0000-000000000003',
  1,
  'Test each value for a fractional part',
  '[{"type":"text","value":"An integer has no fractional part."}]'::jsonb,
  '[{"type":"text","value":"-5 has no fractional part, so it is an integer."}]'::jsonb,
  1
)
on conflict (question_version_id, step_no) do update set
  instruction = excluded.instruction,
  working_blocks = excluded.working_blocks,
  result_blocks = excluded.result_blocks,
  marks = excluded.marks;

insert into public.common_errors (
  question_version_id, wrong_option_key, misconception, corrective_note
) values
  (
    'b2000000-0000-0000-0000-000000000003',
    'A',
    'Treated a fraction as an integer.',
    '3/4 is not an integer because it has a fractional part.'
  ),
  (
    'b2000000-0000-0000-0000-000000000003',
    'C',
    'Confused a terminating decimal with an integer.',
    '0.75 equals 3/4, so it is not an integer.'
  )
on conflict do nothing;

alter table public.question_versions enable trigger trg_qv_immutable;

commit;
