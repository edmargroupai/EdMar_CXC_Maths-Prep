-- P15 · fn_reveal_response — blocks 2–10 after attempt (§40.4)

create or replace function public.fn_reveal_response(
  p_question_version_id uuid,
  p_client_attempt_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student uuid := auth.uid();
  v_attempt record;
  v_qv record;
  v_steps jsonb;
  v_errors jsonb;
  v_math jsonb;
  v_objective_codes text[];
  v_all_blocks text;
begin
  if v_student is null then
    raise exception 'not authenticated'
      using errcode = '42501';
  end if;

  select *
  into v_attempt
  from public.attempts a
  where a.client_attempt_id = p_client_attempt_id
    and a.student_id = v_student
    and a.question_version_id = p_question_version_id;

  if not found then
    return null;
  end if;

  select qv.*, q.status as question_status
  into v_qv
  from public.question_versions qv
  join public.questions q on q.id = qv.question_id
  where qv.id = p_question_version_id
    and q.status = 'published';

  if not found then
    return null;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'stepNo', ss.step_no,
        'instruction', ss.instruction,
        'contentBlocks', ss.working_blocks,
        'resultBlocks', ss.result_blocks,
        'marks', ss.marks,
        'note', ss.sub_note
      )
      order by ss.step_no
    ),
    '[]'::jsonb
  )
  into v_steps
  from public.solution_steps ss
  where ss.question_version_id = p_question_version_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'key', coalesce(ce.wrong_option_key, ce.wrong_value, ce.id::text),
        'partKey', ce.part_key,
        'wrongValue', ce.wrong_value,
        'wrongOptionKey', ce.wrong_option_key,
        'misconception', ce.misconception,
        'correctiveNote', ce.corrective_note
      )
      order by ce.wrong_option_key nulls last, ce.wrong_value nulls last
    ),
    '[]'::jsonb
  )
  into v_errors
  from public.common_errors ce
  where ce.question_version_id = p_question_version_id;

  select coalesce(array_agg(so.code order by so.code), '{}')
  into v_objective_codes
  from public.question_objectives qo
  join public.specific_objectives so on so.id = qo.specific_objective_id
  where qo.question_id = v_qv.question_id;

  v_all_blocks :=
    coalesce(v_qv.strategy_blocks::text, '[]')
    || coalesce(v_qv.final_answer_blocks::text, '[]')
    || coalesce(v_qv.why_this_works::text, '[]')
    || coalesce(v_qv.exam_tip::text, '[]')
    || coalesce(v_steps::text, '[]')
    || coalesce(v_errors::text, '[]')
    || coalesce(v_qv.quick_check::text, '{}');

  with latex_hashes as (
    select distinct m[1] as hash
    from regexp_matches(v_all_blocks, '"renderHash"\s*:\s*"([^"]+)"', 'g') as m
  )
  select coalesce(
    jsonb_object_agg(
      mr.hash,
      jsonb_build_object(
        'svg', mr.svg,
        'widthEx', mr.width_ex,
        'heightEx', mr.height_ex,
        'depthEx', mr.depth_ex
      )
    ),
    '{}'::jsonb
  )
  into v_math
  from public.math_renders mr
  join latex_hashes lh on lh.hash = mr.hash;

  return jsonb_build_object(
    'conceptsRequired', coalesce(v_qv.concepts_required, '[]'::jsonb),
    'strategyBlocks', coalesce(v_qv.strategy_blocks, '[]'::jsonb),
    'solutionSteps', coalesce(v_steps, '[]'::jsonb),
    'finalAnswerBlocks', coalesce(v_qv.final_answer_blocks, '[]'::jsonb),
    'whyThisWorks', coalesce(v_qv.why_this_works, '[]'::jsonb),
    'explanation', v_qv.explanation,
    'commonErrors', coalesce(v_errors, '[]'::jsonb),
    'examTip', coalesce(v_qv.exam_tip, '[]'::jsonb),
    'quickCheck', v_qv.quick_check,
    'answerValidation', jsonb_build_object(
      'marks', v_qv.marks,
      'cognitiveLevel', v_qv.cognitive_level,
      'methodClass', v_qv.method_class,
      'accuracyRule', v_qv.accuracy_rule,
      'verification', v_qv.verification,
      'ambiguityNote', v_qv.ambiguity_note,
      'objectiveCodes', to_jsonb(v_objective_codes)
    ),
    'mathRenders', coalesce(v_math, '{}'::jsonb)
  );
end;
$$;

grant execute on function public.fn_reveal_response(uuid, uuid) to authenticated;
