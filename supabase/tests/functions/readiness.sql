-- P17c · Readiness and projection gates (§42)

begin;
select plan(4);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000033',
  'authenticated', 'authenticated', 'readiness@test.com',
  crypt('password', gen_salt('bf')), timezone('utc', now()),
  timezone('utc', now()), timezone('utc', now()),
  '', '', '', ''
);

update public.profiles
set syllabus_version = 'V2027'
where id = 'a0000000-0000-0000-0000-000000000033';

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000033"}', true);

select ok(
  (public.fn_get_readiness('a0000000-0000-0000-0000-000000000033') ->> 'withheld_reason')
    = 'insufficient_attempts',
  'readiness withheld without enough attempts'
);

select ok(
  (public.fn_get_grade_projection('a0000000-0000-0000-0000-000000000033') ->> 'withheld_reason')
    in ('insufficient_coverage', 'no_simulation', 'not_entitled'),
  'projection withheld for sparse evidence or free tier'
);

select has_table('public', 'readiness_snapshots', 'readiness_snapshots exists');
select has_table('public', 'grade_projections', 'grade_projections exists');

select * from finish();
rollback;
