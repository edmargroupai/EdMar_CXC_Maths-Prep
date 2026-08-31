"use client";

import { useCallback } from "react";
import type { ResponseBlocks } from "@edmar/types";
import { recordAttemptWithSync } from "@/lib/sync";
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
  return recordAttemptWithSync(args);
}
