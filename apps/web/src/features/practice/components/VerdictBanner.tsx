import type { ValidationResult } from "@edmar/types";
import { BlockRenderer } from "@edmar/design/blocks";
import type { CommonError, ResponseBlocks } from "@edmar/types";

type VerdictBannerProps = {
  result: ValidationResult;
  wasSkipped: boolean;
  response?: ResponseBlocks | null;
};

function matchedErrorNote(
  result: ValidationResult,
  commonErrors: CommonError[],
): string | null {
  if (!result.matchedCommonErrorKey) return null;
  const match = commonErrors.find(
    (err) => err.key === result.matchedCommonErrorKey || err.wrongOptionKey === result.matchedCommonErrorKey,
  );
  return match?.correctiveNote ?? null;
}

export function VerdictBanner({ result, wasSkipped, response }: VerdictBannerProps) {
  if (wasSkipped) {
    return (
      <p
        className="rounded-xl border border-navy/15 bg-sky/40 px-4 py-3 text-sm text-navy dark:border-white/15 dark:bg-white/5 dark:text-white"
        role="status"
      >
        Skipped — review the worked solution below when you&apos;re ready.
      </p>
    );
  }

  const misconception = response
    ? matchedErrorNote(result, response.commonErrors)
    : null;

  let message = result.isCorrect ? "Correct!" : "Not quite.";
  if (result.reason === "wrong_precision") {
    message = "Right value, but check your rounding or significant figures.";
  } else if (result.reason === "wrong_units") {
    message = "Check the units on your answer.";
  }

  return (
    <div
      className={`rounded-xl px-4 py-3 text-sm ${
        result.isCorrect
          ? "border border-success/30 bg-success/10 text-navy dark:text-white"
          : "border border-warning/40 bg-warning/10 text-navy dark:text-white"
      }`}
      role="status"
    >
      <p className="font-medium">{message}</p>
      {!result.isCorrect && result.normalised ? (
        <p className="mt-1 text-navy/70 dark:text-white/70">
          Your answer: <strong>{result.normalised}</strong>
          {response ? (
            <>
              {" "}
              · Correct:{" "}
              <BlockRenderer
                blocks={response.finalAnswerBlocks}
                mathRenders={response.mathRenders}
                className="inline"
              />
            </>
          ) : null}
        </p>
      ) : null}
      {misconception ? (
        <p className="mt-2 border-t border-navy/10 pt-2 text-navy/80 dark:border-white/10 dark:text-white/80">
          {misconception}
        </p>
      ) : null}
    </div>
  );
}
