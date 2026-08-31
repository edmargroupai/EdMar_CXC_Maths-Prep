import type { AnswerSpec, ValidationResult } from "@edmar/types";
import { normalise, profileFromSpec } from "../normalise.js";
import { numericToNumber, parseNumeric } from "../parse.js";

const EPSILON = 1e-9;

export function incorrectResult(normalised: string): ValidationResult {
  return { isCorrect: false, normalised, reason: "incorrect" };
}

export function unparseableResult(normalised: string): ValidationResult {
  return { isCorrect: false, normalised, reason: "unparseable" };
}

function valuesMatchAsNumbers(a: string, b: string): boolean {
  const pa = parseNumeric(a);
  const pb = parseNumeric(b);
  if (!pa || !pb) {
    return false;
  }
  return Math.abs(numericToNumber(pa) - numericToNumber(pb)) < EPSILON;
}

export function matchCommonErrors(
  input: string,
  spec: AnswerSpec,
  normalised: string,
): ValidationResult | null {
  if (!spec.commonErrorValues?.length) {
    return null;
  }
  const profile = profileFromSpec(spec);
  for (const err of spec.commonErrorValues) {
    const errNorm = normalise(err.value, profile);
    if (
      errNorm === normalised ||
      err.value === input ||
      valuesMatchAsNumbers(normalised, errNorm)
    ) {
      return {
        isCorrect: false,
        normalised,
        matchedCommonErrorKey: err.key,
        reason: "incorrect",
      };
    }
  }
  return null;
}

export function matchAcceptedForm(
  normalised: string,
  spec: AnswerSpec,
  profile = profileFromSpec(spec),
): { matched: string } | null {
  for (const form of spec.acceptedForms) {
    const formNorm = normalise(form, profile);
    if (formNorm === normalised) {
      return { matched: form };
    }
  }
  return null;
}

export function exactResult(normalised: string, matchedForm?: string): ValidationResult {
  return {
    isCorrect: true,
    normalised,
    matchedForm,
    reason: "exact",
  };
}

export function equivalentFormResult(normalised: string, matchedForm?: string): ValidationResult {
  return {
    isCorrect: true,
    normalised,
    matchedForm,
    reason: "equivalent_form",
  };
}
