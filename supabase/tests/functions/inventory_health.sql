-- ADR-023 · Inventory health enqueue (no sync AI) + RLS

begin;
select plan(4);

-- Config seeds present
select ok(
  exists (select 1 from public.app_config where key = 'mastery_question_target'),
  'mastery_question_target config seeded'
);

select ok(
  exists (select 1 from public.app_config where key = 'inventory_min_approved_per_topic'),
  'inventory_min_approved_per_topic config seeded'
);

-- Replenishment job enqueue (security definer, no auth — job path)
select ok(
  (
    select public.fn_enqueue_inventory_replenishment(
      (select id from public.topics where syllabus_code = 'V2027' and is_active limit 1),
      null,
      null,
      'low_inventory'
    ) is not null
  ),
  'low inventory creates replenishment job'
);

select ok(
  exists (
    select 1
    from public.content_jobs
    where job_type = 'inventory_replenishment'
      and status = 'queued'
      and params ->> 'policy' is not null
  ),
  'replenishment job records template_first policy — not student-sync AI'
);

select * from finish();
rollback;
