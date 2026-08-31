import type { AnswerSpec, ValidationResult } from "@edmar/types";
import {
  compareRationals,
  isUnreducedFraction,
  numericToNumber,
  parseNumeric,
  reduceRational,
  rationalToString,
} from "../parse.js";
import { normalise, profileFromSpec } from "../normalise.js";
import {
  equivalentFormResult,
  exactResult,
  incorrectResult,
  matchAcceptedForm,
  matchCommonErrors,
  unparseableResult,
} from "./helpers.js";

const EPSILON = 1e-9;

function parseToRational(input: string): ReturnType<typeof parseNumeric> | null {
  const mixedMatch = input.trim().match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixedMatch) {
    const whole = BigInt(mixedMatch[1]!);
    const num = BigInt(mixedMatch[2]!);
    const den = BigInt(mixedMatch[3]!);
    const sign = whole < 0n ? -1n : 1n;
    const absWhole = whole < 0n ? -whole : whole;
    return reduceRational(sign * (absWhole * den + num), den);
  }
  return parseNumeric(input);
}

export function validateFraction(
  input: string | string[],
  spec: AnswerSpec,
  normalised: string,
): ValidationResult {
  if (Array.isArray(input)) {
    return incorrectResult(normalised);
  }

  const common = matchCommonErrors(input, spec, normalised);
  if (common) {
    return common;
  }

  const parsed = parseToRational(normalised);
  if (!parsed || parsed.kind !== "rational") {
    const decimalParsed = parseNumeric(normalised);
    if (decimalParsed) {
      const profile = profileFromSpec(spec);
      const accepted = matchAcceptedForm(normalised, spec, profile);
      if (accepted) {
        return exactResult(normalised, accepted.matched);
      }
    }
    return unparseableResult(normalised);
  }

  const canonicalStr =
    typeof spec.canonicalValue === "string" ? spec.canonicalValue : spec.canonicalValue[0];
  const canonicalParsed = parseToRational(canonicalStr ?? "");
  if (!canonicalParsed || canonicalParsed.kind !== "rational") {
    return unparseableResult(normalised);
  }

  const lowestTermsRequired = spec.form?.lowestTerms ?? false;

  if (!compareRationals(parsed, canonicalParsed)) {
    return incorrectResult(normalised);
  }

  const unreduced = isUnreducedFraction(input, parsed);

  if (unreduced && lowestTermsRequired) {
    return {
      isCorrect: false,
      normalised: rationalToString(parsed),
      reason: "not_simplified",
    };
  }

  const profile = profileFromSpec(spec);
  const accepted = matchAcceptedForm(normalised, spec, profile);
  if (accepted) {
    if (unreduced && !lowestTermsRequired) {
      return {
        isCorrect: true,
        normalised: rationalToString(parsed),
        matchedForm: accepted.matched,
        reason: "not_simplified",
      };
    }
    return exactResult(rationalToString(parsed), accepted.matched);
  }

  if (unreduced && !lowestTermsRequired) {
    return {
      isCorrect: true,
      normalised: rationalToString(parsed),
      reason: "not_simplified",
    };
  }

  return exactResult(rationalToString(parsed));
}

export function validateMixedNumber(
  input: string | string[],
  spec: AnswerSpec,
  normalised: string,
): ValidationResult {
  return validateFraction(input, spec, normalised);
}

export function validateRatio(
  input: string | string[],
  spec: AnswerSpec,
  normalised: string,
): ValidationResult {
  if (Array.isArray(input)) {
    return incorrectResult(normalised);
  }

  const common = matchCommonErrors(input, spec, normalised);
  if (common) {
    return common;
  }

  const parts = normalised.split(":").map((p) => p.trim());
  if (parts.length < 2 || parts.some((p) => p === "")) {
    return unparseableResult(normalised);
  }

  const nums = parts.map((p) => parseNumeric(p));
  if (nums.some((n) => !n)) {
    return unparseableResult(normalised);
  }

  const values = nums.map((n) => numericToNumber(n!));
  const simplestRequired = spec.form?.simplestRatio ?? false;

  const gcdPair = (a: number, b: number): number => {
    let x = Math.abs(Math.round(a));
    let y = Math.abs(Math.round(b));
    while (y !== 0) {
      const t = y;
      y = x % y;
      x = t;
    }
    return x || 1;
  };

  const intParts = parts.map((p) => Math.round(numericToNumber(parseNumeric(p)!)));
  const g = intParts.reduce((acc, v, i) => (i === 0 ? Math.abs(v) : gcdPair(acc, v)), 0);

  const canonicalStr =
    typeof spec.canonicalValue === "string" ? spec.canonicalValue : spec.canonicalValue[0] ?? "";
  const canonicalParts = canonicalStr
    .split(":")
    .map((p) => parseNumeric(p.trim()))
    .filter(Boolean)
    .map((n) => numericToNumber(n!));

  const canonInts = canonicalStr
    .split(":")
    .map((p) => Math.round(numericToNumber(parseNumeric(p.trim())!)));
  const canonG = canonInts.reduce((acc, v, i) => (i === 0 ? Math.abs(v) : gcdPair(acc, v)), 0);

  const simplified = intParts.map((v) => v / g);
  const canonSimplified = canonInts.map((v) => v / canonG);

  const valuesMatch =
    simplified.length === canonSimplified.length &&
    simplified.every((v, i) => Math.abs(v - canonSimplified[i]!) < EPSILON);

  const isSimplest = g === 1;

  if (!valuesMatch) {
    return incorrectResult(normalised);
  }

  if (!isSimplest && simplestRequired) {
    return {
      isCorrect: false,
      normalised,
      reason: "not_simplified",
    };
  }

  const profile = profileFromSpec(spec);
  const accepted = matchAcceptedForm(normalised, spec, profile);
  return exactResult(normalised, accepted?.matched);
}
