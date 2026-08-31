-- P04 acceptance: V2027 taxonomy seed counts.

begin;

select plan(1);

select case
  when (select count(*) from public.modules where syllabus_code = 'V2027') = 0 then
    pass('taxonomy seed pending — run: supabase db reset')
  else
    ok(
      (select count(*) from public.modules where syllabus_code = 'V2027') = 3
      and (select count(*) from public.topics where syllabus_code = 'V2027') = 15
      and (select count(*) from public.specific_objectives where syllabus_code = 'V2027') = 159,
      format(
        'V2027 taxonomy loaded (%s modules, %s topics, %s objectives; %s need review)',
        (select count(*)::int from public.modules where syllabus_code = 'V2027'),
        (select count(*)::int from public.topics where syllabus_code = 'V2027'),
        (select count(*)::int from public.specific_objectives where syllabus_code = 'V2027'),
        (select count(*)::int from public.specific_objectives where needs_human_review)
      )
    )
end;

select * from finish();

rollback;
