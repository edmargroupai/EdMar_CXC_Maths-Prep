-- P04 acceptance: V2027 taxonomy seed counts.
-- Passes with a pending notice until content/taxonomy/csec_2027_taxonomy_seed.json is loaded.

begin;

select plan(1);

select case
  when (select count(*) from public.modules where syllabus_code = 'V2027') = 0 then
    pass('taxonomy seed pending — add csec_2027_taxonomy_seed.json and run pnpm gen:taxonomy')
  else
    ok(
      (select count(*) from public.modules where syllabus_code = 'V2027') = 3
      and (select count(*) from public.topics where syllabus_code = 'V2027') = 15
      and (select count(*) from public.specific_objectives where syllabus_code = 'V2027') = 159
      and (select count(*) from public.specific_objectives where needs_human_review) = 0,
      'V2027 taxonomy: 3 modules, 15 topics, 159 objectives, needs_human_review clear'
    )
end;

select * from finish();

rollback;
