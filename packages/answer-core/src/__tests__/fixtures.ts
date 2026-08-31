import type { AnswerSpec, ValidationResult } from "@edmar/types";

/** Shared fixture specs from §27.2 */
export const sellingPriceSpec: AnswerSpec = {
  answerType: "currency",
  canonicalValue: "540.00",
  displayValue: "$540.00",
  acceptedForms: ["540", "540.0", "540.00", "$540", "$540.00", "540.", "$ 540.00"],
  tolerance: { kind: "absolute", value: 0.005 },
  precision: { kind: "decimal_places", value: 2, required: true },
  units: { requirement: "none", canonical: null, acceptedSet: [] },
  form: { lowestTerms: false, simplifiedSurd: false, specifiedForm: null },
  normalisation: "currency_default",
  caseSensitive: false,
  commonErrorValues: [{ key: "pct_on_selling_price", value: "470.00" }],
};

export const fractionSpec: AnswerSpec = {
  answerType: "fraction",
  canonicalValue: "23/20",
  displayValue: "23/20",
  acceptedForms: ["23/20", "1 3/20"],
  tolerance: { kind: "absolute", value: 0 },
  precision: { kind: "none", value: 0, required: false },
  units: { requirement: "none", canonical: null, acceptedSet: [] },
  form: { lowestTerms: false, simplifiedSurd: false, specifiedForm: null },
  normalisation: "numeric_default",
  caseSensitive: false,
};

export const numericSfSpec: AnswerSpec = {
  answerType: "numeric_sf",
  canonicalValue: "58.7",
  displayValue: "58.7",
  acceptedForms: ["58.7"],
  tolerance: { kind: "absolute", value: 0.05 },
  precision: { kind: "significant_figures", value: 3, required: true },
  units: { requirement: "none", canonical: null, acceptedSet: [] },
  form: { lowestTerms: false, simplifiedSurd: false, specifiedForm: null },
  normalisation: "numeric_default",
  caseSensitive: false,
};

export const withUnitsSpec: AnswerSpec = {
  answerType: "with_units",
  canonicalValue: "40 cm^2",
  displayValue: "40 cm²",
  acceptedForms: ["40 cm^2", "40cm2", "40 cm²", "40 sq cm", "40 square cm"],
  tolerance: { kind: "absolute", value: 0 },
  precision: { kind: "none", value: 0, required: false },
  units: { requirement: "required", canonical: "cm^2", acceptedSet: ["cm^2", "cm2", "cm²", "sq cm", "square cm"] },
  form: { lowestTerms: false, simplifiedSurd: false, specifiedForm: null },
  normalisation: "units_default",
  caseSensitive: false,
};

export const withUnitsConvertibleSpec: AnswerSpec = {
  ...withUnitsSpec,
  units: { requirement: "convertible", canonical: "cm^2", acceptedSet: ["cm^2", "mm^2"] },
  acceptedForms: [...withUnitsSpec.acceptedForms, "4000 mm^2"],
};

export const expressionSpec: AnswerSpec = {
  answerType: "expression",
  canonicalValue: "8a + b",
  displayValue: "8a + b",
  acceptedForms: ["8a + b", "b + 8a", "8*a+b", "8a+1b"],
  tolerance: { kind: "none", value: 0 },
  precision: { kind: "none", value: 0, required: false },
  units: { requirement: "none", canonical: null, acceptedSet: [] },
  form: { lowestTerms: false, simplifiedSurd: false, specifiedForm: null },
  normalisation: "expression_default",
  caseSensitive: false,
};

export const factorisedSpec: AnswerSpec = {
  answerType: "expression",
  canonicalValue: "(x+1)(x+2)",
  displayValue: "(x+1)(x+2)",
  acceptedForms: ["(x+1)(x+2)", "(x+2)(x+1)"],
  tolerance: { kind: "none", value: 0 },
  precision: { kind: "none", value: 0, required: false },
  units: { requirement: "none", canonical: null, acceptedSet: [] },
  form: { lowestTerms: false, simplifiedSurd: false, specifiedForm: "factorised" },
  normalisation: "expression_default",
  caseSensitive: false,
};

export const ratioSpec: AnswerSpec = {
  answerType: "ratio",
  canonicalValue: "3:5",
  displayValue: "3:5",
  acceptedForms: ["3:5", "3 : 5"],
  tolerance: { kind: "absolute", value: 0 },
  precision: { kind: "none", value: 0, required: false },
  units: { requirement: "none", canonical: null, acceptedSet: [] },
  form: { lowestTerms: false, simplifiedSurd: false, simplestRatio: true },
  normalisation: "numeric_default",
  caseSensitive: false,
};

export const optionIdSpec: AnswerSpec = {
  answerType: "option_id",
  canonicalValue: "B",
  displayValue: "B",
  acceptedForms: ["B"],
  tolerance: { kind: "none", value: 0 },
  precision: { kind: "none", value: 0, required: false },
  units: { requirement: "none", canonical: null, acceptedSet: [] },
  form: { lowestTerms: false, simplifiedSurd: false, specifiedForm: null },
  normalisation: "default",
  caseSensitive: false,
  commonErrorValues: [{ key: "common_wrong", value: "A" }],
};

export interface FixtureCase {
  input: string | string[];
  spec: AnswerSpec;
  expected: Partial<ValidationResult> & { isCorrect: boolean };
  label?: string;
}
