-- ADR-023 · Configurable mastery-cycle, inventory health, and AI cost-control seeds
-- Seeds only — selection/mastery algorithms unchanged in this migration.

begin;

insert into public.app_config (key, value, description)
values
  (
    'mastery_cycle_enabled',
    'true'::jsonb,
    'When true, topic practice may evaluate a mastery assessment cycle (ADR-023)'
  ),
  (
    'mastery_question_target',
    '20'::jsonb,
    'Default questions per topic mastery assessment cycle'
  ),
  (
    'mastery_accuracy_threshold',
    '0.90'::jsonb,
    'Minimum overall accuracy for cycle mastery (also requires coverage gates)'
  ),
  (
    'remediation_band_near_min',
    '15'::jsonb,
    'Inclusive lower bound (correct count) for near-miss remediation band'
  ),
  (
    'remediation_band_near_max',
    '17'::jsonb,
    'Inclusive upper bound for near-miss remediation; yields remediation_near_count questions'
  ),
  (
    'remediation_near_count',
    '5'::jsonb,
    'Targeted remediation questions when near-miss band applies'
  ),
  (
    'remediation_band_mid_min',
    '10'::jsonb,
    'Inclusive lower bound for mid remediation band'
  ),
  (
    'remediation_band_mid_max',
    '14'::jsonb,
    'Inclusive upper bound for mid remediation band'
  ),
  (
    'remediation_mid_count',
    '10'::jsonb,
    'Targeted remediation questions when mid band applies'
  ),
  (
    'remediation_band_low_max',
    '9'::jsonb,
    'Inclusive upper bound for low band (0..N); triggers prerequisite-oriented remediation'
  ),
  (
    'remediation_low_count',
    '10'::jsonb,
    'Targeted questions after prerequisite review when low band applies'
  ),
  (
    'cooldown_recent_ids',
    '40'::jsonb,
    'Prefer avoiding this many most-recent question IDs per student (ADR-023; time cooldown remains)'
  ),
  (
    'inventory_min_approved_per_topic',
    '40'::jsonb,
    'Minimum approved/published questions per topic for HEALTHY inventory floor'
  ),
  (
    'inventory_preferred_per_topic',
    '60'::jsonb,
    'Preferred approved inventory per topic (mature target starts here; 100+ where content permits)'
  ),
  (
    'inventory_reserve_warn',
    '15'::jsonb,
    'Warn when suitable alternatives for a student fall below this after cooldown rules'
  ),
  (
    'content_generation_policy',
    '"template_first_ai_when_necessary"'::jsonb,
    'Offline replenishment order: templates first, AI only when necessary; never student-sync AI'
  )
on conflict (key) do nothing;

commit;
