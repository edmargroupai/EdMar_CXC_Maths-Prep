-- P18 · fn_get_entitlement and billing webhook idempotency (§23)

begin;
select plan(3);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000044',
  'authenticated', 'authenticated', 'entitlement@test.com',
  crypt('password', gen_salt('bf')), timezone('utc', now()),
  timezone('utc', now()), timezone('utc', now()),
  '', '', '', ''
);

select ok(
  (public.fn_get_entitlement('a0000000-0000-0000-0000-000000000044') ->> 'tier') = 'free',
  'new student defaults to free tier'
);

select ok(
  (public.fn_get_entitlement('a0000000-0000-0000-0000-000000000044') ->> 'is_premium')::boolean = false,
  'free student is not premium'
);

select ok(
  (
    public.fn_process_billing_webhook(
      'dev-billing-webhook-token',
      jsonb_build_object(
        'id', 'evt_test_duplicate',
        'type', 'checkout.session.completed',
        'data', jsonb_build_object(
          'object', jsonb_build_object(
            'metadata', jsonb_build_object(
              'student_id', 'a0000000-0000-0000-0000-000000000044'
            )
          )
        )
      )
    ) ->> 'status'
  ) = 'processed'
  and (
    public.fn_process_billing_webhook(
      'dev-billing-webhook-token',
      jsonb_build_object(
        'id', 'evt_test_duplicate',
        'type', 'checkout.session.completed',
        'data', jsonb_build_object(
          'object', jsonb_build_object(
            'metadata', jsonb_build_object(
              'student_id', 'a0000000-0000-0000-0000-000000000044'
            )
          )
        )
      )
    ) ->> 'status'
  ) = 'duplicate',
  'billing webhook is idempotent on event id'
);

select * from finish();
rollback;
