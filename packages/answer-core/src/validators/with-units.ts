import type { AnswerSpec, ValidationResult } from "@edmar/types";
import { numericToNumber, parseNumeric } from "../parse.js";
import { normalise, profileFromSpec, splitValueAndUnits } from "../normalise.js";
import { convertUnitValue, unitsMatch } from "../units.js";
import {
  exactResult,
  incorrectResult,
  matchAcceptedForm,
  matchCommonErrors,
  unparseableResult,
} from "./helpers.js";

const EPSILON = 1e-9;

export function validateWithUnits(
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

  const profile = profileFromSpec(spec);
  const unitsSpec = spec.units;
  const requirement = unitsSpec?.requirement ?? "none";

  const split = splitValueAndUnits(normalised);
  const numericStr = split.value;
  const unitPart = split.units;

  if (requirement === "required" && !unitPart) {
    return {
      isCorrect: false,
      normalised,
      reason: "wrong_units",
    };
  }

  if (requirement === "none" && unitPart) {
    return incorrectResult(normalised);
  }

  const parsed = parseNumeric(numericStr);
  if (!parsed) {
    return unparseableResult(normalised);
  }

  let value = numericToNumber(parsed);
  const canonicalStr =
    typeof spec.canonicalValue === "string" ? spec.canonicalValue : spec.canonicalValue[0];
  const canonicalSplit = splitValueAndUnits(normalise(canonicalStr ?? "", profile));
  const canonicalParsed = parseNumeric(canonicalSplit.value);
  if (!canonicalParsed) {
    return unparseableResult(normalised);
  }
  let canonicalValue = numericToNumber(canonicalParsed);
  const canonicalUnit = canonicalSplit.units ?? unitsSpec?.canonical ?? null;

  if (unitPart && canonicalUnit && requirement === "convertible") {
    const converted = convertUnitValue(value, unitPart, canonicalUnit);
    if (converted === null) {
      return {
        isCorrect: false,
        normalised,
        reason: "wrong_units",
      };
    }
    value = converted;
  }

  if (unitPart && requirement !== "optional" && requirement !== "none") {
    const acceptedSet = unitsSpec?.acceptedSet ?? [];
    if (!unitsMatch(unitPart, canonicalUnit, acceptedSet)) {
      return {
        isCorrect: false,
        normalised,
        reason: "wrong_units",
      };
    }
  }

  if (Math.abs(value - canonicalValue) > EPSILON && !withinTol(value, canonicalValue, spec)) {
    return incorrectResult(normalised);
  }

  const accepted = matchAcceptedForm(normalised, spec, profile);
  if (accepted) {
    return exactResult(normalised, accepted.matched);
  }

  if (requirement === "optional" && !unitPart) {
    return exactResult(normalised);
  }

  return exactResult(normalised);
}

function withinTol(value: number, canonical: number, spec: AnswerSpec): boolean {
  const tol = spec.tolerance;
  if (!tol) {
    return Math.abs(value - canonical) < EPSILON;
  }
  if (tol.kind === "absolute") {
    return Math.abs(value - canonical) <= (tol.value ?? 0);
  }
  if (tol.kind === "relative") {
    if (Math.abs(canonical) < EPSILON) {
      return Math.abs(value) < EPSILON;
    }
    return Math.abs(value - canonical) / Math.abs(canonical) <= (tol.value ?? 0);
  }
  if (tol.kind === "range") {
    return value >= (tol.min ?? -Infinity) && value <= (tol.max ?? Infinity);
  }
  return Math.abs(value - canonical) < EPSILON;
}

export function validateCoordinate(
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

  const coordMatch = normalised.match(/^\(?\s*([^,)]+)\s*,\s*([^)]+)\s*\)?$/);
  if (!coordMatch) {
    return unparseableResult(normalised);
  }

  const xParsed = parseNumeric(coordMatch[1]!.trim());
  const yParsed = parseNumeric(coordMatch[2]!.trim());
  if (!xParsed || !yParsed) {
    return unparseableResult(normalised);
  }

  const canonicalStr =
    typeof spec.canonicalValue === "string" ? spec.canonicalValue : spec.canonicalValue[0];
  const canonMatch = (canonicalStr ?? "").match(/^\(?\s*([^,)]+)\s*,\s*([^)]+)\s*\)?$/);
  if (!canonMatch) {
    return unparseableResult(normalised);
  }

  const cxParsed = parseNumeric(canonMatch[1]!.trim());
  const cyParsed = parseNumeric(canonMatch[2]!.trim());
  if (!cxParsed || !cyParsed) {
    return unparseableResult(normalised);
  }

  const x = numericToNumber(xParsed);
  const y = numericToNumber(yParsed);
  const cx = numericToNumber(cxParsed);
  const cy = numericToNumber(cyParsed);

  if (
    Math.abs(x - cx) < EPSILON &&
    Math.abs(y - cy) < EPSILON
  ) {
    const profile = profileFromSpec(spec);
    const accepted = matchAcceptedForm(normalised, spec, profile);
    return exactResult(normalised, accepted?.matched);
  }

  return incorrectResult(normalised);
}
