import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { dropPermanentFailures, useSyncStore, type QueuedAttempt } from "@/stores/syncStore";

const PERMANENT_ERROR_CODES = new Set([
  "P0002",
  "42501",
  "23503",
  "22P02",
  "question version not available",
  "session not owned by caller",
]);

function isPermanentAttemptError(message: string, code?: string): boolean {
  if (code && PERMANENT_ERROR_CODES.has(code)) return true;
  const lower = message.toLowerCase();
  return (
    lower.includes("question version not available") ||
    lower.includes("session not owned by caller") ||
    lower.includes("not authenticated")
  );
}

export async function flushQueuedAttempt(
  supabase: SupabaseClient,
  attempt: QueuedAttempt,
): Promise<"flushed" | "retry" | "dropped"> {
  const { data, error } = await supabase.rpc("fn_record_attempt", {
    p_client_attempt_id: attempt.clientAttemptId,
    p_question_version_id: attempt.questionVersionId,
    p_session_id: attempt.sessionId,
    p_part_key: null,
    p_raw_answer: attempt.rawAnswer,
    p_was_skipped: attempt.wasSkipped,
    p_client_is_correct: attempt.clientIsCorrect,
    p_duration_ms: attempt.durationMs,
    p_client_created_at: attempt.clientCreatedAt,
  });

  if (error) {
    if (isPermanentAttemptError(error.message, error.code)) {
      useSyncStore.getState().markAttemptPermanentFailure(attempt.clientAttemptId);
      return "dropped";
    }
    useSyncStore.getState().incrementAttemptRetry(attempt.clientAttemptId);
    return "retry";
  }

  useSyncStore.getState().markAttemptFlushed(attempt.clientAttemptId);
  if (data && typeof data === "object" && "replayed" in data) {
    return "flushed";
  }
  return "flushed";
}

export async function flushSyncQueue(supabase?: SupabaseClient): Promise<number> {
  const store = useSyncStore.getState();
  if (store.isFlushing) return 0;

  const client = supabase ?? createClient();
  const attempts = dropPermanentFailures(store);
  if (attempts.length === 0) return 0;

  store.setFlushing(true);
  let flushed = 0;

  try {
    for (const attempt of attempts) {
      if (attempt.permanentFailure) {
        store.markAttemptPermanentFailure(attempt.clientAttemptId);
        continue;
      }
      const result = await flushQueuedAttempt(client, attempt);
      if (result === "flushed" || result === "dropped") {
        flushed += 1;
      }
    }
    store.setLastFlushAt(new Date().toISOString());
  } finally {
    store.setFlushing(false);
  }

  return flushed;
}

export function isOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

export async function recordAttemptWithSync(args: {
  clientAttemptId: string;
  questionVersionId: string;
  sessionId: string;
  rawAnswer: string | null;
  wasSkipped: boolean;
  clientIsCorrect: boolean;
  durationMs: number;
}) {
  const payload = {
    ...args,
    clientCreatedAt: new Date().toISOString(),
  };

  if (!isOnline()) {
    useSyncStore.getState().enqueueAttempt(payload);
    return { queued: true as const };
  }

  const supabase = createClient();
  const result = await flushQueuedAttempt(supabase, {
    ...payload,
    enqueuedAt: new Date().toISOString(),
    retryCount: 0,
  });

  if (result === "retry") {
    useSyncStore.getState().enqueueAttempt(payload);
    return { queued: true as const };
  }

  return { queued: false as const };
}
