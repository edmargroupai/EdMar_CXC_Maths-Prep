-- ADR-023 · Selection cooldown preference, cycle wiring, RLS, grants

begin;

-- ── RLS ─────────────────────────────────────────────────────────────────────

alter table public.topic_mastery_cycles enable row level security;
alter table public.question_templates enable row level security;

create policy tmc_select_own on public.topic_mastery_cycles
  for select to authenticated
  using (student_id = auth.uid());

create policy tmc_select_staff on public.topic_mastery_cycles
  for select to authenticated
  using (public.auth_role() in (
    'reviewer', 'content_admin', 'curriculum_admin', 'support', 'super_admin'
  ));

create policy qt_select_staff on public.question_templates
  for select to authenticated
  using (public.auth_role() in (
    'reviewer', 'content_admin', 'curriculum_admin', 'super_admin'
  ));

create policy qt_mutate_staff on public.question_templates
  for all to authenticated
  using (public.auth_role() in ('content_admin', 'curriculum_admin', 'super_admin'))
  with check (public.auth_role() in ('content_admin', 'curriculum_admin', 'super_admin'));

-- ── Seed a starter template registry row (generator lives in pipeline) ────────

insert into public.question_templates (
  slug, category, description, parameter_schema, generator_key, status
) values
  (
    'percent_discount',
    'consumer_arithmetic',
    'Percentage discount → sale price',
    '{"original_price":{"min":100,"max":20000,"step":50},"discount_pct":{"min":5,"max":40,"step":5}}'::jsonb,
    'percent_discount',
    'active'
  ),
  (
    'simple_interest',
    'consumer_arithmetic',
    'Simple interest I = PRT/100',
    '{"principal":{"min":500,"max":50000,"step":100},"rate":{"min":2,"max":15,"step":1},"time_years":{"min":1,"max":5,"step":1}}'::jsonb,
    'simple_interest',
    'active'
  ),
  (
    'linear_solve',
    'algebra',
    'Solve ax + b = c',
    '{"a":{"min":2,"max":12},"b":{"min":-20,"max":20},"x":{"min":-10,"max":15}}'::jsonb,
    'linear_solve',
    'active'
  )
on conflict (slug) do nothing;

-- ── fn_create_practice_session — recent-ID preference + cycle link ───────────

