-- P09 · Core database functions (§6), rate_limits (§25.7), materialised views (§24.3)
-- fn_handle_new_user lives in 0004_student.sql — not duplicated here.

begin;

-- ── app_config: §9.11 mastery decay constants ───────────────────────────────

insert into public.app_config (key, value, description) values
  ('mastery_half_life_attempts', '20', 'Recency half-life in attempts (§9.11)'),
  ('mastery_half_life_days', '30', 'Recency half-life in days (§9.11)'),
  ('mastery_decay_floor', '0.6', 'Minimum decay multiplier on stale skills (§9.11)');

-- ── rate_limits token bucket (§25.7) ─────────────────────────────────────────

create table public.rate_limits (
  bucket_key text primary key,
  tokens numeric(12, 4) not null,
  capacity numeric(12, 4) not null,
  refill_rate numeric(12, 6) not null,
  updated_at timestamptz not null default now()
);

alter table public.rate_limits enable row level security;

create policy rate_limits_staff on public.rate_limits
  for all
  using (public.is_staff())
  with check (public.is_staff());

revoke all on public.rate_limits from public;
grant select, insert, update, delete on public.rate_limits to service_role;

-- ── materialised views (§24.3) ──────────────────────────────────────────────

create materialized view public.mv_skill_question_counts as
select
  qs.skill_id,
  count(distinct q.id)::integer as published_count
from public.question_skills qs
join public.questions q on q.id = qs.question_id
where q.status = 'published'
  and q.retired_at is null
group by qs.skill_id;

create unique index uq_mv_sqc_skill on public.mv_skill_question_counts (skill_id);

create materialized view public.mv_topic_coverage as
select
  t.id as topic_id,
  t.syllabus_code,
  count(distinct q.id)::integer as published_count
from public.topics t
join public.specific_objectives so on so.topic_id = t.id
join public.question_objectives qo on qo.specific_objective_id = so.id
join public.questions q on q.id = qo.question_id
where q.status = 'published'
  and q.retired_at is null
  and t.is_active
group by t.id, t.syllabus_code;

create unique index uq_mv_tc_topic on public.mv_topic_coverage (topic_id);

-- ── fn_rate_limit_check ─────────────────────────────────────────────────────

