-- P07 · Row Level Security (§5.1–5.3)
-- Helper functions, v_public_config, policies for all 45 Rev 1 tables, base GRANTs.

begin;

-- ── §5.1 helpers ──────────────────────────────────────────────────────────────

create or replace function public.auth_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'student'::public.app_role
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.auth_role() in (
    'viewer', 'reviewer', 'curriculum_admin', 'content_admin', 'support', 'super_admin'
  );
$$;

create or replace function public.has_role(min_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select array_position(
           array[
             'student', 'viewer', 'reviewer', 'support',
             'curriculum_admin', 'content_admin', 'super_admin'
           ]::public.app_role[],
           public.auth_role()
         )
         >= array_position(
           array[
             'student', 'viewer', 'reviewer', 'support',
             'curriculum_admin', 'content_admin', 'super_admin'
           ]::public.app_role[],
           min_role
         );
$$;

create or replace function public.is_content_role()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.auth_role() in (
    'reviewer', 'curriculum_admin', 'content_admin', 'super_admin'
  );
$$;

create or replace function public.is_curriculum_role()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.auth_role() in ('curriculum_admin', 'content_admin', 'super_admin');
$$;

create or replace function public.is_content_admin_role()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.auth_role() in ('content_admin', 'super_admin');
$$;

create or replace function public.has_premium(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.entitlements e
    where e.student_id = uid
      and e.tier = 'premium'
      and e.status in ('active', 'grace')
      and (
        e.current_period_end is null
        or e.current_period_end > now()
        or (e.status = 'grace' and e.grace_until > now())
      )
  );
$$;

create or replace function public.is_question_published(q_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.questions q
    where q.id = q_id
      and q.status = 'published'
      and q.retired_at is null
  );
$$;

create or replace function public.is_published_question_version(p_version_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.question_versions qv
    join public.questions q on q.id = qv.question_id
    where qv.id = p_version_id
      and q.status = 'published'
      and q.retired_at is null
  );
$$;

-- ── v_public_config (§5.2 note 14) ──────────────────────────────────────────

create or replace view public.v_public_config as
select key, value
from public.app_config
where key in (
  'free_daily_question_limit',
  'cooldown_days_default',
  'cooldown_days_incorrect',
  'mastery_evidence_floor',
  'mastery_full_weight_at',
  'session_max_questions',
  'content_version'
);

-- ── enable RLS on all 45 Rev 1 tables ───────────────────────────────────────

alter table public.subjects enable row level security;
alter table public.syllabus_versions enable row level security;
alter table public.modules enable row level security;
alter table public.topics enable row level security;
alter table public.subtopics enable row level security;
alter table public.specific_objectives enable row level security;
alter table public.skills enable row level security;
alter table public.skill_prerequisites enable row level security;
alter table public.skill_objectives enable row level security;
alter table public.objective_mappings enable row level security;
alter table public.questions enable row level security;
alter table public.question_versions enable row level security;
alter table public.question_options enable row level security;
alter table public.solution_steps enable row level security;
alter table public.common_errors enable row level security;
alter table public.question_assets enable row level security;
alter table public.math_renders enable row level security;
alter table public.question_objectives enable row level security;
alter table public.question_skills enable row level security;
alter table public.question_sources enable row level security;
alter table public.question_payloads enable row level security;
alter table public.question_reviews enable row level security;
alter table public.question_quality_metrics enable row level security;
alter table public.question_reports enable row level security;
alter table public.papers enable row level security;
alter table public.paper_questions enable row level security;
alter table public.profiles enable row level security;
alter table public.admin_role_grants enable row level security;
alter table public.practice_sessions enable row level security;
alter table public.practice_session_items enable row level security;
alter table public.exam_sessions enable row level security;
alter table public.exam_responses enable row level security;
alter table public.attempts enable row level security;
alter table public.attempt_skills enable row level security;
alter table public.student_skill_mastery enable row level security;
alter table public.student_topic_mastery enable row level security;
alter table public.student_daily_usage enable row level security;
alter table public.student_bookmarks enable row level security;
alter table public.entitlements enable row level security;
alter table public.subscription_events enable row level security;
alter table public.audit_log enable row level security;
alter table public.analytics_events enable row level security;
alter table public.content_jobs enable row level security;
alter table public.ai_generations enable row level security;
alter table public.app_config enable row level security;

-- ── profiles ────────────────────────────────────────────────────────────────

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = auth.uid());

