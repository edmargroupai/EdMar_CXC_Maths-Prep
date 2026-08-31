-- P05 · Content schema (§3.4–3.17)
-- Question tables, math_renders, papers; content lifecycle triggers.
-- Profile FK constraints on created_by / reviewer_id columns are added in 0004_student.sql.

begin;

create extension if not exists vector with schema extensions;
create extension if not exists pg_jsonschema with schema extensions;

-- ── math_renders (D-01, D-03) ────────────────────────────────────────────────

create table public.math_renders (
  hash text primary key,
  latex text not null,
  style text not null default 'display' check (style in ('inline', 'display')),
  svg text not null,
  width_ex numeric(8, 3) not null,
  height_ex numeric(8, 3) not null,
  depth_ex numeric(8, 3) not null default 0,
  renderer_version text not null,
  byte_size integer not null,
  created_at timestamptz not null default now()
);

create index idx_mr_created on public.math_renders (created_at);

-- ── questions ───────────────────────────────────────────────────────────────

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  subject_code text not null default 'CSEC_MATH' references public.subjects (code),
  question_type public.question_type not null,
  provenance public.provenance_type not null,
  rights_status public.rights_status not null default 'unknown',
  status public.content_status not null default 'draft',
  current_version_id uuid,
  variant_family_id uuid,
  source_question_id uuid references public.questions (id),
  calculator_allowed boolean not null default true,
  difficulty_band smallint not null check (difficulty_band between 1 and 5),
  profile_dimension public.profile_dimension,
  is_free boolean not null default false,
  legacy_id text,
  retired_at timestamptz,
  retired_reason text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'published' or current_version_id is not null)
);

create index idx_q_published on public.questions (status) where status = 'published';
create index idx_q_difficulty on public.questions (difficulty_band) where status = 'published';
create index idx_q_variant_family on public.questions (variant_family_id)
  where variant_family_id is not null;
create index idx_q_provenance on public.questions (provenance, rights_status);
create index idx_q_free on public.questions (is_free) where is_free and status = 'published';
create unique index uq_q_legacy on public.questions (legacy_id) where legacy_id is not null;

create trigger trg_questions_updated_at
  before update on public.questions
  for each row
  execute function public.trg_set_updated_at();

-- ── question_versions ───────────────────────────────────────────────────────

create table public.question_versions (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  version_no integer not null check (version_no >= 1),
  stem_blocks jsonb not null check (jsonb_typeof(stem_blocks) = 'array'),
  stem_plain text not null,
  answer_spec jsonb not null,
  explanation text,
  explanation_blocks jsonb,
  concepts_required jsonb not null default '[]',
  strategy_blocks jsonb not null default '[]',
  final_answer_blocks jsonb not null default '[]',
  why_this_works jsonb not null default '[]',
  exam_tip jsonb not null default '[]',
  quick_check jsonb,
  cognitive_level public.profile_dimension not null,
  method_class text,
  accuracy_rule public.accuracy_rule not null default 'exact',
  verification public.verification_status not null default 'unverified',
  ambiguity_note text,
  marks smallint check (marks between 1 and 20),
  estimated_seconds smallint,
  hint text,
  normalised_hash text not null,
  embedding extensions.vector(1536),
  validation_report jsonb,
  change_note text,
  created_by uuid,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (question_id, version_no)
);

create index idx_qv_hash on public.question_versions (normalised_hash);
create index idx_qv_embedding on public.question_versions
  using ivfflat (embedding extensions.vector_cosine_ops);
create index idx_qv_question on public.question_versions (question_id, version_no desc);
create index idx_qv_cognitive on public.question_versions (cognitive_level);

alter table public.questions
  add constraint fk_questions_current_version
  foreign key (current_version_id)
  references public.question_versions (id)
  deferrable initially deferred;

-- ── common_errors (before question_options for optional FK) ───────────────────

create table public.common_errors (
  id uuid primary key default gen_random_uuid(),
  question_version_id uuid not null references public.question_versions (id) on delete cascade,
  part_key text,
  wrong_value text,
  wrong_option_key char(1),
  misconception text not null,
  corrective_note text not null,
  skill_id uuid references public.skills (id),
  check (wrong_value is not null or wrong_option_key is not null)
);

create index idx_ce_version on public.common_errors (question_version_id);
create index idx_ce_value on public.common_errors (question_version_id, wrong_value);

-- ── question_options ────────────────────────────────────────────────────────

create table public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_version_id uuid not null references public.question_versions (id) on delete cascade,
  option_key char(1) not null check (option_key in ('A', 'B', 'C', 'D', 'E')),
  content_blocks jsonb not null,
  content_plain text not null,
  is_correct boolean not null default false,
  common_error_id uuid references public.common_errors (id) on delete set null,
  sequence smallint not null,
  preserve_order boolean not null default false,
  unique (question_version_id, option_key)
);

