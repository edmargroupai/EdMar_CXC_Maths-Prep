import type { AnswerSpec, ValidationResult } from "@edmar/types";
import {
  countDecimalPlaces,
  countSignificantFigures,
  numericToNumber,
  parseNumeric,
} from "../parse.js";
import { normalise, profileFromSpec, splitValueAndUnits } from "../normalise.js";
import {
  exactResult,
  incorrectResult,
  matchAcceptedForm,
  matchCommonErrors,
  unparseableResult,
} from "./helpers.js";

const EPSILON = 1e-9;

function withinTolerance(
  value: number,
  canonical: number,
  tolerance: AnswerSpec["tolerance"],
): boolean {
  if (!tolerance) {
    return Math.abs(value - canonical) < EPSILON;
  }
  switch (tolerance.kind) {
    case "none":
      return Math.abs(value - canonical) < EPSILON;
    case "absolute":
      return Math.abs(value - canonical) <= (tolerance.value ?? 0);
    case "relative":
      if (Math.abs(canonical) < EPSILON) {
        return Math.abs(value) < EPSILON;
      }
      return Math.abs(value - canonical) / Math.abs(canonical) <= (tolerance.value ?? 0);
    case "range":
      return value >= (tolerance.min ?? -Infinity) && value <= (tolerance.max ?? Infinity);
    default:
      return Math.abs(value - canonical) < EPSILON;
  }
}

function getCanonicalNumber(spec: AnswerSpec): number | null {
  const canonical =
    typeof spec.canonicalValue === "string" ? spec.canonicalValue : spec.canonicalValue[0];
  const parsed = parseNumeric(canonical ?? "");
  if (!parsed) {
    return null;
  }
  return numericToNumber(parsed);
}

function checkDecimalPlaces(input: string, required: number, requiredFlag: boolean): boolean {
  if (!requiredFlag) {
    return true;
  }
  const dp = countDecimalPlaces(input);
  if (dp >= required) {
    return true;
  }
  if (dp === 0 && !input.includes(".")) {
    return false;
  }
  return dp === required;
}

function checkSignificantFigures(input: string, required: number, requiredFlag: boolean): boolean {
  if (!requiredFlag) {
    return true;
  }
  return countSignificantFigures(input) === required;
}

/**
 * numeric_dp / currency: acceptedForms first, then value, then precision (extra dp OK).
 * numeric_sf: precision first, then value (P08 resolution).
 */
function validateNumericWithPrecision(
  rawInput: string,
  spec: AnswerSpec,
  normalised: string,
  answerType: "numeric_sf" | "numeric_dp" | "currency",
): ValidationResult {
  const profile = profileFromSpec(spec);

  const common = matchCommonErrors(rawInput, spec, normalised);
  if (common) {
    return common;
  }

  let numericStr = normalised;
  if (answerType === "currency" || spec.normalisation === "currency_default") {
    const split = splitValueAndUnits(normalised);
    if (split.units) {
      return incorrectResult(normalised);
    }
    numericStr = split.value;
  }

  const parsed = parseNumeric(numericStr);
  if (!parsed) {
    return unparseableResult(normalised);
  }

  const canonicalNum = getCanonicalNumber(spec);
  if (canonicalNum === null) {
    return unparseableResult(normalised);
  }

  const value = numericToNumber(parsed);
  const precision = spec.precision;
  const precisionRequired = precision?.required ?? false;
  const precisionKind = precision?.kind ?? "none";
  const precisionValue = precision?.value ?? 0;

  if (answerType !== "numeric_sf") {
    const accepted = matchAcceptedForm(normalised, spec, profile);
    if (accepted) {
      return exactResult(normalised, accepted.matched);
    }
  }

  if (answerType === "numeric_sf" && precisionKind === "significant_figures" && precisionRequired) {
    if (!checkSignificantFigures(numericStr, precisionValue, true)) {
      return { isCorrect: false, normalised, reason: "wrong_precision" };
    }
  }

  if (!withinTolerance(value, canonicalNum, spec.tolerance)) {
    return incorrectResult(normalised);
  }

  if (answerType === "numeric_sf" && precisionKind === "significant_figures" && precisionRequired) {
    return exactResult(normalised);
  }

  if (
    (answerType === "numeric_dp" || answerType === "currency") &&
    precisionKind === "decimal_places" &&
    precisionRequired
  ) {
    if (!checkDecimalPlaces(numericStr, precisionValue, true)) {
      return { isCorrect: false, normalised, reason: "wrong_precision" };
    }
  }

  return exactResult(normalised);
}

export function validateNumericExact(
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

  const parsed = parseNumeric(normalised);
  if (!parsed) {
    return unparseableResult(normalised);
  }

  const canonicalNum = getCanonicalNumber(spec);
  if (canonicalNum === null) {
    return unparseableResult(normalised);
  }

  const value = numericToNumber(parsed);
  if (Math.abs(value - canonicalNum) < EPSILON) {
    const accepted = matchAcceptedForm(normalised, spec);
    return exactResult(normalised, accepted?.matched);
  }

  return incorrectResult(normalised);
}

export function validateNumericTolerance(
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

  const parsed = parseNumeric(normalised);
  if (!parsed) {
    return unparseableResult(normalised);
  }

  const canonicalNum = getCanonicalNumber(spec);
  if (canonicalNum === null) {
    return unparseableResult(normalised);
  }

  const value = numericToNumber(parsed);
  if (withinTolerance(value, canonicalNum, spec.tolerance)) {
    return {
      isCorrect: true,
      normalised,
      reason: "tolerance",
    };
  }

  return incorrectResult(normalised);
}

export function validateNumericSf(
  input: string | string[],
  spec: AnswerSpec,
  normalised: string,
): ValidationResult {
  if (Array.isArray(input)) {
    return incorrectResult(normalised);
  }
  return validateNumericWithPrecision(input, spec, normalised, "numeric_sf");
}

export function validateNumericDp(
  input: string | string[],
  spec: AnswerSpec,
  normalised: string,
): ValidationResult {
  if (Array.isArray(input)) {
    return incorrectResult(normalised);
  }
  return validateNumericWithPrecision(input, spec, normalised, "numeric_dp");
}

export function validateCurrency(
  input: string | string[],
  spec: AnswerSpec,
  normalised: string,
): ValidationResult {
  if (Array.isArray(input)) {
    return incorrectResult(normalised);
  }
  return validateNumericWithPrecision(input, spec, normalised, "currency");
}
