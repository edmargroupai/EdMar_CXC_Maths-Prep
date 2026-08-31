-- P06 acceptance: student/progress/commerce tables and fn_handle_new_user.

begin;

select plan(24);

-- P06 tables
select has_table('public', 'profiles', 'profiles exists');
select has_table('public', 'admin_role_grants', 'admin_role_grants exists');
select has_table('public', 'practice_sessions', 'practice_sessions exists');
select has_table('public', 'practice_session_items', 'practice_session_items exists');
select has_table('public', 'exam_sessions', 'exam_sessions exists');
select has_table('public', 'exam_responses', 'exam_responses exists');
select has_table('public', 'attempts', 'attempts exists');
select has_table('public', 'attempt_skills', 'attempt_skills exists');
select has_table('public', 'student_skill_mastery', 'student_skill_mastery exists');
select has_table('public', 'student_topic_mastery', 'student_topic_mastery exists');
select has_table('public', 'student_daily_usage', 'student_daily_usage exists');
select has_table('public', 'student_bookmarks', 'student_bookmarks exists');
select has_table('public', 'entitlements', 'entitlements exists');
select has_table('public', 'subscription_events', 'subscription_events exists');
select has_table('public', 'audit_log', 'audit_log exists');
select has_table('public', 'analytics_events', 'analytics_events exists');
select has_table('public', 'content_jobs', 'content_jobs exists');
select has_table('public', 'ai_generations', 'ai_generations exists');
select has_table('public', 'app_config', 'app_config exists');

select ok(
  (
    select count(*) = 45
    from information_schema.tables
    where table_schema = 'public'
      and table_type = 'BASE TABLE'
  ),
  format(
    '45 Rev 1 tables exist (found %s)',
    (select count(*)::int from information_schema.tables
     where table_schema = 'public' and table_type = 'BASE TABLE')
  )
);

select ok(
  (select count(*) = 9 from public.app_config),
  'app_config seeded with 9 keys'
);

-- fn_handle_new_user: registered email
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  'authenticated',
  'authenticated',
  'p06-test@example.com',
  crypt('password', gen_salt('bf')),
  timezone('utc', now()),
  timezone('utc', now()),
  timezone('utc', now()),
  '',
  '',
  '',
  ''
);

select ok(
  exists (select 1 from public.profiles where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
  'fn_handle_new_user creates a profile'
);

select is(
  (
    select tier::text
    from public.entitlements
    where student_id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
  ),
  'free',
  'fn_handle_new_user creates a free entitlement'
);

-- fn_handle_new_user: anonymous (null email)
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token,
  is_anonymous
) values (
  '00000000-0000-0000-0000-000000000000',
  'ffffffff-ffff-ffff-ffff-ffffffffffff',
  'authenticated',
  'authenticated',
  null,
  crypt('password', gen_salt('bf')),
  timezone('utc', now()),
  timezone('utc', now()),
  timezone('utc', now()),
  '',
  '',
  '',
  '',
  true
);

select is(
  (
    select email::text
    from public.profiles
    where id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'
  ),
  'ffffffff-ffff-ffff-ffff-ffffffffffff@anonymous.local',
  'anonymous sign-in gets a synthetic profile email'
);

select * from finish();

rollback;