create index idx_qo_version on public.question_options (question_version_id, sequence);

-- ── solution_steps ──────────────────────────────────────────────────────────

create table public.solution_steps (
  id uuid primary key default gen_random_uuid(),
  question_version_id uuid not null references public.question_versions (id) on delete cascade,
  step_no smallint not null check (step_no >= 1),
  instruction text not null,
  sub_note text,
  working_blocks jsonb not null default '[]',
  result_blocks jsonb not null default '[]',
  marks smallint,
  created_at timestamptz not null default now(),
  unique (question_version_id, step_no)
);

create index idx_ss_qv on public.solution_steps (question_version_id, step_no);

-- ── question_assets ─────────────────────────────────────────────────────────

create table public.question_assets (
  id uuid primary key default gen_random_uuid(),
  question_version_id uuid not null references public.question_versions (id) on delete cascade,
  role public.asset_role not null default 'question_figure',
  part_key text,
  storage_bucket text not null default 'question-assets',
  storage_path text not null,
  mime_type text not null check (mime_type in ('image/svg+xml', 'image/png', 'image/webp')),
  width_px integer,
  height_px integer,
  alt_text text not null check (char_length(alt_text) >= 10),
  requires_colour boolean not null default false,
  sequence smallint not null default 0,
  unique (storage_bucket, storage_path)
);

create index idx_qa_version on public.question_assets (question_version_id, sequence);

-- ── question_objectives / question_skills ───────────────────────────────────

create table public.question_objectives (
  question_id uuid not null references public.questions (id) on delete cascade,
  specific_objective_id uuid not null references public.specific_objectives (id) on delete restrict,
  is_primary boolean not null default false,
  confidence numeric(3, 2),
  confirmed_by uuid,
  confirmed_at timestamptz,
  primary key (question_id, specific_objective_id)
);

create index idx_qo_objective on public.question_objectives (specific_objective_id);
create unique index uq_qo_primary on public.question_objectives (question_id) where is_primary;

