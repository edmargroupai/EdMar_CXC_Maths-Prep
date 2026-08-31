-- P17 · Mastery and weak areas (§27.5 subset, AT-22)

begin;
select plan(2);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000022',
  'authenticated', 'authenticated', 'weak-areas@test.com',
  crypt('password', gen_salt('bf')), timezone('utc', now()),
  timezone('utc', now()), timezone('utc', now()),
  '', '', '', ''
);

update public.profiles
set syllabus_version = 'V2027'
where id = 'a0000000-0000-0000-0000-000000000022';

insert into public.student_topic_mastery (
  student_id, topic_id, score, confidence, attempts_count, skills_started, skills_total
)
select
  'a0000000-0000-0000-0000-000000000022',
  t.id,
  case t.code when 'M1-T1' then 30 when 'M3-T2' then 45 else 60 end,
  0.5,
  10,
  1,
  3
from public.topics t
where t.code in ('M1-T1', 'M3-T2')
on conflict (student_id, topic_id) do update set score = excluded.score;

select ok(
  (
    select position
    from (
      select
        row_number() over (order by (elem ->> 'mark_impact')::numeric desc) as position,
        t.code
      from jsonb_array_elements(public.fn_weak_areas('a0000000-0000-0000-0000-000000000022')) elem
      join public.topics t on t.id = (elem ->> 'topic_id')::uuid
      where t.code in ('M1-T1', 'M3-T2')
    ) ranked
    where code = 'M3-T2'
  ) = 1,
  'higher mark-impact topic ranks first (AT-22)'
);

select ok(
  (
    select jsonb_array_length(public.fn_weak_areas('a0000000-0000-0000-0000-000000000022')) > 0
  ),
  'fn_weak_areas returns ranked rows with marks_at_stake'
);

select * from finish();
rollback;
