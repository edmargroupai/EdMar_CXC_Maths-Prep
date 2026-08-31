-- P17a · Diagnostic engine schema and RPCs (§3.25, §41.2)

begin;

create table public.diagnostic_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  practice_session_id uuid not null references public.practice_sessions (id) on delete cascade,
  syllabus_code public.syllabus_code not null references public.syllabus_versions (code),
  target_items smallint not null default 22 check (target_items between 15 and 30),
  items_served smallint not null default 0,
  items_answered smallint not null default 0,
  modules_covered smallint not null default 0,
  topics_covered smallint not null default 0,
  walk_log jsonb not null default '[]'::jsonb,
  coverage_map jsonb,
  status public.session_status not null default 'in_progress',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  abandoned_at timestamptz
);

create index idx_ds_student on public.diagnostic_sessions (student_id, started_at desc);
create unique index idx_ds_open on public.diagnostic_sessions (student_id)
  where status = 'in_progress';

alter table public.diagnostic_sessions enable row level security;

create policy diagnostic_sessions_select_own on public.diagnostic_sessions
  for select to authenticated
  using (student_id = auth.uid());

create policy diagnostic_sessions_insert_own on public.diagnostic_sessions
  for insert to authenticated
  with check (student_id = auth.uid());

create policy diagnostic_sessions_update_own on public.diagnostic_sessions
  for update to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

-- ── fn_create_diagnostic ──────────────────────────────────────────────────────

create or replace function public.fn_create_diagnostic()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student uuid := auth.uid();
  v_syllabus public.syllabus_code;
  v_session_id uuid;
  v_diag_id uuid;
begin
  if v_student is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.diagnostic_sessions
    where student_id = v_student and status = 'in_progress'
  ) then
    raise exception 'diagnostic_already_in_progress' using errcode = 'P0001';
  end if;

  select syllabus_version into v_syllabus from public.profiles where id = v_student;

  insert into public.practice_sessions (
    student_id,
    mode,
    scope_kind,
    scope_ids,
    syllabus_code,
    difficulty_mode,
    requested_count,
    delivered_count,
    seed,
    status
  ) values (
    v_student,
    'diagnostic',
    'mixed',
    '{}',
    v_syllabus,
    'mixed',
    22,
    0,
    extract(epoch from now())::bigint,
    'in_progress'
  )
  returning id into v_session_id;

  insert into public.diagnostic_sessions (
    student_id, practice_session_id, syllabus_code, target_items
  ) values (
    v_student, v_session_id, v_syllabus, 22
  )
  returning id into v_diag_id;

  return jsonb_build_object(
    'diagnostic_session_id', v_diag_id,
    'practice_session_id', v_session_id,
    'target_items', 22
  );
end;
$$;

-- ── fn_diagnostic_next_item — block 1 only, no reveal path ───────────────────

create or replace function public.fn_diagnostic_next_item(p_diagnostic_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student uuid := auth.uid();
  v_diag record;
  v_topic record;
  v_qv record;
  v_band smallint := 2;
  v_seq integer;
begin
  select ds.*, ps.id as ps_id
  into v_diag
  from public.diagnostic_sessions ds
  join public.practice_sessions ps on ps.id = ds.practice_session_id
  where ds.id = p_diagnostic_session_id
    and ds.student_id = v_student
    and ds.status = 'in_progress';

  if not found then
    raise exception 'diagnostic not found' using errcode = 'P0002';
  end if;

  if v_diag.items_served >= v_diag.target_items then
    return jsonb_build_object('complete', true);
  end if;

  select t.id, t.name, coalesce(t.paper01_items, 1) as weight
  into v_topic
  from public.topics t
  where t.syllabus_code = v_diag.syllabus_code
    and t.is_active
    and coalesce(t.paper01_items, 0) > 0
  order by random()
  limit 1;

  select qv.id, qv.question_id, qv.stem_blocks
  into v_qv
  from public.question_versions qv
  join public.questions q on q.id = qv.question_id
  join public.question_skills qs on qs.question_id = q.id
  join public.skill_objectives sko on sko.skill_id = qs.skill_id
  join public.specific_objectives so on so.id = sko.specific_objective_id
  where q.status = 'published'
    and so.topic_id = v_topic.id
    and qv.difficulty_band = v_band
  order by md5(v_diag.id::text || v_diag.items_served::text || qv.id::text)
  limit 1;

  if not found then
    select qv.id, qv.question_id, qv.stem_blocks
    into v_qv
    from public.question_versions qv
    join public.questions q on q.id = qv.question_id
    where q.status = 'published'
    order by md5(v_diag.id::text || v_diag.items_served::text || qv.id::text)
    limit 1;
  end if;

  v_seq := v_diag.items_served + 1;

  insert into public.practice_session_items (
    session_id, position, question_id, question_version_id, option_order
  ) values (
    v_diag.practice_session_id,
    v_seq,
    v_qv.question_id,
    v_qv.id,
    null
  );

  update public.diagnostic_sessions
  set items_served = items_served + 1,
      walk_log = walk_log || jsonb_build_array(jsonb_build_object(
        'seq', v_seq,
        'topicId', v_topic.id,
        'bandBefore', v_band,
        'questionVersionId', v_qv.id
      ))
  where id = p_diagnostic_session_id;

  return jsonb_build_object(
    'position', v_seq,
    'question_version_id', v_qv.id,
    'question_id', v_qv.question_id,
    'block_1', v_qv.stem_blocks,
    'topic_name', v_topic.name
  );
end;
$$;

-- ── fn_complete_diagnostic ────────────────────────────────────────────────────

create or replace function public.fn_complete_diagnostic(p_diagnostic_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student uuid := auth.uid();
  v_diag record;
  v_coverage jsonb := '{}'::jsonb;
  r record;
begin
  select * into v_diag
  from public.diagnostic_sessions
  where id = p_diagnostic_session_id
    and student_id = v_student
    and status = 'in_progress';

  if not found then
    raise exception 'diagnostic not found' using errcode = 'P0002';
  end if;

  for r in
    select
      t.id as topic_id,
      case
        when coalesce(stm.score, 0) >= 70 then 'secure'
        when coalesce(stm.score, 0) >= 50 then 'developing'
        when coalesce(stm.attempts_count, 0) > 0 then 'needs_work'
        else 'not_started'
      end as mastery_band
    from public.topics t
    left join public.student_topic_mastery stm
      on stm.student_id = v_student and stm.topic_id = t.id
    where t.syllabus_code = v_diag.syllabus_code
      and t.is_active
  loop
    v_coverage := v_coverage || jsonb_build_object(r.topic_id::text, r.mastery_band);
  end loop;

  update public.diagnostic_sessions
  set status = 'completed',
      completed_at = now(),
      coverage_map = v_coverage,
      topics_covered = (select count(*) from public.topics t where t.syllabus_code = v_diag.syllabus_code)
  where id = p_diagnostic_session_id;

  update public.practice_sessions
  set status = 'completed', completed_at = now()
  where id = v_diag.practice_session_id;

  return jsonb_build_object('coverage_map', v_coverage);
end;
$$;

grant execute on function public.fn_create_diagnostic() to authenticated;
grant execute on function public.fn_diagnostic_next_item(uuid) to authenticated;
grant execute on function public.fn_complete_diagnostic(uuid) to authenticated;

commit;
