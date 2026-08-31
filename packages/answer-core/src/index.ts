import type { AnswerSpec, ValidationResult } from "@edmar/types";
import { normalise, profileFromSpec } from "./normalise.js";
import { parseNumeric } from "./parse.js";
import type { NormalisationProfile, NumericParseResult } from "./types.js";
import { UNSUPPORTED_ANSWER_TYPES } from "./types.js";
import { validateBoolean, validateOptionId, validateOptionSet } from "./validators/option.js";
import {
  validateCurrency,
  validateNumericDp,
  validateNumericExact,
  validateNumericSf,
  validateNumericTolerance,
} from "./validators/numeric.js";
import { validateFraction, validateMixedNumber, validateRatio } from "./validators/fraction.js";
import { validateCoordinate, validateWithUnits } from "./validators/with-units.js";
import { validateExpression } from "./validators/expression.js";

export type { NormalisationProfile, NormalisationProfileName, Rational, Decimal, NumericParseResult } from "./types.js";
export { normalise, profileFromSpec, splitValueAndUnits } from "./normalise.js";
export { parseNumeric, reduceRational, rationalToString, compareRationals, numericToNumber } from "./parse.js";

export function validate(input: string | string[], spec: AnswerSpec): ValidationResult {
  if (spec.parts && Object.keys(spec.parts).length > 0) {
    throw new Error(
      'answer type "structured" is not supported in MVP — use per-part AnswerSpec objects',
    );
  }

  if ((UNSUPPORTED_ANSWER_TYPES as readonly string[]).includes(spec.answerType)) {
    throw new Error(`answer type "${spec.answerType}" is not supported in MVP`);
  }

  const profile = profileFromSpec(spec);
  const rawStr = Array.isArray(input) ? input.join(",") : input;
  const normalisedStr = Array.isArray(input)
    ? input.map((k) => normalise(k, profile)).join(",")
    : normalise(rawStr, profile);

  switch (spec.answerType) {
    case "option_id":
      return validateOptionId(input, spec, normalisedStr);
    case "option_set":
      return validateOptionSet(input, spec, normalisedStr);
    case "boolean":
      return validateBoolean(input, spec, normalisedStr);
    case "numeric_exact":
      return validateNumericExact(input, spec, normalisedStr);
    case "numeric_tolerance":
      return validateNumericTolerance(input, spec, normalisedStr);
    case "numeric_sf":
      return validateNumericSf(input, spec, normalisedStr);
    case "numeric_dp":
      return validateNumericDp(input, spec, normalisedStr);
    case "currency":
      return validateCurrency(input, spec, normalisedStr);
    case "fraction":
      return validateFraction(input, spec, normalisedStr);
    case "mixed_number":
      return validateMixedNumber(input, spec, normalisedStr);
    case "ratio":
      return validateRatio(input, spec, normalisedStr);
    case "with_units":
      return validateWithUnits(input, spec, normalisedStr);
    case "coordinate":
      return validateCoordinate(input, spec, normalisedStr);
    case "expression":
      return validateExpression(input, spec, normalisedStr);
    default:
      throw new Error(`answer type "${spec.answerType}" is not supported in MVP`);
  }
}

export { validate as default };
