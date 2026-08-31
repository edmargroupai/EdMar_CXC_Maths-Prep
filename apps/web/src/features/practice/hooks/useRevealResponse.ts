"use client";

import { useCallback } from "react";
import type { ResponseBlocks } from "@edmar/types";
import { createClient } from "@/lib/supabase/client";

export function useRevealResponse() {
  const reveal = useCallback(
    async (
      questionVersionId: string,
      clientAttemptId: string,
    ): Promise<ResponseBlocks | null> => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("fn_reveal_response", {
        p_question_version_id: questionVersionId,
        p_client_attempt_id: clientAttemptId,
      });

      if (error) {
        throw error;
      }

      return (data as ResponseBlocks | null) ?? null;
    },
    [],
  );

  return { reveal };
}

export async function recordAttemptBackground(args: {
  clientAttemptId: string;
  questionVersionId: string;
  sessionId: string;
  rawAnswer: string | null;
  wasSkipped: boolean;
  clientIsCorrect: boolean;
  durationMs: number;
}) {
  const supabase = createClient();
  void supabase.rpc("fn_record_attempt", {
    p_client_attempt_id: args.clientAttemptId,
    p_question_version_id: args.questionVersionId,
    p_session_id: args.sessionId,
    p_part_key: null,
    p_raw_answer: args.rawAnswer,
    p_was_skipped: args.wasSkipped,
    p_client_is_correct: args.clientIsCorrect,
    p_duration_ms: args.durationMs,
    p_client_created_at: new Date().toISOString(),
  });
}
