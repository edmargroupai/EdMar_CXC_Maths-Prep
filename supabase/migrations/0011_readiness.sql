-- P17c · Readiness snapshots, grade projections, governed functions (§42)

begin;

alter type public.withheld_reason add value if not exists 'withdrawn';

-- ── Tables (§3.26–3.28) ───────────────────────────────────────────────────────

create table public.readiness_snapshots (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  computed_at timestamptz not null default now(),
  as_of date not null,
  sitting_year smallint,
  sitting_month public.sitting_month,
  index_value numeric(5, 2),
  confidence public.confidence_level not null,
  withheld_reason public.withheld_reason,
  weighted_mastery numeric(5, 2) not null default 0,
  coverage_ratio numeric(5, 4) not null default 0,
  simulation_count smallint not null default 0,
  simulation_delta numeric(5, 2),
  attempts_considered integer not null default 0,
  distinct_questions integer not null default 0,
  inputs jsonb not null default '{}',
  model_version text not null,
  trigger_source text not null
);

create index idx_rs_student on public.readiness_snapshots (student_id, computed_at desc);
create index idx_rs_model on public.readiness_snapshots (model_version, computed_at);

create table public.grade_projections (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  readiness_id uuid not null references public.readiness_snapshots (id) on delete cascade,
  computed_at timestamptz not null default now(),
  state public.projection_state not null,
  band_low smallint check (band_low between 1 and 6),
  band_high smallint check (band_high between 1 and 6),
  confidence public.confidence_level not null,
  withheld_reason public.withheld_reason,
  weeks_to_sitting smallint,
  evidence jsonb not null default '{}',
  inputs jsonb not null default '{}',
  model_version text not null,
  disclosure_version text not null,
  constraint band_order check (band_low is null or band_high is null or band_low <= band_high),
  constraint issued_has_band check (
    (state = 'issued' and band_low is not null and band_high is not null
      and confidence <> 'none' and withheld_reason is null)
    or (state = 'withheld' and band_low is null and band_high is null
      and withheld_reason is not null)
  )
);

create index idx_gp_student on public.grade_projections (student_id, computed_at desc);
create index idx_gp_backtest on public.grade_projections (model_version, weeks_to_sitting)
  where state = 'issued';

create table public.student_outcomes (
  student_id uuid primary key references public.profiles (id) on delete cascade,
  sitting_year smallint not null,
  sitting_month public.sitting_month not null,
  reported_grade smallint not null check (reported_grade between 1 and 6),
  reported_at timestamptz not null default now(),
  consent_version text not null,
  source text not null default 'student_reported'
);

insert into public.app_config (key, value, description)
values
  (
    'readiness_model_version',
    '"readiness-1.0.0"'::jsonb,
    'Version tag stored on readiness_snapshots'
  ),
  (
    'projection_model_version',
    '"projection-1.0.0"'::jsonb,
    'Version tag stored on grade_projections'
  ),
  (
    'projection_disclosure_version',
    '"disclosure-1.0.0"'::jsonb,
    'Wording version shown with issued projections'
  ),
  (
    'readiness_coverage_floor',
    '0.35'::jsonb,
    'Minimum weighted coverage ratio to issue a readiness index'
  ),
  (
    'readiness_attempts_floor',
    '5'::jsonb,
    'Minimum attempts before readiness can issue'
  ),
  (
    'readiness_practice_only_discount',
    '0.92'::jsonb,
    'Multiplier when no conformant simulation exists'
  ),
  (
    'readiness_simulation_lambda',
    '0.35'::jsonb,
    'Blend weight for conformant simulation marks'
  ),
  (
    'projection_withdrawn',
    'false'::jsonb,
    'When true, all projections return withheld without deploy'
  )
on conflict (key) do nothing;

-- ── fn_compute_readiness ──────────────────────────────────────────────────────

