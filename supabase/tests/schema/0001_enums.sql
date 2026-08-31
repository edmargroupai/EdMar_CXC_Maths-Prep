-- P03 acceptance: every enum from §3.0 exists with its exact value list,
-- and the shared updated_at trigger function is present.

begin;

select plan(28);

select enum_has_labels(
  'public',
  'app_role',
  array[
    'student',
    'viewer',
    'reviewer',
    'curriculum_admin',
    'content_admin',
    'support',
    'super_admin'
  ],
  'app_role'
);

select enum_has_labels('public', 'syllabus_code', array['V2018', 'V2027'], 'syllabus_code');

select enum_has_labels(
  'public',
  'question_type',
  array[
    'multiple_choice',
    'multi_select',
    'true_false',
    'numeric',
    'expression',
    'structured'
  ],
  'question_type'
);

select enum_has_labels(
  'public',
  'answer_type',
  array[
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
  ],
  'answer_type'
);

select enum_has_labels(
  'public',
  'provenance_type',
  array[
    'past_paper',
    'past_paper_adapted',
    'original_authored',
    'ai_variant',
    'ai_authored',
    'legacy_import'
  ],
  'provenance_type'
);

select enum_has_labels(
  'public',
  'rights_status',
  array[
    'edmar_owned',
    'licensed',
    'public_domain',
    'third_party_unlicensed',
    'unknown'
  ],
  'rights_status'
);

select enum_has_labels(
  'public',
  'content_status',
  array[
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
  ],
  'content_status'
);

select enum_has_labels(
  'public',
  'review_decision',
  array[
    'approved',
    'changes_requested',
    'rejected',
    'suspended',
    'escalated'
  ],
  'review_decision'
);

select enum_has_labels('public', 'profile_dimension', array['CK', 'AK', 'R'], 'profile_dimension');

select enum_has_labels('public', 'paper_code', array['01', '02', '031', '032'], 'paper_code');

select enum_has_labels('public', 'sitting_month', array['january', 'may_june'], 'sitting_month');

select enum_has_labels(
  'public',
  'practice_mode',
  array[
    'topic',
    'recommended',
    'weak_areas',
    'diagnostic',
    'bookmarks',
    'incorrect',
    'misconceptions'
  ],
  'practice_mode'
);

select enum_has_labels(
  'public',
  'session_status',
  array['in_progress', 'completed', 'abandoned', 'expired'],
  'session_status'
);

select enum_has_labels('public', 'exam_mode', array['practice', 'timed'], 'exam_mode');

select enum_has_labels(
  'public',
  'assessment_context',
  array[
    'topic_practice',
    'recommended',
    'diagnostic',
    'simulation_practice',
    'simulation_timed',
    'quick_check'
  ],
  'assessment_context'
);

select enum_has_labels(
  'public',
  'simulation_form',
  array[
    'p01_regular',
    'p02_regular',
    'p01_modular_1',
    'p02_modular_1',
    'p01_modular_2',
    'p02_modular_2',
    'p032'
  ],
  'simulation_form'
);

select enum_has_labels(
  'public',
  'mastery_band',
  array[
    'not_started',
    'getting_started',
    'needs_work',
    'developing',
    'competent',
    'strong',
    'mastered'
  ],
  'mastery_band'
);

select enum_has_labels(
  'public',
  'confidence_level',
  array['none', 'low', 'moderate', 'high'],
  'confidence_level'
);

select enum_has_labels(
  'public',
  'projection_state',
  array['withheld', 'issued'],
  'projection_state'
);

select enum_has_labels(
  'public',
  'withheld_reason',
  array[
    'insufficient_attempts',
    'insufficient_coverage',
    'no_simulation',
    'stale_evidence',
    'not_entitled'
  ],
  'withheld_reason'
);

select enum_has_labels(
  'public',
  'accuracy_rule',
  array[
    'exact',
    'tolerance',
    'significant_figures',
    'decimal_places',
    'equivalent_form',
    'symbolic'
  ],
  'accuracy_rule'
);

select enum_has_labels(
  'public',
  'verification_status',
  array['unverified', 'machine_verified', 'verified', 'disputed'],
  'verification_status'
);

select enum_has_labels('public', 'entitlement_tier', array['free', 'premium'], 'entitlement_tier');

select enum_has_labels(
  'public',
  'entitlement_source',
  array[
    'default',
    'web_stripe',
    'google_play',
    'apple',
    'promo',
    'school',
    'manual'
  ],
  'entitlement_source'
);

select enum_has_labels(
  'public',
  'entitlement_status',
  array[
    'active',
    'grace',
    'on_hold',
    'expired',
    'cancelled',
    'refunded'
  ],
  'entitlement_status'
);

select enum_has_labels(
  'public',
  'job_status',
  array['queued', 'running', 'succeeded', 'failed', 'cancelled'],
  'job_status'
);

select enum_has_labels(
  'public',
  'asset_role',
  array['question_figure', 'solution_figure', 'option_figure'],
  'asset_role'
);

select has_function('public', 'trg_set_updated_at', '{}', 'trg_set_updated_at helper exists');

select * from finish();

rollback;
