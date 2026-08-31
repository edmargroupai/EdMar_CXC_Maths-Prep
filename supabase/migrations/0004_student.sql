-- P06 · Student, progress and commerce schema (§3.1–3.2, §3.18–3.23)
-- Identity, sessions, attempts, mastery, entitlements, ops tables.
-- Adds deferred profile FK constraints from 0003_content.sql.

begin;

create extension if not exists citext with schema extensions;

-- ── profiles (§3.1) ─────────────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) between 1 and 40),
  email extensions.citext not null unique,
  role public.app_role not null default 'student',
  territory text default 'JM' check (territory ~ '^[A-Z]{2}$'),
  syllabus_version public.syllabus_code not null default 'V2027',
  exam_sitting_year smallint check (exam_sitting_year between 2026 and 2035),
  exam_sitting_month public.sitting_month,
  age_confirmed_13_plus boolean not null default false,
  onboarding_completed_at timestamptz,
  locale text not null default 'en-JM',
  theme_preference text not null default 'system'
    check (theme_preference in ('system', 'light', 'dark')),
  notifications_opt_in boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_role on public.profiles (role) where role <> 'student';
create index idx_profiles_deleted on public.profiles (deleted_at) where deleted_at is not null;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.trg_set_updated_at();

-- ── admin_role_grants (§3.2) ────────────────────────────────────────────────

create table public.admin_role_grants (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role public.app_role not null,
  granted_by uuid not null references public.profiles (id),
  granted_at timestamptz not null default now(),
  revoked_by uuid references public.profiles (id),
  revoked_at timestamptz,
  reason text not null check (char_length(reason) >= 5)
);

create unique index uq_arg_active on public.admin_role_grants (profile_id, role)
  where revoked_at is null;
create index idx_arg_profile on public.admin_role_grants (profile_id);

-- ── practice_sessions / practice_session_items (§3.18) ────────────────────────

create table public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  mode public.practice_mode not null,
  scope_kind text not null check (
    scope_kind in ('topic', 'subtopic', 'objective', 'skill', 'module', 'mixed')
  ),
  scope_ids uuid[] not null default '{}',
  syllabus_code public.syllabus_code not null,
  difficulty_mode text not null default 'mixed'
    check (difficulty_mode in ('mixed', 'building', 'challenge')),
  requested_count smallint not null check (requested_count between 1 and 20),
  delivered_count smallint not null default 0,
  seed bigint not null,
  status public.session_status not null default 'in_progress',
  correct_count smallint not null default 0,
  answered_count smallint not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  client_started_at timestamptz,
  duration_seconds integer
);

create index idx_ps_student on public.practice_sessions (student_id, started_at desc);
create index idx_ps_open on public.practice_sessions (student_id)
  where status = 'in_progress';

create table public.practice_session_items (
  session_id uuid not null references public.practice_sessions (id) on delete cascade,
  position smallint not null,
  question_id uuid not null references public.questions (id) on delete restrict,
  question_version_id uuid not null references public.question_versions (id) on delete restrict,
  option_order char(1)[],
  answered boolean not null default false,
  primary key (session_id, position),
  unique (session_id, question_id)
);

-- ── exam_sessions / exam_responses (§3.20) ──────────────────────────────────

create table public.exam_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  paper_id uuid references public.papers (id) on delete restrict,
  form public.simulation_form not null default 'p01_regular',
  blueprint_ok boolean not null default false,
  mode public.exam_mode not null default 'practice',
  duration_minutes smallint not null,
  server_started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  submitted_at timestamptz,
  status public.session_status not null default 'in_progress',
  answer_marks smallint,
  max_answer_marks smallint,
  total_paper_marks smallint,
  marks_by_module jsonb not null default '{}',
  marks_by_profile jsonb not null default '{}',
  seconds_by_item jsonb not null default '{}',
  submitted_late_by smallint,
  created_at timestamptz not null default now()
);

create index idx_es_student on public.exam_sessions (student_id, server_started_at desc);
create index idx_es_open on public.exam_sessions (student_id) where status = 'in_progress';