create or replace function public.fn_compute_readiness(
  p_student uuid default auth.uid(),
  p_as_of date default current_date,
  p_trigger_source text default 'manual'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile record;
  v_weighted_mastery numeric := 0;
  v_coverage_ratio numeric := 0;
  v_attempts integer := 0;
  v_distinct_q integer := 0;
  v_sim_count smallint := 0;
  v_sim_pct numeric;
  v_index numeric;
  v_confidence public.confidence_level := 'low';
  v_withheld public.withheld_reason;
  v_has_diagnostic boolean := false;
  v_model text;
  v_inputs jsonb;
  v_snapshot_id uuid;
  v_floor numeric;
  v_attempts_floor integer;
  v_discount numeric;
  v_lambda numeric;
begin
  if p_student is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select * into v_profile from public.profiles where id = p_student;

  select coalesce((value #>> '{}'), 'readiness-1.0.0') into v_model
  from public.app_config where key = 'readiness_model_version';
  select coalesce((value #>> '{}')::numeric, 0.35) into v_floor
  from public.app_config where key = 'readiness_coverage_floor';
  select coalesce((value #>> '{}')::integer, 5) into v_attempts_floor
  from public.app_config where key = 'readiness_attempts_floor';
  select coalesce((value #>> '{}')::numeric, 0.92) into v_discount
  from public.app_config where key = 'readiness_practice_only_discount';
  select coalesce((value #>> '{}')::numeric, 0.35) into v_lambda
  from public.app_config where key = 'readiness_simulation_lambda';

  select
    coalesce(
      sum(coalesce(stm.score, 35) * greatest(coalesce(t.paper01_items, 1), 1))
        / nullif(sum(greatest(coalesce(t.paper01_items, 1), 1)), 0),
      0
    ),
    coalesce(
      sum(case when coalesce(stm.attempts_count, 0) > 0
        then greatest(coalesce(t.paper01_items, 1), 1) else 0 end)
        / nullif(sum(greatest(coalesce(t.paper01_items, 1), 1)), 0),
      0
    )
  into v_weighted_mastery, v_coverage_ratio
  from public.topics t
  left join public.student_topic_mastery stm
    on stm.student_id = p_student and stm.topic_id = t.id
  where t.syllabus_code = v_profile.syllabus_version
    and t.is_active;

  select count(*), count(distinct question_id)
  into v_attempts, v_distinct_q
  from public.attempts
  where student_id = p_student;

  select count(*)::smallint into v_sim_count
  from public.exam_sessions es
  where es.student_id = p_student
    and es.blueprint_ok
    and es.mode = 'timed'
    and es.status = 'completed';

  select exists (
    select 1 from public.diagnostic_sessions ds
    where ds.student_id = p_student and ds.status = 'completed'
  ) into v_has_diagnostic;

  if v_sim_count > 0 then
    select coalesce(
      100.0 * sum(sub.answer_marks)::numeric / nullif(sum(sub.max_answer_marks), 0),
      v_weighted_mastery
    )
    into v_sim_pct
    from (
      select es.answer_marks, es.max_answer_marks
      from public.exam_sessions es
      where es.student_id = p_student
        and es.blueprint_ok
        and es.mode = 'timed'
        and es.status = 'completed'
      order by es.submitted_at desc nulls last
      limit 3
    ) sub;

    v_index := round((1 - v_lambda) * v_weighted_mastery + v_lambda * v_sim_pct, 2);
  else
    v_index := round(v_weighted_mastery * v_discount, 2);
    v_sim_pct := null;
  end if;

  v_withheld := null;
  if v_attempts < v_attempts_floor then
    v_withheld := 'insufficient_attempts';
    v_index := null;
  elsif v_coverage_ratio < v_floor then
    v_withheld := 'insufficient_coverage';
    v_index := null;
  elsif not v_has_diagnostic and v_sim_count = 0 then
    v_withheld := 'insufficient_coverage';
    v_index := null;
  end if;

  if v_index is not null then
    v_confidence := case
      when v_sim_count >= 2 and v_coverage_ratio >= 0.6 then 'high'
      when v_sim_count >= 1 or v_coverage_ratio >= 0.5 then 'moderate'
      else 'low'
    end;
  else
    v_confidence := 'none';
  end if;

  v_inputs := jsonb_build_object(
    'weighted_mastery', v_weighted_mastery,
    'coverage_ratio', v_coverage_ratio,
    'simulation_count', v_sim_count,
    'simulation_pct', v_sim_pct,
    'attempts', v_attempts,
    'has_diagnostic', v_has_diagnostic,
    'as_of', p_as_of
  );

  insert into public.readiness_snapshots (
    student_id, as_of, sitting_year, sitting_month,
    index_value, confidence, withheld_reason,
    weighted_mastery, coverage_ratio, simulation_count,
    simulation_delta,
    attempts_considered, distinct_questions, inputs,
    model_version, trigger_source
  ) values (
    p_student, p_as_of, v_profile.exam_sitting_year, v_profile.exam_sitting_month,
    v_index, v_confidence, v_withheld,
    round(v_weighted_mastery, 2), round(v_coverage_ratio, 4), v_sim_count,
    case when v_sim_pct is null then null else round(v_sim_pct - v_weighted_mastery, 2) end,
    v_attempts, v_distinct_q, v_inputs,
    v_model, p_trigger_source
  )
  returning id into v_snapshot_id;

  return jsonb_build_object(
    'id', v_snapshot_id,
    'index_value', v_index,
    'confidence', v_confidence,
    'withheld_reason', v_withheld,
    'weighted_mastery', round(v_weighted_mastery, 2),
    'coverage_ratio', round(v_coverage_ratio, 4),
    'simulation_count', v_sim_count,
    'attempts_considered', v_attempts,
    'distinct_questions', v_distinct_q,
    'model_version', v_model,
    'inputs', v_inputs
  );
end;
$$;

-- ── fn_get_readiness ──────────────────────────────────────────────────────────

create or replace function public.fn_get_readiness(p_student uuid default auth.uid())
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_row record;
begin
  if p_student is null then
    return jsonb_build_object('withheld_reason', 'insufficient_attempts');
  end if;

  select * into v_row
  from public.readiness_snapshots
  where student_id = p_student
  order by computed_at desc
  limit 1;

  if not found then
    return public.fn_compute_readiness(p_student, current_date, 'read');
  end if;

  return jsonb_build_object(
    'id', v_row.id,
    'index_value', v_row.index_value,
    'confidence', v_row.confidence,
    'withheld_reason', v_row.withheld_reason,
    'weighted_mastery', v_row.weighted_mastery,
    'coverage_ratio', v_row.coverage_ratio,
    'simulation_count', v_row.simulation_count,
    'simulation_delta', v_row.simulation_delta,
    'attempts_considered', v_row.attempts_considered,
    'distinct_questions', v_row.distinct_questions,
    'model_version', v_row.model_version,
    'computed_at', v_row.computed_at,
    'inputs', v_row.inputs
  );
end;
$$;

-- ── fn_get_readiness_series ───────────────────────────────────────────────────

create or replace function public.fn_get_readiness_series(p_student uuid default auth.uid())
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(row_to_json(s) order by s.computed_at), '[]'::jsonb)
  from (
    select computed_at, index_value, confidence, withheld_reason
    from public.readiness_snapshots
    where student_id = p_student
    order by computed_at desc
    limit 60
  ) s;
$$;

-- ── fn_compute_grade_projection ───────────────────────────────────────────────

create or replace function public.fn_compute_grade_projection(
  p_student uuid default auth.uid(),
  p_as_of date default current_date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_readiness jsonb;
  v_readiness_id uuid;
  v_state public.projection_state := 'withheld';
  v_reason public.withheld_reason := 'insufficient_coverage';
  v_band_low smallint;
  v_band_high smallint;
  v_confidence public.confidence_level := 'none';
  v_centre smallint;
  v_width smallint;
  v_index numeric;
  v_model text;
  v_disclosure text;
  v_weeks smallint;
  v_projection_id uuid;
  v_withdrawn boolean := false;
  v_sim_count smallint;
begin
  if p_student is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select coalesce((value #>> '{}')::boolean, false) into v_withdrawn
  from public.app_config where key = 'projection_withdrawn';

  if v_withdrawn then
    v_reason := 'withdrawn';
    v_readiness := public.fn_get_readiness(p_student);
    v_readiness_id := (v_readiness ->> 'id')::uuid;
    insert into public.grade_projections (
      student_id, readiness_id, state, confidence, withheld_reason,
      evidence, inputs, model_version, disclosure_version
    ) values (
      p_student, v_readiness_id, 'withheld', 'none', v_reason,
      jsonb_build_object('withdrawn', true),
      v_readiness, 'projection-1.0.0', 'disclosure-1.0.0'
    )
    returning id into v_projection_id;
    return jsonb_build_object('id', v_projection_id, 'state', 'withheld', 'withheld_reason', v_reason);
  end if;

  if not public.has_premium(p_student) then
    v_reason := 'not_entitled';
    v_readiness := public.fn_get_readiness(p_student);
    v_readiness_id := (v_readiness ->> 'id')::uuid;
    insert into public.grade_projections (
      student_id, readiness_id, state, confidence, withheld_reason,
      evidence, inputs, model_version, disclosure_version
    ) values (
      p_student, v_readiness_id, 'withheld', 'none', v_reason,
      jsonb_build_object('not_entitled', true),
      v_readiness, 'projection-1.0.0', 'disclosure-1.0.0'
    )
    returning id into v_projection_id;
    return jsonb_build_object('id', v_projection_id, 'state', 'withheld', 'withheld_reason', v_reason);
  end if;

  v_readiness := public.fn_get_readiness(p_student);
  v_readiness_id := (v_readiness ->> 'id')::uuid;
  v_index := (v_readiness ->> 'index_value')::numeric;
  v_sim_count := coalesce((v_readiness ->> 'simulation_count')::smallint, 0);

  if v_index is null then
    v_reason := coalesce(
      (v_readiness ->> 'withheld_reason')::public.withheld_reason,
      'insufficient_coverage'
    );
  elsif v_sim_count = 0 then
    v_reason := 'no_simulation';
  else
    v_state := 'issued';
    v_reason := null;
    v_centre := case
      when v_index >= 85 then 2
      when v_index >= 70 then 3
      when v_index >= 55 then 4
      when v_index >= 40 then 5
      else 6
    end;
    v_confidence := (v_readiness ->> 'confidence')::public.confidence_level;
    v_width := case v_confidence
      when 'high' then 1
      when 'moderate' then 1
      else 2
    end;
    v_band_low := greatest(1, v_centre - v_width);
    v_band_high := least(6, v_centre + v_width);
  end if;

  select coalesce((value #>> '{}'), 'projection-1.0.0') into v_model
  from public.app_config where key = 'projection_model_version';
  select coalesce((value #>> '{}'), 'disclosure-1.0.0') into v_disclosure
  from public.app_config where key = 'projection_disclosure_version';

  insert into public.grade_projections (
    student_id, readiness_id, state,
    band_low, band_high, confidence, withheld_reason,
    weeks_to_sitting, evidence, inputs,
    model_version, disclosure_version
  ) values (
    p_student, v_readiness_id, v_state,
    v_band_low, v_band_high, v_confidence, v_reason,
    v_weeks,
    jsonb_build_object(
      'simulation_count', v_sim_count,
      'attempts', v_readiness -> 'attempts_considered',
      'coverage_ratio', v_readiness -> 'coverage_ratio'
    ),
    v_readiness,
    v_model, v_disclosure
  )
  returning id into v_projection_id;

  if v_state = 'issued' then
    return jsonb_build_object(
      'id', v_projection_id,
      'state', 'issued',
      'band_low', v_band_low,
      'band_high', v_band_high,
      'confidence', v_confidence,
      'model_version', v_model,
      'disclosure_version', v_disclosure,
      'evidence', jsonb_build_object('simulation_count', v_sim_count)
    );
  end if;

  return jsonb_build_object(
    'id', v_projection_id,
    'state', 'withheld',
    'withheld_reason', v_reason,
    'confidence', v_confidence
  );
end;
$$;

-- ── fn_get_grade_projection ───────────────────────────────────────────────────

create or replace function public.fn_get_grade_projection(p_student uuid default auth.uid())
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_row record;
  v_withdrawn boolean := false;
begin
  if p_student is null then
    return jsonb_build_object('state', 'withheld', 'withheld_reason', 'not_entitled');
  end if;

  select coalesce((value #>> '{}')::boolean, false) into v_withdrawn
  from public.app_config where key = 'projection_withdrawn';

  if v_withdrawn then
    return jsonb_build_object('state', 'withheld', 'withheld_reason', 'withdrawn');
  end if;

  select * into v_row
  from public.grade_projections
  where student_id = p_student
  order by computed_at desc
  limit 1;

  if not found then
    return public.fn_compute_grade_projection(p_student, current_date);
  end if;

  if not public.has_premium(p_student) then
    return jsonb_build_object(
      'state', 'withheld',
      'withheld_reason', 'not_entitled',
      'confidence', v_row.confidence
    );
  end if;

  if v_row.state = 'issued' then
    return jsonb_build_object(
      'id', v_row.id,
      'state', 'issued',
      'band_low', v_row.band_low,
      'band_high', v_row.band_high,
      'confidence', v_row.confidence,
      'model_version', v_row.model_version,
      'disclosure_version', v_row.disclosure_version,
      'evidence', v_row.evidence,
      'computed_at', v_row.computed_at
    );
  end if;

  return jsonb_build_object(
    'id', v_row.id,
    'state', 'withheld',
    'withheld_reason', v_row.withheld_reason,
    'confidence', v_row.confidence,
    'evidence', v_row.evidence,
    'computed_at', v_row.computed_at
  );
end;
$$;

-- ── fn_projection_calibration (admin aggregate only) ────────────────────────────

create or replace function public.fn_projection_calibration(
  p_model_version text default 'projection-1.0.0',
  p_weeks_out smallint default 8
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return coalesce((
    select jsonb_build_object(
      'model_version', p_model_version,
      'weeks_out', p_weeks_out,
      'issued_count', count(*) filter (where gp.state = 'issued'),
      'withheld_count', count(*) filter (where gp.state = 'withheld'),
      'band_hit_rate', null,
      'directional_bias', null,
      'coverage', count(*)::numeric / nullif((select count(*) from public.profiles), 0)
    )
    from public.grade_projections gp
    where gp.model_version = p_model_version
  ), '{}'::jsonb);
end;
$$;

-- ── RLS ───────────────────────────────────────────────────────────────────────

alter table public.readiness_snapshots enable row level security;
alter table public.grade_projections enable row level security;
alter table public.student_outcomes enable row level security;

create policy readiness_snapshots_select_own on public.readiness_snapshots
  for select to authenticated using (student_id = auth.uid());

create policy readiness_snapshots_select_staff on public.readiness_snapshots
  for select to authenticated using (public.is_staff());

create policy grade_projections_select_own on public.grade_projections
  for select to authenticated using (student_id = auth.uid());

create policy grade_projections_select_staff on public.grade_projections
  for select to authenticated using (public.is_staff());

create policy student_outcomes_own on public.student_outcomes
  for all to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

grant execute on function public.fn_compute_readiness(uuid, date, text) to authenticated;
grant execute on function public.fn_get_readiness(uuid) to authenticated;
grant execute on function public.fn_get_readiness_series(uuid) to authenticated;
grant execute on function public.fn_compute_grade_projection(uuid, date) to authenticated;
grant execute on function public.fn_get_grade_projection(uuid) to authenticated;
grant execute on function public.fn_projection_calibration(text, smallint) to authenticated;

commit;
