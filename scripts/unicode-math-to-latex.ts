/**
 * §12.5 Unicode-mathematics → LaTeX normalisation.
 * Never treats `$` as a math delimiter (currency uses `$` throughout the corpus).
 */
import { computeRenderHash } from "./lib/render-math-core.js";
import type { Block } from "@edmar/types";

export type ConversionFlags = "manual_latex_review";

export type UnicodeConversionResult = {
  text: string;
  conversionCount: number;
  flags: ConversionFlags[];
};

const SUPERSCRIPT_MAP: Record<string, string> = {
  "⁰": "0",
  "¹": "1",
  "²": "2",
  "³": "3",
  "⁴": "4",
  "⁵": "5",
  "⁶": "6",
  "⁷": "7",
  "⁸": "8",
  "⁹": "9",
};

const SUBSCRIPT_MAP: Record<string, string> = {
  "₀": "0",
  "₁": "1",
  "₂": "2",
  "₃": "3",
  "₄": "4",
  "₅": "5",
  "₆": "6",
  "₇": "7",
  "₈": "8",
  "₉": "9",
};

const GREEK_MAP: Record<string, string> = {
  π: "\\pi",
  θ: "\\theta",
  α: "\\alpha",
  β: "\\beta",
  γ: "\\gamma",
  λ: "\\lambda",
  μ: "\\mu",
  σ: "\\sigma",
  Σ: "\\Sigma",
  Δ: "\\Delta",
};

const COMPARISON_MAP: Record<string, string> = {
  "≤": "\\le",
  "≥": "\\ge",
  "≠": "\\ne",
  "≈": "\\approx",
};

function convertSuperscripts(input: string): { text: string; count: number } {
  let count = 0;
  const text = input.replace(/([A-Za-z0-9]+)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (_, base: string, sup: string) => {
    count += 1;
    const digits = [...sup].map((c) => SUPERSCRIPT_MAP[c] ?? c).join("");
    return `${base}^{${digits}}`;
  });
  return { text, count };
}

function convertSubscripts(input: string): { text: string; count: number } {
  let count = 0;
  const text = input.replace(/([A-Za-z])([₀₁₂₃₄₅₆₇₈₉]+)/g, (_, base: string, sub: string) => {
    count += 1;
    const digits = [...sub].map((c) => SUBSCRIPT_MAP[c] ?? c).join("");
    return `${base}_{${digits}}`;
  });
  return { text, count };
}

function convertSimpleFractions(input: string): { text: string; count: number } {
  let count = 0;
  const text = input.replace(/(?<!\d)(\d+)\/(\d+)(?!\d)/g, (_, num: string, den: string) => {
    count += 1;
    return `\\frac{${num}}{${den}}`;
  });
  return { text, count };
}

function convertMixedNumbers(input: string): { text: string; count: number } {
  let count = 0;
  const text = input.replace(/(?<!\d)(\d+) (\d+\/\d+)/g, (_, whole: string, frac: string) => {
    count += 1;
    const [num, den] = frac.split("/");
    return `${whole}\\frac{${num}}{${den}}`;
  });
  return { text, count };
}

function convertSetOperators(input: string): { text: string; count: number } {
  let count = 0;
  let text = input;
  for (const [unicode, latex] of [
    ["∪", "\\cup"],
    ["∩", "\\cap"],
    ["∈", "\\in"],
    ["∉", "\\notin"],
    ["∅", "\\emptyset"],
    ["∴", "\\therefore"],
    ["∵", "\\because"],
  ] as const) {
    if (text.includes(unicode)) {
      count += (text.match(new RegExp(unicode, "g")) ?? []).length;
      text = text.replaceAll(unicode, latex);
    }
  }
  return { text, count };
}

function convertComparisons(input: string): { text: string; count: number } {
  let count = 0;
  let text = input;
  for (const [unicode, latex] of Object.entries(COMPARISON_MAP)) {
    if (text.includes(unicode)) {
      count += (text.match(new RegExp(unicode, "g")) ?? []).length;
      text = text.replaceAll(unicode, latex);
    }
  }
  return { text, count };
}

function convertOperators(input: string): { text: string; count: number } {
  let count = 0;
  let text = input;
  for (const [unicode, latex] of [
    ["×", "\\times"],
    ["÷", "\\div"],
    ["·", "\\cdot"],
  ] as const) {
    if (text.includes(unicode)) {
      count += (text.match(new RegExp(unicode, "g")) ?? []).length;
      text = text.replaceAll(unicode, latex);
    }
  }
  return { text, count };
}