create table public.exam_responses (
  exam_session_id uuid not null references public.exam_sessions (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete restrict,
  part_key text not null default '',
  raw_answer text,
  is_correct boolean,
  marks_awarded smallint not null default 0,
  max_marks smallint not null,
  flagged boolean not null default false,
  answered_at timestamptz,
  primary key (exam_session_id, question_id, part_key)
);

-- ── attempts / attempt_skills (§3.19) ───────────────────────────────────────

create table public.attempts (
  id bigint generated always as identity primary key,
  client_attempt_id uuid not null unique,
  student_id uuid not null references public.profiles (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete restrict,
  question_version_id uuid not null references public.question_versions (id) on delete restrict,
  session_id uuid references public.practice_sessions (id) on delete set null,
  exam_session_id uuid references public.exam_sessions (id) on delete set null,
  context public.practice_mode,
  part_key text,
  raw_answer text,
  normalised_answer text,
  is_correct boolean not null,
  client_is_correct boolean,
  matched_common_error_id uuid references public.common_errors (id) on delete set null,
  was_skipped boolean not null default false,
  solution_viewed boolean not null default false,
  difficulty_band smallint not null,
  duration_ms integer check (duration_ms between 0 and 3600000),
  client_created_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index uq_at_client on public.attempts (client_attempt_id);
create index idx_at_student_time on public.attempts (student_id, created_at desc);
create index idx_at_student_q on public.attempts (student_id, question_id, created_at desc);
create index idx_at_question on public.attempts (question_id) include (is_correct, duration_ms);
create index idx_at_session on public.attempts (session_id) where session_id is not null;
create index idx_at_wrong on public.attempts (question_id, normalised_answer) where not is_correct;

create table public.attempt_skills (
  attempt_id bigint not null references public.attempts (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete restrict,
  weight numeric(3, 2) not null default 1.00,
  primary key (attempt_id, skill_id)
);

create index idx_as_skill on public.attempt_skills (skill_id);

-- ── progress tables (§3.21) ───────────────────────────────────────────────────

create table public.student_skill_mastery (
  student_id uuid not null references public.profiles (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  score numeric(5, 2),
  raw_score numeric(5, 2) not null default 0,
  confidence numeric(4, 3) not null default 0,
  coverage_cap numeric(5, 2) not null default 100,
  attempts_count integer not null default 0,
  distinct_questions integer not null default 0,
  correct_count integer not null default 0,
  bands_seen smallint[] not null default '{}',
  last_attempt_at timestamptz,
  last_correct_at timestamptz,
  decayed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (student_id, skill_id)
);

create index idx_ssm_student_score on public.student_skill_mastery (student_id, score);
create index idx_ssm_stale on public.student_skill_mastery (last_attempt_at) where score is not null;

create table public.student_topic_mastery (
  student_id uuid not null references public.profiles (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  score numeric(5, 2),
  confidence numeric(4, 3) not null default 0,
  attempts_count integer not null default 0,
  skills_started smallint not null default 0,
  skills_total smallint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (student_id, topic_id)
);

create table public.student_daily_usage (
  student_id uuid not null references public.profiles (id) on delete cascade,
  usage_date date not null,
  questions_served smallint not null default 0,
  questions_answered smallint not null default 0,
  sessions_started smallint not null default 0,
  primary key (student_id, usage_date)
);

create index idx_sdu_date on public.student_daily_usage (usage_date);

create table public.student_bookmarks (
  student_id uuid not null references public.profiles (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (student_id, question_id)
);

-- ── commerce tables (§3.22) ───────────────────────────────────────────────────

create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  tier public.entitlement_tier not null default 'free',
  source public.entitlement_source not null default 'default',
  status public.entitlement_status not null default 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  grace_until timestamptz,
  auto_renewing boolean not null default false,
  platform_product_id text,
  platform_purchase_token text,
  platform_order_id text,
  granted_by uuid references public.profiles (id),
  grant_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index uq_ent_active on public.entitlements (student_id)
  where status in ('active', 'grace', 'on_hold');
create unique index uq_ent_token on public.entitlements (platform_purchase_token)
  where platform_purchase_token is not null;
create index idx_ent_expiring on public.entitlements (current_period_end)
  where status = 'active';

create trigger trg_entitlements_updated_at
  before update on public.entitlements
  for each row
  execute function public.trg_set_updated_at();

create table public.subscription_events (
  id bigint generated always as identity primary key,
  entitlement_id uuid references public.entitlements (id) on delete set null,
  student_id uuid references public.profiles (id) on delete set null,
  provider text not null default 'google_play',
  event_type text not null,
  purchase_token text,
  raw_payload jsonb not null,
  signature_verified boolean not null default false,
  processed_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);

create index idx_se_token on public.subscription_events (purchase_token);
create index idx_se_unprocessed on public.subscription_events (created_at)
  where processed_at is null;

-- ── operations tables (§3.23) ─────────────────────────────────────────────────

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  actor_role public.app_role,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  before jsonb,
  after jsonb,
  reason text,
  ip_hash text,
  created_at timestamptz not null default now()
);

create index idx_al_entity on public.audit_log (entity_type, entity_id, created_at desc);
create index idx_al_actor on public.audit_log (actor_id, created_at desc);

create table public.analytics_events (
  id bigint generated always as identity primary key,
  student_id uuid references public.profiles (id) on delete cascade,
  session_id uuid,
  event_name text not null,
  event_props jsonb not null default '{}',
  app_version text,
  platform text check (platform in ('android', 'ios', 'web')),
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index idx_ae_name_time on public.analytics_events (event_name, occurred_at desc);
create index idx_ae_student on public.analytics_events (student_id, occurred_at desc);

create table public.content_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  status public.job_status not null default 'queued',
  params jsonb not null default '{}',
  source_path text,
  requested_by uuid references public.profiles (id),
  estimated_cost_usd numeric(10, 4),
  actual_cost_usd numeric(10, 4),
  items_total integer not null default 0,
  items_done integer not null default 0,
  items_failed integer not null default 0,
  result jsonb,
  error text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_cj_status on public.content_jobs (status, created_at);

create table public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.content_jobs (id) on delete set null,
  question_id uuid references public.questions (id) on delete cascade,
  question_version_id uuid references public.question_versions (id) on delete cascade,
  stage text not null,
  provider text not null,
  model text not null,
  prompt_name text not null,
  prompt_version text not null,
  input_tokens integer,
  output_tokens integer,
  cost_usd numeric(10, 6),
  confidence numeric(3, 2),
  raw_output jsonb,
  accepted boolean,
  created_at timestamptz not null default now()
);

create index idx_ag_question on public.ai_generations (question_id);
create index idx_ag_prompt on public.ai_generations (prompt_name, prompt_version, created_at desc);
create index idx_ag_cost on public.ai_generations (created_at) include (cost_usd);

create table public.app_config (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default now()
);

-- ── app_config seeds (§3.23) ──────────────────────────────────────────────────

insert into public.app_config (key, value, description) values
  ('free_daily_question_limit', '10', 'Free-tier daily question cap'),
  ('cooldown_days_default', '30', 'Days before a correctly answered question is eligible again'),
  ('cooldown_days_incorrect', '7', 'Days before an incorrectly answered question is eligible again'),
  ('mastery_evidence_floor', '5', 'Distinct questions before a skill score is shown'),
  ('mastery_full_weight_at', '15', 'Distinct questions before confidence reaches 1.0'),
  ('session_max_questions', '20', 'Maximum questions per practice session'),
  ('content_version', '1', 'Global published content version counter'),
  ('ai_monthly_cap_usd', '400', 'Monthly AI spend cap in USD'),
  ('duplicate_cosine_threshold', '0.92', 'Embedding similarity threshold for duplicate detection');

-- ── deferred profile FK constraints from 0003 ─────────────────────────────────

alter table public.questions
  add constraint fk_questions_created_by
  foreign key (created_by) references public.profiles (id);

alter table public.question_versions
  add constraint fk_question_versions_created_by
  foreign key (created_by) references public.profiles (id);

alter table public.question_objectives
  add constraint fk_question_objectives_confirmed_by
  foreign key (confirmed_by) references public.profiles (id);

alter table public.question_reviews
  add constraint fk_question_reviews_reviewer
  foreign key (reviewer_id) references public.profiles (id);

alter table public.question_reports
  add constraint fk_question_reports_reporter
  foreign key (reporter_id) references public.profiles (id);

alter table public.question_reports
  add constraint fk_question_reports_resolved_by
  foreign key (resolved_by) references public.profiles (id);

-- ── fn_handle_new_user (§6.1) ───────────────────────────────────────────────

create or replace function public.fn_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email extensions.citext;
begin
  v_email := coalesce(
    nullif(trim(new.email), ''),
    new.id::text || '@anonymous.local'
  );

  insert into public.profiles (id, email)
  values (new.id, v_email);

  insert into public.entitlements (student_id, tier, source, status)
  values (new.id, 'free', 'default', 'active');

  return new;
end;
$$;

comment on function public.fn_handle_new_user() is
  'AFTER INSERT on auth.users: creates profiles row and default free entitlement.';

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.fn_handle_new_user();

commit;
