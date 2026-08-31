"use client";

import { useEffect, useReducer, useRef } from "react";
import { useRouter } from "next/navigation";
import { validate } from "@edmar/answer-core";
import { BlockRenderer } from "@edmar/design/blocks";
import type { QuestionOption } from "@edmar/types";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { OptionList } from "@/features/practice/components/OptionList";
import { NumericInput } from "@/features/practice/components/NumericInput";
import { ResponsePane } from "@/features/practice/components/ResponsePane";
import { SessionNavigator } from "@/features/practice/components/SessionNavigator";
import { VerdictBanner } from "@/features/practice/components/VerdictBanner";
import { useQuestionPayload } from "@/features/practice/hooks/useQuestionPayload";
import {
  recordAttemptBackground,
  useRevealResponse,
} from "@/features/practice/hooks/useRevealResponse";
import {
  isInputNonEmpty,
  questionReducer,
  type AnswerInput,
} from "@/features/practice/question-reducer";
import type { SessionItemRow } from "@/stores/sessionStore";
import { useSessionStore } from "@/stores/sessionStore";

type QuestionScreenProps = {
  sessionId: string;
  position: number;
  item: SessionItemRow;
  total: number;
};

const NUMERIC_TYPES = new Set([
  "numeric_exact",
  "numeric_tolerance",
  "numeric_sf",
  "numeric_dp",
  "currency",
]);

function orderOptions(
  options: QuestionOption[] | null,
  optionOrder: string[] | null,
): QuestionOption[] {
  if (!options) return [];
  if (!optionOrder?.length) return options;
  return optionOrder
    .map((key) => options.find((opt) => opt.optionKey === key))
    .filter((opt): opt is QuestionOption => Boolean(opt));
}

