-- P21/P22 · Account export and AI spend helpers

begin;

create or replace function public.fn_get_account_export(p_student uuid default auth.uid())
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_profile jsonb;
begin
  if p_student is null or p_student is distinct from auth.uid() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'profile', (select to_jsonb(p) from public.profiles p where p.id = p_student),
    'attempts', coalesce((
      select jsonb_agg(to_jsonb(a) order by a.created_at desc)
      from public.attempts a
      where a.student_id = p_student
      limit 500
    ), '[]'::jsonb),
    'mastery', coalesce((
      select jsonb_agg(to_jsonb(m))
      from public.student_topic_mastery m
      where m.student_id = p_student
    ), '[]'::jsonb),
    'entitlement', public.fn_get_entitlement(p_student),
    'exported_at', now()
  ) into v_profile;

  if v_profile -> 'profile' is null then
    raise exception 'profile not found' using errcode = 'P0002';
  end if;

  return v_profile;
end;
$$;

create or replace function public.fn_get_monthly_ai_spend()
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(cost_usd), 0)::numeric
  from public.ai_generations
  where created_at >= date_trunc('month', now());
$$;

grant execute on function public.fn_get_account_export(uuid) to authenticated;
grant execute on function public.fn_get_monthly_ai_spend() to authenticated;
grant execute on function public.fn_delete_own_account(boolean) to authenticated;

commit;
