/**
 * Analytics event catalogue (§24.2).
 * Names are snake_case, past tense. An event not in this union cannot be emitted.
 * No event may carry a projected band, readiness index, or reported grade.
 */

export type AnalyticsEventName =
  | "app_opened"
  | "onboarding_started"
  | "onboarding_sitting_selected"
  | "onboarding_completed"
  | "account_created"
  | "topic_opened"
  | "practice_started"
  | "question_started"
  | "answer_submitted"
  | "answer_correct"
  | "answer_incorrect"
  | "question_skipped"
  | "solution_viewed"
  | "explanation_viewed"
  | "response_block_opened"
  | "quick_check_attempted"
  | "note_saved"
  | "diagnostic_started"
  | "diagnostic_abandoned"
  | "diagnostic_completed"
  | "coverage_map_viewed"
  | "simulation_started"
  | "simulation_abandoned"
  | "simulation_completed"
  | "simulation_review_opened"
  | "readiness_viewed"
  | "readiness_withheld_shown"
  | "projection_shown"
  | "projection_withheld_shown"
  | "readiness_explainer_viewed"
  | "weak_area_practice_started"
  | "outcome_reported"
  | "install_prompt_shown"
  | "practice_completed"
  | "practice_abandoned"
  | "recommendation_shown"
  | "recommendation_accepted"
  | "progress_viewed"
  | "paper_started"
  | "paper_completed"
  | "paywall_shown"
  | "upgrade_tapped"
  | "subscription_started"
  | "subscription_renewed"
  | "subscription_cancelled"
  | "question_reported"
  | "bookmark_toggled"
  | "offline_session_completed"
  | "sync_failed"
  | "answer_validation_discrepancy"
  | "math_render_fallback"
  | "app_error";

export type AnalyticsEvent =
  | { name: "app_opened"; props: { cold: boolean; app_version: string } }
  | { name: "onboarding_started"; props: Record<string, never> }
  | { name: "onboarding_sitting_selected"; props: { year: number; month: string } }
  | {
      name: "onboarding_completed";
      props: { skipped_interests: boolean; seconds: number };
    }
  | {
      name: "account_created";
      props: { method: "email" | "google"; from_anonymous: boolean };
    }
  | { name: "topic_opened"; props: { topic_id: string } }
  | {
      name: "practice_started";
      props: {
        session_id: string;
        mode: string;
        scope_kind: string;
        count: number;
        difficulty_mode: string;
      };
    }
  | {
      name: "question_started";
      props: {
        session_id: string;
        question_id: string;
        position: number;
        difficulty_band: number;
      };
    }
  | {
      name: "answer_submitted";
      props: {
        session_id: string;
        question_id: string;
        answer_type: string;
        duration_ms: number;
      };
    }
  | {
      name: "answer_correct";
      props: { question_id: string; difficulty_band: number; attempt_no: number };
    }
  | {
      name: "answer_incorrect";
      props: {
        question_id: string;
        difficulty_band: number;
        matched_common_error: boolean;
      };
    }
  | { name: "question_skipped"; props: { question_id: string; position: number } }
  | {
      name: "solution_viewed";
      props: {
        question_id: string;
        steps_revealed: number;
        revealed_all: boolean;
      };
    }
  | { name: "explanation_viewed"; props: { question_id: string } }
  | {
      name: "response_block_opened";
      props: { question_id: string; block_no: number };
    }
  | {
      name: "quick_check_attempted";
      props: { question_id: string; correct: boolean };
    }
  | { name: "note_saved"; props: { question_id: string; length: number } }
  | { name: "diagnostic_started"; props: { diagnostic_id: string } }
  | {
      name: "diagnostic_abandoned";
      props: {
        diagnostic_id: string;
        items_answered: number;
        target_items: number;
      };
    }
  | {
      name: "diagnostic_completed";
      props: {
        diagnostic_id: string;
        items_answered: number;
        topics_covered: number;
        duration_s: number;
      };
    }
  | { name: "coverage_map_viewed"; props: { diagnostic_id: string } }
  | {
      name: "simulation_started";
      props: {
        exam_session_id: string;
        form: string;
        blueprint_ok: boolean;
        mode: string;
      };
    }
  | {
      name: "simulation_abandoned";
      props: {
        exam_session_id: string;
        answered: number;
        total: number;
        seconds_remaining: number;
      };
    }
  | {
      name: "simulation_completed";
      props: {
        exam_session_id: string;
        form: string;
        marks: number;
        max_marks: number;
        late_by_s: number;
      };
    }
  | {
      name: "simulation_review_opened";
      props: { exam_session_id: string; filter: string };
    }
  | {
      name: "readiness_viewed";
      props: {
        has_index: boolean;
        confidence: number;
        withheld_reason: string | null;
      };
    }
  | { name: "readiness_withheld_shown"; props: { withheld_reason: string } }
  | {
      name: "projection_shown";
      props: {
        confidence: number;
        band_width: number;
        weeks_to_sitting: number;
      };
    }
  | { name: "projection_withheld_shown"; props: { withheld_reason: string } }
  | { name: "readiness_explainer_viewed"; props: { from_surface: string } }
  | {
      name: "weak_area_practice_started";
      props: { objective_id: string; marks_at_stake: number };
    }
  | { name: "outcome_reported"; props: { consent_version: string } }
  | { name: "install_prompt_shown"; props: { accepted: boolean } }
  | {
      name: "practice_completed";
      props: {
        session_id: string;
        correct: number;
        total: number;
        duration_s: number;
      };
    }
  | {
      name: "practice_abandoned";
      props: { session_id: string; answered: number; total: number };
    }
  | {
      name: "recommendation_shown";
      props: { scope_id: string; reason_kind: string };
    }
  | { name: "recommendation_accepted"; props: { scope_id: string } }
  | { name: "progress_viewed"; props: { tab: string } }
  | { name: "paper_started"; props: { paper_id: string; mode: string } }
  | {
      name: "paper_completed";
      props: {
        paper_id: string;
        answer_marks: number;
        max_marks: number;
        duration_s: number;
      };
    }
  | {
      name: "paywall_shown";
      props: {
        context: "limit_reached" | "timed_mode" | "premium_topic" | "settings";
      };
    }
  | { name: "upgrade_tapped"; props: { context: string; product_id: string } }
  | {
      name: "subscription_started";
      props: { product_id: string; source: string };
    }
  | { name: "subscription_renewed"; props: { product_id: string } }
  | {
      name: "subscription_cancelled";
      props: { product_id: string; days_active: number };
    }
  | {
      name: "question_reported";
      props: { question_id: string; reason_code: string };
    }
  | { name: "bookmark_toggled"; props: { question_id: string; on: boolean } }
  | {
      name: "offline_session_completed";
      props: { queued_attempts: number };
    }
  | { name: "sync_failed"; props: { reason: string; pending_count: number } }
  | {
      name: "answer_validation_discrepancy";
      props: {
        question_id: string;
        client_result: boolean;
        server_result: boolean;
      };
    }
  | {
      name: "math_render_fallback";
      props: { question_id: string; render_hash: string };
    }
  | { name: "app_error"; props: { code: string; screen: string } };

/** Ingest payload shape for fn_ingest_events. */
export interface AnalyticsEventRecord {
  name: AnalyticsEventName;
  props: Record<string, unknown>;
  clientTs: string;
  sessionId?: string;
}
