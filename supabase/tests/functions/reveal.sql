-- P15 · fn_reveal_response reveal policy (§40.4)

begin;
select plan(1);

select has_function(
  'public',
  'fn_reveal_response',
  array['uuid', 'uuid'],
  'fn_reveal_response exists'
);

select * from finish();
rollback;
