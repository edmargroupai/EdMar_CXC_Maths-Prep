"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { CompleteSessionResponse } from "@edmar/types";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { createClient } from "@/lib/supabase/client";
import { useSessionStore } from "@/stores/sessionStore";

export default function SessionResultsPage() {
  const params = useParams<{ sessionId: string }>();
  const clearSession = useSessionStore((s) => s.clearSession);
  const [summary, setSummary] = useState<CompleteSessionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const supabase = createClient();
        const { data, error: rpcError } = await supabase.rpc("fn_complete_session", {
          p_session_id: params.sessionId,
        });
        if (cancelled) return;
        if (rpcError) throw rpcError;

        const raw = data as Record<string, unknown>;
        setSummary({
          sessionId: String(raw.session_id),
          correctCount: Number(raw.correct_count ?? 0),
          answeredCount: Number(raw.answered_count ?? 0),
          deliveredCount: Number(raw.delivered_count ?? 0),
          durationSeconds: Number(raw.duration_seconds ?? 0),
          masteryBefore: (raw.mastery_before as Record<string, number>) ?? {},
          masteryAfter: (raw.mastery_after as Record<string, number>) ?? {},
        });
        clearSession();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not complete session.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params.sessionId, clearSession]);

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <ErrorState message={error} />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8" aria-busy="true">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-sky/50" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-navy dark:text-white">Session complete</h1>
      <p className="mt-2 text-navy/60 dark:text-white/70">
        You answered {summary.answeredCount} of {summary.deliveredCount} questions.
      </p>

      <dl className="mt-8 grid grid-cols-2 gap-4 rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(13,27,62,0.08)] dark:bg-navy">
        <div>
          <dt className="text-xs uppercase tracking-wide text-navy/50">Correct</dt>
          <dd className="text-2xl font-bold text-navy dark:text-white">{summary.correctCount}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-navy/50">Duration</dt>
          <dd className="text-2xl font-bold text-navy dark:text-white">
            {Math.round(summary.durationSeconds / 60)} min
          </dd>
        </div>
      </dl>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button href="/practice/setup">Practise again</Button>
        <Link href="/home" className="text-sm text-royal hover:underline self-center">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
