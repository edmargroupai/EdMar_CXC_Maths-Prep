import type { Decimal, NumericParseResult, Rational } from "./types.js";

function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

export function reduceRational(num: bigint, den: bigint): Rational {
  if (den === 0n) {
    throw new Error("division by zero in fraction");
  }
  if (den < 0n) {
    num = -num;
    den = -den;
  }
  const g = gcd(num, den);
  return { kind: "rational", num: num / g, den: den / g };
}

export function rationalToString(r: Rational): string {
  if (r.den === 1n) {
    return r.num.toString();
  }
  return `${r.num}/${r.den}`;
}

export function rationalToNumber(r: Rational): number {
  return Number(r.num) / Number(r.den);
}

export function compareRationals(a: Rational, b: Rational): boolean {
  return a.num * b.den === b.num * a.den;
}

function parseFractionToken(token: string): Rational | null {
  const trimmed = token.trim().replace(/\s+/g, "");

  const parenMatch = trimmed.match(/^\(-(\d+)\/(\d+)\)$/);
  if (parenMatch) {
    return reduceRational(-BigInt(parenMatch[1]!), BigInt(parenMatch[2]!));
  }

  const negParenMatch = trimmed.match(/^-\((\d+)\/(\d+)\)$/);
  if (negParenMatch) {
    return reduceRational(-BigInt(negParenMatch[1]!), BigInt(negParenMatch[2]!));
  }

  const slashMatch = trimmed.match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
  if (slashMatch) {
    return reduceRational(BigInt(slashMatch[1]!), BigInt(slashMatch[2]!));
  }

  const doubleNegMatch = trimmed.match(/^-\(-(\d+)\/(\d+)\)$/);
  if (doubleNegMatch) {
    return reduceRational(BigInt(doubleNegMatch[1]!), BigInt(doubleNegMatch[2]!));
  }

  return null;
}

function parseMixedNumber(token: string): Rational | null {
  const match = token.trim().match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (!match) {
    return null;
  }
  const whole = BigInt(match[1]!);
  const num = BigInt(match[2]!);
  const den = BigInt(match[3]!);
  const sign = whole < 0n ? -1n : 1n;
  const absWhole = whole < 0n ? -whole : whole;
  const improperNum = absWhole * den + num;
  return reduceRational(sign * improperNum, den);
}

function parseDecimal(token: string): Decimal | null {
  const trimmed = token.trim();
  if (!/^-?\d*\.?\d+$/.test(trimmed) && !/^-?\d+\.$/.test(trimmed)) {
    if (!/^-?\d+$/.test(trimmed)) {
      return null;
    }
  }
  const normalized = trimmed.endsWith(".") ? trimmed.slice(0, -1) : trimmed;
  if (normalized === "" || normalized === "-" || normalized === ".") {
    return null;
  }
  return { kind: "decimal", value: normalized };
}

/**
 * Parse a numeric string to an exact rational or decimal representation.
 */
export function parseNumeric(input: string): NumericParseResult | null {
  if (!input || input.trim() === "") {
    return null;
  }

  const trimmed = input.trim().replace(/\s+/g, " ");

  const mixed = parseMixedNumber(trimmed);
  if (mixed) {
    return mixed;
  }

  const fraction = parseFractionToken(trimmed);
  if (fraction) {
    return fraction;
  }

  return parseDecimal(trimmed);
}

export function numericToNumber(value: NumericParseResult): number {
  if (value.kind === "decimal") {
    return Number(value.value);
  }
  return rationalToNumber(value);
}

export function isUnreducedFraction(input: string, reduced: Rational): boolean {
  const slashMatch = input.trim().match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
  if (!slashMatch) {
    return false;
  }
  const num = BigInt(slashMatch[1]!);
  const den = BigInt(slashMatch[2]!);
  if (den === 0n) {
    return false;
  }
  const g = gcd(num < 0n ? -num : num, den < 0n ? -den : den);
  return g > 1n && compareRationals({ kind: "rational", num, den }, reduced);
}

export function countDecimalPlaces(input: string): number {
  const match = input.match(/\.(\d+)/);
  return match ? match[1]!.length : 0;
}

export function countSignificantFigures(input: string): number {
  const trimmed = input.trim();
  if (!trimmed || trimmed === "-" || trimmed === "+") {
    return 0;
  }

  const cleaned = trimmed.replace(/^[-+]/, "");

  if (cleaned.includes(".")) {
    const withoutLeadingZeros = cleaned.replace(/^0+\./, "0.");
    const digits = withoutLeadingZeros.replace(/[^0-9]/g, "");
    if (digits.length === 0) {
      return 0;
    }
    const [intPart, fracPart = ""] = withoutLeadingZeros.split(".");
    const intDigits = intPart!.replace(/^0+/, "") || "0";
    if (intDigits !== "0" && intDigits !== "") {
      return intDigits.replace(/[^0-9]/g, "").length + fracPart.replace(/[^0-9]/g, "").length;
    }
    const fracTrimmed = fracPart.replace(/^0+/, "");
    return fracTrimmed.length > 0 ? fracTrimmed.length : 1;
  }

  const noLeading = cleaned.replace(/^0+/, "") || "0";
  return noLeading.length;
}

export function hasTrailingDecimalPoint(input: string): boolean {
  return /\.$/.test(input.trim());
}