create or replace function public.fn_create_practice_session(
  p_mode public.practice_mode,
  p_scope_kind text,
  p_scope_ids uuid[],
  p_count smallint,
  p_difficulty_mode text default 'mixed',
  p_client_seed bigint default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student uuid := auth.uid();
  v_syllabus public.syllabus_code;
  v_allowance smallint;
  v_count smallint;
  v_max smallint;
  v_objective_ids uuid[];
  v_seed bigint;
  v_session_id uuid;
  v_starved boolean := false;
  v_existing uuid;
  v_delivered smallint := 0;
  v_items jsonb := '[]'::jsonb;
  v_recent_n integer;
  v_topic_id uuid;
  v_cycle_id uuid;
  v_cycle_status public.mastery_cycle_status;
  v_remediation_skills uuid[];
begin
  if v_student is null then
    raise exception 'not authenticated'
      using errcode = '42501';
  end if;

  perform public.fn_rate_limit_check(
    'fn_create_practice_session:' || v_student::text,
    30,
    3600
  );

  select coalesce((value #>> '{}')::smallint, 20)
  into v_max
  from public.app_config
  where key = 'session_max_questions';

  v_count := least(greatest(p_count, 1), v_max)::smallint;

  -- Remediation cycles may request a smaller targeted set
  if p_scope_kind = 'topic' and coalesce(array_length(p_scope_ids, 1), 0) = 1 then
    v_topic_id := p_scope_ids[1];
    v_cycle_id := public.fn_get_or_create_topic_cycle(v_student, v_topic_id);
    if v_cycle_id is not null then
      select
        status,
        case
          when status in ('remediation', 'prerequisite_remediation')
            then least(greatest(coalesce(remediation_remaining, p_count), 1), v_max)::smallint
          when status = 'in_progress'
            then least(
              greatest((questions_target - questions_answered)::integer, 1),
              v_count
            )::smallint
          else v_count
        end,
        case
          when status = 'prerequisite_remediation' then prerequisite_skill_ids
          when status = 'remediation' then weak_skill_ids
          else '{}'::uuid[]
        end
      into v_cycle_status, v_count, v_remediation_skills
      from public.topic_mastery_cycles
      where id = v_cycle_id;

      if v_cycle_status = 'mastered' then
        v_cycle_id := public.fn_get_or_create_topic_cycle(v_student, v_topic_id);
      end if;
    end if;
  end if;

  v_allowance := public.fn_check_daily_allowance(v_student, v_count);
  if v_allowance = 0 then
    raise exception 'entitlement_exhausted'
      using errcode = 'P0001';
  end if;
  v_count := v_allowance;

  select p.syllabus_version into v_syllabus
  from public.profiles p
  where p.id = v_student;

  v_objective_ids := public.fn_resolve_scope(p_scope_kind, p_scope_ids, v_syllabus);

  select ps.id
  into v_existing
  from public.practice_sessions ps
  where ps.student_id = v_student
    and ps.status = 'in_progress'
    and ps.scope_kind = p_scope_kind
    and ps.scope_ids = p_scope_ids
    and ps.difficulty_mode = p_difficulty_mode
    and ps.mode = p_mode
    and ps.started_at > now() - interval '60 seconds'
  order by ps.started_at desc
  limit 1;

  if v_existing is not null then
    select jsonb_build_object(
      'session_id', ps.id,
      'delivered_count', ps.delivered_count,
      'requested_count', ps.requested_count,
      'allowance_remaining', public.fn_check_daily_allowance(v_student, v_max::smallint),
      'starved', false,
      'topic_cycle_id', ps.topic_cycle_id,
      'items', coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'position', psi.position,
              'question_id', psi.question_id,
              'question_version_id', psi.question_version_id,
              'option_order', psi.option_order
            )
            order by psi.position
          )
          from public.practice_session_items psi
          where psi.session_id = ps.id
        ),
        '[]'::jsonb
      )
    )
    into v_items
    from public.practice_sessions ps
    where ps.id = v_existing;

    return v_items;
  end if;

  v_recent_n := public.fn_app_config_int('cooldown_recent_ids', 40);

  drop table if exists tmp_candidates;
  create temp table tmp_candidates on commit drop as
  select distinct
    q.id as question_id,
    q.current_version_id as question_version_id,
    q.difficulty_band,
    q.variant_family_id,
    qp.is_free,
    qo.specific_objective_id as primary_objective_id
  from public.questions q
  join public.question_payloads qp on qp.question_version_id = q.current_version_id
  join public.question_objectives qo on qo.question_id = q.id and qo.is_primary
  where q.status = 'published'
    and q.retired_at is null
    and qo.specific_objective_id = any (v_objective_ids)
    and (public.has_premium(v_student) or q.is_free)
    and (
      v_remediation_skills is null
      or cardinality(v_remediation_skills) = 0
      or exists (
        select 1
        from public.question_skills qs
        where qs.question_id = q.id
          and qs.skill_id = any (v_remediation_skills)
      )
    );

  if not exists (select 1 from tmp_candidates) then
    -- Fall back without remediation skill filter (never sync AI)
    drop table if exists tmp_candidates;
    create temp table tmp_candidates on commit drop as
    select distinct
      q.id as question_id,
      q.current_version_id as question_version_id,
      q.difficulty_band,
      q.variant_family_id,
      qp.is_free,
      qo.specific_objective_id as primary_objective_id
    from public.questions q
    join public.question_payloads qp on qp.question_version_id = q.current_version_id
    join public.question_objectives qo on qo.question_id = q.id and qo.is_primary
    where q.status = 'published'
      and q.retired_at is null
      and qo.specific_objective_id = any (v_objective_ids)
      and (public.has_premium(v_student) or q.is_free);
  end if;

  if not exists (select 1 from tmp_candidates) then
    raise exception 'no_questions_available'
      using errcode = 'P0003';
  end if;

  drop table if exists tmp_recent;
  create temp table tmp_recent on commit drop as
  select a.question_id, max(a.created_at) as last_seen
  from public.attempts a
  where a.student_id = v_student
  group by a.question_id
  order by max(a.created_at) desc
  limit v_recent_n;

  -- Prefer: time-cooldown OK AND outside recent-ID window
  drop table if exists tmp_pool;
  create temp table tmp_pool on commit drop as
  select c.*
  from tmp_candidates c
  where not exists (
    select 1
    from public.attempts a
    where a.student_id = v_student
      and a.question_id = c.question_id
      and a.created_at > now() - (
        case when a.is_correct
          then coalesce(
            (select (ac.value #>> '{}')::integer from public.app_config ac where ac.key = 'cooldown_days_default'),
            30
          )
          else coalesce(
            (select (ac.value #>> '{}')::integer from public.app_config ac where ac.key = 'cooldown_days_incorrect'),
            7
          )
        end
      ) * interval '1 day'
  )
  and not exists (
    select 1 from tmp_recent r where r.question_id = c.question_id
  );

  if (select count(*) from tmp_pool) < v_count then
    -- Relax recent-ID window; keep time cooldown
    drop table if exists tmp_pool;
    create temp table tmp_pool on commit drop as
    select c.*
    from tmp_candidates c
    where not exists (
      select 1
      from public.attempts a
      where a.student_id = v_student
        and a.question_id = c.question_id
        and a.created_at > now() - (
          case when a.is_correct
            then coalesce(
              (select (ac.value #>> '{}')::integer from public.app_config ac where ac.key = 'cooldown_days_default'),
              30
            )
            else coalesce(
              (select (ac.value #>> '{}')::integer from public.app_config ac where ac.key = 'cooldown_days_incorrect'),
              7
            )
          end
        ) * interval '1 day'
    );
  end if;

  if (select count(*) from tmp_pool) < v_count then
    v_starved := true;
    -- Full relax: least-recent first preference via ranking below
    drop table if exists tmp_pool;
    create temp table tmp_pool on commit drop as select * from tmp_candidates;
  end if;

  v_seed := coalesce(p_client_seed, ('x' || substr(md5(v_student::text || clock_timestamp()::text), 1, 16))::bit(64)::bigint);
  perform setseed((abs(v_seed % 1000000)::numeric / 1000000.0));

  drop table if exists tmp_selected;
  create temp table tmp_selected on commit drop as
  with annotated as (
    select
      p.*,
      exists (
        select 1 from public.attempts a
        where a.student_id = v_student and a.question_id = p.question_id
      ) as seen,
      coalesce(
        (select max(a.created_at) from public.attempts a
         where a.student_id = v_student and a.question_id = p.question_id),
        '1970-01-01'::timestamptz
      ) as last_attempt_at,
      exists (
        select 1 from tmp_recent r where r.question_id = p.question_id
      ) as in_recent_window
    from tmp_pool p
    where case p_difficulty_mode
      when 'challenge' then p.difficulty_band >= 4
      when 'building' then p.difficulty_band <= 3
      else true
    end
  ),
  ranked as (
    select
      a.*,
      row_number() over (
        partition by coalesce(a.variant_family_id, a.question_id)
        order by
          a.seen asc,
          a.in_recent_window asc,
          a.last_attempt_at asc,
          random()
      ) as family_rn,
      row_number() over (
        order by
          a.seen asc,
          a.in_recent_window asc,
          a.last_attempt_at asc,
          random()
      ) as rn
    from annotated a
  )
  select question_id, question_version_id, difficulty_band, variant_family_id, is_free, primary_objective_id
  from ranked
  where family_rn = 1
  order by rn
  limit v_count;

  v_delivered := (select count(*)::smallint from tmp_selected);

  if v_delivered = 0 then
    raise exception 'no_questions_available'
      using errcode = 'P0003';
  end if;

  insert into public.practice_sessions (
    student_id, mode, scope_kind, scope_ids, syllabus_code,
    difficulty_mode, requested_count, delivered_count, seed, status, topic_cycle_id
  ) values (
    v_student, p_mode, p_scope_kind, p_scope_ids, v_syllabus,
    p_difficulty_mode, p_count, v_delivered, v_seed, 'in_progress', v_cycle_id
  )
  returning id into v_session_id;

  insert into public.practice_session_items (
    session_id, position, question_id, question_version_id, option_order
  )
  select
    v_session_id,
    row_number() over (order by s.question_id)::smallint - 1,
    s.question_id,
    s.question_version_id,
    (
      select array_agg(qo.option_key order by
        case when qo.preserve_order then qo.sequence else random() end)
      from public.question_options qo
      where qo.question_version_id = s.question_version_id
    )
  from tmp_selected s;

  insert into public.student_daily_usage (student_id, usage_date, questions_served, sessions_started)
  values (v_student, current_date, v_delivered, 1)
  on conflict (student_id, usage_date) do update
  set questions_served = public.student_daily_usage.questions_served + excluded.questions_served,
      sessions_started = public.student_daily_usage.sessions_started + 1;

  select jsonb_build_object(
    'session_id', v_session_id,
    'delivered_count', v_delivered,
    'requested_count', p_count,
    'allowance_remaining', public.fn_check_daily_allowance(v_student, (v_max - v_delivered)::smallint),
    'starved', v_starved,
    'topic_cycle_id', v_cycle_id,
    'items', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'position', psi.position,
            'question_id', psi.question_id,
            'question_version_id', psi.question_version_id,
            'option_order', psi.option_order
          )
          order by psi.position
        )
        from public.practice_session_items psi
        where psi.session_id = v_session_id
      ),
      '[]'::jsonb
    )
  )
  into v_items;

  return v_items;
end;
$$;

-- ── fn_complete_session — accumulate mastery cycle ───────────────────────────

create or replace function public.fn_complete_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student uuid := auth.uid();
  v_session record;
  v_before jsonb;
  v_after jsonb;
  v_duration integer;
  v_cycle_result jsonb;
begin
  select * into v_session
  from public.practice_sessions
  where id = p_session_id and student_id = v_student;

  if not found then
    raise exception 'session not found'
      using errcode = 'P0002';
  end if;

  if v_session.status = 'completed' then
    raise exception 'session_already_completed'
      using errcode = 'P0001';
  end if;

  select coalesce(jsonb_object_agg(skill_id::text, score), '{}'::jsonb)
  into v_before
  from public.student_skill_mastery
  where student_id = v_student;

  update public.practice_sessions
  set status = 'completed',
      completed_at = now(),
      duration_seconds = extract(epoch from (now() - started_at))::integer
  where id = p_session_id
  returning duration_seconds into v_duration;

  v_cycle_result := public.fn_accumulate_topic_cycle(p_session_id);

  select coalesce(jsonb_object_agg(skill_id::text, score), '{}'::jsonb)
  into v_after
  from public.student_skill_mastery
  where student_id = v_student;

  insert into public.audit_log (actor_id, actor_role, action, entity_type, entity_id)
  values (v_student, public.auth_role(), 'complete_session', 'practice_session', p_session_id::text);

  return jsonb_build_object(
    'session_id', p_session_id,
    'correct_count', v_session.correct_count,
    'answered_count', v_session.answered_count,
    'delivered_count', v_session.delivered_count,
    'duration_seconds', v_duration,
    'mastery_before', v_before,
    'mastery_after', v_after,
    'mastery_cycle', v_cycle_result
  );
end;
$$;

-- ── Pure cycle evaluate helper for tests (no session required) ───────────────

create or replace function public.fn_evaluate_cycle_from_counts(
  p_student uuid,
  p_topic_id uuid,
  p_correct smallint,
  p_answered smallint,
  p_skill_coverage_met boolean,
  p_prerequisite_met boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_accuracy numeric;
  v_threshold numeric;
  v_near_min integer;
  v_near_max integer;
  v_mid_min integer;
  v_mid_max integer;
  v_near_count integer;
  v_mid_count integer;
  v_low_count integer;
begin
  if p_answered <= 0 then
    return jsonb_build_object('verdict', 'in_progress');
  end if;

  v_accuracy := p_correct::numeric / p_answered;
  v_threshold := public.fn_app_config_numeric('mastery_accuracy_threshold', 0.90);
  v_near_min := public.fn_app_config_int('remediation_band_near_min', 15);
  v_near_max := public.fn_app_config_int('remediation_band_near_max', 17);
  v_mid_min := public.fn_app_config_int('remediation_band_mid_min', 10);
  v_mid_max := public.fn_app_config_int('remediation_band_mid_max', 14);
  v_near_count := public.fn_app_config_int('remediation_near_count', 5);
  v_mid_count := public.fn_app_config_int('remediation_mid_count', 10);
  v_low_count := public.fn_app_config_int('remediation_low_count', 10);

  if v_accuracy >= v_threshold and p_skill_coverage_met and p_prerequisite_met then
    return jsonb_build_object(
      'verdict', 'mastered',
      'overall_accuracy', v_accuracy,
      'skill_coverage_met', true,
      'prerequisite_met', true
    );
  end if;

  if v_accuracy >= v_threshold and (not p_skill_coverage_met or not p_prerequisite_met) then
    return jsonb_build_object(
      'verdict', case when not p_prerequisite_met then 'prerequisite_remediation' else 'remediation' end,
      'overall_accuracy', v_accuracy,
      'skill_coverage_met', p_skill_coverage_met,
      'prerequisite_met', p_prerequisite_met,
      'remediation_band', 'coverage_gap',
      'remediation_remaining', v_mid_count
    );
  end if;

  if p_correct between v_near_min and v_near_max then
    return jsonb_build_object(
      'verdict', 'remediation',
      'remediation_band', 'near',
      'remediation_remaining', v_near_count,
      'overall_accuracy', v_accuracy
    );
  end if;

  if p_correct between v_mid_min and v_mid_max then
    return jsonb_build_object(
      'verdict', 'remediation',
      'remediation_band', 'mid',
      'remediation_remaining', v_mid_count,
      'overall_accuracy', v_accuracy
    );
  end if;

  return jsonb_build_object(
    'verdict', 'prerequisite_remediation',
    'remediation_band', 'low',
    'remediation_remaining', v_low_count,
    'overall_accuracy', v_accuracy
  );
end;
$$;

grant execute on function public.fn_evaluate_topic_mastery_cycle(uuid) to authenticated;
grant execute on function public.fn_get_or_create_topic_cycle(uuid, uuid) to authenticated;
grant execute on function public.fn_accumulate_topic_cycle(uuid) to authenticated;
grant execute on function public.fn_topic_inventory_health(uuid) to authenticated;
grant execute on function public.fn_enqueue_inventory_replenishment(uuid, uuid, uuid, text) to authenticated;
grant execute on function public.fn_evaluate_cycle_from_counts(uuid, uuid, smallint, smallint, boolean, boolean) to authenticated;
grant execute on function public.job_check_inventory_health() to service_role;

commit;
