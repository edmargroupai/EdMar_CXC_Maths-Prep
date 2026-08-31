"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { DifficultyMode } from "@edmar/types";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { useSessionStore, type SessionItemRow } from "@/stores/sessionStore";

interface SessionCreated {
  session_id: string;
  delivered_count: number;
  items: SessionItemRow[];
}

const COUNTS = [5, 10, 15, 20] as const;
const DIFFICULTIES: { value: DifficultyMode; label: string }[] = [
  { value: "building", label: "Building" },
  { value: "mixed", label: "Mixed" },
  { value: "challenge", label: "Challenge" },
];

export function PracticeSetupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useSessionStore((s) => s.setSession);

  const [count, setCount] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<DifficultyMode>("mixed");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startSession() {
    if (!isSupabaseConfigured()) {
      setError("Practice is not configured yet.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      let scopeIds = searchParams.getAll("topic");
      if (scopeIds.length === 0) {
        const { data: topics } = await supabase
          .from("topics")
          .select("id")
          .eq("syllabus_code", "V2027")
          .eq("is_active", true)
          .order("sequence", { ascending: true })
          .limit(1);
        scopeIds = topics?.[0]?.id ? [topics[0].id] : [];
      }

      if (scopeIds.length === 0) {
        setError("No topics available to practise yet.");
        return;
      }

      const { data, error: rpcError } = await supabase.rpc("fn_create_practice_session", {
        p_mode: "topic",
        p_scope_kind: "topic",
        p_scope_ids: scopeIds,
        p_count: count,
        p_difficulty_mode: difficulty,
        p_client_seed: null,
      });

      if (rpcError) throw rpcError;

      const session = data as SessionCreated;
      if (!session.session_id || !session.items?.length) {
        setError("No questions were delivered for this session.");
        return;
      }

      setSession({
        sessionId: session.session_id,
        mode: "topic",
        difficultyMode: difficulty,
        items: session.items,
        scopeIds,
      });

      router.push(`/session/${session.session_id}/q/0`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start session.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {error ? (
        <div className="mt-6">
          <ErrorState message={error} onRetry={() => setError(null)} />
        </div>
      ) : null}

      <form
        className="mt-8 space-y-8"
        onSubmit={(event) => {
          event.preventDefault();
          void startSession();
        }}
      >
        <fieldset>
          <legend className="text-sm font-semibold text-navy dark:text-white">
            Number of questions
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {COUNTS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setCount(value)}
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  count === value
                    ? "bg-navy text-white dark:bg-royal"
                    : "bg-white text-navy/70 hover:bg-sky dark:bg-navy dark:text-white/70"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-semibold text-navy dark:text-white">Difficulty</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {DIFFICULTIES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setDifficulty(option.value)}
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  difficulty === option.value
                    ? "bg-royal text-white"
                    : "bg-white text-navy/70 hover:bg-sky dark:bg-navy dark:text-white/70"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? "Starting…" : "Start session"}
        </Button>
      </form>
    </>
  );
}
