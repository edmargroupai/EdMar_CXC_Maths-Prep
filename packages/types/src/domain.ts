// ── Identity ────────────────────────────────────────────────────────────────
export type AppRole =
  | "student"
  | "viewer"
  | "reviewer"
  | "curriculum_admin"
  | "content_admin"
  | "support"
  | "super_admin";
export type SyllabusCode = "V2018" | "V2027";
export type SittingMonth = "january" | "may_june";

export interface Profile {
  id: string;
  displayName: string | null;
  email: string;
  role: AppRole;
  territory: string;
  syllabusVersion: SyllabusCode;
  examSittingYear: number | null;
  examSittingMonth: SittingMonth | null;
  ageConfirmed13Plus: boolean;
  onboardingCompletedAt: string | null;
  locale: string;
  themePreference: "system" | "light" | "dark";
  notificationsOptIn: boolean;
  createdAt: string;
}

// ── Curriculum ──────────────────────────────────────────────────────────────
export interface Module {
  id: string;
  syllabusCode: SyllabusCode;
  moduleNo: 1 | 2 | 3;
  name: string;
  paper01Items: number;
  paper02Marks: number;
}
export interface Topic {
  id: string;
  syllabusCode: SyllabusCode;
  moduleId: string | null;
  topicNo: number;
  code: string;
  name: string;
  sequence: number;
  paper01Items: number | null;
  isActive: boolean;
}
export interface Subtopic {
  id: string;
  topicId: string;
  code: string;
  name: string;
  sequence: number;
  isEdmarConstruct: true;
}
export interface SpecificObjective {
  id: string;
  syllabusCode: SyllabusCode;
  topicId: string;
  subtopicId: string | null;
  code: string;
  objectiveNo: number;
  statement: string;
  contentNotes: string | null;
}
export interface Skill {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

// ── Content ─────────────────────────────────────────────────────────────────
export type QuestionType =
  | "multiple_choice"
  | "multi_select"
  | "true_false"
  | "numeric"
  | "expression"
  | "structured";
export type AnswerType =
  | "option_id"
  | "option_set"
  | "boolean"
  | "numeric_exact"
  | "numeric_tolerance"
  | "numeric_sf"
  | "numeric_dp"
  | "fraction"
  | "mixed_number"
  | "ratio"
  | "currency"
  | "with_units"
  | "expression"
  | "coordinate"
  | "set"
  | "interval"
  | "matrix"
  | "vector"
  | "text";
export type ContentStatus =
  | "draft"
  | "pending_validation"
  | "validating"
  | "pending_review"
  | "changes_requested"
  | "approved"
  | "published"
  | "suspended"
  | "retired"
  | "rejected"
  | "archived";
export type ProfileDimension = "CK" | "AK" | "R";
export type DifficultyBand = 1 | 2 | 3 | 4 | 5;

export type Block =
  | { type: "text"; value: string }
  | { type: "math"; latex: string; style: "inline" | "display"; renderHash: string; alt?: string }
  | {
      type: "mixed";
      runs: Array<
        { type: "text"; value: string } | { type: "math"; latex: string; renderHash: string }
      >;
    }
  | { type: "asset"; storagePath: string; altText: string }
  | { type: "table"; header?: string[]; rows: string[][]; caption?: string }
  | { type: "list"; ordered?: boolean; items: Block[][] };

export interface AnswerSpec {
  answerType: AnswerType;
  canonicalValue: string | string[];
  displayValue: string;
  acceptedForms: string[];
  tolerance?: {
    kind: "absolute" | "relative" | "range" | "none";
    value?: number;
    min?: number;
    max?: number;
  };
  precision?: {
    kind: "significant_figures" | "decimal_places" | "none";
    value: number;
    required: boolean;
  };
  units?: {
    requirement: "none" | "optional" | "required" | "convertible";
    canonical: string | null;
    acceptedSet: string[];
  };
  form?: {
    lowestTerms?: boolean;
    simplifiedSurd?: boolean;
    simplestRatio?: boolean;
    specifiedForm?: string | null;
  };
  followThrough?: { dependsOn: string; rule: string };
  normalisation:
    | "default"
    | "numeric_default"
    | "currency_default"
    | "expression_default"
    | "units_default"
    | "text_default";
  caseSensitive?: boolean;
  commonErrorValues?: Array<{ key: string; value: string }>;
  parts?: Record<string, AnswerSpec>;
}

export interface QuestionOption {
  optionKey: "A" | "B" | "C" | "D" | "E";
  contentBlocks: Block[];
  isCorrect?: boolean;
  commonErrorKey?: string;
}
export interface SolutionStep {
  partKey?: string;
  stepNo: number;
  instruction: string;
  contentBlocks: Block[];
  resultBlocks?: Block[];
  marks?: number;
  note?: string;
}
export interface CommonError {
  key: string;
  partKey?: string;
  wrongValue?: string;
  wrongOptionKey?: string;
  misconception: string;
  correctiveNote: string;
  skillCode?: string;
}
export interface QuestionAsset {
  role: "question_figure" | "solution_figure" | "option_figure";
  storagePath: string;
  mimeType: string;
  widthPx?: number;
  heightPx?: number;
  altText: string;
  requiresColour?: boolean;
}
export interface MathRender {
  svg: string;
  widthEx: number;
  heightEx: number;
  depthEx: number;
}

/** Pre-answer payload from fn_build_question_payload / question_payloads (§40.4). */
export interface QuestionPayloadBody {
  questionType: QuestionType;
  difficultyBand: DifficultyBand;
  calculatorAllowed: boolean;
  marks: number | null;
  estimatedSeconds: number | null;
  stemBlocks: Block[];
  options: QuestionOption[] | null;
  answerSpec: AnswerSpec;
  assets: QuestionAsset[];
  mathRenders: Record<string, MathRender>;
  topicName: string;
  objectiveCodes: string[];
}

export interface ConceptRequired {
  objectiveId: string;
  code: string;
  label: string;
}

export interface QuickCheck {
  promptBlocks: Block[];
  answerSpec: AnswerSpec;
  assetId?: string | null;
  solutionNote?: string;
}

export interface AnswerValidationMeta {
  marks: number | null;
  cognitiveLevel: ProfileDimension;
  methodClass: string | null;
  accuracyRule: string;
  verification: string;
  ambiguityNote: string | null;
  objectiveCodes: string[];
}

/** Blocks 2–10 from fn_reveal_response (§40.4). */
export interface ResponseBlocks {
  conceptsRequired: ConceptRequired[];
  strategyBlocks: Block[];
  solutionSteps: SolutionStep[];
  finalAnswerBlocks: Block[];
  whyThisWorks: Block[];
  explanation: string | null;
  commonErrors: CommonError[];
  examTip: Block[];
  quickCheck: QuickCheck | null;
  answerValidation: AnswerValidationMeta;
  mathRenders: Record<string, MathRender>;
}

/** What the student app actually receives from GET /rest/v1/question_payloads. */
export interface QuestionPayload {
  questionId: string;
  questionVersionId: string;
  contentVersion: number;
  payload: QuestionPayloadBody;
}

/** The full authoring object — admin and pipeline only, never sent to students. */
export interface Question {
  id: string;
  legacyId: string | null;
  questionType: QuestionType;
  provenance:
    | "past_paper"
    | "past_paper_adapted"
    | "original_authored"
    | "ai_variant"
    | "ai_authored"
    | "legacy_import";
  rightsStatus: "edmar_owned" | "licensed" | "public_domain" | "third_party_unlicensed" | "unknown";
  status: ContentStatus;
  currentVersionId: string | null;
  variantFamilyId: string | null;
  sourceQuestionId: string | null;
  calculatorAllowed: boolean;
  difficultyBand: DifficultyBand;
  profileDimension: ProfileDimension | null;
  isFree: boolean;
  retiredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Practice ────────────────────────────────────────────────────────────────
export type PracticeMode =
  | "topic"
  | "recommended"
  | "weak_areas"
  | "diagnostic"
  | "bookmarks"
  | "incorrect";
export type DifficultyMode = "mixed" | "building" | "challenge";
export type SessionStatus = "in_progress" | "completed" | "abandoned" | "expired";

export interface PracticeSession {
  id: string;
  studentId: string;
  mode: PracticeMode;
  scopeKind: string;
  scopeIds: string[];
  difficultyMode: DifficultyMode;
  requestedCount: number;
  deliveredCount: number;
  status: SessionStatus;
  correctCount: number;
  answeredCount: number;
  startedAt: string;
  completedAt: string | null;
}

export interface PracticeSessionItem {
  position: number;
  questionId: string;
  questionVersionId: string;
  optionOrder: Array<"A" | "B" | "C" | "D" | "E"> | null;
  answered: boolean;
}

export interface Attempt {
  id: number;
  clientAttemptId: string;
  studentId: string;
  questionId: string;
  questionVersionId: string;
  sessionId: string | null;
  examSessionId: string | null;
  context: PracticeMode | null;
  partKey: string | null;
  rawAnswer: string | null;
  normalisedAnswer: string | null;
  isCorrect: boolean;
  matchedCommonErrorId: string | null;
  wasSkipped: boolean;
  solutionViewed: boolean;
  difficultyBand: DifficultyBand;
  durationMs: number | null;
  createdAt: string;
}

export interface ExamSession {
  id: string;
  studentId: string;
  paperId: string;
  mode: "practice" | "timed";
  durationMinutes: number;
  serverStartedAt: string;
  expiresAt: string;
  submittedAt: string | null;
  status: SessionStatus;
  answerMarks: number | null;
  maxAnswerMarks: number | null;
}

// ── Progress ────────────────────────────────────────────────────────────────
export type MasteryBandLabel =
  | "not_started"
  | "getting_started"
  | "needs_work"
  | "developing"
  | "competent"
  | "strong"
  | "mastered";

export interface SkillMastery {
  skillId: string;
  skillName: string;
  score: number | null;
  confidence: number;
  coverageCap: number;
  attemptsCount: number;
  distinctQuestions: number;
  correctCount: number;
  bandsSeen: DifficultyBand[];
  lastAttemptAt: string | null;
  band: MasteryBandLabel;
}

export interface TopicMastery {
  topicId: string;
  topicName: string;
  score: number | null;
  confidence: number;
  attemptsCount: number;
  skillsStarted: number;
  skillsTotal: number;
  band: MasteryBandLabel;
}

export interface Recommendation {
  scopeKind: "skill" | "subtopic" | "topic";
  scopeId: string;
  label: string;
  reason: string;
  mastery: number | null;
  availableQuestions: number;
}

// ── Commerce ────────────────────────────────────────────────────────────────
export type EntitlementTier = "free" | "premium";
export type EntitlementSource = "default" | "google_play" | "apple" | "promo" | "school" | "manual";
export type EntitlementStatus =
  | "active"
  | "grace"
  | "on_hold"
  | "expired"
  | "cancelled"
  | "refunded";

export interface Entitlement {
  tier: EntitlementTier;
  source: EntitlementSource;
  status: EntitlementStatus;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  graceUntil: string | null;
  autoRenewing: boolean;
  platformProductId: string | null;
}

/** Everything the UI needs to decide what to show. Nothing else may compute this. */
export interface EntitlementView {
  tier: EntitlementTier;
  isPremium: boolean;
  status: EntitlementStatus;
  daysRemaining: number | null;
  allowanceRemaining: number | null;
  dailyLimit: number | null;
  resetsAt: string | null;
}

// ── Validation ──────────────────────────────────────────────────────────────
export interface ValidationResult {
  isCorrect: boolean;
  normalised: string;
  matchedForm?: string;
  matchedCommonErrorKey?: string;
  reason?:
    | "exact"
    | "tolerance"
    | "equivalent_form"
    | "wrong_precision"
    | "wrong_units"
    | "not_simplified"
    | "unparseable"
    | "incorrect";
}

// ── Errors ──────────────────────────────────────────────────────────────────
export type ApiErrorCode =
  | "validation_failed"
  | "invalid_scope"
  | "invalid_answer_format"
  | "not_authenticated"
  | "token_expired"
  | "not_authorised"
  | "entitlement_required"
  | "entitlement_exhausted"
  | "not_found"
  | "session_already_completed"
  | "exam_already_submitted"
  | "no_questions_available"
  | "scope_empty"
  | "purchase_not_valid"
  | "rate_limited"
  | "internal_error";

export interface ApiError {
  error: { code: ApiErrorCode; message: string; details?: Record<string, unknown> };
}
