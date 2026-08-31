-- P04 · Curriculum schema (§3.3)
-- Taxonomy tables: subjects through objective_mappings.
-- V2027 seed data is applied via supabase/seed/*.sql generated from
-- content/taxonomy/csec_2027_taxonomy_seed.json (scripts/gen-taxonomy-seed.js).

begin;

-- ── subjects ─────────────────────────────────────────────────────────────────

create table public.subjects (
  code text primary key,
  name text not null,
  is_active boolean not null default true,
  sequence smallint not null default 0
);

-- ── syllabus_versions ──────────────────────────────────────────────────────

create table public.syllabus_versions (
  code public.syllabus_code primary key,
  subject_code text not null references public.subjects (code),
  official_code text,
  effective_from_year smallint not null,
  effective_from_month public.sitting_month not null,
  has_modules boolean not null default false,
  is_default boolean not null default false,
  source_document text
);

create unique index uq_syllabus_default
  on public.syllabus_versions ((true))
  where is_default;

-- ── modules (V2027) ────────────────────────────────────────────────────────

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  syllabus_code public.syllabus_code not null references public.syllabus_versions (code),
  module_no smallint not null check (module_no between 1 and 3),
  name text not null,
  paper01_items smallint not null default 20,
  paper02_marks smallint not null default 30,
  weighted_marks smallint not null default 100,
  duration_hours smallint not null default 65,
  unique (syllabus_code, module_no)
);

-- ── topics ─────────────────────────────────────────────────────────────────

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  syllabus_code public.syllabus_code not null references public.syllabus_versions (code),
  module_id uuid references public.modules (id),
  topic_no smallint not null,
  code text not null,
  name text not null,
  sequence smallint not null,
  paper01_items smallint,
  paper02_marks_group text,
  paper02_marks smallint,
  is_active boolean not null default true,
  unique (syllabus_code, code),
  unique (syllabus_code, module_id, topic_no)
);

create index idx_topics_syllabus on public.topics (syllabus_code, sequence);

-- ── subtopics (EdMar construct) ────────────────────────────────────────────

create table public.subtopics (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics (id) on delete restrict,
  code text not null,
  name text not null,
  sequence smallint not null default 0,
  is_edmar_construct boolean not null default true check (is_edmar_construct),
  is_active boolean not null default true,
  unique (topic_id, code)
);

-- ── specific_objectives ────────────────────────────────────────────────────

create table public.specific_objectives (
  id uuid primary key default gen_random_uuid(),
  syllabus_code public.syllabus_code not null references public.syllabus_versions (code),
  topic_id uuid not null references public.topics (id) on delete restrict,
  subtopic_id uuid references public.subtopics (id) on delete set null,
  code text not null,
  objective_no smallint not null,
  statement text not null,
  content_notes text,
  needs_human_review boolean not null default false,
  sequence smallint not null default 0,
  is_active boolean not null default true,
  unique (syllabus_code, code)
);

create index idx_so_topic on public.specific_objectives (topic_id, sequence);
create index idx_so_review on public.specific_objectives (needs_human_review)
  where needs_human_review;

-- ── skills ───────────────────────────────────────────────────────────────────

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_skills_active on public.skills (is_active) where is_active;

create trigger trg_skills_updated_at
  before update on public.skills
  for each row
  execute function public.trg_set_updated_at();

-- ── skill_prerequisites ────────────────────────────────────────────────────

create table public.skill_prerequisites (
  skill_id uuid not null references public.skills (id) on delete cascade,
  prerequisite_skill_id uuid not null references public.skills (id) on delete cascade,
  primary key (skill_id, prerequisite_skill_id),
  check (skill_id <> prerequisite_skill_id)
);

create or replace function public.trg_skill_prereq_acyclic_fn()
returns trigger
language plpgsql
as $$
declare
  v_cycle boolean;
begin
  with recursive walk as (
    select sp.prerequisite_skill_id as skill_id
    from public.skill_prerequisites sp
    where sp.skill_id = new.prerequisite_skill_id
    union
    select sp.prerequisite_skill_id
    from public.skill_prerequisites sp
    join walk w on sp.skill_id = w.skill_id
  )
  select exists (
    select 1 from walk where skill_id = new.skill_id
  )
  into v_cycle;

  if v_cycle then
    raise exception 'skill prerequisite cycle detected'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger trg_skill_prereq_acyclic
  before insert or update on public.skill_prerequisites
  for each row
  execute function public.trg_skill_prereq_acyclic_fn();

-- ── skill_objectives ───────────────────────────────────────────────────────

create table public.skill_objectives (
  skill_id uuid not null references public.skills (id) on delete cascade,
  specific_objective_id uuid not null references public.specific_objectives (id) on delete cascade,
  primary key (skill_id, specific_objective_id)
);

create index idx_skill_objectives_objective on public.skill_objectives (specific_objective_id);

-- ── objective_mappings (V2018 ↔ V2027 bridge) ──────────────────────────────

create table public.objective_mappings (
  from_objective_id uuid not null references public.specific_objectives (id),
  to_objective_id uuid not null references public.specific_objectives (id),
  relationship text not null check (
    relationship in ('identical', 'partial', 'moved', 'split', 'merged')
  ),
  note text,
  primary key (from_objective_id, to_objective_id)
);

commit;