create policy profiles_select_staff on public.profiles
  for select to authenticated
  using (public.has_role('support'));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ── admin_role_grants ───────────────────────────────────────────────────────

create policy arg_select_super on public.admin_role_grants
  for select to authenticated
  using (public.has_role('super_admin'));

create policy arg_insert_super on public.admin_role_grants
  for insert to authenticated
  with check (public.has_role('super_admin'));

create policy arg_update_super on public.admin_role_grants
  for update to authenticated
  using (public.has_role('super_admin'))
  with check (public.has_role('super_admin'));

-- ── curriculum / taxonomy ─────────────────────────────────────────────────────

create policy subjects_select_active on public.subjects
  for select to authenticated
  using (is_active);

create policy subjects_staff_all on public.subjects
  for all to authenticated
  using (public.is_staff())
  with check (public.is_curriculum_role());

create policy syllabus_versions_select on public.syllabus_versions
  for select to authenticated
  using (true);

create policy syllabus_versions_staff on public.syllabus_versions
  for all to authenticated
  using (public.is_staff())
  with check (public.is_curriculum_role());

create policy modules_select on public.modules
  for select to authenticated
  using (true);

create policy modules_staff on public.modules
  for all to authenticated
  using (public.is_staff())
  with check (public.is_curriculum_role());

create policy topics_select_active on public.topics
  for select to authenticated
  using (is_active);

create policy topics_staff on public.topics
  for all to authenticated
  using (public.is_staff())
  with check (public.is_curriculum_role());

create policy subtopics_select_active on public.subtopics
  for select to authenticated
  using (is_active);

create policy subtopics_staff on public.subtopics
  for all to authenticated
  using (public.is_staff())
  with check (public.is_curriculum_role());

create policy objectives_select_active on public.specific_objectives
  for select to authenticated
  using (is_active);

create policy objectives_staff on public.specific_objectives
  for all to authenticated
  using (public.is_staff())
  with check (public.is_curriculum_role());

create policy skills_select_active on public.skills
  for select to authenticated
  using (is_active);

create policy skills_staff on public.skills
  for all to authenticated
  using (public.is_staff())
  with check (public.is_curriculum_role());

create policy skill_prereq_select on public.skill_prerequisites
  for select to authenticated
  using (true);

create policy skill_prereq_staff on public.skill_prerequisites
  for all to authenticated
  using (public.is_staff())
  with check (public.is_curriculum_role());

create policy skill_objectives_select on public.skill_objectives
  for select to authenticated
  using (true);

create policy skill_objectives_staff on public.skill_objectives
  for all to authenticated
  using (public.is_staff())
  with check (public.is_curriculum_role());

create policy objective_mappings_select on public.objective_mappings
  for select to authenticated
  using (true);

create policy objective_mappings_staff on public.objective_mappings
  for all to authenticated
  using (public.is_staff())
  with check (public.is_curriculum_role());

-- ── content ─────────────────────────────────────────────────────────────────

create policy questions_select_published on public.questions
  for select to authenticated
  using (status = 'published' and retired_at is null);

create policy questions_staff on public.questions
  for all to authenticated
  using (public.is_staff())
  with check (public.is_content_role());

create policy qv_select_published on public.question_versions
  for select to authenticated
  using (public.is_question_published(question_id));

create policy qv_staff on public.question_versions
  for all to authenticated
  using (public.is_staff())
  with check (public.is_content_role());

create policy qo_select_published on public.question_options
  for select to authenticated
  using (public.is_published_question_version(question_version_id));

create policy qo_staff on public.question_options
  for all to authenticated
  using (public.is_staff())
  with check (public.is_content_role());

create policy ss_select_published on public.solution_steps
  for select to authenticated
  using (public.is_published_question_version(question_version_id));

create policy ss_staff on public.solution_steps
  for all to authenticated
  using (public.is_staff())
  with check (public.is_content_role());

