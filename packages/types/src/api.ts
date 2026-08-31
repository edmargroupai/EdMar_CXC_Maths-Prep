import type {
  AnswerType,
  ApiError,
  DifficultyMode,
  PracticeMode,
  PracticeSessionItem,
} from "./domain.js";

// ── fn_create_practice_session (§34.1) ──────────────────────────────────────

export interface CreatePracticeSessionRequest {
  pMode: PracticeMode;
  pScopeKind: string;
  pScopeIds: string[];
  pCount: number;
  pDifficultyMode: DifficultyMode;
  pClientSeed: string | null;
}

export interface CreatePracticeSessionResponse {
  sessionId: string;
  deliveredCount: number;
  requestedCount: number;
  allowanceRemaining: number;
  starved: boolean;
  items: PracticeSessionItem[];
}

export type CreatePracticeSessionResult = CreatePracticeSessionResponse | ApiError;

// ── fn_record_attempt (§34.2) ─────────────────────────────────────────────

export interface RecordAttemptRequest {
  pClientAttemptId: string;
  pQuestionVersionId: string;
  pSessionId: string;
  pPartKey: string | null;
  pRawAnswer: string;
  pWasSkipped: boolean;
  pClientIsCorrect: boolean;
  pDurationMs: number;
  pClientCreatedAt: string;
}

export interface RecordAttemptResponse {
  attemptId: number;
  isCorrect: boolean;
  matchedCommonErrorId: string | null;
  discrepancy: boolean;
  replayed?: boolean;
}

export type RecordAttemptResult = RecordAttemptResponse | ApiError;

// ── question_payloads (§34.3) ───────────────────────────────────────────────
// Success shape is QuestionPayload in domain.ts.

// ── publish question (§34.4) ────────────────────────────────────────────────

export interface PublishQuestionRequest {
  versionId: string;
  note: string;
}

export interface PublishQuestionResponse {
  ok: true;
  contentVersion: number;
}

export type PublishQuestionResult = PublishQuestionResponse | ApiError;

// ── verify-purchase (§34.5) ─────────────────────────────────────────────────

export interface VerifyPurchaseRequest {
  purchaseToken: string;
  productId: string;
}

export interface VerifyPurchaseResponse {
  tier: "premium";
  status: "active";
  currentPeriodEnd: string;
  autoRenewing: boolean;
}

export type VerifyPurchaseResult = VerifyPurchaseResponse | ApiError;

// ── Shared RPC helpers ──────────────────────────────────────────────────────

export interface AnswerSubmittedAnalyticsContext {
  sessionId: string;
  questionId: string;
  answerType: AnswerType;
  durationMs: number;
}