create or replace function public.fn_rate_limit_check(
  p_bucket_key text,
  p_capacity numeric,
  p_window_seconds integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_row public.rate_limits%rowtype;
  v_elapsed numeric;
  v_tokens numeric;
  v_refill_rate numeric;
begin
  if p_capacity <= 0 or p_window_seconds <= 0 then
    return;
  end if;

  v_refill_rate := p_capacity / p_window_seconds;

  select *
  into v_row
  from public.rate_limits
  where bucket_key = p_bucket_key
  for update;

  if not found then
    insert into public.rate_limits (bucket_key, tokens, capacity, refill_rate, updated_at)
    values (p_bucket_key, p_capacity - 1, p_capacity, v_refill_rate, v_now);
    return;
  end if;

  v_elapsed := extract(epoch from (v_now - v_row.updated_at));
  v_tokens := least(
    v_row.capacity,
    v_row.tokens + v_elapsed * v_row.refill_rate
  );

  if v_tokens < 1 then
    raise exception 'rate_limited'
      using errcode = 'P0001';
  end if;

  update public.rate_limits
  set tokens = v_tokens - 1,
      capacity = p_capacity,
      refill_rate = v_refill_rate,
      updated_at = v_now
  where bucket_key = p_bucket_key;
end;
$$;

-- ── fn_normalise_answer (§10.5 mirror) ──────────────────────────────────────

create or replace function public.fn_normalise_answer(
  p_input text,
  p_normalisation text,
  p_case_sensitive boolean default false
)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  v_out text;
begin
  if p_input is null then
    return '';
  end if;

  v_out := p_input;
  v_out := replace(v_out, E'\u2212', '-');
  v_out := replace(v_out, E'\u2013', '-');
  v_out := replace(v_out, E'\u2014', '-');
  v_out := trim(regexp_replace(v_out, '\s+', ' ', 'g'));

  case coalesce(p_normalisation, 'default')
    when 'numeric_default' then
      v_out := regexp_replace(v_out, '^\+', '');
      v_out := regexp_replace(v_out, '^(-?\d{1,3}(,\d{3})+(\.\d+)?)$', '\1', 'g');
      v_out := replace(v_out, ',', '');
      if v_out ~ '^-?\d+,\d+$' and v_out !~ '\.' then
        v_out := replace(v_out, ',', '.');
      end if;
      if v_out ~ '^-?[\d\s.,]+$' then
        v_out := replace(v_out, ' ', '');
      end if;
    when 'currency_default' then
      v_out := regexp_replace(v_out, '^(\$|J\$|US\$|TT\$)\s*', '', 'i');
      v_out := public.fn_normalise_answer(v_out, 'numeric_default', p_case_sensitive);
    when 'expression_default' then
      v_out := replace(v_out, '×', '*');
      v_out := replace(v_out, '·', '*');
      v_out := replace(v_out, '²', '^2');
      v_out := replace(v_out, '³', '^3');
      v_out := regexp_replace(v_out, '^(x|y|answer)\s*=\s*', '', 'i');
      v_out := regexp_replace(v_out, '\s*\*\s*', '*', 'g');
      v_out := regexp_replace(v_out, '\s*\^\s*', '^', 'g');
      v_out := regexp_replace(v_out, '\s*\+\s*', '+', 'g');
      v_out := regexp_replace(v_out, '\s*-\s*', '-', 'g');
      v_out := regexp_replace(v_out, '\s+', '', 'g');
      v_out := regexp_replace(v_out, '^\+', '');
    when 'units_default' then
      v_out := regexp_replace(v_out, '\s+', ' ', 'g');
      v_out := trim(v_out);
      v_out := regexp_replace(v_out, '^(.+?)\s*cm2$', '\1 cm^2', 'i');
      v_out := regexp_replace(v_out, '^(.+?)\s*cm²$', '\1 cm^2', 'i');
      v_out := regexp_replace(v_out, '^(.+?)\s*cm\^2$', '\1 cm^2', 'i');
      v_out := regexp_replace(v_out, '^(.+?)\s*sq\s*cm$', '\1 cm^2', 'i');
      v_out := regexp_replace(v_out, '^(.+?)\s*square\s*cm$', '\1 cm^2', 'i');
      v_out := regexp_replace(v_out, '^(.+?)\s*mm2$', '\1 mm^2', 'i');
      v_out := regexp_replace(v_out, '^(.+?)\s*mm²$', '\1 mm^2', 'i');
      v_out := regexp_replace(v_out, '^(.+?)\s*mm\^2$', '\1 mm^2', 'i');
      v_out := regexp_replace(v_out, '^(.+?)\s*sq\s*mm$', '\1 mm^2', 'i');
      v_out := regexp_replace(v_out, '^(.+?)\s*cm3$', '\1 cm^3', 'i');
      v_out := regexp_replace(v_out, '^(.+?)\s*cm³$', '\1 cm^3', 'i');
      v_out := regexp_replace(v_out, '^(.+?)\s*cm\^3$', '\1 cm^3', 'i');
      if v_out ~ '^(.+?)\s*%$' then
        v_out := trim(regexp_replace(v_out, '^(.+?)\s*%$', '\1', '')) || ' %';
        v_out := public.fn_normalise_answer(split_part(v_out, ' %', 1), 'numeric_default', p_case_sensitive) || ' %';
      end if;
    when 'text_default' then
      v_out := trim(regexp_replace(v_out, '\s+', ' ', 'g'));
      if not p_case_sensitive then
        v_out := lower(v_out);
      end if;
    else
      if not p_case_sensitive then
        v_out := lower(v_out);
      end if;
      v_out := regexp_replace(v_out, '^(x|y|answer)\s*=\s*', '', 'i');
  end case;

  return trim(v_out);
end;
$$;

-- ── fn_parse_numeric_value ──────────────────────────────────────────────────

create or replace function public.fn_parse_numeric_value(p_input text)
returns numeric
language plpgsql
immutable
set search_path = public
as $$
declare
  v text;
  v_whole bigint;
  v_num bigint;
  v_den bigint;
  m text[];
begin
  if p_input is null or trim(p_input) = '' then
    return null;
  end if;

  v := trim(regexp_replace(p_input, '\s+', ' ', 'g'));

  m := regexp_match(v, '^(-?\d+)\s+(\d+)\s*/\s*(\d+)$');
  if m is not null then
    v_whole := m[1]::bigint;
    v_num := m[2]::bigint;
    v_den := m[3]::bigint;
    if v_den = 0 then
      return null;
    end if;
    if v_whole < 0 then
      return (v_whole * v_den - v_num)::numeric / v_den;
    end if;
    return (v_whole * v_den + v_num)::numeric / v_den;
  end if;

  m := regexp_match(v, '^(-?\d+)\s*/\s*(-?\d+)$');
  if m is not null then
    v_den := m[2]::bigint;
    if v_den = 0 then
      return null;
    end if;
    return m[1]::numeric / v_den;
  end if;

  v := replace(v, ',', '');
  begin
    return v::numeric;
  exception when others then
    return null;
  end;
end;
$$;

create or replace function public.fn_gcd_int(a integer, b integer)
returns integer
language plpgsql
immutable
set search_path = public
as $$
declare
  x integer := abs(a);
  y integer := abs(b);
  t integer;
begin
  while y <> 0 loop
    t := y;
    y := x % y;
    x := t;
  end loop;
  return coalesce(nullif(x, 0), 1);
end;
$$;

-- ── fn_validate_answer helpers ──────────────────────────────────────────────

create or replace function public.fn_match_common_errors(
  p_raw text,
  p_normalised text,
  p_spec jsonb
)
returns jsonb
language plpgsql
immutable
set search_path = public
as $$
declare
  v_err jsonb;
  v_norm text;
  v_profile text;
  v_case boolean;
  v_val numeric;
  v_err_val numeric;
begin
  if p_spec -> 'commonErrorValues' is null then
    return null;
  end if;

  v_profile := coalesce(p_spec ->> 'normalisation', 'default');
  v_case := coalesce((p_spec ->> 'caseSensitive')::boolean, false);

  for v_err in select jsonb_array_elements(p_spec -> 'commonErrorValues')
  loop
    v_norm := public.fn_normalise_answer(v_err ->> 'value', v_profile, v_case);
    if v_norm = p_normalised or (v_err ->> 'value') = p_raw then
      return jsonb_build_object(
        'is_correct', false,
        'normalised', p_normalised,
        'matched_common_error_key', v_err ->> 'key',
        'reason', 'incorrect'
      );
    end if;
    v_val := public.fn_parse_numeric_value(p_normalised);
    v_err_val := public.fn_parse_numeric_value(v_norm);
    if v_val is not null and v_err_val is not null and abs(v_val - v_err_val) < 1e-9 then
      return jsonb_build_object(
        'is_correct', false,
        'normalised', p_normalised,
        'matched_common_error_key', v_err ->> 'key',
        'reason', 'incorrect'
      );
    end if;
  end loop;

  return null;
end;
$$;

create or replace function public.fn_match_accepted_form(
  p_normalised text,
  p_spec jsonb
)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  v_form text;
  v_norm text;
  v_profile text;
  v_case boolean;
begin
  v_profile := coalesce(p_spec ->> 'normalisation', 'default');
  v_case := coalesce((p_spec ->> 'caseSensitive')::boolean, false);

  for v_form in select jsonb_array_elements_text(p_spec -> 'acceptedForms')
  loop
    v_norm := public.fn_normalise_answer(v_form, v_profile, v_case);
    if v_norm = p_normalised then
      return v_form;
    end if;
  end loop;

  return null;
end;
$$;

create or replace function public.fn_within_tolerance(
  p_value numeric,
  p_canonical numeric,
  p_tolerance jsonb
)
returns boolean
language plpgsql
immutable
set search_path = public
as $$
declare
  v_kind text;
begin
  if p_tolerance is null then
    return abs(p_value - p_canonical) < 1e-9;
  end if;

  v_kind := p_tolerance ->> 'kind';

  case v_kind
    when 'none' then
      return abs(p_value - p_canonical) < 1e-9;
    when 'absolute' then
      return abs(p_value - p_canonical) <= coalesce((p_tolerance ->> 'value')::numeric, 0);
    when 'relative' then
      if abs(p_canonical) < 1e-9 then
        return abs(p_value) < 1e-9;
      end if;
      return abs(p_value - p_canonical) / abs(p_canonical)
        <= coalesce((p_tolerance ->> 'value')::numeric, 0);
    when 'range' then
      return p_value >= coalesce((p_tolerance ->> 'min')::numeric, -1e308)
         and p_value <= coalesce((p_tolerance ->> 'max')::numeric, 1e308);
    else
      return abs(p_value - p_canonical) < 1e-9;
  end case;
end;
$$;

create or replace function public.fn_count_decimal_places(p_input text)
returns integer
language sql
immutable
set search_path = public
as $$
  select coalesce(length(substring(p_input from '\.(\d+)')), 0);
$$;

create or replace function public.fn_count_significant_figures(p_input text)
returns integer
language plpgsql
immutable
set search_path = public
as $$
declare
  v text;
  v_digits text;
begin
  v := trim(p_input);
  v := regexp_replace(v, '^[-+]', '');
  v := replace(v, '.', '');
  v := regexp_replace(v, '^0+', '');
  if v = '' then
    return 1;
  end if;
  return length(v);
end;
$$;

-- ── fn_validate_answer (§6.6) ───────────────────────────────────────────────

create or replace function public.fn_validate_answer(
  p_answer_spec jsonb,
  p_raw_answer text,
  p_part_key text default null
)
returns jsonb
language plpgsql
immutable
set search_path = public
as $$
declare
  v_spec jsonb;
  v_type text;
  v_profile text;
  v_case boolean;
  v_normalised text;
  v_common jsonb;
  v_matched text;
  v_canonical text;
  v_canonical_num numeric;
  v_value numeric;
  v_precision jsonb;
  v_precision_kind text;
  v_precision_val integer;
  v_precision_required boolean;
  v_bool text;
  v_parts text[];
  v_canon_parts text[];
  v_i integer;
  v_gcd integer;
  v_g integer;
  v_split record;
  v_canon_split record;
  v_unit_req text;
  v_coord record;
  v_canon_coord record;
begin
  if p_answer_spec ? 'parts' and jsonb_typeof(p_answer_spec -> 'parts') = 'object'
     and p_part_key is not null and p_answer_spec -> 'parts' ? p_part_key then
    v_spec := p_answer_spec -> 'parts' -> p_part_key;
  else
    v_spec := p_answer_spec;
  end if;

  v_type := v_spec ->> 'answerType';
  v_profile := coalesce(v_spec ->> 'normalisation', 'default');
  v_case := coalesce((v_spec ->> 'caseSensitive')::boolean, false);
  v_normalised := public.fn_normalise_answer(coalesce(p_raw_answer, ''), v_profile, v_case);

  v_common := public.fn_match_common_errors(p_raw_answer, v_normalised, v_spec);
  if v_common is not null then
    return v_common;
  end if;

  case v_type
    when 'option_id' then
      if p_raw_answer is null or trim(p_raw_answer) = '' then
        return jsonb_build_object('is_correct', false, 'normalised', v_normalised, 'reason', 'incorrect');
      end if;
      v_canonical := v_spec ->> 'canonicalValue';
      if v_normalised = v_canonical
         or upper(trim(p_raw_answer)) = upper(v_canonical) then
        return jsonb_build_object('is_correct', true, 'normalised', v_normalised,
          'matched_form', v_canonical, 'reason', 'exact');
      end if;
      return jsonb_build_object('is_correct', false, 'normalised', v_normalised, 'reason', 'incorrect');

    when 'option_set' then
      if p_raw_answer is null or trim(p_raw_answer) = '' then
        return jsonb_build_object('is_correct', false, 'normalised', v_normalised, 'reason', 'incorrect');
      end if;
      v_parts := regexp_split_to_array(regexp_replace(p_raw_answer, '[,;\s]+', ',', 'g'), ',');
      v_parts := array(select upper(trim(x)) from unnest(v_parts) x where trim(x) <> '' order by 1);
      if jsonb_typeof(v_spec -> 'canonicalValue') = 'array' then
        v_canon_parts := array(
          select upper(jsonb_array_elements_text(v_spec -> 'canonicalValue')) order by 1
        );
      else
        v_canon_parts := array[upper(v_spec ->> 'canonicalValue')];
      end if;
      if v_parts = v_canon_parts then
        return jsonb_build_object('is_correct', true, 'normalised', array_to_string(v_parts, ','),
          'matched_form', array_to_string(v_canon_parts, ','), 'reason', 'exact');
      end if;
      return jsonb_build_object('is_correct', false, 'normalised', v_normalised, 'reason', 'incorrect');

    when 'boolean' then
      v_canonical := lower(v_spec ->> 'canonicalValue');
      v_bool := lower(v_normalised);
      if v_bool in ('true', 't', 'yes', '1') then
        v_bool := 'true';
      elsif v_bool in ('false', 'f', 'no', '0') then
        v_bool := 'false';
      else
        return jsonb_build_object('is_correct', false, 'normalised', v_normalised, 'reason', 'incorrect');
      end if;
      if v_bool = v_canonical then
        return jsonb_build_object('is_correct', true, 'normalised', v_bool, 'reason', 'exact');
      end if;
      return jsonb_build_object('is_correct', false, 'normalised', v_normalised, 'reason', 'incorrect');

    when 'expression' then
      v_matched := public.fn_match_accepted_form(v_normalised, v_spec);
      if v_matched is not null then
        return jsonb_build_object('is_correct', true, 'normalised', v_normalised,
          'matched_form', v_matched, 'reason', 'exact');
      end if;
      return jsonb_build_object('is_correct', false, 'normalised', v_normalised, 'reason', 'incorrect');

    when 'numeric_exact' then
      v_value := public.fn_parse_numeric_value(v_normalised);
      if v_value is null then
        return jsonb_build_object('is_correct', false, 'normalised', v_normalised, 'reason', 'unparseable');
      end if;
      v_canonical_num := public.fn_parse_numeric_value(v_spec ->> 'canonicalValue');
      if v_canonical_num is null then
        return jsonb_build_object('is_correct', false, 'normalised', v_normalised, 'reason', 'unparseable');
      end if;
      if abs(v_value - v_canonical_num) < 1e-9 then
        v_matched := public.fn_match_accepted_form(v_normalised, v_spec);
        return jsonb_build_object('is_correct', true, 'normalised', v_normalised,
          'matched_form', v_matched, 'reason', 'exact');
      end if;
      return jsonb_build_object('is_correct', false, 'normalised', v_normalised, 'reason', 'incorrect');

    when 'numeric_tolerance' then
      v_value := public.fn_parse_numeric_value(v_normalised);
      if v_value is null then
        return jsonb_build_object('is_correct', false, 'normalised', v_normalised, 'reason', 'unparseable');
      end if;
      v_canonical_num := public.fn_parse_numeric_value(v_spec ->> 'canonicalValue');
      if v_canonical_num is null then
        return jsonb_build_object('is_correct', false, 'normalised', v_normalised, 'reason', 'unparseable');
      end if;
      if public.fn_within_tolerance(v_value, v_canonical_num, v_spec -> 'tolerance') then
        return jsonb_build_object('is_correct', true, 'normalised', v_normalised, 'reason', 'tolerance');
      end if;
      return jsonb_build_object('is_correct', false, 'normalised', v_normalised, 'reason', 'incorrect');

    when 'numeric_sf', 'numeric_dp', 'currency' then
      v_precision := v_spec -> 'precision';
      v_precision_kind := coalesce(v_precision ->> 'kind', 'none');
      v_precision_val := coalesce((v_precision ->> 'value')::integer, 0);
      v_precision_required := coalesce((v_precision ->> 'required')::boolean, false);

      if v_type = 'currency' or v_profile = 'currency_default' then
        v_normalised := public.fn_normalise_answer(coalesce(p_raw_answer, ''), 'currency_default', v_case);
      end if;

      v_value := public.fn_parse_numeric_value(
        split_part(regexp_replace(v_normalised, '\s+', ' ', 'g'), ' ', 1)
      );
      if v_value is null then
        return jsonb_build_object('is_correct', false, 'normalised', v_normalised, 'reason', 'unparseable');
      end if;
      v_canonical_num := public.fn_parse_numeric_value(v_spec ->> 'canonicalValue');
      if v_canonical_num is null then
        return jsonb_build_object('is_correct', false, 'normalised', v_normalised, 'reason', 'unparseable');
      end if;

      if v_type <> 'numeric_sf' then
        v_matched := public.fn_match_accepted_form(v_normalised, v_spec);
        if v_matched is not null then
          return jsonb_build_object('is_correct', true, 'normalised', v_normalised,
            'matched_form', v_matched, 'reason', 'exact');
        end if;
      end if;

      if v_type = 'numeric_sf' and v_precision_kind = 'significant_figures' and v_precision_required then
        if public.fn_count_significant_figures(v_normalised) <> v_precision_val then
          return jsonb_build_object('is_correct', false, 'normalised', v_normalised, 'reason', 'wrong_precision');
        end if;
      end if;

      if not public.fn_within_tolerance(v_value, v_canonical_num, v_spec -> 'tolerance') then
        return jsonb_build_object('is_correct', false, 'normalised', v_normalised, 'reason', 'incorrect');
      end if;

      if v_type = 'numeric_sf' and v_precision_kind = 'significant_figures' and v_precision_required then
        return jsonb_build_object('is_correct', true, 'normalised', v_normalised, 'reason', 'exact');
      end if;

      if v_type in ('numeric_dp', 'currency') and v_precision_kind = 'decimal_places' and v_precision_required then
        if public.fn_count_decimal_places(v_normalised) < v_precision_val
           and not (public.fn_count_decimal_places(v_normalised) = 0 and v_normalised !~ '\.') then
          if public.fn_count_decimal_places(v_normalised) <> v_precision_val then
            return jsonb_build_object('is_correct', false, 'normalised', v_normalised, 'reason', 'wrong_precision');
          end if;
        end if;
      end if;

      return jsonb_build_object('is_correct', true, 'normalised', v_normalised, 'reason', 'exact');

    when 'fraction', 'mixed_number' then
      v_value := public.fn_parse_numeric_value(v_normalised);
      v_canonical_num := public.fn_parse_numeric_value(v_spec ->> 'canonicalValue');
      if v_value is null or v_canonical_num is null then
        v_matched := public.fn_match_accepted_form(v_normalised, v_spec);
        if v_matched is not null then
          return jsonb_build_object('is_correct', true, 'normalised', v_normalised,
            'matched_form', v_matched, 'reason', 'exact');
        end if;
        return jsonb_build_object('is_correct', false, 'normalised', v_normalised, 'reason', 'unparseable');
      end if;
      if abs(v_value - v_canonical_num) >= 1e-9 then
        return jsonb_build_object('is_correct', false, 'normalised', v_normalised, 'reason', 'incorrect');
      end if;
      v_matched := public.fn_match_accepted_form(v_normalised, v_spec);
      return jsonb_build_object('is_correct', true, 'normalised', v_normalised,
        'matched_form', v_matched, 'reason', 'exact');

    when 'ratio' then
      v_parts := regexp_split_to_array(replace(v_normalised, ' ', ''), ':');
      if array_length(v_parts, 1) < 2 then
        return jsonb_build_object('is_correct', false, 'normalised', v_normalised, 'reason', 'unparseable');
      end if;

      v_canon_parts := regexp_split_to_array(replace(v_spec ->> 'canonicalValue', ' ', ''), ':');

      if coalesce((v_spec -> 'form' ->> 'simplestRatio')::boolean, false) then
        v_g := 0;
        for v_i in 1..array_length(v_parts, 1) loop
          if public.fn_parse_numeric_value(trim(v_parts[v_i])) is null then
            return jsonb_build_object('is_correct', false, 'normalised', v_normalised, 'reason', 'unparseable');
          end if;
          v_g := case
            when v_i = 1 then abs(round(public.fn_parse_numeric_value(trim(v_parts[v_i]))::numeric))
            else public.fn_gcd_int(v_g, abs(round(public.fn_parse_numeric_value(trim(v_parts[v_i]))::numeric))::integer)
          end;
        end loop;
        if v_g > 1 then
          return jsonb_build_object('is_correct', false, 'normalised', v_normalised, 'reason', 'not_simplified');
        end if;
      end if;

      v_matched := public.fn_match_accepted_form(v_normalised, v_spec);
      if v_matched is not null then
        return jsonb_build_object('is_correct', true, 'normalised', v_normalised,
          'matched_form', v_matched, 'reason', 'exact');
      end if;

      if abs(
        public.fn_parse_numeric_value(trim(v_parts[1])) / nullif(public.fn_parse_numeric_value(trim(v_parts[2])), 0)
        - public.fn_parse_numeric_value(trim(v_canon_parts[1])) / nullif(public.fn_parse_numeric_value(trim(v_canon_parts[2])), 0)
      ) < 1e-9 then
        return jsonb_build_object('is_correct', true, 'normalised', v_normalised, 'reason', 'exact');
      end if;
      return jsonb_build_object('is_correct', false, 'normalised', v_normalised, 'reason', 'incorrect');

    when 'with_units' then
      v_unit_req := coalesce(v_spec -> 'units' ->> 'requirement', 'none');
      select
        (regexp_match(v_normalised, '^(-?[\d.,/\s]+(?:\s+\d+/\d+)?)\s*(.*)$'))[1] as val,
        nullif(trim((regexp_match(v_normalised, '^(-?[\d.,/\s]+(?:\s+\d+/\d+)?)\s*(.*)$'))[2]), '') as units
      into v_split;
      if v_unit_req = 'required' and (v_split.units is null or v_split.units = '') then
        return jsonb_build_object('is_correct', false, 'normalised', v_normalised, 'reason', 'wrong_units');
      end if;
      v_value := public.fn_parse_numeric_value(v_split.val);
      if v_value is null then
        return jsonb_build_object('is_correct', false, 'normalised', v_normalised, 'reason', 'unparseable');
      end if;
      v_canonical_num := public.fn_parse_numeric_value(
        split_part(public.fn_normalise_answer(v_spec ->> 'canonicalValue', v_profile, v_case), ' ', 1)
      );
      if v_canonical_num is null then
        return jsonb_build_object('is_correct', false, 'normalised', v_normalised, 'reason', 'unparseable');
      end if;
      if not public.fn_within_tolerance(v_value, v_canonical_num, v_spec -> 'tolerance') then
        return jsonb_build_object('is_correct', false, 'normalised', v_normalised, 'reason', 'incorrect');
      end if;
      v_matched := public.fn_match_accepted_form(v_normalised, v_spec);
      return jsonb_build_object('is_correct', true, 'normalised', v_normalised,
        'matched_form', v_matched, 'reason', 'exact');

    when 'coordinate' then
      select
        (regexp_match(v_normalised, '^\(?\s*([^,)]+)\s*,\s*([^)]+)\s*\)?$'))[1] as x,
        (regexp_match(v_normalised, '^\(?\s*([^,)]+)\s*,\s*([^)]+)\s*\)?$'))[2] as y
      into v_coord;
      if v_coord.x is null then
        return jsonb_build_object('is_correct', false, 'normalised', v_normalised, 'reason', 'unparseable');
      end if;
      select
        (regexp_match(v_spec ->> 'canonicalValue', '^\(?\s*([^,)]+)\s*,\s*([^)]+)\s*\)?$'))[1] as x,
        (regexp_match(v_spec ->> 'canonicalValue', '^\(?\s*([^,)]+)\s*,\s*([^)]+)\s*\)?$'))[2] as y
      into v_canon_coord;
      if abs(public.fn_parse_numeric_value(v_coord.x) - public.fn_parse_numeric_value(v_canon_coord.x)) < 1e-9
         and abs(public.fn_parse_numeric_value(v_coord.y) - public.fn_parse_numeric_value(v_canon_coord.y)) < 1e-9 then
        v_matched := public.fn_match_accepted_form(v_normalised, v_spec);
        return jsonb_build_object('is_correct', true, 'normalised', v_normalised,
          'matched_form', v_matched, 'reason', 'exact');
      end if;
      return jsonb_build_object('is_correct', false, 'normalised', v_normalised, 'reason', 'incorrect');

    else
      raise exception 'unsupported answer type: %', v_type
        using errcode = '22023';
  end case;
end;
$$;

-- ── fn_resolve_scope (§6.2) ───────────────────────────────────────────────────

create or replace function public.fn_resolve_scope(
  p_scope_kind text,
  p_scope_ids uuid[],
  p_syllabus public.syllabus_code
)
returns uuid[]
language plpgsql
stable
set search_path = public
as $$
declare
  v_ids uuid[];
begin
  if p_scope_ids is null or cardinality(p_scope_ids) = 0 then
    raise exception 'scope_ids must not be empty'
      using errcode = '22023';
  end if;

  case p_scope_kind
    when 'objective' then
      select coalesce(array_agg(so.id order by so.id), '{}')
      into v_ids
      from public.specific_objectives so
      where so.id = any (p_scope_ids)
        and so.syllabus_code = p_syllabus
        and so.is_active;

    when 'topic' then
      select coalesce(array_agg(so.id order by so.id), '{}')
      into v_ids
      from public.specific_objectives so
      where so.topic_id = any (p_scope_ids)
        and so.syllabus_code = p_syllabus
        and so.is_active;

    when 'subtopic' then
      select coalesce(array_agg(so.id order by so.id), '{}')
      into v_ids
      from public.specific_objectives so
      where so.subtopic_id = any (p_scope_ids)
        and so.syllabus_code = p_syllabus
        and so.is_active;

    when 'module' then
      select coalesce(array_agg(so.id order by so.id), '{}')
      into v_ids
      from public.specific_objectives so
      join public.topics t on t.id = so.topic_id
      where t.module_id = any (p_scope_ids)
        and so.syllabus_code = p_syllabus
        and so.is_active;

    when 'skill' then
      select coalesce(array_agg(distinct so.id order by so.id), '{}')
      into v_ids
      from public.skill_objectives sko
      join public.specific_objectives so on so.id = sko.specific_objective_id
      where sko.skill_id = any (p_scope_ids)
        and so.syllabus_code = p_syllabus
        and so.is_active;

    when 'mixed' then
      select coalesce(array_agg(so.id order by so.id), '{}')
      into v_ids
      from public.specific_objectives so
      where so.syllabus_code = p_syllabus
        and so.is_active;

    else
      raise exception 'unknown scope kind: %', p_scope_kind
        using errcode = '22023';
  end case;

  if cardinality(v_ids) = 0 then
    raise exception 'scope resolves to no objectives'
      using errcode = '22023';
  end if;

  return v_ids;
end;
$$;

-- ── fn_check_daily_allowance (§6.3) ───────────────────────────────────────────

create or replace function public.fn_check_daily_allowance(
  p_student uuid,
  p_requested smallint
)
returns smallint
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_limit smallint;
  v_served smallint;
  v_lifetime smallint;
  v_is_anonymous boolean;
  v_remaining smallint;
begin
  if public.has_premium(p_student) then
    return p_requested;
  end if;

  select coalesce((value #>> '{}')::smallint, 10)
  into v_limit
  from public.app_config
  where key = 'free_daily_question_limit';

  select coalesce(sdu.questions_served, 0)
  into v_served
  from public.student_daily_usage sdu
  where sdu.student_id = p_student
    and sdu.usage_date = current_date;

  v_remaining := greatest(0, v_limit - coalesce(v_served, 0));

  select coalesce(au.is_anonymous, false)
  into v_is_anonymous
  from auth.users au
  where au.id = p_student;

  if v_is_anonymous then
    select coalesce(sum(sdu.questions_served), 0)::smallint
    into v_lifetime
    from public.student_daily_usage sdu
    where sdu.student_id = p_student;

    v_remaining := least(v_remaining, greatest(0, 3 - v_lifetime));
  end if;

  return least(p_requested, v_remaining)::smallint;
end;
$$;

-- ── fn_build_question_payload (§6.8, §40.4 pre-answer only) ───────────────────

create or replace function public.fn_build_question_payload(p_version_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_qv record;
  v_q record;
  v_options jsonb;
  v_assets jsonb;
  v_math jsonb;
  v_topic text;
  v_objective_codes text[];
  v_payload jsonb;
  v_content_version bigint;
begin
  select qv.*, q.question_type, q.difficulty_band, q.calculator_allowed, q.is_free
  into v_qv
  from public.question_versions qv
  join public.questions q on q.id = qv.question_id
  where qv.id = p_version_id;

  if not found then
    raise exception 'question version not found: %', p_version_id
      using errcode = 'P0002';
  end if;

  select coalesce((value #>> '{}')::bigint, 1)
  into v_content_version
  from public.app_config
  where key = 'content_version';

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'optionKey', qo.option_key,
        'contentBlocks', qo.content_blocks,
        'contentPlain', qo.content_plain,
        'sequence', qo.sequence,
        'preserveOrder', qo.preserve_order
      )
      order by qo.sequence
    ),
    'null'::jsonb
  )
  into v_options
  from public.question_options qo
  where qo.question_version_id = p_version_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'role', qa.role,
        'storagePath', qa.storage_path,
        'mimeType', qa.mime_type,
        'widthPx', qa.width_px,
        'heightPx', qa.height_px,
        'altText', qa.alt_text,
        'requiresColour', qa.requires_colour
      )
      order by qa.sequence
    ),
    '[]'::jsonb
  )
  into v_assets
  from public.question_assets qa
  where qa.question_version_id = p_version_id
    and qa.role = 'question_figure';

  with latex_hashes as (
    select distinct m[1] as hash
    from public.question_versions qv2,
         lateral regexp_matches(qv2.stem_blocks::text, '"renderHash"\s*:\s*"([^"]+)"', 'g') m
    where qv2.id = p_version_id
    union
    select distinct m[1]
    from public.question_options qo2,
         lateral regexp_matches(qo2.content_blocks::text, '"renderHash"\s*:\s*"([^"]+)"', 'g') m
    where qo2.question_version_id = p_version_id
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

  select t.name
  into v_topic
  from public.question_objectives qo
  join public.specific_objectives so on so.id = qo.specific_objective_id
  join public.topics t on t.id = so.topic_id
  where qo.question_id = v_qv.question_id
    and qo.is_primary
  limit 1;

  select coalesce(array_agg(so.code order by so.code), '{}')
  into v_objective_codes
  from public.question_objectives qo
  join public.specific_objectives so on so.id = qo.specific_objective_id
  where qo.question_id = v_qv.question_id;

  v_payload := jsonb_build_object(
    'questionType', v_qv.question_type,
    'difficultyBand', v_qv.difficulty_band,
    'calculatorAllowed', v_qv.calculator_allowed,
    'marks', v_qv.marks,
    'estimatedSeconds', v_qv.estimated_seconds,
    'stemBlocks', v_qv.stem_blocks,
    'options', v_options,
    'answerSpec', v_qv.answer_spec,
    'assets', v_assets,
    'mathRenders', coalesce(v_math, '{}'::jsonb),
    'topicName', v_topic,
    'objectiveCodes', to_jsonb(v_objective_codes)
  );

  return v_payload;
end;
$$;

-- ── fn_publish_question (§6.7) ────────────────────────────────────────────────

create or replace function public.fn_publish_question(
  p_question_id uuid,
  p_version_id uuid,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payload jsonb;
  v_payload_bytes integer;
  v_content_version bigint;
  v_obj_count integer;
  v_skill_count integer;
  v_ce_count integer;
  v_ss_count integer;
  v_q record;
  v_v record;
  v_roundtrip jsonb;
begin
  if auth.uid() is null then
    raise exception 'not authenticated'
      using errcode = '42501';
  end if;

  if not public.is_content_admin_role() then
    raise exception 'Publishing requires content_admin.'
      using errcode = 'P0001';
  end if;

  select *
  into v_q
  from public.questions
  where id = p_question_id;

  if not found then
    raise exception 'question not found'
      using errcode = 'P0002';
  end if;

  select *
  into v_v
  from public.question_versions
  where id = p_version_id
    and question_id = p_question_id;

  if not found then
    raise exception 'version not found for question'
      using errcode = 'P0002';
  end if;

  if v_q.rights_status = 'third_party_unlicensed' then
    raise exception 'rights_not_cleared'
      using errcode = 'P0013';
  end if;

  if not exists (
    select 1
    from public.question_reviews qr
    where qr.question_version_id = p_version_id
      and qr.decision = 'approved'
  ) then
    raise exception 'version not approved'
      using errcode = 'P0013';
  end if;

  select count(*)::integer into v_obj_count
  from public.question_objectives
  where question_id = p_question_id;

  if v_obj_count < 1 then
    raise exception 'no_specific_objective'
      using errcode = 'P0011';
  end if;

  select count(*)::integer into v_skill_count
  from public.question_skills
  where question_id = p_question_id;

  if v_skill_count < 1 or v_skill_count > 3 then
    raise exception 'skill_count_out_of_range'
      using errcode = 'P0012';
  end if;

  if not extensions.jsonb_matches_schema(public.fn_answer_spec_schema(), v_v.answer_spec) then
    raise exception 'answer_spec_schema_invalid'
      using errcode = 'P0013';
  end if;

  if exists (
    select 1
    from public.question_assets qa
    where qa.question_version_id = p_version_id
      and char_length(qa.alt_text) < 10
  ) then
    raise exception 'asset_missing_alt_text'
      using errcode = 'P0013';
  end if;

  if v_v.validation_report is null
     or coalesce(v_v.validation_report ->> 'status', '') <> 'passed' then
    raise exception 'validation_report_not_passed'
      using errcode = 'P0013';
  end if;

  if jsonb_array_length(coalesce(v_v.concepts_required, '[]'::jsonb)) < 1
     or jsonb_array_length(coalesce(v_v.strategy_blocks, '[]'::jsonb)) < 1
     or jsonb_array_length(coalesce(v_v.final_answer_blocks, '[]'::jsonb)) < 1
     or jsonb_array_length(coalesce(v_v.why_this_works, '[]'::jsonb)) < 1
     or jsonb_array_length(coalesce(v_v.exam_tip, '[]'::jsonb)) < 1
     or v_v.quick_check is null
     or v_v.cognitive_level is null
     or v_v.verification <> 'verified' then
    raise exception 'presentation_blocks_incomplete'
      using errcode = 'P0013';
  end if;

  select count(*)::integer into v_ce_count
  from public.common_errors
  where question_version_id = p_version_id;

  if v_ce_count < 2 then
    raise exception 'common_errors_insufficient'
      using errcode = 'P0013';
  end if;

  select count(*)::integer into v_ss_count
  from public.solution_steps
  where question_version_id = p_version_id;

  if v_ss_count < 1 then
    raise exception 'solution_steps_missing'
      using errcode = 'P0013';
  end if;

  if exists (
    select 1
    from public.solution_steps ss
    where ss.question_version_id = p_version_id
      and ss.instruction ilike '%AUTO-DERIVED%'
  ) then
    raise exception 'solution_placeholder_present'
      using errcode = 'P0013';
  end if;

  v_roundtrip := public.fn_validate_answer(
    v_v.answer_spec,
    v_v.answer_spec ->> 'displayValue',
    null
  );
  if coalesce((v_roundtrip ->> 'is_correct')::boolean, false) is not true then
    raise exception 'answer_spec_roundtrip_failed'
      using errcode = 'P0013';
  end if;

  update public.app_config
  set value = to_jsonb((coalesce((value #>> '{}')::bigint, 0) + 1)),
      updated_at = now()
  where key = 'content_version'
  returning (value #>> '{}')::bigint into v_content_version;

  v_payload := public.fn_build_question_payload(p_version_id);
  v_payload_bytes := octet_length(v_payload::text);

  insert into public.question_payloads (
    question_version_id, question_id, payload, payload_bytes, content_version, is_free
  ) values (
    p_version_id, p_question_id, v_payload, v_payload_bytes, v_content_version, v_q.is_free
  )
  on conflict (question_version_id) do update
  set payload = excluded.payload,
      payload_bytes = excluded.payload_bytes,
      content_version = excluded.content_version,
      is_free = excluded.is_free,
      built_at = now();

  update public.questions
  set status = 'published',
      current_version_id = p_version_id,
      updated_at = now()
  where id = p_question_id;

  update public.question_versions
  set published_at = coalesce(published_at, now())
  where id = p_version_id;

  insert into public.audit_log (actor_id, actor_role, action, entity_type, entity_id, reason)
  values (
    auth.uid(),
    public.auth_role(),
    'publish',
    'question',
    p_question_id::text,
    p_note
  );
end;
$$;

-- ── fn_create_practice_session (§6.4, §9.3) ───────────────────────────────────

create or replace function public.fn_create_practice_session(
  p_mode public.practice_mode,
  p_scope_kind text,
  p_scope_ids uuid[],
  p_count smallint,
  p_difficulty_mode text default 'mixed',
  p_client_seed bigint default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student uuid := auth.uid();
  v_syllabus public.syllabus_code;
  v_allowance smallint;
  v_count smallint;
  v_max smallint;
  v_objective_ids uuid[];
  v_seed bigint;
  v_session_id uuid;
  v_starved boolean := false;
  v_existing uuid;
  v_delivered smallint := 0;
  v_items jsonb := '[]'::jsonb;
begin
  if v_student is null then
    raise exception 'not authenticated'
      using errcode = '42501';
  end if;

  perform public.fn_rate_limit_check(
    'fn_create_practice_session:' || v_student::text,
    30,
    3600
  );

  select coalesce((value #>> '{}')::smallint, 20)
  into v_max
  from public.app_config
  where key = 'session_max_questions';

  v_count := least(greatest(p_count, 1), v_max)::smallint;

  v_allowance := public.fn_check_daily_allowance(v_student, v_count);
  if v_allowance = 0 then
    raise exception 'entitlement_exhausted'
      using errcode = 'P0001';
  end if;
  v_count := v_allowance;

  select p.syllabus_version into v_syllabus
  from public.profiles p
  where p.id = v_student;

  v_objective_ids := public.fn_resolve_scope(p_scope_kind, p_scope_ids, v_syllabus);

  select ps.id
  into v_existing
  from public.practice_sessions ps
  where ps.student_id = v_student
    and ps.status = 'in_progress'
    and ps.scope_kind = p_scope_kind
    and ps.scope_ids = p_scope_ids
    and ps.difficulty_mode = p_difficulty_mode
    and ps.mode = p_mode
    and ps.started_at > now() - interval '60 seconds'
  order by ps.started_at desc
  limit 1;

  if v_existing is not null then
    select jsonb_build_object(
      'session_id', ps.id,
      'delivered_count', ps.delivered_count,
      'requested_count', ps.requested_count,
      'allowance_remaining', public.fn_check_daily_allowance(v_student, v_max::smallint),
      'starved', false,
      'items', coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'position', psi.position,
              'question_id', psi.question_id,
              'question_version_id', psi.question_version_id,
              'option_order', psi.option_order
            )
            order by psi.position
          )
          from public.practice_session_items psi
          where psi.session_id = ps.id
        ),
        '[]'::jsonb
      )
    )
    into v_items
    from public.practice_sessions ps
    where ps.id = v_existing;

    return v_items;
  end if;

  drop table if exists tmp_candidates;
  create temp table tmp_candidates on commit drop as
  select distinct
    q.id as question_id,
    q.current_version_id as question_version_id,
    q.difficulty_band,
    q.variant_family_id,
    qp.is_free,
    qo.specific_objective_id as primary_objective_id
  from public.questions q
  join public.question_payloads qp on qp.question_version_id = q.current_version_id
  join public.question_objectives qo on qo.question_id = q.id and qo.is_primary
  where q.status = 'published'
    and q.retired_at is null
    and qo.specific_objective_id = any (v_objective_ids)
    and (public.has_premium(v_student) or q.is_free);

  if not exists (select 1 from tmp_candidates) then
    raise exception 'no_questions_available'
      using errcode = 'P0003';
  end if;

  drop table if exists tmp_pool;
  create temp table tmp_pool on commit drop as
  select c.*
  from tmp_candidates c
  where not exists (
    select 1
    from public.attempts a
    where a.student_id = v_student
      and a.question_id = c.question_id
      and a.created_at > now() - (
        case when a.is_correct
          then coalesce(
            (select (ac.value #>> '{}')::integer from public.app_config ac where ac.key = 'cooldown_days_default'),
            30
          )
          else coalesce(
            (select (ac.value #>> '{}')::integer from public.app_config ac where ac.key = 'cooldown_days_incorrect'),
            7
          )
        end
      ) * interval '1 day'
  );

  if (select count(*) from tmp_pool) < v_count then
    v_starved := true;
    drop table if exists tmp_pool;
    create temp table tmp_pool on commit drop as select * from tmp_candidates;
  end if;

  v_seed := coalesce(p_client_seed, ('x' || substr(md5(v_student::text || clock_timestamp()::text), 1, 16))::bit(64)::bigint);
  perform setseed((abs(v_seed % 1000000)::numeric / 1000000.0));

  drop table if exists tmp_selected;
  create temp table tmp_selected on commit drop as
  with ranked as (
    select
      p.*,
      row_number() over (
        partition by coalesce(p.variant_family_id, p.question_id)
        order by random()
      ) as family_rn,
      row_number() over (order by random()) as rn
    from tmp_pool p
    where case p_difficulty_mode
      when 'challenge' then p.difficulty_band >= 4
      when 'building' then p.difficulty_band <= 3
      else true
    end
  )
  select question_id, question_version_id, difficulty_band, variant_family_id, is_free, primary_objective_id
  from ranked
  where family_rn = 1
  order by rn
  limit v_count;

  v_delivered := (select count(*)::smallint from tmp_selected);

  if v_delivered = 0 then
    raise exception 'no_questions_available'
      using errcode = 'P0003';
  end if;

  insert into public.practice_sessions (
    student_id, mode, scope_kind, scope_ids, syllabus_code,
    difficulty_mode, requested_count, delivered_count, seed, status
  ) values (
    v_student, p_mode, p_scope_kind, p_scope_ids, v_syllabus,
    p_difficulty_mode, p_count, v_delivered, v_seed, 'in_progress'
  )
  returning id into v_session_id;

  insert into public.practice_session_items (
    session_id, position, question_id, question_version_id, option_order
  )
  select
    v_session_id,
    row_number() over (order by s.question_id)::smallint - 1,
    s.question_id,
    s.question_version_id,
    (
      select array_agg(qo.option_key order by
        case when qo.preserve_order then qo.sequence else random() end)
      from public.question_options qo
      where qo.question_version_id = s.question_version_id
    )
  from tmp_selected s;

  insert into public.student_daily_usage (student_id, usage_date, questions_served, sessions_started)
  values (v_student, current_date, v_delivered, 1)
  on conflict (student_id, usage_date) do update
  set questions_served = public.student_daily_usage.questions_served + excluded.questions_served,
      sessions_started = public.student_daily_usage.sessions_started + 1;

  select jsonb_build_object(
    'session_id', v_session_id,
    'delivered_count', v_delivered,
    'requested_count', p_count,
    'allowance_remaining', public.fn_check_daily_allowance(v_student, (v_max - v_delivered)::smallint),
    'starved', v_starved,
    'items', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'position', psi.position,
            'question_id', psi.question_id,
            'question_version_id', psi.question_version_id,
            'option_order', psi.option_order
          )
          order by psi.position
        )
        from public.practice_session_items psi
        where psi.session_id = v_session_id
      ),
      '[]'::jsonb
    )
  )
  into v_items;

  return v_items;
end;
$$;

-- ── fn_update_skill_mastery (§6.9, §9.11) ─────────────────────────────────────

create or replace function public.fn_update_skill_mastery(
  p_student uuid,
  p_skill uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_half_life_attempts numeric;
  v_half_life_days numeric;
  v_evidence_floor integer;
  v_full_weight_at integer;
  v_decay_floor numeric;
  v_raw numeric := 0;
  v_weight_sum numeric := 0;
  v_credit numeric;
  v_weight numeric;
  v_recency numeric;
  v_recency_n numeric;
  v_recency_t numeric;
  v_difficulty_credit numeric;
  v_difficulty_penalty numeric;
  v_guess_discount numeric;
  v_distinct_q integer;
  v_confidence numeric;
  v_score_shrunk numeric;
  v_cap numeric;
  v_max_band smallint;
  v_score numeric;
  v_attempts_count integer;
  v_correct_count integer;
  v_bands smallint[];
  v_last_attempt timestamptz;
  v_last_correct timestamptz;
  v_days_since numeric;
  v_decayed_at timestamptz;
  r record;
  v_i integer := 0;
begin
  select coalesce((value #>> '{}')::numeric, 20) into v_half_life_attempts
  from public.app_config where key = 'mastery_half_life_attempts';
  select coalesce((value #>> '{}')::numeric, 30) into v_half_life_days
  from public.app_config where key = 'mastery_half_life_days';
  select coalesce((value #>> '{}')::integer, 5) into v_evidence_floor
  from public.app_config where key = 'mastery_evidence_floor';
  select coalesce((value #>> '{}')::integer, 15) into v_full_weight_at
  from public.app_config where key = 'mastery_full_weight_at';
  select coalesce((value #>> '{}')::numeric, 0.6) into v_decay_floor
  from public.app_config where key = 'mastery_decay_floor';

  drop table if exists tmp_skill_attempts;
  create temp table tmp_skill_attempts on commit drop as
  select
    a.*,
    q.question_type,
    (select count(*)::integer from public.question_options qo
     where qo.question_version_id = a.question_version_id) as n_options
  from public.attempts a
  join public.attempt_skills ask on ask.attempt_id = a.id
  join public.questions q on q.id = a.question_id
  where a.student_id = p_student
    and ask.skill_id = p_skill
  order by a.created_at desc
  limit 60;

  for r in select * from tmp_skill_attempts order by created_at desc
  loop
    v_i := v_i + 1;
    v_recency_n := power(0.5, (v_i - 1) / v_half_life_attempts);
    v_recency_t := power(0.5, extract(epoch from (now() - r.created_at)) / 86400.0 / v_half_life_days);
    v_recency := least(v_recency_n, v_recency_t);

    v_difficulty_credit := 0.6 + 0.2 * r.difficulty_band;
    v_difficulty_penalty := 1.8 - 0.2 * r.difficulty_band;
    v_guess_discount := case
      when r.question_type = 'multiple_choice' and coalesce(r.n_options, 0) > 0
        then 1 - (1.0 / r.n_options)
      else 1.0
    end;

    if r.was_skipped then
      v_credit := 0;
      v_weight := v_recency * 1.0;
    elsif r.is_correct then
      v_credit := v_difficulty_credit * v_guess_discount;
      v_weight := v_recency * v_difficulty_credit;
    else
      v_credit := 0;
      v_weight := v_recency * v_difficulty_penalty;
    end if;

    v_raw := v_raw + v_credit * v_recency;
    v_weight_sum := v_weight_sum + v_weight;
  end loop;

  if v_weight_sum > 0 then
    v_raw := 100.0 * v_raw / v_weight_sum;
  else
    v_raw := 0;
  end if;

  select
    count(distinct question_id)::integer,
    count(*) filter (where is_correct)::integer,
    count(*)::integer,
    coalesce(array_agg(distinct difficulty_band order by difficulty_band), '{}'),
    max(created_at),
    max(created_at) filter (where is_correct)
  into v_distinct_q, v_correct_count, v_attempts_count, v_bands, v_last_attempt, v_last_correct
  from tmp_skill_attempts;

  v_confidence := least(1.0, greatest(0.0, v_distinct_q::numeric / v_full_weight_at));
  v_score_shrunk := v_confidence * v_raw + (1 - v_confidence) * 50;

  select coalesce(max(difficulty_band), 1) into v_max_band from tmp_skill_attempts;
  v_cap := case
    when v_max_band <= 2 then 60
    when v_max_band = 3 then 75
    when v_max_band = 4 then 89
    else 100
  end;

  v_score := least(v_score_shrunk, v_cap);

  select decayed_at into v_decayed_at
  from public.student_skill_mastery
  where student_id = p_student and skill_id = p_skill;

  if v_last_attempt is not null then
    v_days_since := extract(epoch from (now() - v_last_attempt)) / 86400.0;
    if v_days_since > 60 then
      v_score := greatest(v_score_shrunk * v_decay_floor, v_score - 0.25 * (v_days_since - 60));
    end if;
  end if;

  if v_distinct_q < v_evidence_floor then
    v_score := null;
  end if;

  insert into public.student_skill_mastery (
    student_id, skill_id, score, raw_score, confidence, coverage_cap,
    attempts_count, distinct_questions, correct_count, bands_seen,
    last_attempt_at, last_correct_at, updated_at
  ) values (
    p_student, p_skill, v_score, v_raw, v_confidence, v_cap,
    v_attempts_count, v_distinct_q, v_correct_count, v_bands,
    v_last_attempt, v_last_correct, now()
  )
  on conflict (student_id, skill_id) do update
  set score = excluded.score,
      raw_score = excluded.raw_score,
      confidence = excluded.confidence,
      coverage_cap = excluded.coverage_cap,
      attempts_count = excluded.attempts_count,
      distinct_questions = excluded.distinct_questions,
      correct_count = excluded.correct_count,
      bands_seen = excluded.bands_seen,
      last_attempt_at = excluded.last_attempt_at,
      last_correct_at = excluded.last_correct_at,
      updated_at = now();
end;
$$;

-- ── fn_record_attempt (§6.5) ──────────────────────────────────────────────────

create or replace function public.fn_record_attempt(
  p_client_attempt_id uuid,
  p_question_version_id uuid,
  p_session_id uuid default null,
  p_exam_session_id uuid default null,
  p_part_key text default null,
  p_raw_answer text default null,
  p_was_skipped boolean default false,
  p_client_is_correct boolean default null,
  p_duration_ms integer default null,
  p_client_created_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student uuid := auth.uid();
  v_existing record;
  v_q record;
  v_v record;
  v_validation jsonb;
  v_is_correct boolean;
  v_normalised text;
  v_matched_ce uuid;
  v_attempt_id bigint;
  v_discrepancy boolean := false;
  v_skill record;
begin
  if v_student is null then
    raise exception 'not authenticated'
      using errcode = '42501';
  end if;

  perform public.fn_rate_limit_check(
    'fn_record_attempt:' || v_student::text,
    600,
    3600
  );

  select * into v_existing
  from public.attempts
  where client_attempt_id = p_client_attempt_id;

  if found then
    return jsonb_build_object(
      'attempt_id', v_existing.id,
      'is_correct', v_existing.is_correct,
      'matched_common_error_id', v_existing.matched_common_error_id,
      'discrepancy', false,
      'replayed', true
    );
  end if;

  select q.*, v.answer_spec
  into v_q
  from public.question_versions v
  join public.questions q on q.id = v.question_id
  where v.id = p_question_version_id
    and q.status = 'published';

  if not found then
    raise exception 'question version not available'
      using errcode = 'P0002';
  end if;

  if p_session_id is not null then
    if not exists (
      select 1 from public.practice_sessions ps
      where ps.id = p_session_id and ps.student_id = v_student
    ) then
      raise exception 'session not owned by caller'
        using errcode = '42501';
    end if;
  end if;

  if p_was_skipped then
    v_is_correct := false;
    v_normalised := null;
    v_validation := jsonb_build_object('is_correct', false, 'normalised', null);
  else
    v_validation := public.fn_validate_answer(v_q.answer_spec, p_raw_answer, p_part_key);
    v_is_correct := coalesce((v_validation ->> 'is_correct')::boolean, false);
    v_normalised := v_validation ->> 'normalised';
  end if;

  if p_client_is_correct is not null and p_client_is_correct is distinct from v_is_correct then
    v_discrepancy := true;
    insert into public.analytics_events (student_id, event_name, event_props, occurred_at)
    values (
      v_student,
      'answer_validation_discrepancy',
      jsonb_build_object(
        'question_id', v_q.id,
        'client_result', p_client_is_correct,
        'server_result', v_is_correct
      ),
      now()
    );
  end if;

  select ce.id into v_matched_ce
  from public.common_errors ce
  where ce.question_version_id = p_question_version_id
    and (
      (ce.wrong_value is not null and ce.wrong_value = v_normalised)
      or (ce.wrong_option_key is not null and upper(ce.wrong_option_key) = upper(coalesce(p_raw_answer, '')))
    )
  limit 1;

  insert into public.attempts (
    client_attempt_id, student_id, question_id, question_version_id,
    session_id, exam_session_id, context, part_key, raw_answer, normalised_answer,
    is_correct, client_is_correct, matched_common_error_id, was_skipped,
    difficulty_band, duration_ms, client_created_at
  ) values (
    p_client_attempt_id, v_student, v_q.id, p_question_version_id,
    p_session_id, p_exam_session_id,
    (select mode from public.practice_sessions where id = p_session_id),
    p_part_key, p_raw_answer, v_normalised,
    v_is_correct, p_client_is_correct, v_matched_ce, p_was_skipped,
    v_q.difficulty_band, p_duration_ms, p_client_created_at
  )
  returning id into v_attempt_id;

  insert into public.attempt_skills (attempt_id, skill_id, weight)
  select v_attempt_id, qs.skill_id, qs.weight
  from public.question_skills qs
  where qs.question_id = v_q.id;

  for v_skill in select skill_id from public.question_skills where question_id = v_q.id
  loop
    perform public.fn_update_skill_mastery(v_student, v_skill.skill_id);
  end loop;

  if p_session_id is not null then
    update public.practice_sessions
    set answered_count = answered_count + 1,
        correct_count = correct_count + case when v_is_correct then 1 else 0 end
    where id = p_session_id;

    update public.practice_session_items
    set answered = true
    where session_id = p_session_id
      and question_version_id = p_question_version_id;

    update public.student_daily_usage
    set questions_answered = questions_answered + 1
    where student_id = v_student and usage_date = current_date;
  end if;

  return jsonb_build_object(
    'attempt_id', v_attempt_id,
    'is_correct', v_is_correct,
    'matched_common_error_id', v_matched_ce,
    'discrepancy', v_discrepancy,
    'replayed', false
  );
end;
$$;

-- ── fn_get_recommendation (§6.10, §9.12) ──────────────────────────────────────

create or replace function public.fn_get_recommendation(p_student uuid default auth.uid())
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_syllabus public.syllabus_code;
  v_best record;
  v_score numeric;
  v_best_score numeric := -1e9;
  v_result jsonb;
  r record;
begin
  if p_student is null then
    return null;
  end if;

  select syllabus_version into v_syllabus
  from public.profiles where id = p_student;

  for r in
    select
      s.id as skill_id,
      s.name as skill_name,
      coalesce(ssm.score, 35) as mastery_score,
      coalesce(mv.published_count, 0) as available_questions
    from public.skills s
    join public.skill_objectives sko on sko.skill_id = s.id
    join public.specific_objectives so on so.id = sko.specific_objective_id
    left join public.student_skill_mastery ssm
      on ssm.student_id = p_student and ssm.skill_id = s.id
    left join public.mv_skill_question_counts mv on mv.skill_id = s.id
    where so.syllabus_code = v_syllabus
      and s.is_active
    group by s.id, s.name, ssm.score, mv.published_count
    having coalesce(mv.published_count, 0) > 5
  loop
    v_score := 40 * (1 - coalesce(r.mastery_score, 35) / 100.0);
    v_score := v_score + 25 * 0.1;
    v_score := v_score - case when r.available_questions < 10 then 50 else 0 end;

    if v_score > v_best_score then
      v_best_score := v_score;
      v_best := r;
    end if;
  end loop;

  if v_best is null then
    return null;
  end if;

  v_result := jsonb_build_object(
    'scope_kind', 'skill',
    'scope_id', v_best.skill_id,
    'label', v_best.skill_name,
    'reason', format('%s is a good next focus area.', v_best.skill_name),
    'mastery', (select score from public.student_skill_mastery
                where student_id = p_student and skill_id = v_best.skill_id),
    'available_questions', v_best.available_questions
  );

  return v_result;
end;
$$;

-- ── fn_complete_session (§6.11) ───────────────────────────────────────────────

create or replace function public.fn_complete_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student uuid := auth.uid();
  v_session record;
  v_before jsonb;
  v_after jsonb;
  v_duration integer;
begin
  select * into v_session
  from public.practice_sessions
  where id = p_session_id and student_id = v_student;

  if not found then
    raise exception 'session not found'
      using errcode = 'P0002';
  end if;

  if v_session.status = 'completed' then
    raise exception 'session_already_completed'
      using errcode = 'P0001';
  end if;

  select coalesce(jsonb_object_agg(skill_id::text, score), '{}'::jsonb)
  into v_before
  from public.student_skill_mastery
  where student_id = v_student;

  update public.practice_sessions
  set status = 'completed',
      completed_at = now(),
      duration_seconds = extract(epoch from (now() - started_at))::integer
  where id = p_session_id
  returning duration_seconds into v_duration;

  select coalesce(jsonb_object_agg(skill_id::text, score), '{}'::jsonb)
  into v_after
  from public.student_skill_mastery
  where student_id = v_student;

  insert into public.audit_log (actor_id, actor_role, action, entity_type, entity_id)
  values (v_student, public.auth_role(), 'complete_session', 'practice_session', p_session_id::text);

  return jsonb_build_object(
    'session_id', p_session_id,
    'correct_count', v_session.correct_count,
    'answered_count', v_session.answered_count,
    'delivered_count', v_session.delivered_count,
    'duration_seconds', v_duration,
    'mastery_before', v_before,
    'mastery_after', v_after
  );
end;
$$;

-- ── fn_start_exam_session / fn_submit_exam_session (§6.12 stubs) ─────────────

create or replace function public.fn_start_exam_session(
  p_paper_id uuid,
  p_mode public.exam_mode default 'practice'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student uuid := auth.uid();
  v_paper record;
  v_session_id uuid;
  v_expires timestamptz;
begin
  if v_student is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if p_mode = 'timed' and not public.has_premium(v_student) then
    raise exception 'entitlement_required' using errcode = 'P0001';
  end if;

  select * into v_paper from public.papers where id = p_paper_id and status = 'published';
  if not found then
    raise exception 'paper not found' using errcode = 'P0002';
  end if;

  v_expires := now() + make_interval(mins => v_paper.duration_minutes);

  insert into public.exam_sessions (
    student_id, paper_id, mode, duration_minutes, server_started_at, expires_at, status
  ) values (
    v_student, p_paper_id, p_mode, v_paper.duration_minutes, now(), v_expires, 'in_progress'
  )
  returning id into v_session_id;

  return jsonb_build_object(
    'exam_session_id', v_session_id,
    'server_started_at', now(),
    'expires_at', v_expires,
    'duration_minutes', v_paper.duration_minutes
  );
end;
$$;

create or replace function public.fn_submit_exam_session(p_exam_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student uuid := auth.uid();
  v_session record;
begin
  select * into v_session
  from public.exam_sessions
  where id = p_exam_session_id and student_id = v_student;

  if not found then
    raise exception 'exam session not found' using errcode = 'P0002';
  end if;

  if v_session.submitted_at is not null then
    return jsonb_build_object(
      'exam_session_id', p_exam_session_id,
      'answer_marks', v_session.answer_marks,
      'max_answer_marks', v_session.max_answer_marks,
      'replayed', true
    );
  end if;

  update public.exam_sessions
  set submitted_at = now(),
      status = 'completed',
      answer_marks = coalesce(answer_marks, 0),
      max_answer_marks = coalesce(max_answer_marks, total_paper_marks)
  where id = p_exam_session_id;

  return jsonb_build_object(
    'exam_session_id', p_exam_session_id,
    'answer_marks', coalesce(v_session.answer_marks, 0),
    'max_answer_marks', coalesce(v_session.max_answer_marks, v_session.total_paper_marks),
    'marks_by_module', v_session.marks_by_module,
    'replayed', false
  );
end;
$$;

-- ── §6.13 student-facing functions ────────────────────────────────────────────

create or replace function public.fn_abandon_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.practice_sessions
  set status = 'abandoned',
      completed_at = coalesce(completed_at, now())
  where id = p_session_id
    and student_id = auth.uid()
    and status = 'in_progress';
end;
$$;

create or replace function public.fn_save_exam_response(
  p_exam_session_id uuid,
  p_question_id uuid,
  p_part_key text,
  p_raw_answer text,
  p_flagged boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session record;
begin
  select * into v_session
  from public.exam_sessions
  where id = p_exam_session_id and student_id = auth.uid();

  if not found then
    raise exception 'exam session not found' using errcode = 'P0002';
  end if;

  if v_session.status <> 'in_progress' or v_session.submitted_at is not null then
    raise exception 'exam_already_submitted' using errcode = 'P0001';
  end if;

  if now() > v_session.expires_at + interval '60 seconds' then
    raise exception 'exam_expired' using errcode = 'P0001';
  end if;

  insert into public.exam_responses (
    exam_session_id, question_id, part_key, raw_answer, flagged, max_marks, answered_at
  ) values (
    p_exam_session_id, p_question_id, coalesce(p_part_key, ''), p_raw_answer, p_flagged, 1, now()
  )
  on conflict (exam_session_id, question_id, part_key) do update
  set raw_answer = excluded.raw_answer,
      flagged = excluded.flagged,
      answered_at = now();
end;
$$;

create or replace function public.fn_toggle_bookmark(p_question_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student uuid := auth.uid();
  v_exists boolean;
begin
  select exists (
    select 1 from public.student_bookmarks
    where student_id = v_student and question_id = p_question_id
  ) into v_exists;

  if v_exists then
    delete from public.student_bookmarks
    where student_id = v_student and question_id = p_question_id;
    return jsonb_build_object('bookmarked', false);
  end if;

  insert into public.student_bookmarks (student_id, question_id)
  values (v_student, p_question_id);

  return jsonb_build_object('bookmarked', true);
end;
$$;

create or replace function public.fn_ingest_events(p_events jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student uuid := auth.uid();
  v_evt jsonb;
  v_accepted integer := 0;
  v_rejected integer := 0;
  v_allowed text[] := array[
    'app_opened', 'practice_started', 'answer_submitted', 'answer_correct', 'answer_incorrect',
    'question_skipped', 'practice_completed', 'practice_abandoned', 'bookmark_toggled',
    'question_reported', 'sync_failed', 'answer_validation_discrepancy'
  ];
begin
  perform public.fn_rate_limit_check('fn_ingest_events:' || v_student::text, 240, 3600);

  if jsonb_array_length(coalesce(p_events, '[]'::jsonb)) > 200 then
    raise exception 'batch too large' using errcode = '22023';
  end if;

  for v_evt in select jsonb_array_elements(coalesce(p_events, '[]'::jsonb))
  loop
    if (v_evt ->> 'event_name') = any (v_allowed) then
      insert into public.analytics_events (student_id, event_name, event_props, occurred_at)
      values (
        v_student,
        v_evt ->> 'event_name',
        coalesce(v_evt -> 'event_props', '{}'::jsonb),
        coalesce((v_evt ->> 'occurred_at')::timestamptz, now())
      );
      v_accepted := v_accepted + 1;
    else
      v_rejected := v_rejected + 1;
    end if;
  end loop;

  return jsonb_build_object('accepted', v_accepted, 'rejected', v_rejected);
end;
$$;

create or replace function public.fn_recompute_affected_attempts(p_version_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt record;
  v_validation jsonb;
  v_count integer := 0;
  v_students integer := 0;
  v_seen uuid[] := '{}';
begin
  if not public.is_content_admin_role() then
    raise exception 'not authorised' using errcode = '42501';
  end if;

  for v_attempt in
    select a.*
    from public.attempts a
    where a.question_version_id = p_version_id
  loop
    select v.answer_spec into strict v_validation
    from public.question_versions v where v.id = p_version_id;

    v_validation := public.fn_validate_answer(
      (select answer_spec from public.question_versions where id = p_version_id),
      v_attempt.raw_answer,
      v_attempt.part_key
    );

    update public.attempts
    set is_correct = coalesce((v_validation ->> 'is_correct')::boolean, false),
        normalised_answer = v_validation ->> 'normalised'
    where id = v_attempt.id;

    v_count := v_count + 1;
    if not v_attempt.student_id = any (v_seen) then
      v_seen := array_append(v_seen, v_attempt.student_id);
      perform public.fn_recompute_all_mastery(v_attempt.student_id);
    end if;
  end loop;

  v_students := cardinality(v_seen);

  insert into public.audit_log (actor_id, actor_role, action, entity_type, entity_id, after)
  values (
    auth.uid(), public.auth_role(), 'recompute_attempts', 'question_version', p_version_id::text,
    jsonb_build_object('attempts', v_count, 'students', v_students)
  );

  return jsonb_build_object('attempts', v_count, 'students', v_students);
end;
$$;

create or replace function public.fn_recompute_all_mastery(p_student uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_skill uuid;
begin
  if auth.uid() is distinct from p_student and not public.is_staff() then
    raise exception 'not authorised' using errcode = '42501';
  end if;

  for v_skill in
    select distinct ask.skill_id
    from public.attempt_skills ask
    join public.attempts a on a.id = ask.attempt_id
    where a.student_id = p_student
  loop
    perform public.fn_update_skill_mastery(p_student, v_skill);
  end loop;
end;
$$;

create or replace function public.fn_report_question(
  p_question_id uuid,
  p_reason_code text,
  p_detail text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student uuid := auth.uid();
  v_q record;
  v_report_id uuid;
begin
  perform public.fn_rate_limit_check('fn_report_question:day:' || v_student::text, 20, 86400);
  perform public.fn_rate_limit_check('fn_report_question:min:' || v_student::text, 3, 60);

  select q.id, q.current_version_id into v_q
  from public.questions q
  where q.id = p_question_id and q.status = 'published';

  if not found then
    raise exception 'question not found' using errcode = 'P0002';
  end if;

  insert into public.question_reports (
    question_id, question_version_id, reporter_id, reason_code, detail
  ) values (
    p_question_id, v_q.current_version_id, v_student, p_reason_code, p_detail
  )
  returning id into v_report_id;

  return jsonb_build_object('report_id', v_report_id);
end;
$$;

create or replace function public.fn_delete_own_account(p_confirm boolean default false)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not p_confirm then
    raise exception 'confirmation required' using errcode = '22023';
  end if;

  update public.profiles
  set deleted_at = now()
  where id = auth.uid();

  insert into public.audit_log (actor_id, actor_role, action, entity_type, entity_id)
  values (auth.uid(), public.auth_role(), 'delete_account', 'profile', auth.uid()::text);
end;
$$;

create or replace function public.fn_link_anonymous_account(p_anon_uid uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student uuid := auth.uid();
  v_migrated integer := 0;
  v_is_anon boolean;
begin
  select coalesce(is_anonymous, false) into v_is_anon
  from auth.users where id = p_anon_uid;

  if not v_is_anon then
    raise exception 'source is not anonymous' using errcode = '22023';
  end if;

  update public.attempts
  set student_id = v_student
  where student_id = p_anon_uid;

  get diagnostics v_migrated = row_count;

  update public.practice_sessions set student_id = v_student where student_id = p_anon_uid;
  update public.student_daily_usage set student_id = v_student where student_id = p_anon_uid;

  insert into public.audit_log (actor_id, actor_role, action, entity_type, entity_id, after)
  values (
    v_student, public.auth_role(), 'link_anonymous', 'profile', v_student::text,
    jsonb_build_object('anon_uid', p_anon_uid, 'migrated_attempts', v_migrated)
  );

  return jsonb_build_object('migrated_attempts', v_migrated);
end;
$$;

-- ── pg_cron job stubs (§6.14) ─────────────────────────────────────────────────
-- Uncomment when pg_cron extension is available in the target environment.
-- select cron.schedule('job_process_subscription_events', '*/15 * * * *', $$ select 1 $$);
-- select cron.schedule('job_refresh_quality_metrics', '0 * * * *', $$ select 1 $$);
-- select cron.schedule('job_decay_mastery', '15 2 * * *', $$ select 1 $$);
-- select cron.schedule('job_refresh_materialised_views', '30 2 * * *',
--   $$ refresh materialized view concurrently public.mv_skill_question_counts;
--      refresh materialized view concurrently public.mv_topic_coverage; $$);
-- select cron.schedule('job_purge_deleted_accounts', '0 3 * * *', $$ select 1 $$);
-- select cron.schedule('job_rebuild_stale_payloads', '0 4 * * 0', $$ select 1 $$);

-- ── GRANT EXECUTE on §6 functions ─────────────────────────────────────────────

grant execute on function public.fn_rate_limit_check(text, numeric, integer) to service_role;
grant execute on function public.fn_normalise_answer(text, text, boolean) to authenticated;
grant execute on function public.fn_gcd_int(integer, integer) to authenticated;
grant execute on function public.fn_parse_numeric_value(text) to authenticated;
grant execute on function public.fn_match_common_errors(text, text, jsonb) to authenticated;
grant execute on function public.fn_match_accepted_form(text, jsonb) to authenticated;
grant execute on function public.fn_within_tolerance(numeric, numeric, jsonb) to authenticated;
grant execute on function public.fn_count_decimal_places(text) to authenticated;
grant execute on function public.fn_count_significant_figures(text) to authenticated;
grant execute on function public.fn_validate_answer(jsonb, text, text) to authenticated;
grant execute on function public.fn_resolve_scope(text, uuid[], public.syllabus_code) to authenticated;
grant execute on function public.fn_check_daily_allowance(uuid, smallint) to authenticated;
grant execute on function public.fn_build_question_payload(uuid) to authenticated;
grant execute on function public.fn_publish_question(uuid, uuid, text) to authenticated;
grant execute on function public.fn_create_practice_session(public.practice_mode, text, uuid[], smallint, text, bigint) to authenticated;
grant execute on function public.fn_update_skill_mastery(uuid, uuid) to authenticated;
grant execute on function public.fn_record_attempt(uuid, uuid, uuid, uuid, text, text, boolean, boolean, integer, timestamptz) to authenticated;
grant execute on function public.fn_get_recommendation(uuid) to authenticated;
grant execute on function public.fn_complete_session(uuid) to authenticated;
grant execute on function public.fn_start_exam_session(uuid, public.exam_mode) to authenticated;
grant execute on function public.fn_submit_exam_session(uuid) to authenticated;
grant execute on function public.fn_abandon_session(uuid) to authenticated;
grant execute on function public.fn_save_exam_response(uuid, uuid, text, text, boolean) to authenticated;
grant execute on function public.fn_toggle_bookmark(uuid) to authenticated;
grant execute on function public.fn_ingest_events(jsonb) to authenticated;
grant execute on function public.fn_recompute_affected_attempts(uuid) to authenticated;
grant execute on function public.fn_recompute_all_mastery(uuid) to authenticated;
grant execute on function public.fn_report_question(uuid, text, text) to authenticated;
grant execute on function public.fn_delete_own_account(boolean) to authenticated;
grant execute on function public.fn_link_anonymous_account(uuid) to authenticated;

commit;
