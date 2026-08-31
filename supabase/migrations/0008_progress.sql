-- P17 · Topic mastery rollup, weak areas, recommendation marks-at-stake

begin;

-- ── fn_update_topic_mastery (§9.11 rollup) ───────────────────────────────────

create or replace function public.fn_update_topic_mastery(
  p_student uuid,
  p_topic uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_score numeric;
  v_confidence numeric;
  v_attempts integer;
  v_skills_started integer;
  v_skills_total integer;
begin
  select
    count(distinct s.id),
    count(distinct s.id) filter (where ssm.score is not null)
  into v_skills_total, v_skills_started
  from public.skills s
  join public.skill_objectives sko on sko.skill_id = s.id
  join public.specific_objectives so on so.id = sko.specific_objective_id
  left join public.student_skill_mastery ssm
    on ssm.student_id = p_student and ssm.skill_id = s.id
  where so.topic_id = p_topic
    and s.is_active;

  select
    coalesce(avg(ssm.score), 35),
    coalesce(avg(ssm.confidence), 0),
    coalesce(sum(ssm.attempts_count), 0)
  into v_score, v_confidence, v_attempts
  from public.skills s
  join public.skill_objectives sko on sko.skill_id = s.id
  join public.specific_objectives so on so.id = sko.specific_objective_id
  left join public.student_skill_mastery ssm
    on ssm.student_id = p_student and ssm.skill_id = s.id
  where so.topic_id = p_topic
    and s.is_active;

  insert into public.student_topic_mastery (
    student_id,
    topic_id,
    score,
    confidence,
    attempts_count,
    skills_started,
    skills_total,
    updated_at
  ) values (
    p_student,
    p_topic,
    round(v_score, 2),
    round(v_confidence, 3),
    v_attempts,
    coalesce(v_skills_started, 0),
    coalesce(v_skills_total, 0),
    now()
  )
  on conflict (student_id, topic_id) do update set
    score = excluded.score,
    confidence = excluded.confidence,
    attempts_count = excluded.attempts_count,
    skills_started = excluded.skills_started,
    skills_total = excluded.skills_total,
    updated_at = now();
end;
$$;

-- ── fn_weak_areas (§42.1, AT-22) ─────────────────────────────────────────────

create or replace function public.fn_weak_areas(p_student uuid default auth.uid())
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_syllabus public.syllabus_code;
begin
  if p_student is null then
    return '[]'::jsonb;
  end if;

  select syllabus_version into v_syllabus
  from public.profiles where id = p_student;

  return coalesce((
    select jsonb_agg(row_to_json(x) order by x.mark_impact desc)
    from (
      select
        t.id as topic_id,
        t.code as topic_code,
        t.name as topic_name,
        coalesce(t.paper01_items, 0) as marks_at_stake,
        coalesce(stm.score, 35)::numeric as mastery_score,
        round(
          coalesce(t.paper01_items, 0)::numeric
          * (1 - coalesce(stm.score, 35) / 100.0),
          2
        ) as mark_impact
      from public.topics t
      left join public.student_topic_mastery stm
        on stm.student_id = p_student and stm.topic_id = t.id
      where t.syllabus_code = v_syllabus
        and t.is_active
        and coalesce(t.paper01_items, 0) > 0
    ) x
  ), '[]'::jsonb);
end;
$$;

-- ── fn_get_recommendation — add marks_at_stake ───────────────────────────────

create or replace function public.fn_get_recommendation(p_student uuid default auth.uid())
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_syllabus public.syllabus_code;
  v_best record;
  v_score numeric;
  v_best_score numeric := -1e9;
  v_result jsonb;
  v_marks_at_stake integer;
  r record;
begin
  if p_student is null then
    return null;
  end if;

  select syllabus_version into v_syllabus
  from public.profiles where id = p_student;

  for r in
    select
      s.id as skill_id,
      s.name as skill_name,
      coalesce(ssm.score, 35) as mastery_score,
      coalesce(mv.published_count, 0) as available_questions,
      coalesce(max(t.paper01_items), 0) as marks_at_stake
    from public.skills s
    join public.skill_objectives sko on sko.skill_id = s.id
    join public.specific_objectives so on so.id = sko.specific_objective_id
    join public.topics t on t.id = so.topic_id
    left join public.student_skill_mastery ssm
      on ssm.student_id = p_student and ssm.skill_id = s.id
    left join public.mv_skill_question_counts mv on mv.skill_id = s.id
    where so.syllabus_code = v_syllabus
      and s.is_active
    group by s.id, s.name, ssm.score, mv.published_count
    having coalesce(mv.published_count, 0) > 5
  loop
    v_score := 40 * (1 - coalesce(r.mastery_score, 35) / 100.0);
    v_score := v_score + 25 * 0.1;
    v_score := v_score - case when r.available_questions < 10 then 50 else 0 end;
    v_score := v_score + coalesce(r.marks_at_stake, 0) * 0.5;

    if v_score > v_best_score then
      v_best_score := v_score;
      v_best := r;
    end if;
  end loop;

  if v_best is null then
    return null;
  end if;

  v_marks_at_stake := coalesce(v_best.marks_at_stake, 0);

  v_result := jsonb_build_object(
    'scope_kind', 'skill',
    'scope_id', v_best.skill_id,
    'label', v_best.skill_name,
    'reason', format(
      '%s is worth up to %s exam marks — a strong next focus.',
      v_best.skill_name,
      v_marks_at_stake
    ),
    'marks_at_stake', v_marks_at_stake,
    'mastery', (select score from public.student_skill_mastery
                where student_id = p_student and skill_id = v_best.skill_id),
    'available_questions', v_best.available_questions
  );

  return v_result;
end;
$$;

-- ── fn_record_attempt — roll up topic mastery after skill updates ────────────

create or replace function public.fn_record_attempt(
  p_client_attempt_id uuid,
  p_question_version_id uuid,
  p_session_id uuid default null,
  p_exam_session_id uuid default null,
  p_part_key text default null,
  p_raw_answer text default null,
  p_was_skipped boolean default false,
  p_client_is_correct boolean default null,
  p_duration_ms integer default null,
  p_client_created_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student uuid := auth.uid();
  v_existing record;
  v_q record;
  v_v record;
  v_validation jsonb;
  v_is_correct boolean;
  v_normalised text;
  v_matched_ce uuid;
  v_attempt_id bigint;
  v_discrepancy boolean := false;
  v_skill record;
  v_topic uuid;
begin
  if v_student is null then
    raise exception 'not authenticated'
      using errcode = '42501';
  end if;

  perform public.fn_rate_limit_check(
    'fn_record_attempt:' || v_student::text,
    600,
    3600
  );

  select * into v_existing
  from public.attempts
  where client_attempt_id = p_client_attempt_id;

  if found then
    return jsonb_build_object(
      'attempt_id', v_existing.id,
      'is_correct', v_existing.is_correct,
      'matched_common_error_id', v_existing.matched_common_error_id,
      'discrepancy', false,
      'replayed', true
    );
  end if;

  select q.*, v.answer_spec
  into v_q
  from public.question_versions v
  join public.questions q on q.id = v.question_id
  where v.id = p_question_version_id
    and q.status = 'published';

  if not found then
    raise exception 'question version not available'
      using errcode = 'P0002';
  end if;

  if p_session_id is not null then
    if not exists (
      select 1 from public.practice_sessions ps
      where ps.id = p_session_id and ps.student_id = v_student
    ) then
      raise exception 'session not owned by caller'
        using errcode = '42501';
    end if;
  end if;

  if p_was_skipped then
    v_is_correct := false;
    v_normalised := null;
    v_validation := jsonb_build_object('is_correct', false, 'normalised', null);
  else
    v_validation := public.fn_validate_answer(v_q.answer_spec, p_raw_answer, p_part_key);
    v_is_correct := coalesce((v_validation ->> 'is_correct')::boolean, false);
    v_normalised := v_validation ->> 'normalised';
  end if;

  if p_client_is_correct is not null and p_client_is_correct is distinct from v_is_correct then
    v_discrepancy := true;
    insert into public.analytics_events (student_id, event_name, event_props, occurred_at)
    values (
      v_student,
      'answer_validation_discrepancy',
      jsonb_build_object(
        'question_id', v_q.id,
        'client_result', p_client_is_correct,
        'server_result', v_is_correct
      ),
      now()
    );
  end if;

  select ce.id into v_matched_ce
  from public.common_errors ce
  where ce.question_version_id = p_question_version_id
    and (
      (ce.wrong_value is not null and ce.wrong_value = v_normalised)
      or (ce.wrong_option_key is not null and upper(ce.wrong_option_key) = upper(coalesce(p_raw_answer, '')))
    )
  limit 1;

  insert into public.attempts (
    client_attempt_id, student_id, question_id, question_version_id,
    session_id, exam_session_id, context, part_key, raw_answer, normalised_answer,
    is_correct, client_is_correct, matched_common_error_id, was_skipped,
    difficulty_band, duration_ms, client_created_at
  ) values (
    p_client_attempt_id, v_student, v_q.id, p_question_version_id,
    p_session_id, p_exam_session_id,
    (select mode from public.practice_sessions where id = p_session_id),
    p_part_key, p_raw_answer, v_normalised,
    v_is_correct, p_client_is_correct, v_matched_ce, p_was_skipped,
    v_q.difficulty_band, p_duration_ms, p_client_created_at
  )
  returning id into v_attempt_id;

  insert into public.attempt_skills (attempt_id, skill_id, weight)
  select v_attempt_id, qs.skill_id, qs.weight
  from public.question_skills qs
  where qs.question_id = v_q.id;

  for v_skill in select skill_id from public.question_skills where question_id = v_q.id
  loop
    perform public.fn_update_skill_mastery(v_student, v_skill.skill_id);
  end loop;

  for v_topic in
    select distinct so.topic_id
    from public.question_skills qs
    join public.skill_objectives sko on sko.skill_id = qs.skill_id
    join public.specific_objectives so on so.id = sko.specific_objective_id
    where qs.question_id = v_q.id
  loop
    perform public.fn_update_topic_mastery(v_student, v_topic);
  end loop;

  if p_session_id is not null then
    update public.practice_sessions
    set answered_count = answered_count + 1,
        correct_count = correct_count + case when v_is_correct then 1 else 0 end
    where id = p_session_id;

    update public.practice_session_items
    set answered = true
    where session_id = p_session_id
      and question_version_id = p_question_version_id;

    update public.student_daily_usage
    set questions_answered = questions_answered + 1
    where student_id = v_student and usage_date = current_date;
  end if;

  return jsonb_build_object(
    'attempt_id', v_attempt_id,
    'is_correct', v_is_correct,
    'matched_common_error_id', v_matched_ce,
    'discrepancy', v_discrepancy,
    'replayed', false
  );
end;
$$;

grant execute on function public.fn_update_topic_mastery(uuid, uuid) to authenticated;
grant execute on function public.fn_weak_areas(uuid) to authenticated;

commit;
