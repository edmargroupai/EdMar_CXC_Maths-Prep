"use client";

import { useEffect, useState } from "react";
import type { QuestionPayload } from "@edmar/types";
import { createClient } from "@/lib/supabase/client";

type PayloadRow = {
  question_id: string;
  question_version_id: string;
  content_version: number;
  payload: QuestionPayload["payload"];
};

function toQuestionPayload(row: PayloadRow): QuestionPayload {
  return {
    questionId: row.question_id,
    questionVersionId: row.question_version_id,
    contentVersion: row.content_version,
    payload: row.payload,
  };
}

export function useQuestionPayload(questionVersionId: string | null) {
  const [payload, setPayload] = useState<QuestionPayload | null>(null);
  const [loading, setLoading] = useState(Boolean(questionVersionId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!questionVersionId) return;

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
        setError(null);
      }
    });

    void (async () => {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("question_payloads")
        .select("question_id, question_version_id, content_version, payload")
        .eq("question_version_id", questionVersionId)
        .maybeSingle();

      if (cancelled) return;

      if (fetchError || !data) {
        setError(fetchError?.message ?? "Question not found");
        setPayload(null);
      } else {
        setPayload(toQuestionPayload(data as PayloadRow));
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [questionVersionId]);

  return { payload, loading, error };
}
