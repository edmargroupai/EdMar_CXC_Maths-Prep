export interface QueuedAttempt {
  clientAttemptId: string;
  questionVersionId: string;
  sessionId: string;
  rawAnswer: string | null;
  wasSkipped: boolean;
  clientIsCorrect: boolean;
  durationMs: number;
  clientCreatedAt: string;
  enqueuedAt: string;
  retryCount: number;
  permanentFailure?: boolean;
}

export interface QueuedAnalyticsEvent {
  eventName: string;
  eventProps: Record<string, unknown>;
  occurredAt: string;
  enqueuedAt: string;
}

export interface SyncState {
  pendingAttempts: QueuedAttempt[];
  pendingEvents: QueuedAnalyticsEvent[];
  lastFlushAt: string | null;
  isFlushing: boolean;
  enqueueAttempt: (attempt: Omit<QueuedAttempt, "enqueuedAt" | "retryCount">) => void;
  enqueueEvent: (event: Omit<QueuedAnalyticsEvent, "enqueuedAt">) => void;
  markAttemptFlushed: (clientAttemptId: string) => void;
  markAttemptPermanentFailure: (clientAttemptId: string) => void;
  incrementAttemptRetry: (clientAttemptId: string) => void;
  setFlushing: (value: boolean) => void;
  setLastFlushAt: (iso: string) => void;
}
