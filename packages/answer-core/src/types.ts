import type { AnswerSpec } from "@edmar/types";

/** Normalisation profile names — mirror `AnswerSpec.normalisation`. */
export type NormalisationProfileName = AnswerSpec["normalisation"];

export interface NormalisationProfile {
  profile: NormalisationProfileName;
  caseSensitive?: boolean;
}

export interface Rational {
  kind: "rational";
  num: bigint;
  den: bigint;
}

export interface Decimal {
  kind: "decimal";
  value: string;
}

export type NumericParseResult = Rational | Decimal;

export interface ParsedWithUnits {
  numericPart: string;
  unitPart: string | null;
}

export type ValidatorFn = (
  input: string | string[],
  spec: AnswerSpec,
  normalised: string,
) => import("@edmar/types").ValidationResult;

export const UNSUPPORTED_ANSWER_TYPES = [
  "set",
  "interval",
  "matrix",
  "vector",
  "text",
] as const;

export type UnsupportedAnswerType = (typeof UNSUPPORTED_ANSWER_TYPES)[number];
