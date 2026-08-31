"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { validate } from "@edmar/answer-core";
import type { AnswerSpec, Block, QuestionOption } from "@edmar/types";
import { Button } from "@/components/ui/button";
import { ensureAnonymousSession } from "@/lib/auth/ensure-anonymous-session";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { useOnboardingStore } from "@/stores/onboardingStore";

interface SessionItem {
  position: number;
  question_id: string;
  question_version_id: string;
  option_order: string[] | null;
}

interface SessionCreated {
  session_id: string;
  delivered_count: number;
  items: SessionItem[];
}

interface PayloadRow {
  question_id: string;
  question_version_id: string;
  payload: {
    stemBlocks: Block[];
    options: QuestionOption[] | null;
    answerSpec: AnswerSpec;
  };
}

function blockText(blocks: Block[]): string {
  return blocks
    .map((block) => {
      if (block.type === "text") return block.value;
      if (block.type === "math") return block.alt ?? block.latex;
      return "";
    })
    .join(" ")
    .trim();
}

interface LoadedSession {
  sessionId: string;
  items: SessionItem[];
  payloads: Map<string, PayloadRow["payload"]>;
}

async function loadOnboardingSession(
  interestTopicIds: string[],
): Promise<{ ok: true; data: LoadedSession } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error: "Practice is not configured yet. You can still create an account.",
    };
  }

  const supabase = createClient();
  await ensureAnonymousSession(supabase);

  let scopeIds = interestTopicIds;
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
    return {
      ok: false,
      error: "No practice topics are available yet. Continue to create your account.",
    };
  }

  const { data: sessionData, error: sessionError } = await supabase.rpc(
    "fn_create_practice_session",
    {
      p_mode: "topic",
      p_scope_kind: "topic",
      p_scope_ids: scopeIds,
      p_count: 3,
      p_difficulty_mode: "building",
      p_client_seed: null,
    },
  );

  if (sessionError) {
    throw sessionError;
  }

  const session = sessionData as SessionCreated;
  const versionIds = (session.items ?? []).map((item) => item.question_version_id);
  if (versionIds.length === 0) {
    return {
      ok: false,
      error: "No onboarding questions are available yet. Continue to create your account.",
    };
  }

  const { data: payloadRows, error: payloadError } = await supabase
    .from("question_payloads")
    .select("question_id, question_version_id, payload")
    .in("question_version_id", versionIds);

  if (payloadError) {
    throw payloadError;
  }

  const map = new Map<string, PayloadRow["payload"]>();
  for (const row of (payloadRows ?? []) as PayloadRow[]) {
    map.set(row.question_version_id, row.payload);
  }

  return {
    ok: true,
    data: {
      sessionId: session.session_id,
      items: session.items ?? [],
      payloads: map,
    },
  };
}