function convertDegrees(input: string): { text: string; count: number } {
  let count = 0;
  const text = input.replace(/(\d+)°/g, (_, n: string) => {
    count += 1;
    return `${n}^{\\circ}`;
  });
  return { text, count };
}

function convertSquareRoots(input: string): { text: string; count: number } {
  let count = 0;
  const text = input.replace(/√(\d+)/g, (_, n: string) => {
    count += 1;
    return `\\sqrt{${n}}`;
  });
  return { text, count };
}

function convertGreek(input: string): { text: string; count: number } {
  let count = 0;
  let text = input;
  for (const [unicode, latex] of Object.entries(GREEK_MAP)) {
    if (text.includes(unicode)) {
      count += (text.match(new RegExp(unicode, "g")) ?? []).length;
      text = text.replaceAll(unicode, latex);
    }
  }
  return { text, count };
}

function convertMatrixBracketSemicolon(input: string): { text: string; count: number } {
  let count = 0;
  const text = input.replace(/\[([^\]]+)\]/g, (match, inner: string) => {
    if (!inner.includes(";")) {
      return match;
    }
    count += 1;
    const rows = inner.split(";").map((row: string) => row.trim().split(/\s+/).join(" & "));
    return `\\begin{pmatrix}${rows.join(" \\\\ ")}\\end{pmatrix}`;
  });
  return { text, count };
}

/** Apply §12.5 conversion rules in order. */
export function convertUnicodeMathToLatex(input: string): UnicodeConversionResult {
  const flags: ConversionFlags[] = [];
  let text = input;
  let conversionCount = 0;

  const steps = [
    convertSuperscripts,
    convertSubscripts,
    convertMixedNumbers,
    convertSimpleFractions,
    convertSetOperators,
    convertComparisons,
    convertOperators,
    convertDegrees,
    convertSquareRoots,
    convertGreek,
    convertMatrixBracketSemicolon,
  ];

  for (const step of steps) {
    const result = step(text);
    text = result.text;
    conversionCount += result.count;
  }

  if (text.includes("$") && !text.includes("\\$")) {
    // Currency `$` is left as plain text — never a delimiter.
  }

  if (/[²³⁴⁵⁶⁷⁸⁹⁰₁₂₃₄₅₆₇₈₉₀]/.test(input) && conversionCount === 0) {
    flags.push("manual_latex_review");
  }

  return { text, conversionCount, flags };
}

const LATEX_SEGMENT =
  /\\(?:frac\{[^{}]*\}\{[^{}]*\}|sqrt\{[^{}]*\}|begin\{pmatrix\}[\s\S]*?\\end\{pmatrix\}|[a-zA-Z]+(?:\{[^{}]*\})*(?:\^\{[^{}]*\}|_\{[^{}]*\})*)/g;

/** Split converted text into text/math blocks with render hashes. */
export function buildBlocksFromConvertedText(converted: string): Block[] {
  const blocks: Block[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  LATEX_SEGMENT.lastIndex = 0;
  while ((match = LATEX_SEGMENT.exec(converted)) !== null) {
    const before = converted.slice(lastIndex, match.index);
    if (before.length > 0) {
      blocks.push({ type: "text", value: before });
    }
    const latex = match[0];
    blocks.push({
      type: "math",
      latex,
      style: "inline",
      renderHash: computeRenderHash(latex, "inline"),
    });
    lastIndex = match.index + latex.length;
  }

  const tail = converted.slice(lastIndex);
  if (tail.length > 0 || blocks.length === 0) {
    blocks.push({ type: "text", value: tail.length > 0 ? tail : converted });
  }

  return blocks;
}

export function textToStemBlocks(raw: string): {
  stemPlain: string;
  stemBlocks: Block[];
  conversionCount: number;
  flags: ConversionFlags[];
} {
  const stemPlain = raw.trim();
  const converted = convertUnicodeMathToLatex(stemPlain);
  const stemBlocks = buildBlocksFromConvertedText(converted.text);
  return {
    stemPlain,
    stemBlocks,
    conversionCount: converted.conversionCount,
    flags: converted.flags,
  };
}
