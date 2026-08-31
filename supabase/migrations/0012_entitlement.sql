-- P18 · fn_get_entitlement and server-side allowance surface (§23)

begin;

create or replace function public.fn_get_entitlement(p_student uuid default auth.uid())
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_entitlement record;
  v_limit smallint;
  v_served smallint;
  v_remaining smallint;
  v_resets timestamptz;
  v_days integer;
begin
  if p_student is null then
    return jsonb_build_object('tier', 'free', 'is_premium', false, 'status', 'active');
  end if;

  select * into v_entitlement
  from public.entitlements e
  where e.student_id = p_student
    and e.status in ('active', 'grace', 'cancelled')
  order by
    case e.tier when 'premium' then 0 else 1 end,
    e.created_at desc
  limit 1;

  select coalesce((value #>> '{}')::smallint, 10) into v_limit
  from public.app_config where key = 'free_daily_question_limit';

  select coalesce(sdu.questions_served, 0) into v_served
  from public.student_daily_usage sdu
  where sdu.student_id = p_student and sdu.usage_date = current_date;

  v_remaining := public.fn_check_daily_allowance(p_student, v_limit);
  v_resets := (current_date + 1)::timestamptz;

  if v_entitlement is null then
    return jsonb_build_object(
      'tier', 'free',
      'is_premium', false,
      'status', 'active',
      'days_remaining', null,
      'allowance_remaining', v_remaining,
      'daily_limit', v_limit,
      'resets_at', v_resets
    );
  end if;

  v_days := case
    when v_entitlement.current_period_end is not null
      then greatest(0, (v_entitlement.current_period_end::date - current_date))
    else null
  end;

  return jsonb_build_object(
    'tier', v_entitlement.tier,
    'is_premium', public.has_premium(p_student),
    'status', v_entitlement.status,
    'days_remaining', v_days,
    'allowance_remaining', case when public.has_premium(p_student) then null else v_remaining end,
    'daily_limit', case when public.has_premium(p_student) then null else v_limit end,
    'resets_at', case when public.has_premium(p_student) then null else v_resets end,
    'current_period_end', v_entitlement.current_period_end,
    'grace_until', v_entitlement.grace_until
  );
end;
$$;

grant execute on function public.fn_get_entitlement(uuid) to authenticated;

-- Stripe-shaped webhook ingress (§23.5) — idempotent on platform event id, no client secrets.
insert into public.app_config (key, value, description)
values (
  'billing_webhook_token',
  '"dev-billing-webhook-token"'::jsonb,
  'Shared secret passed to fn_process_billing_webhook from the web route handler'
)
on conflict (key) do nothing;

create or replace function public.fn_process_billing_webhook(
  p_token text,
  p_event jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expected text;
  v_event_id text;
  v_event_type text;
  v_student uuid;
  v_existing bigint;
  v_entitlement_id uuid;
begin
  select trim(both '"' from value::text) into v_expected
  from public.app_config where key = 'billing_webhook_token';

  if v_expected is null or p_token is distinct from v_expected then
    raise exception 'invalid webhook token' using errcode = '42501';
  end if;

  v_event_id := coalesce(p_event ->> 'id', p_event -> 'data' ->> 'id');
  v_event_type := coalesce(p_event ->> 'type', 'unknown');

  if v_event_id is null then
    raise exception 'missing event id' using errcode = '22023';
  end if;

  select id into v_existing
  from public.subscription_events
  where purchase_token = v_event_id
  limit 1;

  if v_existing is not null then
    return jsonb_build_object('status', 'duplicate', 'event_id', v_event_id);
  end if;

  v_student := nullif(p_event #>> '{data,object,metadata,student_id}', '')::uuid;

  insert into public.subscription_events (
    student_id, provider, event_type, purchase_token, raw_payload, signature_verified, processed_at
  ) values (
    v_student,
    'web_stripe',
    v_event_type,
    v_event_id,
    p_event,
    true,
    now()
  )
  returning id into v_existing;

  if v_student is not null and v_event_type in (
    'checkout.session.completed',
    'customer.subscription.created',
    'customer.subscription.updated'
  ) then
    insert into public.entitlements (
      student_id, tier, source, status, current_period_start, current_period_end,
      auto_renewing, platform_product_id, platform_purchase_token, platform_order_id
    ) values (
      v_student,
      'premium',
      'web_stripe',
      'active',
      now(),
      now() + interval '30 days',
      true,
      p_event #>> '{data,object,items,data,0,price,id}',
      v_event_id,
      v_event_id
    )
    on conflict (student_id) where status in ('active', 'grace', 'on_hold')
    do update set
      tier = 'premium',
      status = 'active',
      current_period_end = excluded.current_period_end,
      updated_at = now()
    returning id into v_entitlement_id;

    update public.subscription_events
    set entitlement_id = v_entitlement_id
    where id = v_existing;
  elsif v_student is not null and v_event_type = 'invoice.payment_failed' then
    update public.entitlements
    set status = 'grace',
        grace_until = now() + interval '7 days',
        updated_at = now()
    where student_id = v_student
      and status = 'active';
  elsif v_student is not null and v_event_type in (
    'customer.subscription.deleted',
    'customer.subscription.canceled'
  ) then
    update public.entitlements
    set status = 'cancelled',
        auto_renewing = false,
        updated_at = now()
    where student_id = v_student
      and status in ('active', 'grace');
  end if;

  return jsonb_build_object('status', 'processed', 'event_id', v_event_id);
end;
$$;

grant execute on function public.fn_process_billing_webhook(text, jsonb) to anon, authenticated;

grant execute on function public.is_staff() to authenticated;

commit;