create policy ce_select_published on public.common_errors
  for select to authenticated
  using (public.is_published_question_version(question_version_id));

create policy ce_staff on public.common_errors
  for all to authenticated
  using (public.is_staff())
  with check (public.is_content_role());

create policy qa_select_published on public.question_assets
  for select to authenticated
  using (public.is_published_question_version(question_version_id));

create policy qa_staff on public.question_assets
  for all to authenticated
  using (public.is_staff())
  with check (public.is_content_role());

create policy mr_select on public.math_renders
  for select to authenticated
  using (true);

create policy qobj_select_published on public.question_objectives
  for select to authenticated
  using (public.is_question_published(question_id));

create policy qobj_staff on public.question_objectives
  for all to authenticated
  using (public.is_staff())
  with check (public.is_content_role());

create policy qsk_select_published on public.question_skills
  for select to authenticated
  using (public.is_question_published(question_id));

create policy qsk_staff on public.question_skills
  for all to authenticated
  using (public.is_staff())
  with check (public.is_content_role());

create policy qsrc_select_published on public.question_sources
  for select to authenticated
  using (public.is_question_published(question_id));

create policy qsrc_staff on public.question_sources
  for all to authenticated
  using (public.is_staff())
  with check (public.is_content_role());

-- §5.3 paywall
create policy qp_student_read on public.question_payloads
  for select to authenticated
  using (
    public.is_question_published(question_id)
    and (
      public.is_staff()
      or public.has_premium()
      or is_free
    )
  );

create policy qp_staff_read on public.question_payloads
  for select to authenticated
  using (public.is_staff());

create policy qrev_staff on public.question_reviews
  for all to authenticated
  using (public.is_content_role())
  with check (public.is_content_role());

create policy qqm_staff_read on public.question_quality_metrics
  for select to authenticated
  using (public.is_staff());

create policy qrep_select_own on public.question_reports
  for select to authenticated
  using (reporter_id = auth.uid());

create policy qrep_insert_own on public.question_reports
  for insert to authenticated
  with check (reporter_id = auth.uid());

create policy qrep_staff on public.question_reports
  for all to authenticated
  using (public.is_staff())
  with check (public.is_content_role());

create policy papers_select_published on public.papers
  for select to authenticated
  using (status = 'published');

create policy papers_staff on public.papers
  for all to authenticated
  using (public.is_staff())
  with check (public.is_content_admin_role());

create policy pq_select_published on public.paper_questions
  for select to authenticated
  using (
    exists (
      select 1
      from public.papers p
      where p.id = paper_questions.paper_id
        and p.status = 'published'
    )
    and public.is_question_published(question_id)
  );

create policy pq_staff on public.paper_questions
  for all to authenticated
  using (public.is_staff())
  with check (public.is_content_admin_role());

-- ── sessions & attempts ─────────────────────────────────────────────────────

create policy ps_select_own on public.practice_sessions
  for select to authenticated
  using (student_id = auth.uid());

create policy ps_update_own on public.practice_sessions
  for update to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

create policy ps_select_staff on public.practice_sessions
  for select to authenticated
  using (public.has_role('support'));

create policy psi_select_own on public.practice_session_items
  for select to authenticated
  using (
    exists (
      select 1
      from public.practice_sessions ps
      where ps.id = practice_session_items.session_id
        and ps.student_id = auth.uid()
    )
  );

create policy psi_select_staff on public.practice_session_items
  for select to authenticated
  using (public.has_role('support'));

create policy es_select_own on public.exam_sessions
  for select to authenticated
  using (student_id = auth.uid());

create policy es_update_own on public.exam_sessions
  for update to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

create policy es_select_staff on public.exam_sessions
  for select to authenticated
  using (public.has_role('support'));

create policy er_select_own on public.exam_responses
  for select to authenticated
  using (
    exists (
      select 1
      from public.exam_sessions es
      where es.id = exam_responses.exam_session_id
        and es.student_id = auth.uid()
    )
  );

create policy er_insert_own on public.exam_responses
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.exam_sessions es
      where es.id = exam_responses.exam_session_id
        and es.student_id = auth.uid()
        and es.status = 'in_progress'
        and es.expires_at > now()
    )
  );

