import { create, all } from "mathjs";

const math = create(all, {});

const EPSILON = 1e-9;

/**
 * Tier 1 expression canonical form: parse, expand, sort terms, normalise spacing.
 */
export function canonicaliseExpression(input: string): string | null {
  try {
    const node = math.parse(input);
    const simplified = math.simplify(node);
    const expanded = math.simplify(math.parse(simplified.toString()));
    const terms = splitTopLevelTerms(expanded.toString());
    terms.sort((a, b) => compareTerms(a, b));
    return terms.join("+").replace(/\+\-/g, "-");
  } catch {
    return null;
  }
}

function splitTopLevelTerms(expr: string): string[] {
  const terms: string[] = [];
  let current = "";
  let depth = 0;
  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i]!;
    if (ch === "(") {
      depth++;
      current += ch;
    } else if (ch === ")") {
      depth--;
      current += ch;
    } else if ((ch === "+" || ch === "-") && depth === 0 && current.length > 0) {
      terms.push(current.trim());
      current = ch === "-" ? "-" : "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) {
    terms.push(current.trim());
  }
  return terms.length > 0 ? terms : [expr];
}

/** @internal Exported for branch-coverage tests only. */
export function compareTerms(a: string, b: string): number {
  const varPartA = extractVariablePart(a);
  const varPartB = extractVariablePart(b);
  if (varPartA !== varPartB) {
    return varPartA.localeCompare(varPartB);
  }
  return coefficientOf(a) - coefficientOf(b);
}

function extractVariablePart(term: string): string {
  const cleaned = term.replace(/^[\-+]?(\d+\*?|\d+\/\d+\*?)?/, "").replace(/\*/g, "");
  return cleaned || "";
}

/** @internal Exported for branch-coverage tests only. */
export function coefficientOf(term: string): number {
  const match = term.match(/^[\-+]?(\d+(?:\.\d+)?|\d+\/\d+)?/);
  if (!match || match[0] === "" || match[0] === "+" || match[0] === "-") {
    return term.startsWith("-") ? -1 : 1;
  }
  return parseFloat(match[0]);
}

export function expressionsEquivalentTier1(a: string, b: string): boolean {
  const canonA = canonicaliseExpression(a);
  const canonB = canonicaliseExpression(b);
  if (canonA === null || canonB === null) {
    return false;
  }
  if (canonA === canonB) {
    return true;
  }
  try {
    const diff = math.simplify(math.parse(`(${canonA})-(${canonB})`));
    const val = diff.evaluate({});
    if (typeof val === "number") {
      return Math.abs(val) < EPSILON;
    }
  } catch {
    return false;
  }
  return false;
}

export function isFactorisedForm(input: string): boolean {
  return /\([^)]+\)\([^)]+\)/.test(input.replace(/\s/g, ""));
}

export function normaliseFactorised(input: string): string {
  return input.replace(/\s+/g, "").replace(/\*\*/g, "^");
}

export function factorisedFormsEquivalent(a: string, b: string): boolean {
  const normA = normaliseFactorised(a);
  const normB = normaliseFactorised(b);
  if (normA === normB) {
    return true;
  }
  const factorsA = extractFactors(normA).sort();
  const factorsB = extractFactors(normB).sort();
  if (factorsA.length !== factorsB.length) {
    return false;
  }
  return factorsA.every((f, i) => f === factorsB[i]);
}

/** @internal Exported for branch-coverage tests only. */
export function extractFactors(expr: string): string[] {
  const factors: string[] = [];
  let depth = 0;
  let current = "";
  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i]!;
    if (ch === "(") {
      if (depth === 0 && current) {
        factors.push(current);
        current = "";
      }
      depth++;
      current += ch;
    } else if (ch === ")") {
      current += ch;
      depth--;
      if (depth === 0) {
        factors.push(current);
        current = "";
      }
    } else {
      current += ch;
    }
  }
  if (current) {
    factors.push(current);
  }
  return factors.filter(Boolean);
}
