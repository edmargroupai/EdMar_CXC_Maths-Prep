-- P05 acceptance: content tables, indexes, and lifecycle triggers.

begin;

select plan(26);

insert into public.subjects (code, name)
values ('CSEC_MATH', 'CSEC Mathematics')
on conflict (code) do nothing;

-- tables
select has_table('public', 'questions', 'questions exists');
select has_table('public', 'question_versions', 'question_versions exists');
select has_table('public', 'question_options', 'question_options exists');
select has_table('public', 'solution_steps', 'solution_steps exists');
select has_table('public', 'common_errors', 'common_errors exists');
select has_table('public', 'question_assets', 'question_assets exists');
select has_table('public', 'math_renders', 'math_renders exists');
select has_table('public', 'question_objectives', 'question_objectives exists');
select has_table('public', 'question_skills', 'question_skills exists');
select has_table('public', 'question_sources', 'question_sources exists');
select has_table('public', 'question_payloads', 'question_payloads exists');
select has_table('public', 'question_reviews', 'question_reviews exists');
select has_table('public', 'question_quality_metrics', 'question_quality_metrics exists');
select has_table('public', 'question_reports', 'question_reports exists');
select has_table('public', 'papers', 'papers exists');
select has_table('public', 'paper_questions', 'paper_questions exists');

-- indexes (§3)
select has_index('public', 'questions', 'idx_q_published', 'idx_q_published exists');
select has_index('public', 'questions', 'idx_q_difficulty', 'idx_q_difficulty exists');
select has_index('public', 'question_versions', 'idx_qv_hash', 'idx_qv_hash exists');
select has_index('public', 'question_versions', 'idx_qv_question', 'idx_qv_question exists');
select has_index('public', 'question_payloads', 'idx_qp_free', 'idx_qp_free exists');
select has_index('public', 'papers', 'idx_papers_published', 'idx_papers_published exists');

-- answer_spec schema gate
select throws_ok(
  $sql$
    insert into public.questions (
      question_type, provenance, difficulty_band
    ) values (
      'numeric', 'original_authored', 2
    );
    insert into public.question_versions (
      question_id, version_no, stem_blocks, stem_plain, answer_spec,
      cognitive_level, normalised_hash
    )
    select
      q.id, 1, '[]'::jsonb, 'test', '{"bad": true}'::jsonb,
      'CK', 'hash-test-invalid-spec'
    from public.questions q
    order by q.created_at desc
    limit 1
  $sql$,
  '23514',
  null,
  'invalid answer_spec rejected by trg_validate_answer_spec'
);

-- status transition: draft → published is illegal
insert into public.questions (
  id, question_type, provenance, difficulty_band, status
) values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'numeric', 'original_authored', 2, 'draft'
);

select throws_ok(
  $sql$
    update public.questions
    set status = 'published'
    where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  $sql$,
  '23514',
  null,
  'draft → published status transition rejected'
);

-- immutability: published versions cannot be edited (except embedding / validation_report)
insert into public.questions (
  id, question_type, provenance, difficulty_band
) values (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'numeric', 'original_authored', 3
);

insert into public.question_versions (
  id, question_id, version_no, stem_blocks, stem_plain, answer_spec,
  cognitive_level, normalised_hash, published_at
) values (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  1,
  '[]'::jsonb,
  'immutable stem',
  '{
    "answerType": "numeric_exact",
    "canonicalValue": "42",
    "displayValue": "42",
    "acceptedForms": ["42"],
    "normalisation": "numeric_default"
  }'::jsonb,
  'CK',
  'hash-immutable-test',
  timezone('utc', now())
);

select throws_ok(
  $sql$
    update public.question_versions
    set stem_plain = 'changed'
    where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
  $sql$,
  '23514',
  null,
  'published question version is immutable'
);

select lives_ok(
  $sql$
    update public.question_versions
    set validation_report = '{"status": "passed"}'::jsonb
    where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
  $sql$,
  'embedding and validation_report may be updated on published versions'
);

select * from finish();

rollback;