export function QuestionScreen({ sessionId, position, item, total }: QuestionScreenProps) {
  const router = useRouter();
  const setStorePosition = useSessionStore((s) => s.setPosition);
  const { payload: loadedPayload, loading, error } = useQuestionPayload(item.question_version_id);
  const { reveal } = useRevealResponse();
  const [state, dispatch] = useReducer(questionReducer, { phase: "loading" });
  const durationStart = useRef(0);

  useEffect(() => {
    setStorePosition(position);
  }, [position, setStorePosition]);

  useEffect(() => {
    if (loading) {
      dispatch({ type: "LOAD_START" });
      return;
    }
    if (error || !loadedPayload) {
      dispatch({ type: "LOAD_ERROR" });
      return;
    }
    durationStart.current = Date.now();
    dispatch({
      type: "LOAD_SUCCESS",
      payload: loadedPayload,
      startedAt: durationStart.current,
    });
  }, [loading, error, loadedPayload]);

  useEffect(() => {
    if (state.phase !== "revealing") return;

    let cancelled = false;

    void (async () => {
      try {
        await recordAttemptBackground({
          clientAttemptId: state.clientAttemptId,
          questionVersionId: item.question_version_id,
          sessionId,
          rawAnswer: state.wasSkipped ? null : String(state.input),
          wasSkipped: state.wasSkipped,
          clientIsCorrect: state.result.isCorrect,
          durationMs: Math.max(0, Date.now() - durationStart.current),
        });

        const response = await reveal(item.question_version_id, state.clientAttemptId);
        if (cancelled || !response) return;
        dispatch({ type: "REVEAL_SUCCESS", response });
      } catch {
        // Verdict remains visible; response pane stays hidden.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [state, sessionId, item.question_version_id, reveal]);

  useEffect(() => {
    if (state.phase !== "checking") return;

    const result = state.wasSkipped
      ? { isCorrect: false, normalised: "" }
      : validate(state.input, state.payload.payload.answerSpec);

    dispatch({ type: "VERDICT", result });
  }, [state]);

  useEffect(() => {
    if (state.phase !== "advancing") return;
    if (position >= total - 1) {
      router.push(`/session/${sessionId}/results`);
      return;
    }
    router.push(`/session/${sessionId}/q/${position + 1}`);
  }, [state.phase, position, total, sessionId, router]);

  function handleCheck() {
    if (state.phase !== "answering" || !isInputNonEmpty(state.input)) return;
    dispatch({
      type: "CHECK",
      input: state.input as AnswerInput,
      clientAttemptId: crypto.randomUUID(),
    });
  }

  function handleSkip() {
    if (state.phase !== "answering") return;
    dispatch({ type: "SKIP", clientAttemptId: crypto.randomUUID() });
  }

  if (loading || state.phase === "loading") {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8" aria-busy="true">
        <div className="h-6 w-32 animate-pulse rounded bg-sky/50" />
        <div className="mt-6 h-24 animate-pulse rounded-xl bg-sky/40" />
      </div>
    );
  }

  if (error || !loadedPayload) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <ErrorState message={error ?? "Could not load this question."} />
      </div>
    );
  }

  if (state.phase === "answering" || state.phase === "checking") {
    const body = state.payload;
    const input = state.input;
    const answerSpec = body.payload.answerSpec;
    const options = orderOptions(body.payload.options, item.option_order);
    const isMcq = answerSpec.answerType === "option_id" || answerSpec.answerType === "option_set";
    const isNumeric = NUMERIC_TYPES.has(answerSpec.answerType);

    return (
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-royal">
            {position + 1} / {total}
          </p>
          <SessionNavigator
            total={total}
            current={position}
            sessionId={sessionId}
            onSelect={(next) => router.push(`/session/${sessionId}/q/${next}`)}
          />
        </div>

        <article className="rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(13,27,62,0.08)] dark:bg-navy">
          <BlockRenderer
            blocks={body.payload.stemBlocks}
            mathRenders={body.payload.mathRenders}
          />

          <div className="mt-8">
            {isMcq ? (
              <OptionList
                options={options}
                selected={typeof input === "string" ? input : null}
                onSelect={(key) => dispatch({ type: "SET_INPUT", input: key })}
                disabled={state.phase === "checking"}
                mathRenders={body.payload.mathRenders}
              />
            ) : isNumeric ? (
              <NumericInput
                value={typeof input === "string" ? input : ""}
                onChange={(value) => dispatch({ type: "SET_INPUT", input: value })}
                disabled={state.phase === "checking"}
              />
            ) : (
              <p className="text-sm text-navy/60">Input type not yet supported in MVP.</p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              type="button"
              size="lg"
              disabled={!isInputNonEmpty(input) || state.phase === "checking"}
              onClick={handleCheck}
            >
              Check answer
            </Button>
            <Button type="button" variant="ghost" size="lg" onClick={handleSkip}>
              Skip
            </Button>
          </div>
        </article>
      </div>
    );
  }

  if (state.phase === "revealing" || state.phase === "result") {
    const showResponse = state.phase === "result";

    return (
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-royal">
            {position + 1} / {total}
          </p>
          <SessionNavigator
            total={total}
            current={position}
            sessionId={sessionId}
            onSelect={(next) => router.push(`/session/${sessionId}/q/${next}`)}
          />
        </div>

        <div className="response-layout-wide @container">
          <div className="space-y-4">
            <article className="rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(13,27,62,0.08)] dark:bg-navy">
              <BlockRenderer
                blocks={state.payload.payload.stemBlocks}
                mathRenders={state.payload.payload.mathRenders}
              />
            </article>
            <VerdictBanner
              result={state.result}
              wasSkipped={state.wasSkipped}
              response={showResponse ? state.response : null}
            />
            <Button type="button" size="lg" onClick={() => dispatch({ type: "ADVANCE" })}>
              {position >= total - 1 ? "Finish session" : "Next question"}
            </Button>
          </div>

          {showResponse ? (
            <aside className="rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(13,27,62,0.08)] dark:bg-navy">
              <ResponsePane response={state.response} />
            </aside>
          ) : null}
        </div>
      </div>
    );
  }

  return null;
}
