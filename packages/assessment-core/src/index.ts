/** Labels, gate constants and user-facing strings only — no readiness arithmetic (I-6, §42.5). */

export type WithheldReason =
  | "insufficient_attempts"
  | "insufficient_coverage"
  | "no_simulation"
  | "stale_evidence"
  | "not_entitled"
  | "withdrawn";

export type ConfidenceLevel = "none" | "low" | "moderate" | "high";

export const WITHHELD_LABELS: Record<WithheldReason, string> = {
  insufficient_attempts: "Not enough practice evidence yet.",
  insufficient_coverage: "More syllabus coverage is needed before we can issue a reading.",
  no_simulation: "Complete at least one timed, exam-standard simulation to unlock a grade band.",
  stale_evidence: "Your recent practice is too old — refresh a few topics to update this reading.",
  not_entitled: "Grade projections are available on Premium.",
  withdrawn: "Projections are temporarily unavailable while we review the model.",
};

export const CONFIDENCE_LABELS: Record<Exclude<ConfidenceLevel, "none">, string> = {
  low: "Low confidence",
  moderate: "Moderate confidence",
  high: "High confidence",
};

export function formatGradeBand(bandLow: number, bandHigh: number): string {
  if (bandLow === bandHigh) {
    return `Grade ${bandLow}`;
  }
  return `Grades ${bandLow}–${bandHigh}`;
}

export const PROJECTION_DISCLOSURE =
  "This is a projection from your EdMar practice and simulation evidence. It is not a CXC result or a guarantee.";

export const READINESS_DISCLOSURE =
  "Your readiness index measures preparedness on EdMar's scale from practice and simulation evidence — not your exam mark.";

export function withheldMessage(reason: WithheldReason | null | undefined): string {
  if (!reason) {
    return "Your readiness reading is not available yet.";
  }
  return WITHHELD_LABELS[reason] ?? WITHHELD_LABELS.insufficient_coverage;
}
