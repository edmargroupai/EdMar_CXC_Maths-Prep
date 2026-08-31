-- P17b · Simulation engine (§41.3)

begin;

alter table public.exam_sessions
  add column if not exists item_manifest jsonb not null default '[]'::jsonb;

-- ── fn_create_simulation ──────────────────────────────────────────────────────

create or replace function public.fn_create_simulation(
  p_form public.simulation_form default 'p01_regular'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student uuid := auth.uid();
  v_duration smallint := 150;
  v_session_id uuid;
  v_items jsonb := '[]'::jsonb;
  v_module_counts jsonb := '{}'::jsonb;
  v_topic_counts jsonb := '{}'::jsonb;
  v_total integer := 0;
  v_blueprint_ok boolean := false;
  r record;
begin
  if v_student is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.exam_sessions
    where student_id = v_student and status = 'in_progress'
  ) then
    raise exception 'simulation_already_in_progress' using errcode = 'P0001';
  end if;

  for r in
    select
      qv.id as question_version_id,
      qv.question_id,
      m.module_no,
      t.id as topic_id,
      t.paper01_items as target_items,
      row_number() over (
        partition by m.module_no
        order by md5(v_student::text || qv.id::text)
      ) as module_rank
    from public.question_versions qv
    join public.questions q on q.id = qv.question_id
    join public.question_skills qs on qs.question_id = q.id
    join public.skill_objectives sko on sko.skill_id = qs.skill_id
    join public.specific_objectives so on so.id = sko.specific_objective_id
    join public.topics t on t.id = so.topic_id
    join public.modules m on m.id = t.module_id
    where q.status = 'published'
      and m.syllabus_code = (select syllabus_version from public.profiles where id = v_student)
  loop
    if r.module_rank <= 20 then
      v_items := v_items || jsonb_build_array(jsonb_build_object(
        'position', v_total + 1,
        'question_version_id', r.question_version_id,
        'question_id', r.question_id,
        'module_no', r.module_no,
        'topic_id', r.topic_id
      ));
      v_module_counts := jsonb_set(
        v_module_counts,
        array[r.module_no::text],
        to_jsonb(coalesce((v_module_counts ->> r.module_no::text)::integer, 0) + 1),
        true
      );
      v_topic_counts := jsonb_set(
        v_topic_counts,
        array[r.topic_id::text],
        to_jsonb(coalesce((v_topic_counts ->> r.topic_id::text)::integer, 0) + 1),
        true
      );
      v_total := v_total + 1;
      exit when v_total >= 60;
    end if;
  end loop;

  v_blueprint_ok := v_total = 60
    and coalesce((v_module_counts ->> '1')::integer, 0) = 20
    and coalesce((v_module_counts ->> '2')::integer, 0) = 20
    and coalesce((v_module_counts ->> '3')::integer, 0) = 20;

  insert into public.exam_sessions (
    student_id,
    form,
    blueprint_ok,
    mode,
    duration_minutes,
    server_started_at,
    expires_at,
    item_manifest
  ) values (
    v_student,
    p_form,
    v_blueprint_ok,
    'timed',
    v_duration,
    now(),
    now() + make_interval(mins => v_duration),
    v_items
  )
  returning id into v_session_id;

  return jsonb_build_object(
    'exam_session_id', v_session_id,
    'item_count', v_total,
    'blueprint_ok', v_blueprint_ok,
    'expires_at', (select expires_at from public.exam_sessions where id = v_session_id),
    'server_started_at', (select server_started_at from public.exam_sessions where id = v_session_id)
  );
end;
$$;

-- ── fn_submit_simulation ──────────────────────────────────────────────────────

create or replace function public.fn_submit_simulation(p_exam_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student uuid := auth.uid();
  v_session record;
  v_late interval;
begin
  select * into v_session
  from public.exam_sessions
  where id = p_exam_session_id and student_id = v_student;

  if not found then
    raise exception 'simulation not found' using errcode = 'P0002';
  end if;

  v_late := greatest(interval '0', now() - v_session.expires_at);

  update public.exam_sessions
  set status = 'completed',
      submitted_at = least(now(), v_session.expires_at),
      submitted_late_by = case
        when v_late > interval '0' then extract(epoch from v_late)::smallint
        else null
      end,
      answer_marks = coalesce((
        select sum(er.marks_awarded)::smallint
        from public.exam_responses er
        where er.exam_session_id = p_exam_session_id
      ), 0),
      max_answer_marks = coalesce((
        select sum(er.max_marks)::smallint
        from public.exam_responses er
        where er.exam_session_id = p_exam_session_id
      ), 0)
  where id = p_exam_session_id;

  return jsonb_build_object(
    'exam_session_id', p_exam_session_id,
    'blueprint_ok', v_session.blueprint_ok,
    'submitted_late_by', case when v_late > interval '0' then extract(epoch from v_late)::integer else null end
  );
end;
$$;

grant execute on function public.fn_create_simulation(public.simulation_form) to authenticated;
grant execute on function public.fn_submit_simulation(uuid) to authenticated;

commit;
