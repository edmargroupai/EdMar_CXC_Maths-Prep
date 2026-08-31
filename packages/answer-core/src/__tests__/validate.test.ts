import { describe, expect, it } from "vitest";
import { validate, normalise, parseNumeric } from "../index.js";
import {
  sellingPriceSpec,
  fractionSpec,
  numericSfSpec,
  withUnitsSpec,
  withUnitsConvertibleSpec,
  expressionSpec,
  factorisedSpec,
  ratioSpec,
  optionIdSpec,
  type FixtureCase,
} from "./fixtures.js";
import type { AnswerSpec } from "@edmar/types";

function assertCase({ input, spec, expected, label }: FixtureCase) {
  const result = validate(input, spec);
  expect(result.isCorrect, label ?? String(input)).toBe(expected.isCorrect);
  if (expected.reason !== undefined) {
    expect(result.reason, label ?? String(input)).toBe(expected.reason);
  }
  if (expected.matchedCommonErrorKey !== undefined) {
    expect(result.matchedCommonErrorKey).toBe(expected.matchedCommonErrorKey);
  }
}

describe("§27.2 currency / numeric_dp — selling price $540", () => {
  const cases: FixtureCase[] = [
    { input: "540", spec: sellingPriceSpec, expected: { isCorrect: true, reason: "exact" } },
    { input: "540.0", spec: sellingPriceSpec, expected: { isCorrect: true } },
    { input: "540.00", spec: sellingPriceSpec, expected: { isCorrect: true } },
    { input: "$540", spec: sellingPriceSpec, expected: { isCorrect: true } },
    { input: "$540.00", spec: sellingPriceSpec, expected: { isCorrect: true } },
    { input: " 540 ", spec: sellingPriceSpec, expected: { isCorrect: true } },
    { input: "540.", spec: sellingPriceSpec, expected: { isCorrect: true } },
    { input: "$ 540.00", spec: sellingPriceSpec, expected: { isCorrect: true } },
    { input: "539.99", spec: sellingPriceSpec, expected: { isCorrect: false } },
    { input: "5400", spec: sellingPriceSpec, expected: { isCorrect: false } },
    { input: "", spec: sellingPriceSpec, expected: { isCorrect: false } },
    { input: "abc", spec: sellingPriceSpec, expected: { isCorrect: false, reason: "unparseable" } },
    { input: "540 cm", spec: sellingPriceSpec, expected: { isCorrect: false } },
    { input: "540.000", spec: sellingPriceSpec, expected: { isCorrect: true, reason: "exact" } },
    {
      input: "470",
      spec: sellingPriceSpec,
      expected: { isCorrect: false, matchedCommonErrorKey: "pct_on_selling_price" },
    },
  ];

  it.each(cases)("$input", (c) => assertCase(c));
});

describe("§27.2 fraction — 23/20", () => {
  const cases: FixtureCase[] = [
    { input: "23/20", spec: fractionSpec, expected: { isCorrect: true } },
    { input: "1 3/20", spec: fractionSpec, expected: { isCorrect: true } },
    { input: "46/40", spec: fractionSpec, expected: { isCorrect: true, reason: "not_simplified" } },
    { input: "-(-23/20)", spec: fractionSpec, expected: { isCorrect: true } },
    { input: "23 / 20", spec: fractionSpec, expected: { isCorrect: true } },
    { input: "20/23", spec: fractionSpec, expected: { isCorrect: false } },
    { input: "1.15", spec: fractionSpec, expected: { isCorrect: false } },
    { input: "23\\20", spec: fractionSpec, expected: { isCorrect: false, reason: "unparseable" } },
  ];

  it.each(cases)("$input", (c) => assertCase(c));
});

describe("§27.2 numeric_sf — 58.7", () => {
  const cases: FixtureCase[] = [
    { input: "58.7", spec: numericSfSpec, expected: { isCorrect: true } },
    { input: "58.74", spec: numericSfSpec, expected: { isCorrect: false, reason: "wrong_precision" } },
    { input: "58.73", spec: numericSfSpec, expected: { isCorrect: false, reason: "wrong_precision" } },
    { input: "59", spec: numericSfSpec, expected: { isCorrect: false, reason: "wrong_precision" } },
  ];

  it.each(cases)("$input", (c) => assertCase(c));
});

