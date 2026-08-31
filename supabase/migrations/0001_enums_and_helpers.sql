-- P03 · Enumerated types (§3.0) and shared helpers
-- Forward-only. Every enum value list is authoritative in TECHNICAL_BUILD_SPEC.md §3.0.

begin;

-- ── Enumerated types ─────────────────────────────────────────────────────────

create type public.app_role as enum (
  'student',
  'viewer',
  'reviewer',
  'curriculum_admin',
  'content_admin',
  'support',
  'super_admin'
);

create type public.syllabus_code as enum ('V2018', 'V2027');

create type public.question_type as enum (
  'multiple_choice',
  'multi_select',
  'true_false',
  'numeric',
  'expression',
  'structured'
);

create type public.answer_type as enum (
  'option_id',
  'option_set',
  'boolean',
  'numeric_exact',
  'numeric_tolerance',
  'numeric_sf',
  'numeric_dp',
  'fraction',
  'mixed_number',
  'ratio',
  'currency',
  'with_units',
  'expression',
  'coordinate',
  'set',
  'interval',
  'matrix',
  'vector',
  'text'
);

create type public.provenance_type as enum (
  'past_paper',
  'past_paper_adapted',
  'original_authored',
  'ai_variant',
  'ai_authored',
  'legacy_import'
);

create type public.rights_status as enum (
  'edmar_owned',
  'licensed',
  'public_domain',
  'third_party_unlicensed',
  'unknown'
);

create type public.content_status as enum (
  'draft',
  'pending_validation',
  'validating',
  'pending_review',
  'changes_requested',
  'approved',
  'published',
  'suspended',
  'retired',
  'rejected',
  'archived'
);

create type public.review_decision as enum (
  'approved',
  'changes_requested',
  'rejected',
  'suspended',
  'escalated'
);

create type public.profile_dimension as enum ('CK', 'AK', 'R');

create type public.paper_code as enum ('01', '02', '031', '032');

create type public.sitting_month as enum ('january', 'may_june');

create type public.practice_mode as enum (
  'topic',
  'recommended',
  'weak_areas',
  'diagnostic',
  'bookmarks',
  'incorrect',
  'misconceptions'
);

create type public.session_status as enum (
  'in_progress',
  'completed',
  'abandoned',
  'expired'
);

create type public.exam_mode as enum ('practice', 'timed');

-- Rev 2 additions
create type public.assessment_context as enum (
  'topic_practice',
  'recommended',
  'diagnostic',
  'simulation_practice',
  'simulation_timed',
  'quick_check'
);

create type public.simulation_form as enum (
  'p01_regular',
  'p02_regular',
  'p01_modular_1',
  'p02_modular_1',
  'p01_modular_2',
  'p02_modular_2',
  'p032'
);

create type public.mastery_band as enum (
  'not_started',
  'getting_started',
  'needs_work',
  'developing',
  'competent',
  'strong',
  'mastered'
);

create type public.confidence_level as enum ('none', 'low', 'moderate', 'high');

create type public.projection_state as enum ('withheld', 'issued');

create type public.withheld_reason as enum (
  'insufficient_attempts',
  'insufficient_coverage',
  'no_simulation',
  'stale_evidence',
  'not_entitled'
);

create type public.accuracy_rule as enum (
  'exact',
  'tolerance',
  'significant_figures',
  'decimal_places',
  'equivalent_form',
  'symbolic'
);

create type public.verification_status as enum (
  'unverified',
  'machine_verified',
  'verified',
  'disputed'
);

create type public.entitlement_tier as enum ('free', 'premium');

create type public.entitlement_source as enum (
  'default',
  'web_stripe',
  'google_play',
  'apple',
  'promo',
  'school',
  'manual'
);

create type public.entitlement_status as enum (
  'active',
  'grace',
  'on_hold',
  'expired',
  'cancelled',
  'refunded'
);

create type public.job_status as enum (
  'queued',
  'running',
  'succeeded',
  'failed',
  'cancelled'
);

create type public.asset_role as enum (
  'question_figure',
  'solution_figure',
  'option_figure'
);

-- ── Shared helpers ──────────────────────────────────────────────────────────

create or replace function public.trg_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

comment on function public.trg_set_updated_at() is
  'BEFORE UPDATE trigger function: sets updated_at to UTC now(). Attach as trg_set_updated_at on tables with updated_at.';

commit;
