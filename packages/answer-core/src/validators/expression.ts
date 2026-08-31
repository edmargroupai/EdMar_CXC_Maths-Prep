import type { AnswerSpec, ValidationResult } from "@edmar/types";
import {
  canonicaliseExpression,
  expressionsEquivalentTier1,
  factorisedFormsEquivalent,
  isFactorisedForm,
} from "../equivalence.js";
import { normalise, profileFromSpec } from "../normalise.js";
import {
  equivalentFormResult,
  exactResult,
  incorrectResult,
  matchAcceptedForm,
  matchCommonErrors,
  unparseableResult,
} from "./helpers.js";

export function validateExpression(
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
  const specifiedForm = spec.form?.specifiedForm ?? null;

  const accepted = matchAcceptedForm(normalised, spec, profile);
  if (accepted) {
    return exactResult(normalised, accepted.matched);
  }

  if (specifiedForm === "factorised") {
    for (const form of spec.acceptedForms) {
      const formNorm = normalise(form, profile);
      if (factorisedFormsEquivalent(normalised, formNorm)) {
        return exactResult(normalised, form);
      }
    }
    if (isFactorisedForm(normalised)) {
      return incorrectResult(normalised);
    }
    const canon = typeof spec.canonicalValue === "string" ? spec.canonicalValue : spec.canonicalValue[0];
    if (canon && expressionsEquivalentTier1(normalised, normalise(canon, profile))) {
      return incorrectResult(normalised);
    }
    return incorrectResult(normalised);
  }

  const canonical =
    typeof spec.canonicalValue === "string" ? spec.canonicalValue : spec.canonicalValue[0];

  if (canonical && expressionsEquivalentTier1(normalised, normalise(canonical, profile))) {
    return equivalentFormResult(normalised, canonical);
  }

  for (const form of spec.acceptedForms) {
    const formNorm = normalise(form, profile);
    if (expressionsEquivalentTier1(normalised, formNorm)) {
      return equivalentFormResult(normalised, form);
    }
  }

  const canonForm = canonicaliseExpression(normalised);
  if (canonForm === null) {
    return unparseableResult(normalised);
  }

  return incorrectResult(normalised);
}