describe("§27.2 with_units — 40 cm²", () => {
  const cases: FixtureCase[] = [
    { input: "40 cm²", spec: withUnitsSpec, expected: { isCorrect: true } },
    { input: "40cm2", spec: withUnitsSpec, expected: { isCorrect: true } },
    { input: "40 cm^2", spec: withUnitsSpec, expected: { isCorrect: true } },
    { input: "40 sq cm", spec: withUnitsSpec, expected: { isCorrect: true } },
    { input: "40 square cm", spec: withUnitsSpec, expected: { isCorrect: true } },
    { input: "40", spec: withUnitsSpec, expected: { isCorrect: false, reason: "wrong_units" } },
    { input: "40 cm", spec: withUnitsSpec, expected: { isCorrect: false, reason: "wrong_units" } },
    { input: "40 cm³", spec: withUnitsSpec, expected: { isCorrect: false, reason: "wrong_units" } },
    { input: "4000 mm²", spec: withUnitsConvertibleSpec, expected: { isCorrect: true } },
  ];

  it.each(cases)("$input", (c) => assertCase(c));
});

describe("§27.2 expression — 8a + b", () => {
  const cases: FixtureCase[] = [
    { input: "8a + b", spec: expressionSpec, expected: { isCorrect: true } },
    { input: "b + 8a", spec: expressionSpec, expected: { isCorrect: true } },
    { input: "8*a+b", spec: expressionSpec, expected: { isCorrect: true } },
    { input: "8a+1b", spec: expressionSpec, expected: { isCorrect: true } },
    { input: " 8 a + b ", spec: expressionSpec, expected: { isCorrect: true } },
    { input: "8ab", spec: expressionSpec, expected: { isCorrect: false } },
    { input: "9a", spec: expressionSpec, expected: { isCorrect: false } },
    { input: "8a - b", spec: expressionSpec, expected: { isCorrect: false } },
  ];

  it.each(cases)("$input", (c) => assertCase(c));
});

describe("§27.2 expression factorised", () => {
  const cases: FixtureCase[] = [
    { input: "(x+1)(x+2)", spec: factorisedSpec, expected: { isCorrect: true } },
    { input: "(x+2)(x+1)", spec: factorisedSpec, expected: { isCorrect: true } },
    { input: "x^2+3x+2", spec: factorisedSpec, expected: { isCorrect: false } },
  ];

  it.each(cases)("$input", (c) => assertCase(c));
});

describe("§27.2 ratio — 3:5", () => {
  const cases: FixtureCase[] = [
    { input: "3:5", spec: ratioSpec, expected: { isCorrect: true } },
    { input: "3 : 5", spec: ratioSpec, expected: { isCorrect: true } },
    { input: "6:10", spec: ratioSpec, expected: { isCorrect: false, reason: "not_simplified" } },
  ];

  it.each(cases)("$input", (c) => assertCase(c));
});

describe("§27.2 option_id", () => {
  const cases: FixtureCase[] = [
    { input: "B", spec: optionIdSpec, expected: { isCorrect: true } },
    { input: "A", spec: optionIdSpec, expected: { isCorrect: false, matchedCommonErrorKey: "common_wrong" } },
    { input: "", spec: optionIdSpec, expected: { isCorrect: false } },
  ];

  it.each(cases)("$input", (c) => assertCase(c));
});

describe("unsupported answer types throw", () => {
  const base: AnswerSpec = {
    answerType: "set",
    canonicalValue: "1",
    displayValue: "1",
    acceptedForms: ["1"],
    tolerance: { kind: "none", value: 0 },
    precision: { kind: "none", value: 0, required: false },
    units: { requirement: "none", canonical: null, acceptedSet: [] },
    normalisation: "default",
  };

  for (const type of ["set", "interval", "matrix", "vector", "text"] as const) {
    it(`throws for ${type}`, () => {
      expect(() => validate("1", { ...base, answerType: type })).toThrow(/not supported in MVP/);
    });
  }

  it("throws for structured", () => {
    expect(() =>
      validate("1", {
        ...base,
        answerType: "numeric_exact",
        parts: { a: { ...base, answerType: "numeric_exact" } },
      }),
    ).toThrow(/structured/);
  });
});