create table public.question_skills (
  question_id uuid not null references public.questions (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete restrict,
  weight numeric(3, 2) not null default 1.00 check (weight > 0 and weight <= 1),
  primary key (question_id, skill_id)
);

create index idx_qs_skill on public.question_skills (skill_id);

-- ── question_sources ──────────────────────────────────────────────────────────

create table public.question_sources (
  question_id uuid primary key references public.questions (id) on delete cascade,
  source_kind text not null check (source_kind in ('past_paper', 'workbook', 'textbook', 'authored')),
  source_title text,
  sitting_year smallint check (sitting_year between 1980 and 2040),
  sitting_month public.sitting_month,
  paper public.paper_code,
  question_no smallint,
  part_label text,
  syllabus_in_force public.syllabus_code,
  page_ref text
);

create index idx_qsrc_paper on public.question_sources (sitting_year, sitting_month, paper, question_no);
create index idx_qsrc_kind on public.question_sources (source_kind);

-- ── question_payloads (D-14) ────────────────────────────────────────────────

create table public.question_payloads (
  question_version_id uuid primary key references public.question_versions (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  payload jsonb not null,
  payload_bytes integer not null check (payload_bytes < 262144),
  content_version bigint not null,
  is_free boolean not null,
  built_at timestamptz not null default now()
);

create index idx_qp_question on public.question_payloads (question_id);
create index idx_qp_free on public.question_payloads (is_free) where is_free;

-- ── question_reviews ────────────────────────────────────────────────────────

create table public.question_reviews (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  question_version_id uuid not null references public.question_versions (id) on delete cascade,
  reviewer_id uuid not null,
  decision public.review_decision not null,
  note text,
  rejection_reason_code text,
  diff jsonb,
  review_seconds integer,
  created_at timestamptz not null default now(),
  check (decision = 'approved' or note is not null)
);

create index idx_qr_question on public.question_reviews (question_id, created_at desc);
create index idx_qr_reviewer on public.question_reviews (reviewer_id, created_at desc);

-- ── question_quality_metrics ────────────────────────────────────────────────

create table public.question_quality_metrics (
  question_id uuid primary key references public.questions (id) on delete cascade,
  total_attempts integer not null default 0,
  distinct_students integer not null default 0,
  correct_attempts integer not null default 0,
  accuracy numeric(5, 4),
  skip_count integer not null default 0,
  mean_seconds numeric(8, 2),
  median_seconds numeric(8, 2),
  top_wrong_value text,
  top_wrong_share numeric(5, 4),
  report_count integer not null default 0,
  flagged_reason text,
  last_computed_at timestamptz not null default now()
);

create index idx_qqm_flagged on public.question_quality_metrics (flagged_reason)
  where flagged_reason is not null;
create index idx_qqm_accuracy on public.question_quality_metrics (accuracy);

-- ── question_reports ────────────────────────────────────────────────────────

create table public.question_reports (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id),
  question_version_id uuid not null references public.question_versions (id),
  reporter_id uuid,
  reason_code text not null check (
    reason_code in (
      'wrong_answer',
      'wrong_solution',
      'unclear',
      'typo',
      'diagram_missing',
      'off_syllabus',
      'other'
    )
  ),
  detail text check (char_length(detail) <= 500),
  student_answer text,
  resolution text check (resolution in ('fixed', 'no_change', 'duplicate', 'invalid')),
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_qrep_open on public.question_reports (question_id) where resolved_at is null;
create index idx_qrep_reporter on public.question_reports (reporter_id, created_at desc);

-- ── papers ──────────────────────────────────────────────────────────────────

create table public.papers (
  id uuid primary key default gen_random_uuid(),
  syllabus_code public.syllabus_code not null references public.syllabus_versions (code),
  title text not null,
  paper public.paper_code not null,
  sitting_year smallint,
  sitting_month public.sitting_month,
  is_original boolean not null default false,
  module_scope smallint[] not null default '{1,2,3}',
  total_marks smallint not null,
  duration_minutes smallint not null,
  rights_status public.rights_status not null default 'unknown',
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index uq_papers_sitting on public.papers (syllabus_code, paper, sitting_year, sitting_month)
  where sitting_year is not null;
create index idx_papers_published on public.papers (status, sitting_year desc)
  where status = 'published';

create trigger trg_papers_updated_at
  before update on public.papers
  for each row
  execute function public.trg_set_updated_at();

-- ── paper_questions ─────────────────────────────────────────────────────────

create table public.paper_questions (
  paper_id uuid not null references public.papers (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete restrict,
  position smallint not null,
  display_no text not null,
  marks smallint not null,
  module_no smallint,
  primary key (paper_id, question_id),
  unique (paper_id, position)
);

create index idx_pq_question on public.paper_questions (question_id);

-- ── fn_answer_spec_schema (§11.2) ───────────────────────────────────────────
-- Keep in sync with packages/content-schema/schemas/edmar-answer-spec.schema.json (P10).

create or replace function public.fn_answer_spec_schema()
returns json
language sql
immutable
set search_path = ''
as $$
  select '{
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://schema.edmar.ai/edmar-answer-spec.schema.json",
    "type": "object",
    "additionalProperties": false,
    "required": ["answerType", "canonicalValue", "displayValue", "acceptedForms", "normalisation"],
    "properties": {
      "answerType": {
        "enum": [
          "option_id", "option_set", "boolean", "numeric_exact", "numeric_tolerance",
          "numeric_sf", "numeric_dp", "fraction", "mixed_number", "ratio", "currency",
          "with_units", "expression", "coordinate", "set", "interval", "matrix",
          "vector", "text"
        ]
      },
      "canonicalValue": { "type": ["string", "array"] },
      "displayValue": { "type": "string", "minLength": 1 },
      "acceptedForms": { "type": "array", "items": { "type": "string" }, "minItems": 1 },
      "tolerance": {
        "type": "object",
        "additionalProperties": false,
        "required": ["kind"],
        "properties": {
          "kind": { "enum": ["absolute", "relative", "range", "none"] },
          "value": { "type": "number", "minimum": 0 },
          "min": { "type": "number" },
          "max": { "type": "number" }
        }
      },
      "precision": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "kind": { "enum": ["significant_figures", "decimal_places", "none"] },
          "value": { "type": "integer", "minimum": 0, "maximum": 10 },
          "required": { "type": "boolean", "default": false }
        }
      },
      "units": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "requirement": { "enum": ["none", "optional", "required", "convertible"] },
          "canonical": { "type": ["string", "null"] },
          "acceptedSet": { "type": "array", "items": { "type": "string" } }
        }
      },
      "form": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "lowestTerms": { "type": "boolean", "default": false },
          "simplifiedSurd": { "type": "boolean", "default": false },
          "simplestRatio": { "type": "boolean", "default": false },
          "specifiedForm": { "type": ["string", "null"] }
        }
      },
      "followThrough": {
        "type": "object",
        "additionalProperties": false,
        "required": ["dependsOn", "rule"],
        "properties": {
          "dependsOn": { "type": "string" },
          "rule": { "type": "string" }
        }
      },
      "normalisation": {
        "enum": [
          "default", "numeric_default", "currency_default", "expression_default",
          "units_default", "text_default"
        ]
      },
      "caseSensitive": { "type": "boolean", "default": false },
      "commonErrorValues": {
        "type": "array",
        "items": {
          "type": "object",
          "required": ["key", "value"],
          "properties": { "key": { "type": "string" }, "value": { "type": "string" } }
        }
      },
      "parts": {
        "type": "object",
        "additionalProperties": { "$ref": "#" }
      }
    },
    "allOf": [
      {
        "if": {
          "properties": {
            "answerType": {
              "enum": ["numeric_tolerance", "numeric_sf", "numeric_dp", "currency", "with_units"]
            }
          }
        },
        "then": { "required": ["tolerance"] }
      },
      {
        "if": { "properties": { "answerType": { "enum": ["numeric_sf", "numeric_dp"] } } },
        "then": { "required": ["precision"] }
      },
      {
        "if": { "properties": { "answerType": { "const": "with_units" } } },
        "then": { "required": ["units"] }
      }
    ]
  }'::json;
