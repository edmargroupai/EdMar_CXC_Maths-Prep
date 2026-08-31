-- P07 acceptance: every public table has RLS enabled.

begin;

select plan(2);

select ok(
  (
    select count(*) = 46
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    join information_schema.tables t
      on t.table_schema = n.nspname
     and t.table_name = c.relname
     and t.table_type = 'BASE TABLE'
    where n.nspname = 'public'
      and c.relrowsecurity
  ),
  format(
    'all 46 tables have RLS enabled (%s/%s)',
    (
      select count(*)::int
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      join information_schema.tables t
        on t.table_schema = n.nspname
       and t.table_name = c.relname
       and t.table_type = 'BASE TABLE'
      where n.nspname = 'public'
        and c.relrowsecurity
    ),
    (
      select count(*)::int
      from information_schema.tables
      where table_schema = 'public'
        and table_type = 'BASE TABLE'
    )
  )
);

select ok(
  exists (
    select 1
    from pg_views
    where schemaname = 'public'
      and viewname = 'v_public_config'
  ),
  'v_public_config view exists'
);

select * from finish();

rollback;
