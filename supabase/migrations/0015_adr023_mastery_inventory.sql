-- ADR-023 · Mastery cycle, selection cooldown, inventory health, replenishment jobs
-- Implements runtime engines documented in Spec §9.14 and docs/decisions/ADR-023-mastery-inventory-ai-cost.md

begin;

-- ── Additional config ───────────────────────────────────────────────────────

insert into public.app_config (key, value, description)
values
  (
    'mastery_prerequisite_score_threshold',
    '70'::jsonb,
    'Minimum skill mastery score for critical prerequisite satisfaction (ADR-023)'
  ),
  (
    'mastery_skill_min_attempts_per_skill',
    '1'::jsonb,
    'Minimum distinct cycle attempts per topic skill for skill coverage gate'
  )
on conflict (key) do nothing;

-- provenance 'template_generated' is added in this migration but only used after commit (0016).

-- ── Enums ─────────────────────────────────────────────────────────────────────

create type public.mastery_cycle_status as enum (
  'in_progress',
  'mastered',
  'remediation',
  'prerequisite_remediation'
);

create type public.inventory_health_status as enum (
  'healthy',
  'low',
  'critical'
);

-- ── Topic mastery cycles ──────────────────────────────────────────────────────

create table public.topic_mastery_cycles (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  cycle_number integer not null default 1 check (cycle_number >= 1),
  status public.mastery_cycle_status not null default 'in_progress',
  questions_target smallint not null check (questions_target between 1 and 50),
  questions_answered smallint not null default 0,
  questions_correct smallint not null default 0,
  skill_coverage_met boolean not null default false,
  prerequisite_met boolean not null default false,
  overall_accuracy numeric(5, 4),
  remediation_band text,
  remediation_remaining smallint,
  weak_skill_ids uuid[] not null default '{}',
  prerequisite_skill_ids uuid[] not null default '{}',
  evaluated_at timestamptz,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (student_id, topic_id, cycle_number)
);

create unique index idx_tmc_one_active
  on public.topic_mastery_cycles (student_id, topic_id)
  where status in ('in_progress', 'remediation', 'prerequisite_remediation');

create index idx_tmc_student on public.topic_mastery_cycles (student_id, started_at desc);
create index idx_tmc_topic on public.topic_mastery_cycles (topic_id);

alter table public.practice_sessions
  add column if not exists topic_cycle_id uuid
    references public.topic_mastery_cycles (id) on delete set null;

create index idx_ps_topic_cycle on public.practice_sessions (topic_cycle_id)
  where topic_cycle_id is not null;

-- ── Question templates (offline generation) ───────────────────────────────────