export function OnboardingFirstQuestion() {
  const router = useRouter();
  const interestTopicIds = useOnboardingStore((s) => s.interestTopicIds);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [items, setItems] = useState<SessionItem[]>([]);
  const [payloads, setPayloads] = useState<Map<string, PayloadRow["payload"]>>(
    new Map(),
  );
  const [position, setPosition] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const startedAt = useRef(Date.now());

  const currentItem = items[position] ?? null;
  const currentPayload = currentItem
    ? payloads.get(currentItem.question_version_id)
    : undefined;

  const orderedOptions = useMemo(() => {
    if (!currentPayload?.options) return [];
    const order = currentItem?.option_order;
    if (!order || order.length === 0) return currentPayload.options;
    return order
      .map((key) => currentPayload.options?.find((opt) => opt.optionKey === key))
      .filter((opt): opt is QuestionOption => Boolean(opt));
  }, [currentItem, currentPayload]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setLoading(true);
      setError(null);

      try {
        const result = await loadOnboardingSession(interestTopicIds);
        if (cancelled) return;

        if (!result.ok) {
          setError(result.error);
          return;
        }

        setSessionId(result.data.sessionId);
        setItems(result.data.items);
        setPayloads(result.data.payloads);
        startedAt.current = Date.now();
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Could not start your practice session.";
        setError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [interestTopicIds, reloadToken]);

  function retrySession() {
    setReloadToken((value) => value + 1);
  }

  async function handleCheck() {
    if (!currentItem || !currentPayload || !sessionId || !selected || submitting) {
      return;
    }

    setSubmitting(true);
    const result = validate(selected, currentPayload.answerSpec);
    setIsCorrect(result.isCorrect);
    setChecked(true);

    const supabase = createClient();
    const durationMs = Math.max(0, Date.now() - startedAt.current);

    try {
      await supabase.rpc("fn_record_attempt", {
        p_client_attempt_id: crypto.randomUUID(),
        p_question_version_id: currentItem.question_version_id,
        p_session_id: sessionId,
        p_part_key: null,
        p_raw_answer: selected,
        p_was_skipped: false,
        p_client_is_correct: result.isCorrect,
        p_duration_ms: durationMs,
        p_client_created_at: new Date().toISOString(),
      });
    } catch {
      // Local verdict is shown; attempt sync can retry later in P15.
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSkip() {
    if (!currentItem || !sessionId || submitting) return;

    setSubmitting(true);
    const supabase = createClient();
    const durationMs = Math.max(0, Date.now() - startedAt.current);

    try {
      await supabase.rpc("fn_record_attempt", {
        p_client_attempt_id: crypto.randomUUID(),
        p_question_version_id: currentItem.question_version_id,
        p_session_id: sessionId,
        p_part_key: null,
        p_raw_answer: null,
        p_was_skipped: true,
        p_client_is_correct: false,
        p_duration_ms: durationMs,
        p_client_created_at: new Date().toISOString(),
      });
    } catch {
      // Non-blocking for onboarding.
    }

    goNext();
    setSubmitting(false);
  }

  function goNext() {
    if (position >= items.length - 1) {
      router.push("/sign-up");
      return;
    }
    setPosition((value) => value + 1);
    setSelected(null);
    setChecked(false);
    setIsCorrect(null);
    startedAt.current = Date.now();
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col justify-center" aria-busy="true">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-sky/50" />
        <div className="mt-6 h-24 animate-pulse rounded-xl bg-sky/40" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-12 animate-pulse rounded-xl bg-sky/30" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col justify-center text-center">
        <h1 className="text-2xl font-bold text-navy">Almost there</h1>
        <p className="mt-3 text-navy/70">{error}</p>
        <div className="mt-8 flex justify-center gap-3">
          <Button type="button" onClick={retrySession}>
            Try again
          </Button>
          <Button type="button" variant="secondary" href="/sign-up">
            Create account
          </Button>
        </div>
      </div>
    );
  }

  if (!currentItem || !currentPayload) {
    return (
      <div className="flex flex-1 flex-col justify-center text-center">
        <h1 className="text-2xl font-bold text-navy">Ready to save your progress?</h1>
        <p className="mt-3 text-navy/70">
          Create a free account to keep practising and track your improvement.
        </p>
        <Button type="button" className="mt-8" size="lg" href="/sign-up">
          Create account
        </Button>
      </div>
    );
  }

  const stem = blockText(currentPayload.stemBlocks);

  return (
    <div className="flex flex-1 flex-col">
      <p className="text-sm font-medium text-royal">
        Question {position + 1} of {items.length}
      </p>
      <h1 className="mt-4 text-xl font-bold text-navy">{stem}</h1>

      <fieldset className="mt-8 space-y-2" disabled={checked}>
        <legend className="sr-only">Choose an answer</legend>
        {orderedOptions.map((option) => {
          const isSelected = selected === option.optionKey;
          return (
            <label
              key={option.optionKey}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                isSelected
                  ? "border-royal bg-sky/50 text-navy"
                  : "border-navy/10 text-navy/80 hover:bg-sky/30"
              }`}
            >
              <input
                type="radio"
                name="answer"
                value={option.optionKey}
                checked={isSelected}
                onChange={() => setSelected(option.optionKey)}
                className="mt-1 h-4 w-4 border-navy/20 text-royal focus:ring-royal"
              />
              <span>
                <span className="font-semibold">{option.optionKey}.</span>{" "}
                {blockText(option.contentBlocks)}
              </span>
            </label>
          );
        })}
      </fieldset>

      {checked && isCorrect !== null ? (
        <p
          className={`mt-4 rounded-xl px-4 py-3 text-sm ${
            isCorrect
              ? "border border-success/30 bg-success/10 text-navy"
              : "border border-error/30 bg-error/10 text-navy"
          }`}
          role="status"
        >
          {isCorrect ? "Correct!" : "Not quite — keep going."}
        </p>
      ) : null}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {!checked ? (
          <>
            <Button
              type="button"
              size="lg"
              disabled={!selected || submitting}
              onClick={() => void handleCheck()}
            >
              Check
            </Button>
            <Button type="button" variant="ghost" size="lg" onClick={() => void handleSkip()}>
              Skip
            </Button>
          </>
        ) : (
          <Button type="button" size="lg" onClick={goNext}>
            {position >= items.length - 1 ? "Create account" : "Next question"}
          </Button>
        )}
      </div>
    </div>
  );
}
