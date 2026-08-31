/**
 * §12.6 Answer-spec inference from legacy answer strings.
 */
import { normalise } from "@edmar/answer-core";
import type { AnswerSpec } from "@edmar/types";

const OPTION_KEYS = ["A", "B", "C", "D", "E"] as const;

/** Algebra-safe expression: no commas, `$`, or `=`. */
const ALGEBRA_SAFE = /^[a-zA-Z0-9+\-*/^().\s/]+$/;

export function normaliseLegacyAnswer(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function resolveOptionKey(answer: string, options: string[]): (typeof OPTION_KEYS)[number] {
  const target = normaliseLegacyAnswer(answer);
  for (let i = 0; i < options.length; i++) {
    const option = options[i]!;
    const normalisedOption = normaliseLegacyAnswer(option);
    if (normalisedOption === target) {
      return OPTION_KEYS[i]!;
    }
    try {
      if (
        normalise(normalisedOption, "currency_default") === normalise(target, "currency_default")
      ) {
        return OPTION_KEYS[i]!;
      }
    } catch {
      // fall through
    }
    if (normalisedOption.replace(/\$/g, "").replace(/,/g, "") === target.replace(/\$/g, "").replace(/,/g, "")) {
      return OPTION_KEYS[i]!;
    }
  }
  throw new Error(`Answer "${answer}" not found in options: ${options.join(", ")}`);
}

function countDecimalPlaces(value: string): number {
  const match = value.match(/\.(\d+)/);
  return match ? match[1]!.length : 0;
}

function inferUnderlyingType(answer: string): AnswerSpec {
  const displayValue = answer.trim();
  let s = displayValue;

  if (/^\$[\d,]+(\.\d{2})?$/.test(s)) {
    const canonical = s.replace(/^\$/, "").replace(/,/g, "");
    return {
      answerType: "currency",
      canonicalValue: Number(canonical).toFixed(2),
      displayValue: s,
      acceptedForms: [s, `$${canonical}`, canonical],
      tolerance: { kind: "absolute", value: 0.005 },
      precision: { kind: "decimal_places", value: 2, required: true },
      normalisation: "currency_default",
    };
  }

  if (/^-?\d+\/-?\d+$/.test(s)) {
    return {
      answerType: "fraction",
      canonicalValue: s,
      displayValue: s,
      acceptedForms: [s],
      tolerance: { kind: "absolute", value: 0 },
      normalisation: "numeric_default",
    };
  }

  if (/^-?\d+ \d+\/\d+$/.test(s)) {
    return {
      answerType: "mixed_number",
      canonicalValue: s,
      displayValue: s,
      acceptedForms: [s],
      tolerance: { kind: "absolute", value: 0 },
      normalisation: "numeric_default",
    };
  }

  if (/^-?\d+(\.\d+)?\s*[a-zA-Z°²³]+$/i.test(s)) {
    const parts = s.match(/^(-?\d+(?:\.\d+)?)\s*(.+)$/);
    const num = parts?.[1] ?? s;
    const unit = parts?.[2] ?? "";
    return {
      answerType: "with_units",
      canonicalValue: `${num} ${unit}`.trim(),
      displayValue: s,
      acceptedForms: [s, num],
      tolerance: { kind: "absolute", value: 0 },
      units: { requirement: "required", canonical: unit, acceptedSet: [unit] },
      normalisation: "units_default",
    };
  }

  if (/^-?\d+:\d+(:\d+)?$/.test(s)) {
    return {
      answerType: "ratio",
      canonicalValue: s,
      displayValue: s,
      acceptedForms: [s],
      tolerance: { kind: "none" },
      normalisation: "numeric_default",
    };
  }

  if (/^-?\d+(\.\d+)?$/.test(s.replace(/,/g, ""))) {
    const cleaned = s.replace(/,/g, "");
    const isInteger = /^-?\d+$/.test(cleaned);
    if (isInteger) {
      return {
        answerType: "numeric_exact",
        canonicalValue: cleaned,
        displayValue: s,
        acceptedForms: [cleaned, s],
        tolerance: { kind: "absolute", value: 0 },
        normalisation: "numeric_default",
      };
    }
    const dp = countDecimalPlaces(cleaned);
    return {
      answerType: "numeric_dp",
      canonicalValue: cleaned,
      displayValue: s,
      acceptedForms: [cleaned, s],
      tolerance: { kind: "absolute", value: 0 },
      precision: { kind: "decimal_places", value: dp, required: true },
      normalisation: "numeric_default",
    };
  }

  if (/^\[.*\]$/.test(s) && s.includes(";")) {
    const matrixLatex = s.replace(/^\[/, "").replace(/\]$/, "");
    const rows = matrixLatex.split(";").map((r) => r.trim());
    const canonical = rows.join(";");
    return {
      answerType: "matrix",
      canonicalValue: canonical,
      displayValue: s,
      acceptedForms: [s, canonical],
      tolerance: { kind: "none" },
      normalisation: "default",
    };
  }

  if (/[a-zA-Z]/.test(s) && ALGEBRA_SAFE.test(s)) {
    return {
      answerType: "expression",
      canonicalValue: s.replace(/\s+/g, ""),
      displayValue: s,
      acceptedForms: [s, s.replace(/\s+/g, "")],
      normalisation: "expression_default",
    };
  }

  return {
    answerType: "text",
    canonicalValue: s,
    displayValue: s,
    acceptedForms: [s],
    normalisation: "text_default",
  };
}

export type InferResult =
  | { ok: true; spec: AnswerSpec; flags: string[] }
  | { ok: false; reason: string; underlyingType: string; flags: string[] };

export function inferAnswerSpec(answer: string, options?: string[]): InferResult {
  const flags = ["answer_spec_inferred"];
  const displayValue = answer.trim();

  if (options && options.length > 0) {
    const key = resolveOptionKey(displayValue, options);
    const underlying = inferUnderlyingType(displayValue);
    const spec: AnswerSpec = {
      answerType: "option_id",
      canonicalValue: key,
      displayValue: key,
      acceptedForms: [key],
      normalisation: "default",
      parts: { underlying },
    };
    return { ok: true, spec, flags };
  }

  const underlying = inferUnderlyingType(displayValue);
  if (underlying.answerType === "text") {
    return {
      ok: false,
      reason: "compound_or_untyped_answer",
      underlyingType: "text",
      flags,
    };
  }

  return { ok: true, spec: underlying, flags };
}