$$;

comment on function public.fn_answer_spec_schema() is
  'Returns the canonical AnswerSpec JSON Schema (§11.2). Keep in sync with packages/content-schema.';

-- ── trg_validate_answer_spec ──────────────────────────────────────────────────

create or replace function public.trg_validate_answer_spec_fn()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not extensions.jsonb_matches_schema(public.fn_answer_spec_schema(), new.answer_spec) then
    raise exception 'answer_spec does not conform to schema'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger trg_validate_answer_spec
  before insert or update of answer_spec on public.question_versions
  for each row
  execute function public.trg_validate_answer_spec_fn();

-- ── trg_qv_immutable ──────────────────────────────────────────────────────────

create or replace function public.trg_qv_immutable_fn()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.published_at is not null then
    if (to_jsonb(new) - 'embedding' - 'validation_report')
       is distinct from (to_jsonb(old) - 'embedding' - 'validation_report') then
      raise exception 'published question versions are immutable'
        using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_qv_immutable
  before update on public.question_versions
  for each row
  execute function public.trg_qv_immutable_fn();

-- ── trg_qo_exactly_one_correct ──────────────────────────────────────────────

create or replace function public.trg_qo_exactly_one_correct_fn()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_type public.question_type;
  v_correct_count integer;
begin
  select q.question_type
  into v_type
  from public.question_versions qv
  join public.questions q on q.id = qv.question_id
  where qv.id = coalesce(new.question_version_id, old.question_version_id);

  if v_type = 'multiple_choice' then
    select count(*)::integer
    into v_correct_count
    from public.question_options
    where question_version_id = coalesce(new.question_version_id, old.question_version_id)
      and is_correct;

    if v_correct_count <> 1 then
      raise exception 'multiple_choice requires exactly one correct option'
        using errcode = '23514';
    end if;
  elsif v_type = 'multi_select' then
    select count(*)::integer
    into v_correct_count
    from public.question_options
    where question_version_id = coalesce(new.question_version_id, old.question_version_id)
      and is_correct;

    if v_correct_count < 1 then
      raise exception 'multi_select requires at least one correct option'
        using errcode = '23514';
    end if;
  end if;

  return coalesce(new, old);
end;
$$;

create constraint trigger trg_qo_exactly_one_correct
  after insert or update or delete on public.question_options
  deferrable initially deferred
  for each row
  execute function public.trg_qo_exactly_one_correct_fn();

-- ── trg_question_status_transition ────────────────────────────────────────────

create or replace function public.trg_question_status_transition_fn()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if not exists (
      select 1
      from (
        values
          ('draft', 'pending_validation'),
          ('pending_validation', 'validating'),
          ('validating', 'pending_review'),
          ('validating', 'rejected'),
          ('pending_review', 'changes_requested'),
          ('pending_review', 'approved'),
          ('pending_review', 'rejected'),
          ('changes_requested', 'pending_validation'),
          ('approved', 'published'),
          ('published', 'suspended'),
          ('published', 'retired'),
          ('suspended', 'published'),
          ('rejected', 'archived')
      ) as t(from_status, to_status)
      where t.from_status::public.content_status = old.status
        and t.to_status::public.content_status = new.status
    )
    and not (
      new.status = 'draft'
      and old.status in (
        'draft', 'pending_validation', 'validating', 'pending_review',
        'changes_requested', 'approved', 'rejected', 'suspended', 'published'
      )
    ) then
      raise exception 'invalid question status transition: % → %', old.status, new.status
        using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_question_status_transition
  before update of status on public.questions
  for each row
  execute function public.trg_question_status_transition_fn();

commit;
