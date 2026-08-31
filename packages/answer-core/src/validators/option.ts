import type { AnswerSpec, ValidationResult } from "@edmar/types";
import { incorrectResult, matchCommonErrors, exactResult } from "./helpers.js";

export function validateOptionId(
  input: string | string[],
  spec: AnswerSpec,
  normalised: string,
): ValidationResult {
  if (Array.isArray(input)) {
    return incorrectResult("");
  }
  if (!input || input.trim() === "") {
    return incorrectResult("");
  }

  const common = matchCommonErrors(input, spec, normalised);
  if (common) {
    return common;
  }

  const canonical =
    typeof spec.canonicalValue === "string" ? spec.canonicalValue : spec.canonicalValue[0];

  if (normalised === canonical || input.trim().toUpperCase() === canonical.toUpperCase()) {
    return exactResult(normalised, canonical);
  }

  return incorrectResult(normalised);
}

export function validateOptionSet(
  input: string | string[],
  spec: AnswerSpec,
  normalised: string,
): ValidationResult {
  const keys = Array.isArray(input) ? input : input.split(/[,;\s]+/).filter(Boolean);
  if (keys.length === 0) {
    return incorrectResult(normalised);
  }

  const common = matchCommonErrors(keys.join(","), spec, normalised);
  if (common) {
    return common;
  }

  const canonical = Array.isArray(spec.canonicalValue)
    ? [...spec.canonicalValue].sort()
    : [spec.canonicalValue];

  const sortedKeys = [...keys].map((k) => k.trim().toUpperCase()).sort();

  if (
    canonical.length === sortedKeys.length &&
    canonical.every((c, i) => c.toUpperCase() === sortedKeys[i])
  ) {
    return exactResult(sortedKeys.join(","), canonical.join(","));
  }

  return incorrectResult(normalised);
}

export function validateBoolean(
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

  const canonical =
    typeof spec.canonicalValue === "string" ? spec.canonicalValue.toLowerCase() : "";

  const boolNorm = normalised.toLowerCase();
  const trueValues = ["true", "t", "yes", "1"];
  const falseValues = ["false", "f", "no", "0"];

  let parsed: string | null = null;
  if (trueValues.includes(boolNorm)) {
    parsed = "true";
  } else if (falseValues.includes(boolNorm)) {
    parsed = "false";
  }

  if (parsed === canonical) {
    return exactResult(parsed);
  }

  return incorrectResult(normalised);
}