describe("additional validators", () => {
  const numericBase: AnswerSpec = {
    answerType: "numeric_exact",
    canonicalValue: "42",
    displayValue: "42",
    acceptedForms: ["42"],
    tolerance: { kind: "absolute", value: 0 },
    precision: { kind: "none", value: 0, required: false },
    units: { requirement: "none", canonical: null, acceptedSet: [] },
    normalisation: "numeric_default",
  };

  it("boolean true/false", () => {
    const spec: AnswerSpec = { ...numericBase, answerType: "boolean", canonicalValue: "true", acceptedForms: ["true"] };
    expect(validate("true", spec).isCorrect).toBe(true);
    expect(validate("false", spec).isCorrect).toBe(false);
  });

  it("option_set", () => {
    const spec: AnswerSpec = {
      ...numericBase,
      answerType: "option_set",
      canonicalValue: ["A", "C"],
      acceptedForms: ["A,C"],
    };
    expect(validate(["A", "C"], spec).isCorrect).toBe(true);
    expect(validate(["C", "A"], spec).isCorrect).toBe(true);
    expect(validate(["A", "B"], spec).isCorrect).toBe(false);
  });

  it("numeric_tolerance relative", () => {
    const spec: AnswerSpec = {
      ...numericBase,
      answerType: "numeric_tolerance",
      canonicalValue: "100",
      tolerance: { kind: "relative", value: 0.01 },
    };
    expect(validate("100.5", spec).isCorrect).toBe(true);
    expect(validate("102", spec).isCorrect).toBe(false);
  });

  it("numeric_tolerance range", () => {
    const spec: AnswerSpec = {
      ...numericBase,
      answerType: "numeric_tolerance",
      canonicalValue: "10",
      tolerance: { kind: "range", min: 9, max: 11 },
    };
    expect(validate("9.5", spec).reason).toBe("tolerance");
    expect(validate("12", spec).isCorrect).toBe(false);
  });

  it("coordinate", () => {
    const spec: AnswerSpec = {
      ...numericBase,
      answerType: "coordinate",
      canonicalValue: "(3, 4)",
      acceptedForms: ["(3,4)", "(3, 4)"],
    };
    expect(validate("(3, 4)", spec).isCorrect).toBe(true);
    expect(validate("(4, 3)", spec).isCorrect).toBe(false);
  });

  it("fraction lowestTerms required rejects unreduced", () => {
    const spec: AnswerSpec = {
      ...fractionSpec,
      form: { lowestTerms: true, simplifiedSurd: false, specifiedForm: null },
    };
    expect(validate("46/40", spec).reason).toBe("not_simplified");
  });

  it("numeric_dp wrong precision when not in acceptedForms", () => {
    const spec: AnswerSpec = {
      ...sellingPriceSpec,
      answerType: "numeric_dp",
      normalisation: "numeric_default",
      acceptedForms: ["540.00"],
    };
    expect(validate("540", spec).reason).toBe("wrong_precision");
  });
});

describe("normalise", () => {
  it("unicode minus and whitespace", () => {
    expect(normalise("  −540  ", { profile: "numeric_default" })).toBe("-540");
    expect(normalise("  540  ", { profile: "numeric_default" })).toBe("540");
  });

  it("expression profile", () => {
    expect(normalise("2×x", { profile: "expression_default" })).toBe("2*x");
  });

  it("text case folding", () => {
    expect(normalise("Hello", { profile: "text_default" })).toBe("hello");
  });

  it("text case sensitive", () => {
    expect(normalise("Hello", { profile: "text_default", caseSensitive: true })).toBe("Hello");
  });

  it("currency strip", () => {
    expect(normalise("J$100", { profile: "currency_default" })).toBe("100");
  });

  it("handles nullish input", () => {
    expect(normalise(null as unknown as string, { profile: "default" })).toBe("");
  });
});

describe("parseNumeric", () => {
  it("parses fraction", () => {
    const r = parseNumeric("23/20");
    expect(r?.kind).toBe("rational");
    if (r?.kind === "rational") {
      expect(r.num).toBe(23n);
      expect(r.den).toBe(20n);
    }
  });

  it("parses mixed number", () => {
    const r = parseNumeric("1 3/20");
    expect(r?.kind).toBe("rational");
  });

  it("parses decimal", () => {
    const d = parseNumeric("3.14");
    expect(d?.kind).toBe("decimal");
  });

  it("returns null for empty", () => {
    expect(parseNumeric("")).toBeNull();
    expect(parseNumeric("abc")).toBeNull();
  });
});