create table public.question_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category text not null,
  description text,
  parameter_schema jsonb not null default '{}',
  template_version text not null default '1.0.0',
  generator_key text not null,
  status text not null default 'active'
    check (status in ('draft', 'active', 'retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_question_templates_updated_at
  before update on public.question_templates
  for each row
  execute function public.trg_set_updated_at();

-- ── Helpers ───────────────────────────────────────────────────────────────────

create or replace function public.fn_app_config_numeric(p_key text, p_default numeric)
returns numeric
language sql
stable
as $$
  select coalesce(
    (select (ac.value #>> '{}')::numeric from public.app_config ac where ac.key = p_key),
    p_default
  );
$$;

create or replace function public.fn_app_config_int(p_key text, p_default integer)
returns integer
language sql
stable
as $$
  select coalesce(
    (select (ac.value #>> '{}')::integer from public.app_config ac where ac.key = p_key),
    p_default
  );
$$;

create or replace function public.fn_app_config_bool(p_key text, p_default boolean)
returns boolean
language sql
stable
as $$
  select coalesce(
    (select (ac.value #>> '{}')::boolean from public.app_config ac where ac.key = p_key),
    p_default
  );
$$;

-- ── Skill coverage + prerequisites for a cycle ──────────────────────────────

create or replace function public.fn_cycle_skill_coverage_met(
  p_cycle_id uuid,
  p_topic_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_min_attempts integer;
  v_uncovered integer;
begin
  v_min_attempts := public.fn_app_config_int('mastery_skill_min_attempts_per_skill', 1);

  -- Topics with no linked skills: coverage gate is vacuously met.
  if not exists (
    select 1
    from public.skills s
    join public.skill_objectives so on so.skill_id = s.id
    join public.specific_objectives obj on obj.id = so.specific_objective_id
    where obj.topic_id = p_topic_id
  ) then
    return true;
  end if;

  select count(*)::integer
  into v_uncovered
  from (
    select s.id as skill_id
    from public.skills s
    join public.skill_objectives so on so.skill_id = s.id
    join public.specific_objectives obj on obj.id = so.specific_objective_id
    where obj.topic_id = p_topic_id
    group by s.id
  ) topic_skills
  where (
    select count(distinct a.question_id)
    from public.attempts a
    join public.practice_sessions ps on ps.id = a.session_id
    join public.attempt_skills ask on ask.attempt_id = a.id
    where ps.topic_cycle_id = p_cycle_id
      and ask.skill_id = topic_skills.skill_id
  ) < v_min_attempts;

  return v_uncovered = 0;
end;
$$;

create or replace function public.fn_cycle_prerequisite_met(
  p_student uuid,
  p_topic_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_threshold numeric;
  v_failing integer;
begin
  v_threshold := public.fn_app_config_numeric('mastery_prerequisite_score_threshold', 70);

  select count(distinct sp.prerequisite_skill_id)::integer
  into v_failing
  from public.skills s
  join public.skill_objectives so on so.skill_id = s.id
  join public.specific_objectives obj on obj.id = so.specific_objective_id
  join public.skill_prerequisites sp on sp.skill_id = s.id
  left join public.student_skill_mastery ssm
    on ssm.student_id = p_student
   and ssm.skill_id = sp.prerequisite_skill_id
  where obj.topic_id = p_topic_id
    and coalesce(ssm.score, 0) < v_threshold;

  return v_failing = 0;
end;
$$;

-- ── Evaluate topic mastery cycle ─────────────────────────────────────────────

create or replace function public.fn_evaluate_topic_mastery_cycle(p_cycle_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cycle public.topic_mastery_cycles%rowtype;
  v_accuracy numeric;
  v_threshold numeric;
  v_skill_ok boolean;
  v_prereq_ok boolean;
  v_near_min integer;
  v_near_max integer;
  v_mid_min integer;
  v_mid_max integer;
  v_low_max integer;
  v_near_count integer;
  v_mid_count integer;
  v_low_count integer;
  v_band text;
  v_remediation_count smallint;
  v_weak_skills uuid[];
  v_prereq_skills uuid[];
  v_verdict text;
begin
  select * into v_cycle
  from public.topic_mastery_cycles
  where id = p_cycle_id
  for update;

  if not found then
    raise exception 'cycle not found' using errcode = 'P0002';
  end if;

  if v_cycle.questions_answered = 0 then
    return jsonb_build_object('verdict', 'in_progress');
  end if;

  v_accuracy := v_cycle.questions_correct::numeric / v_cycle.questions_answered;
  v_threshold := public.fn_app_config_numeric('mastery_accuracy_threshold', 0.90);
  v_skill_ok := public.fn_cycle_skill_coverage_met(p_cycle_id, v_cycle.topic_id);
  v_prereq_ok := public.fn_cycle_prerequisite_met(v_cycle.student_id, v_cycle.topic_id);

  v_near_min := public.fn_app_config_int('remediation_band_near_min', 15);
  v_near_max := public.fn_app_config_int('remediation_band_near_max', 17);
  v_mid_min := public.fn_app_config_int('remediation_band_mid_min', 10);
  v_mid_max := public.fn_app_config_int('remediation_band_mid_max', 14);
  v_low_max := public.fn_app_config_int('remediation_band_low_max', 9);
  v_near_count := public.fn_app_config_int('remediation_near_count', 5);
  v_mid_count := public.fn_app_config_int('remediation_mid_count', 10);
  v_low_count := public.fn_app_config_int('remediation_low_count', 10);

  if v_accuracy >= v_threshold and v_skill_ok and v_prereq_ok then
    update public.topic_mastery_cycles
    set status = 'mastered',
        skill_coverage_met = true,
        prerequisite_met = true,
        overall_accuracy = v_accuracy,
        evaluated_at = now(),
        completed_at = now(),
        remediation_remaining = null,
        remediation_band = null
    where id = p_cycle_id;

    return jsonb_build_object(
      'verdict', 'mastered',
      'overall_accuracy', v_accuracy,
      'skill_coverage_met', true,
      'prerequisite_met', true
    );
  end if;

  -- Accuracy OK but coverage gates failed → targeted remediation, not mastered
  if v_accuracy >= v_threshold and (not v_skill_ok or not v_prereq_ok) then
    v_verdict := case when not v_prereq_ok then 'prerequisite_remediation' else 'remediation' end;
    v_remediation_count := v_mid_count;
    v_band := 'coverage_gap';
  elsif v_cycle.questions_correct between v_near_min and v_near_max then
    v_verdict := 'remediation';
    v_band := 'near';
    v_remediation_count := v_near_count::smallint;
  elsif v_cycle.questions_correct between v_mid_min and v_mid_max then
    v_verdict := 'remediation';
    v_band := 'mid';
    v_remediation_count := v_mid_count::smallint;
  else
    v_verdict := 'prerequisite_remediation';
    v_band := 'low';
    v_remediation_count := v_low_count::smallint;
  end if;

  select coalesce(array_agg(s.id), '{}'::uuid[])
  into v_weak_skills
  from public.skills s
  join public.skill_objectives so on so.skill_id = s.id
  join public.specific_objectives obj on obj.id = so.specific_objective_id
  left join public.student_skill_mastery ssm
    on ssm.student_id = v_cycle.student_id
   and ssm.skill_id = s.id
  where obj.topic_id = v_cycle.topic_id
    and coalesce(ssm.score, 35) < 70;

  if v_verdict = 'prerequisite_remediation' then
    select coalesce(array_agg(distinct sp.prerequisite_skill_id), '{}'::uuid[])
    into v_prereq_skills
    from public.skills s
    join public.skill_objectives so on so.skill_id = s.id
    join public.specific_objectives obj on obj.id = so.specific_objective_id
    join public.skill_prerequisites sp on sp.skill_id = s.id
    left join public.student_skill_mastery ssm
      on ssm.student_id = v_cycle.student_id
     and ssm.skill_id = sp.prerequisite_skill_id
    where obj.topic_id = v_cycle.topic_id
      and coalesce(ssm.score, 0) < public.fn_app_config_numeric('mastery_prerequisite_score_threshold', 70);
  end if;

  update public.topic_mastery_cycles
  set status = v_verdict::public.mastery_cycle_status,
      skill_coverage_met = v_skill_ok,
      prerequisite_met = v_prereq_ok,
      overall_accuracy = v_accuracy,
      remediation_band = v_band,
      remediation_remaining = v_remediation_count,
      weak_skill_ids = coalesce(v_weak_skills, '{}'),
      prerequisite_skill_ids = coalesce(v_prereq_skills, '{}'),
      evaluated_at = now()
  where id = p_cycle_id;

  return jsonb_build_object(
    'verdict', v_verdict,
    'overall_accuracy', v_accuracy,
    'skill_coverage_met', v_skill_ok,
    'prerequisite_met', v_prereq_ok,
    'remediation_band', v_band,
    'remediation_remaining', v_remediation_count
  );
end;
$$;

create or replace function public.fn_get_or_create_topic_cycle(
  p_student uuid,
  p_topic_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cycle_id uuid;
  v_target smallint;
  v_next_no integer;
begin
  if not public.fn_app_config_bool('mastery_cycle_enabled', true) then
    return null;
  end if;

  select id into v_cycle_id
  from public.topic_mastery_cycles
  where student_id = p_student
    and topic_id = p_topic_id
    and status in ('in_progress', 'remediation', 'prerequisite_remediation')
  order by started_at desc
  limit 1;

  if v_cycle_id is not null then
    return v_cycle_id;
  end if;

  v_target := public.fn_app_config_int('mastery_question_target', 20)::smallint;

  select coalesce(max(cycle_number), 0) + 1
  into v_next_no
  from public.topic_mastery_cycles
  where student_id = p_student and topic_id = p_topic_id;

  insert into public.topic_mastery_cycles (
    student_id, topic_id, cycle_number, questions_target
  ) values (
    p_student, p_topic_id, v_next_no, v_target
  )
  returning id into v_cycle_id;

  return v_cycle_id;
end;
$$;

create or replace function public.fn_accumulate_topic_cycle(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session record;
  v_cycle public.topic_mastery_cycles%rowtype;
  v_result jsonb := null;
begin
  select * into v_session
  from public.practice_sessions
  where id = p_session_id;

  if v_session.topic_cycle_id is null then
    return null;
  end if;

  select * into v_cycle
  from public.topic_mastery_cycles
  where id = v_session.topic_cycle_id
  for update;

  if v_cycle.status not in ('in_progress', 'remediation', 'prerequisite_remediation') then
    return null;
  end if;

  update public.topic_mastery_cycles
  set questions_answered = questions_answered + v_session.answered_count,
      questions_correct = questions_correct + v_session.correct_count
  where id = v_cycle.id
  returning * into v_cycle;

  if v_cycle.status = 'remediation' or v_cycle.status = 'prerequisite_remediation' then
    update public.topic_mastery_cycles
    set remediation_remaining = greatest(0, coalesce(remediation_remaining, 0) - v_session.answered_count)
    where id = v_cycle.id
    returning * into v_cycle;

    if v_cycle.remediation_remaining <= 0 then
      update public.topic_mastery_cycles
      set status = 'in_progress',
          questions_answered = 0,
          questions_correct = 0,
          remediation_remaining = null,
          remediation_band = null,
          evaluated_at = null
      where id = v_cycle.id;
      return jsonb_build_object('verdict', 'remediation_complete');
    end if;

    return jsonb_build_object(
      'verdict', v_cycle.status,
      'remediation_remaining', v_cycle.remediation_remaining
    );
  end if;

  if v_cycle.questions_answered >= v_cycle.questions_target then
    v_result := public.fn_evaluate_topic_mastery_cycle(v_cycle.id);
    return v_result;
  end if;

  return jsonb_build_object(
    'verdict', 'in_progress',
    'questions_answered', v_cycle.questions_answered,
    'questions_target', v_cycle.questions_target
  );
end;
$$;

-- ── Inventory health + replenishment ──────────────────────────────────────────

create or replace function public.fn_topic_inventory_health(p_topic_id uuid default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_min integer;
  v_preferred integer;
  v_result jsonb := '[]'::jsonb;
begin
  if auth.uid() is not null
     and public.auth_role() not in (
       'reviewer', 'content_admin', 'curriculum_admin', 'super_admin'
     ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  v_min := public.fn_app_config_int('inventory_min_approved_per_topic', 40);
  v_preferred := public.fn_app_config_int('inventory_preferred_per_topic', 60);

  select coalesce(jsonb_agg(row_data order by (row_data ->> 'topic_code')), '[]'::jsonb)
  into v_result
  from (
    select jsonb_build_object(
      'topic_id', t.id,
      'topic_code', t.code,
      'topic_name', t.name,
      'approved_count', coalesce(qc.approved, 0),
      'draft_count', coalesce(qc.draft, 0),
      'pending_review_count', coalesce(qc.pending, 0),
      'template_generated_count', coalesce(qc.template_gen, 0),
      'ai_generated_count', coalesce(qc.ai_gen, 0),
      'objective_coverage', coalesce(oc.covered, 0),
      'objective_total', coalesce(oc.total, 0),
      'skill_coverage', coalesce(sc.covered, 0),
      'skill_total', coalesce(sc.total, 0),
      'health_status', case
        when coalesce(qc.approved, 0) < v_min / 2 then 'critical'
        when coalesce(qc.approved, 0) < v_min then 'low'
        when coalesce(qc.approved, 0) < v_preferred then 'low'
        else 'healthy'
      end
    ) as row_data
    from public.topics t
    left join lateral (
      select
        count(*) filter (where q.status = 'published') as approved,
        count(*) filter (where q.status = 'draft') as draft,
        count(*) filter (where q.status = 'pending_review') as pending,
        count(*) filter (
          where exists (
            select 1 from public.ai_generations ag
            where ag.question_id = q.id
              and ag.provider = 'deterministic_template'
          )
        ) as template_gen,
        count(*) filter (where q.provenance in ('ai_variant', 'ai_authored')) as ai_gen
      from public.question_objectives qo
      join public.specific_objectives so on so.id = qo.specific_objective_id
      join public.questions q on q.id = qo.question_id
      where so.topic_id = t.id
    ) qc on true
    left join lateral (
      select
        count(distinct so.id) as total,
        count(distinct so.id) filter (
          where exists (
            select 1
            from public.question_objectives qo2
            join public.questions q2 on q2.id = qo2.question_id
            where qo2.specific_objective_id = so.id
              and q2.status = 'published'
          )
        ) as covered
      from public.specific_objectives so
      where so.topic_id = t.id
    ) oc on true
    left join lateral (
      select
        count(distinct s.id) as total,
        count(distinct s.id) filter (
          where exists (
            select 1
            from public.question_skills qs
            join public.questions q3 on q3.id = qs.question_id
            where qs.skill_id = s.id
              and q3.status = 'published'
          )
        ) as covered
      from public.skills s
      join public.skill_objectives sko on sko.skill_id = s.id
      join public.specific_objectives so2 on so2.id = sko.specific_objective_id
      where so2.topic_id = t.id
    ) sc on true
    where (p_topic_id is null or t.id = p_topic_id)
      and t.is_active
  ) rows;

  return v_result;
end;
$$;

create or replace function public.fn_enqueue_inventory_replenishment(
  p_topic_id uuid,
  p_skill_id uuid default null,
  p_specific_objective_id uuid default null,
  p_reason text default 'low_inventory'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job_id uuid;
  v_policy text;
begin
  -- Staff RPC or SECURITY DEFINER job (no JWT)
  if auth.uid() is not null
     and public.auth_role() not in (
       'reviewer', 'content_admin', 'curriculum_admin', 'super_admin'
     ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.content_jobs cj
    where cj.job_type = 'inventory_replenishment'
      and cj.status in ('queued', 'running')
      and cj.params ->> 'topic_id' = p_topic_id::text
      and coalesce(cj.params ->> 'skill_id', '') = coalesce(p_skill_id::text, '')
  ) then
    select id into v_job_id
    from public.content_jobs
    where job_type = 'inventory_replenishment'
      and status in ('queued', 'running')
      and params ->> 'topic_id' = p_topic_id::text
    order by created_at desc
    limit 1;
    return v_job_id;
  end if;

  select ac.value #>> '{}' into v_policy
  from public.app_config ac
  where ac.key = 'content_generation_policy';

  insert into public.content_jobs (job_type, status, params, requested_by)
  values (
    'inventory_replenishment',
    'queued',
    jsonb_build_object(
      'topic_id', p_topic_id,
      'skill_id', p_skill_id,
      'specific_objective_id', p_specific_objective_id,
      'reason', p_reason,
      'policy', coalesce(v_policy, 'template_first_ai_when_necessary')
    ),
    auth.uid()
  )
  returning id into v_job_id;

  return v_job_id;
end;
$$;

create or replace function public.job_check_inventory_health()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_min integer;
  v_warn integer;
  v_row record;
begin
  v_min := public.fn_app_config_int('inventory_min_approved_per_topic', 40);
  v_warn := public.fn_app_config_int('inventory_reserve_warn', 15);

  for v_row in
    select
      t.id as topic_id,
      count(distinct q.id) filter (where q.status = 'published') as approved
    from public.topics t
    join public.specific_objectives so on so.topic_id = t.id
    left join public.question_objectives qo on qo.specific_objective_id = so.id
    left join public.questions q on q.id = qo.question_id
    where t.is_active
    group by t.id
    having count(distinct q.id) filter (where q.status = 'published') < v_min
       or count(distinct q.id) filter (where q.status = 'published') < v_warn
  loop
    perform public.fn_enqueue_inventory_replenishment(
      v_row.topic_id,
      null,
      null,
      case
        when v_row.approved < v_warn then 'critical_reserve'
        else 'low_inventory'
      end
    );
  end loop;
end;
$$;

commit;