create policy er_update_own on public.exam_responses
  for update to authenticated
  using (
    exists (
      select 1
      from public.exam_sessions es
      where es.id = exam_responses.exam_session_id
        and es.student_id = auth.uid()
        and es.status = 'in_progress'
        and es.expires_at > now()
    )
  )
  with check (
    exists (
      select 1
      from public.exam_sessions es
      where es.id = exam_responses.exam_session_id
        and es.student_id = auth.uid()
        and es.status = 'in_progress'
        and es.expires_at > now()
    )
  );

create policy er_select_staff on public.exam_responses
  for select to authenticated
  using (public.has_role('support'));

create policy attempts_select_own on public.attempts
  for select to authenticated
  using (student_id = auth.uid());

create policy attempts_select_staff on public.attempts
  for select to authenticated
  using (public.has_role('support'));

create policy ask_select_own on public.attempt_skills
  for select to authenticated
  using (
    exists (
      select 1
      from public.attempts a
      where a.id = attempt_skills.attempt_id
        and a.student_id = auth.uid()
    )
  );

create policy ask_select_staff on public.attempt_skills
  for select to authenticated
  using (public.has_role('support'));

-- ── progress ────────────────────────────────────────────────────────────────

create policy ssm_select_own on public.student_skill_mastery
  for select to authenticated
  using (student_id = auth.uid());

create policy ssm_select_staff on public.student_skill_mastery
  for select to authenticated
  using (public.has_role('support'));

create policy stm_select_own on public.student_topic_mastery
  for select to authenticated
  using (student_id = auth.uid());

create policy stm_select_staff on public.student_topic_mastery
  for select to authenticated
  using (public.has_role('support'));

create policy sdu_select_own on public.student_daily_usage
  for select to authenticated
  using (student_id = auth.uid());

create policy sdu_select_staff on public.student_daily_usage
  for select to authenticated
  using (public.has_role('support'));

create policy sb_select_own on public.student_bookmarks
  for select to authenticated
  using (student_id = auth.uid());

create policy sb_insert_own on public.student_bookmarks
  for insert to authenticated
  with check (student_id = auth.uid());

create policy sb_delete_own on public.student_bookmarks
  for delete to authenticated
  using (student_id = auth.uid());

create policy sb_select_staff on public.student_bookmarks
  for select to authenticated
  using (public.has_role('support'));

-- ── commerce ────────────────────────────────────────────────────────────────

create policy ent_select_own on public.entitlements
  for select to authenticated
  using (student_id = auth.uid());

create policy ent_select_staff on public.entitlements
  for select to authenticated
  using (public.has_role('support'));

create policy ent_insert_support on public.entitlements
  for insert to authenticated
  with check (public.has_role('support') and source = 'manual');

create policy ent_update_support on public.entitlements
  for update to authenticated
  using (public.has_role('support') and source = 'manual')
  with check (public.has_role('support') and source = 'manual');

create policy se_select_content on public.subscription_events
  for select to authenticated
  using (public.has_role('content_admin'));

-- ── operations ────────────────────────────────────────────────────────────────

create policy al_select_super on public.audit_log
  for select to authenticated
  using (public.has_role('super_admin'));

create policy al_insert_authenticated on public.audit_log
  for insert to authenticated
  with check (true);

create policy ae_insert_own on public.analytics_events
  for insert to authenticated
  with check (student_id = auth.uid());

create policy ae_select_content on public.analytics_events
  for select to authenticated
  using (public.has_role('content_admin'));

create policy cj_staff on public.content_jobs
  for all to authenticated
  using (public.is_content_admin_role())
  with check (public.is_content_admin_role());

create policy ag_select_staff on public.ai_generations
  for select to authenticated
  using (public.is_staff());

create policy app_config_select_super on public.app_config
  for select to authenticated
  using (public.has_role('super_admin'));

create policy app_config_write_super on public.app_config
  for all to authenticated
  using (public.has_role('super_admin'))
  with check (public.has_role('super_admin'));

-- ── base GRANTs (PostgREST / Supabase API) ──────────────────────────────────

grant usage on schema public to postgres, anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

grant select on public.v_public_config to authenticated;

commit;
