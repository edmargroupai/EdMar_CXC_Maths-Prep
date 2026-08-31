import type { AnswerSpec } from "@edmar/types";
import type { NormalisationProfile } from "./types.js";

const UNICODE_MINUS = /[\u2212\u2013\u2014]/g;
const MULTIPLY_SIGNS = /[×·]/g;
const SUPERSCRIPT_MAP: Record<string, string> = {
  "²": "^2",
  "³": "^3",
  "ⁿ": "^n",
};
const RESTATEMENT_PREFIX = /^(?:x|y|answer)\s*=\s*/i;
const CURRENCY_PREFIX = /^(?:\$|J\$|US\$|TT\$)\s*/;

function replaceSuperscripts(input: string): string {
  let out = input;
  for (const [char, replacement] of Object.entries(SUPERSCRIPT_MAP)) {
    out = out.split(char).join(replacement);
  }
  return out.replace(/\*\*/g, "^");
}

function collapseWhitespace(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}

function stripThousandsSeparators(token: string): string {
  if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(token)) {
    return token.replace(/,/g, "");
  }
  if (/^-?\d{1,3}(\s\d{3})+(\.\d+)?$/.test(token)) {
    return token.replace(/\s/g, "");
  }
  return token;
}

function normaliseDecimalSeparator(token: string): string {
  if (token.includes(".") && token.includes(",")) {
    return token;
  }
  if (!token.includes(".") && token.includes(",")) {
    const parts = token.split(",");
    if (parts.length === 2 && /^\d+$/.test(parts[1] ?? "")) {
      return `${parts[0]}.${parts[1]}`;
    }
  }
  return token;
}

function removeNumericInternalSpaces(token: string): string {
  if (/^-?[\d\s.,]+$/.test(token)) {
    return token.replace(/\s/g, "");
  }
  return token;
}

function normaliseNumericToken(token: string): string {
  let out = token;
  out = out.replace(UNICODE_MINUS, "-");
  out = out.replace(/^\+/, "");
  out = stripThousandsSeparators(out);
  out = normaliseDecimalSeparator(out);
  out = removeNumericInternalSpaces(out);
  return out;
}

function normaliseExpression(input: string): string {
  let out = input.replace(UNICODE_MINUS, "-");
  out = out.replace(MULTIPLY_SIGNS, "*");
  out = replaceSuperscripts(out);
  out = out.replace(/^\+/, "");
  out = out.replace(RESTATEMENT_PREFIX, "");
  out = out.replace(/\s*\*\s*/g, "*");
  out = out.replace(/\s*\^\s*/g, "^");
  return collapseWhitespace(out);
}

function normaliseUnits(input: string): string {
  let out = input.replace(UNICODE_MINUS, "-");
  out = out.replace(/\s+/g, " ");
  out = out.trim();

  const percentMatch = out.match(/^(.+?)\s*%$/);
  if (percentMatch) {
    const numeric = normaliseNumericToken(percentMatch[1]!.trim());
    return `${numeric} %`;
  }

  const unitAliases: Array<[RegExp, string]> = [
    [/^(.+?)\s*cm2$/i, "$1 cm^2"],
    [/^(.+?)\s*cm²$/i, "$1 cm^2"],
    [/^(.+?)\s*cm\^2$/i, "$1 cm^2"],
    [/^(.+?)\s*sq\s*cm$/i, "$1 cm^2"],
    [/^(.+?)\s*square\s*cm$/i, "$1 cm^2"],
    [/^(.+?)\s*mm2$/i, "$1 mm^2"],
    [/^(.+?)\s*mm²$/i, "$1 mm^2"],
    [/^(.+?)\s*mm\^2$/i, "$1 mm^2"],
    [/^(.+?)\s*sq\s*mm$/i, "$1 mm^2"],
    [/^(.+?)\s*cm3$/i, "$1 cm^3"],
    [/^(.+?)\s*cm³$/i, "$1 cm^3"],
    [/^(.+?)\s*cm\^3$/i, "$1 cm^3"],
  ];

  for (const [pattern, replacement] of unitAliases) {
    if (pattern.test(out)) {
      out = out.replace(pattern, replacement);
      break;
    }
  }

  return out.replace(/\s+/g, " ").trim();
}

function normaliseCurrency(input: string): string {
  let out = input.trim();
  out = out.replace(CURRENCY_PREFIX, "");
  out = normaliseNumericToken(out);
  return out;
}

function normaliseDefault(input: string, profile: NormalisationProfile): string {
  let out = input.replace(UNICODE_MINUS, "-");
  out = collapseWhitespace(out);
  if (!profile.caseSensitive) {
    out = out.toLowerCase();
  }
  return out;
}

/**
 * Apply §10.5 normalisation rules for the given profile.
 */
export function normalise(input: string, profile: NormalisationProfile): string {
  if (input == null) {
    return "";
  }

  let out = input;

  switch (profile.profile) {
    case "numeric_default":
      out = collapseWhitespace(out);
      out = normaliseNumericToken(out);
      break;
    case "currency_default":
      out = normaliseCurrency(out);
      break;
    case "expression_default":
      out = normaliseExpression(out);
      break;
    case "units_default":
      out = normaliseUnits(out);
      break;
    case "text_default":
      out = collapseWhitespace(out);
      if (!profile.caseSensitive) {
        out = out.toLowerCase();
      }
      break;
    case "default":
    default:
      out = normaliseDefault(out, profile);
      if (RESTATEMENT_PREFIX.test(out)) {
        out = out.replace(RESTATEMENT_PREFIX, "");
      }
      break;
  }

  return out.trim();
}

export function profileFromSpec(spec: AnswerSpec): NormalisationProfile {
  return {
    profile: spec.normalisation,
    caseSensitive: spec.caseSensitive ?? false,
  };
}

export function splitValueAndUnits(input: string): { value: string; units: string | null } {
  const trimmed = input.trim();
  const match = trimmed.match(/^(-?[\d.,/\s]+(?:\s+\d+\/\d+)?)\s*(.*)$/);
  if (!match) {
    return { value: trimmed, units: null };
  }
  const value = match[1]!.trim();
  const units = match[2]?.trim() ?? "";
  return { value, units: units.length > 0 ? units : null };
}
