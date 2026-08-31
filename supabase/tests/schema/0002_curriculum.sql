-- P04 acceptance: curriculum tables exist with expected constraints.

begin;

select plan(16);

select has_table('public', 'subjects', 'subjects exists');
select has_table('public', 'syllabus_versions', 'syllabus_versions exists');
select has_table('public', 'modules', 'modules exists');
select has_table('public', 'topics', 'topics exists');
select has_table('public', 'subtopics', 'subtopics exists');
select has_table('public', 'specific_objectives', 'specific_objectives exists');
select has_table('public', 'skills', 'skills exists');
select has_table('public', 'skill_prerequisites', 'skill_prerequisites exists');
select has_table('public', 'skill_objectives', 'skill_objectives exists');
select has_table('public', 'objective_mappings', 'objective_mappings exists');

select col_is_pk('public', 'subjects', 'code', 'subjects.code is PK');
select col_is_pk('public', 'syllabus_versions', 'code', 'syllabus_versions.code is PK');

select has_index('public', 'topics', 'idx_topics_syllabus', 'idx_topics_syllabus exists');
select has_index(
  'public',
  'specific_objectives',
  'idx_so_review',
  'idx_so_review exists'
);

-- skill prerequisite cycle prevention
insert into public.skills (code, name) values
  ('TEST_SKILL_A', 'Test A'),
  ('TEST_SKILL_B', 'Test B');

insert into public.skill_prerequisites (skill_id, prerequisite_skill_id)
select a.id, b.id
from public.skills a
join public.skills b on b.code = 'TEST_SKILL_B'
where a.code = 'TEST_SKILL_A';

select throws_ok(
  $sql$
    insert into public.skill_prerequisites (skill_id, prerequisite_skill_id)
    select b.id, a.id
    from public.skills a
    join public.skills b on b.code = 'TEST_SKILL_B'
    where a.code = 'TEST_SKILL_A'
  $sql$,
  '23514',
  null,
  'skill prerequisite cycle is rejected'
);

select ok(
  (select count(*) = 0 from public.skill_prerequisites sp
   join public.skills s on s.id = sp.skill_id
   where s.code = 'TEST_SKILL_A' and sp.skill_id = sp.prerequisite_skill_id),
  'self prerequisite blocked by check constraint'
);

select * from finish();

rollback;
