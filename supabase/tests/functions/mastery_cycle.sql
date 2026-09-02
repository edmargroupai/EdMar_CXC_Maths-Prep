-- ADR-023 · Mastery cycle evaluation tests

begin;
select plan(8);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000023',
  'authenticated', 'authenticated', 'cycle@test.com',
  crypt('password', gen_salt('bf')), timezone('utc', now()),
  timezone('utc', now()), timezone('utc', now()),
  '', '', '', ''
);

update public.profiles
set syllabus_version = 'V2027'
where id = 'a0000000-0000-0000-0000-000000000023';

select is(
  (public.fn_evaluate_cycle_from_counts(
    'a0000000-0000-0000-0000-000000000023',
    '00000000-0000-0000-0000-000000000001',
    18::smallint, 20::smallint, true, true
  ) ->> 'verdict'),
  'mastered',
  '18/20 + coverage + prereqs → mastered'
);

select is(
  (public.fn_evaluate_cycle_from_counts(
    'a0000000-0000-0000-0000-000000000023',
    '00000000-0000-0000-0000-000000000001',
    18::smallint, 20::smallint, false, true
  ) ->> 'verdict'),
  'remediation',
  '18/20 + missing skill coverage → NOT mastered'
);

select is(
  (public.fn_evaluate_cycle_from_counts(
    'a0000000-0000-0000-0000-000000000023',
    '00000000-0000-0000-0000-000000000001',
    18::smallint, 20::smallint, true, false
  ) ->> 'verdict'),
  'prerequisite_remediation',
  '18/20 + missing critical prerequisite → NOT mastered'
);

select is(
  (public.fn_evaluate_cycle_from_counts(
    'a0000000-0000-0000-0000-000000000023',
    '00000000-0000-0000-0000-000000000001',
    17::smallint, 20::smallint, true, true
  ) ->> 'remediation_band'),
  'near',
  '17/20 → near remediation band'
);

select is(
  (public.fn_evaluate_cycle_from_counts(
    'a0000000-0000-0000-0000-000000000023',
    '00000000-0000-0000-0000-000000000001',
    17::smallint, 20::smallint, true, true
  ) ->> 'remediation_remaining'),
  '5',
  '17/20 → 5 targeted remediation questions'
);

select is(
  (public.fn_evaluate_cycle_from_counts(
    'a0000000-0000-0000-0000-000000000023',
    '00000000-0000-0000-0000-000000000001',
    12::smallint, 20::smallint, true, true
  ) ->> 'remediation_band'),
  'mid',
  '12/20 → mid remediation'
);

select is(
  (public.fn_evaluate_cycle_from_counts(
    'a0000000-0000-0000-0000-000000000023',
    '00000000-0000-0000-0000-000000000001',
    5::smallint, 20::smallint, true, true
  ) ->> 'verdict'),
  'prerequisite_remediation',
  'low performance → prerequisite remediation'
);

select is(
  (public.fn_evaluate_cycle_from_counts(
    'a0000000-0000-0000-0000-000000000023',
    '00000000-0000-0000-0000-000000000001',
    5::smallint, 20::smallint, true, true
  ) ->> 'remediation_remaining'),
  '10',
  'low band → ~10 targeted questions'
);

select * from finish();
rollback;
