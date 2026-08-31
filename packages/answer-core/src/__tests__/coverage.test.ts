import { describe, expect, it } from "vitest";
import {
  canonicaliseExpression,
  coefficientOf,
  compareTerms,
  expressionsEquivalentTier1,
  extractFactors,
  factorisedFormsEquivalent,
  isFactorisedForm,
  normaliseFactorised,
} from "../equivalence.js";
import { normalise, profileFromSpec, splitValueAndUnits } from "../normalise.js";
import {
  compareRationals,
  countDecimalPlaces,
  countSignificantFigures,
  hasTrailingDecimalPoint,
  isUnreducedFraction,
  parseNumeric,
  reduceRational,
  rationalToString,
  numericToNumber,
} from "../parse.js";
import { canonicaliseUnit, convertUnitValue, normaliseUnitToken, unitsMatch } from "../units.js";
import { validate } from "../index.js";
import type { AnswerSpec } from "@edmar/types";
import { expressionSpec, factorisedSpec, withUnitsSpec } from "./fixtures.js";
import {
  equivalentFormResult,
  exactResult,
  matchAcceptedForm,
} from "../validators/helpers.js";

const baseSpec: AnswerSpec = {
  answerType: "numeric_exact",
  canonicalValue: "1",
  displayValue: "1",
  acceptedForms: ["1"],
  tolerance: { kind: "absolute", value: 0 },
  precision: { kind: "none", value: 0, required: false },
  units: { requirement: "none", canonical: null, acceptedSet: [] },
  normalisation: "numeric_default",
};

describe("parse edge cases", () => {
  it("reduceRational and rationalToString", () => {
    expect(() => reduceRational(1n, 0n)).toThrow(/division by zero/);
    const r = reduceRational(-6n, -8n);
    expect(rationalToString(r)).toBe("3/4");
    expect(compareRationals(r, { kind: "rational", num: 3n, den: 4n })).toBe(true);
  });

  it("paren fraction forms", () => {
    expect(parseNumeric("(-3/4)")?.kind).toBe("rational");
    expect(parseNumeric("-(-23/20)")?.kind).toBe("rational");
    expect(parseNumeric("-(3/4)")?.kind).toBe("rational");
  });

  it("reduceRational negative denominator", () => {
    const r = reduceRational(3n, -4n);
    expect(r.num).toBe(-3n);
    expect(r.den).toBe(4n);
  });

  it("decimal edge cases", () => {
    expect(parseNumeric("-")).toBeNull();
    expect(parseNumeric(".")).toBeNull();
    expect(parseNumeric("540.")).toEqual({ kind: "decimal", value: "540" });
    expect(hasTrailingDecimalPoint("540.")).toBe(true);
  });

  it("count precision helpers", () => {
    expect(countDecimalPlaces("540.00")).toBe(2);
    expect(countSignificantFigures("0.0058")).toBeGreaterThan(0);
    expect(countSignificantFigures("100")).toBe(3);
    expect(countSignificantFigures("-")).toBe(0);
    expect(countSignificantFigures("+")).toBe(0);
    expect(compareRationals({ kind: "rational", num: 1n, den: 2n }, { kind: "rational", num: 2n, den: 4n })).toBe(
      true,
    );
    expect(isUnreducedFraction("46/40", { kind: "rational", num: 23n, den: 20n })).toBe(true);
    expect(isUnreducedFraction("23/20", { kind: "rational", num: 23n, den: 20n })).toBe(false);
    expect(isUnreducedFraction("0/0", { kind: "rational", num: 0n, den: 1n })).toBe(false);
  });
});

describe("normalise edge cases", () => {
  it("default profile with restatement", () => {
    expect(normalise("x = 5", { profile: "default" })).toBe("5");
    expect(normalise("Answer = 5", { profile: "default" })).toBe("5");
  });

  it("thousands separators", () => {
    expect(normalise("1,234.5", { profile: "numeric_default" })).toBe("1234.5");
    expect(normalise("1 234.5", { profile: "numeric_default" })).toBe("1234.5");
  });

  it("decimal comma locale", () => {
    expect(normalise("3,14", { profile: "numeric_default" })).toBe("3.14");
    expect(normalise("1,234,56.78", { profile: "numeric_default" })).toBe("1,234,56.78");
  });

  it("expression restatement prefix", () => {
    expect(normalise("y = 2x", { profile: "expression_default" })).toBe("2x");
    expect(normalise("x = 2x", { profile: "expression_default" })).toBe("2x");
  });

  it("percent as unit token", () => {
    expect(normalise("20 %", { profile: "units_default" })).toBe("20 %");
  });

  it("cm3 aliases", () => {
    expect(normalise("5 cm3", { profile: "units_default" })).toContain("cm^3");
  });

  it("profileFromSpec", () => {
    expect(profileFromSpec({ ...baseSpec, caseSensitive: true }).caseSensitive).toBe(true);
  });

  it("splitValueAndUnits", () => {
    expect(splitValueAndUnits("40 cm^2").units).toBe("cm^2");
    expect(splitValueAndUnits("hello").value).toBe("hello");
  });
});

describe("units", () => {
  it("canonicalise and match", () => {
    expect(canonicaliseUnit("sq cm")).toBe("cm^2");
    expect(unitsMatch("cm2", "cm^2", [])).toBe(true);
    expect(unitsMatch("m", "cm^2", [])).toBe(false);
    expect(normaliseUnitToken("mm²")).toBe("mm^2");
  });

  it("convertUnitValue", () => {
    expect(convertUnitValue(40, "cm^2", "mm^2")).toBe(4000);
    expect(convertUnitValue(4000, "mm^2", "cm^2")).toBe(40);
    expect(convertUnitValue(1, "cm^2", "cm^2")).toBe(1);
    expect(convertUnitValue(1, "cm^2", "m^2")).toBeNull();
  });
});

describe("equivalence", () => {
  it("canonicaliseExpression", () => {
    expect(canonicaliseExpression("2x+3")).toBeTruthy();
    expect(canonicaliseExpression("not valid @@")).toBeNull();
  });

  it("expressionsEquivalentTier1", () => {
    expect(expressionsEquivalentTier1("2x+3", "3+2x")).toBe(true);
    expect(expressionsEquivalentTier1("2x+3", "2x+4")).toBe(false);
    expect(expressionsEquivalentTier1("bad", "2x+3")).toBe(false);
  });

  it("factorised helpers", () => {
    expect(isFactorisedForm("(x+1)(x+2)")).toBe(true);
    expect(normaliseFactorised("(x + 1)(x + 2)")).toBe("(x+1)(x+2)");
    expect(factorisedFormsEquivalent("(x+2)(x+1)", "(x+1)(x+2)")).toBe(true);
    expect(factorisedFormsEquivalent("(x+1)(x+2)", "(x+1)(x+3)")).toBe(false);
    expect(factorisedFormsEquivalent("x(x+1)", "x(x+1)")).toBe(true);
  });
});

describe("helpers exports", () => {
  it("result builders", () => {
    expect(exactResult("1").isCorrect).toBe(true);
    expect(equivalentFormResult("1").reason).toBe("equivalent_form");
    expect(matchAcceptedForm("1", baseSpec)?.matched).toBe("1");
  });
});

describe("validator branch coverage", () => {
  it("boolean variants", () => {
    const spec: AnswerSpec = {
      ...baseSpec,
      answerType: "boolean",
      canonicalValue: "true",
      acceptedForms: ["true"],
      normalisation: "default",
    };
    expect(validate("yes", spec).isCorrect).toBe(true);
    expect(validate("T", spec).isCorrect).toBe(true);
    expect(validate("no", spec).isCorrect).toBe(false);
    expect(validate([], spec).isCorrect).toBe(false);
  });

  it("option_id array input", () => {
    const spec: AnswerSpec = { ...baseSpec, answerType: "option_id", canonicalValue: "A", acceptedForms: ["A"] };
    expect(validate([], spec).isCorrect).toBe(false);
  });

  it("option_set empty", () => {
    const spec: AnswerSpec = {
      ...baseSpec,
      answerType: "option_set",
      canonicalValue: ["A"],
      acceptedForms: ["A"],
    };
    expect(validate([], spec).isCorrect).toBe(false);
  });

  it("numeric no tolerance default", () => {
    const spec: AnswerSpec = {
      ...baseSpec,
      answerType: "numeric_exact",
      canonicalValue: "0.001",
      tolerance: { kind: "none", value: 0 },
    };
    expect(validate("0.001", spec).isCorrect).toBe(true);
  });

  it("numeric_sf without precision required", () => {
    const spec: AnswerSpec = {
      ...baseSpec,
      answerType: "numeric_sf",
      canonicalValue: "58.7",
      precision: { kind: "significant_figures", value: 3, required: false },
      tolerance: { kind: "absolute", value: 0.05 },
    };
    expect(validate("58.74", spec).isCorrect).toBe(true);
  });

  it("numeric relative zero canonical", () => {
    const spec: AnswerSpec = {
      ...baseSpec,
      answerType: "numeric_tolerance",
      canonicalValue: "0",
      tolerance: { kind: "relative", value: 0.01 },
    };
    expect(validate("0", spec).isCorrect).toBe(true);
  });

  it("currency with spurious units", () => {
    const spec: AnswerSpec = {
      ...baseSpec,
      answerType: "currency",
      canonicalValue: "100",
      normalisation: "currency_default",
      precision: { kind: "decimal_places", value: 2, required: false },
      tolerance: { kind: "absolute", value: 0.01 },
    };
    expect(validate("100 USD", spec).isCorrect).toBe(false);
  });

  it("fraction decimal in acceptedForms", () => {
    const spec: AnswerSpec = {
      ...baseSpec,
      answerType: "fraction",
      canonicalValue: "0.75",
      acceptedForms: ["0.75", "3/4"],
      normalisation: "numeric_default",
    };
    expect(validate("0.75", spec).isCorrect).toBe(true);
  });

  it("fraction unparseable rational canonical", () => {
    const spec: AnswerSpec = {
      ...baseSpec,
      answerType: "fraction",
      canonicalValue: "not-a-fraction",
      acceptedForms: [],
      normalisation: "numeric_default",
    };
    expect(validate("1/2", spec).reason).toBe("unparseable");
  });

  it("ratio unparseable", () => {
    const spec: AnswerSpec = {
      ...baseSpec,
      answerType: "ratio",
      canonicalValue: "1:2",
      acceptedForms: ["1:2"],
      form: { simplestRatio: false },
    };
    expect(validate(":", spec).reason).toBe("unparseable");
    expect(validate("a:b", spec).reason).toBe("unparseable");
  });

  it("ratio without simplest requirement accepts 6:10", () => {
    const spec: AnswerSpec = {
      ...baseSpec,
      answerType: "ratio",
      canonicalValue: "3:5",
      acceptedForms: ["3:5"],
      form: { simplestRatio: false },
    };
    expect(validate("6:10", spec).isCorrect).toBe(true);
  });

  it("with_units optional without unit", () => {
    const spec: AnswerSpec = {
      ...baseSpec,
      answerType: "with_units",
      canonicalValue: "40 cm^2",
      acceptedForms: ["40"],
      normalisation: "units_default",
      units: { requirement: "optional", canonical: "cm^2", acceptedSet: ["cm^2"] },
      tolerance: { kind: "absolute", value: 0 },
    };
    expect(validate("40", spec).isCorrect).toBe(true);
  });

  it("with_units none rejects unit", () => {
    const spec: AnswerSpec = {
      ...baseSpec,
      answerType: "with_units",
      canonicalValue: "40",
      acceptedForms: ["40"],
      normalisation: "units_default",
      units: { requirement: "none", canonical: null, acceptedSet: [] },
      tolerance: { kind: "absolute", value: 0 },
    };
    expect(validate("40 cm", spec).isCorrect).toBe(false);
  });

  it("with_units convertible wrong unit", () => {
    const spec: AnswerSpec = {
      ...baseSpec,
      answerType: "with_units",
      canonicalValue: "40 cm^2",
      acceptedForms: ["40 cm^2"],
      normalisation: "units_default",
      units: { requirement: "convertible", canonical: "cm^2", acceptedSet: ["cm^2", "mm^2"] },
      tolerance: { kind: "absolute", value: 0 },
    };
    expect(validate("40 m^2", spec).reason).toBe("wrong_units");
  });

  it("coordinate unparseable", () => {
    const spec: AnswerSpec = {
      ...baseSpec,
      answerType: "coordinate",
      canonicalValue: "(1,2)",
      acceptedForms: ["(1,2)"],
    };
    expect(validate("not-a-coord", spec).reason).toBe("unparseable");
    expect(validate([], spec).isCorrect).toBe(false);
  });

  it("expression unparseable", () => {
    const spec: AnswerSpec = {
      ...baseSpec,
      answerType: "expression",
      canonicalValue: "8a+b",
      acceptedForms: [],
      normalisation: "expression_default",
    };
    expect(validate("@@invalid@@", spec).reason).toBe("unparseable");
  });

  it("expression factorised wrong factor count", () => {
    const spec: AnswerSpec = {
      ...baseSpec,
      answerType: "expression",
      canonicalValue: "(x+1)(x+2)",
      acceptedForms: ["(x+1)(x+2)"],
      normalisation: "expression_default",
      form: { specifiedForm: "factorised" },
    };
    expect(validate("(x+1)", spec).isCorrect).toBe(false);
  });

  it("validate default throw for unknown type", () => {
    expect(() =>
      validate("1", { ...baseSpec, answerType: "not_a_type" as AnswerSpec["answerType"] }),
    ).toThrow(/not supported in MVP/);
  });

  it("mixed_number answer type", () => {
    const spec: AnswerSpec = {
      ...baseSpec,
      answerType: "mixed_number",
      canonicalValue: "1 3/20",
      acceptedForms: ["1 3/20"],
      normalisation: "numeric_default",
    };
    expect(validate("1 3/20", spec).isCorrect).toBe(true);
  });

  it("numeric array inputs rejected", () => {
    expect(validate([], { ...baseSpec, answerType: "numeric_sf" }).isCorrect).toBe(false);
    expect(validate([], { ...baseSpec, answerType: "numeric_dp" }).isCorrect).toBe(false);
    expect(validate([], { ...baseSpec, answerType: "currency", normalisation: "currency_default" }).isCorrect).toBe(false);
    expect(validate([], { ...baseSpec, answerType: "numeric_tolerance" }).isCorrect).toBe(false);
  });

  it("boolean canonical string match", () => {
    const spec: AnswerSpec = {
      ...baseSpec,
      answerType: "boolean",
      canonicalValue: "false",
      acceptedForms: ["false"],
      normalisation: "default",
    };
    expect(validate("false", spec).isCorrect).toBe(true);
  });

  it("option_set with common error", () => {
    const spec: AnswerSpec = {
      ...baseSpec,
      answerType: "option_set",
      canonicalValue: ["B"],
      acceptedForms: ["B"],
      commonErrorValues: [{ key: "wrong", value: "A" }],
    };
    expect(validate(["A"], spec).matchedCommonErrorKey).toBe("wrong");
  });

  it("with_units common error and bad canonical", () => {
    const spec: AnswerSpec = {
      ...baseSpec,
      answerType: "with_units",
      canonicalValue: "not-numeric cm^2",
      acceptedForms: [],
      normalisation: "units_default",
      units: { requirement: "required", canonical: "cm^2", acceptedSet: ["cm^2"] },
      commonErrorValues: [{ key: "err", value: "1 cm^2" }],
    };
    expect(validate("1 cm^2", spec).matchedCommonErrorKey).toBe("err");
    expect(validate("40 cm^2", spec).reason).toBe("unparseable");
  });

  it("with_units tolerance kinds", () => {
    const relativeSpec: AnswerSpec = {
      ...baseSpec,
      answerType: "with_units",
      canonicalValue: "100 cm^2",
      acceptedForms: ["100 cm^2"],
      normalisation: "units_default",
      units: { requirement: "required", canonical: "cm^2", acceptedSet: ["cm^2"] },
      tolerance: { kind: "relative", value: 0.01 },
    };
    expect(validate("101 cm^2", relativeSpec).isCorrect).toBe(true);

    const rangeSpec: AnswerSpec = {
      ...relativeSpec,
      tolerance: { kind: "range", min: 99, max: 101 },
    };
    expect(validate("99.5 cm^2", rangeSpec).isCorrect).toBe(true);

    const noneSpec: AnswerSpec = {
      ...relativeSpec,
      tolerance: { kind: "none", value: 0 },
    };
    expect(validate("100 cm^2", noneSpec).isCorrect).toBe(true);
  });

  it("coordinate error paths", () => {
    const spec: AnswerSpec = {
      ...baseSpec,
      answerType: "coordinate",
      canonicalValue: "bad",
      acceptedForms: [],
      commonErrorValues: [{ key: "ce", value: "(0,0)" }],
    };
    expect(validate("(0,0)", spec).matchedCommonErrorKey).toBe("ce");
    expect(validate("(0,0)", { ...spec, commonErrorValues: undefined, canonicalValue: "bad" }).reason).toBe(
      "unparseable",
    );
    expect(
      validate("(1,2)", {
        ...spec,
        canonicalValue: "(a,b)",
        commonErrorValues: undefined,
      }).reason,
    ).toBe("unparseable");
  });

  it("expression tier1 equivalent_form via canonical", () => {
    const spec: AnswerSpec = {
      ...baseSpec,
      answerType: "expression",
      canonicalValue: "2x+3",
      acceptedForms: [],
      normalisation: "expression_default",
    };
    expect(validate("3+2x", spec).reason).toBe("equivalent_form");
  });

  it("expression factorised wrong but factorised-looking", () => {
    const spec: AnswerSpec = {
      ...baseSpec,
      answerType: "expression",
      canonicalValue: "(x+1)(x+2)",
      acceptedForms: ["(x+1)(x+2)"],
      normalisation: "expression_default",
      form: { specifiedForm: "factorised" },
    };
    expect(validate("(x+1)(x+3)", spec).isCorrect).toBe(false);
  });

  it("expression array input", () => {
    const spec: AnswerSpec = {
      ...baseSpec,
      answerType: "expression",
      canonicalValue: "x",
      acceptedForms: ["x"],
      normalisation: "expression_default",
    };
    expect(validate([], spec).isCorrect).toBe(false);
  });

  it("fraction accepts decimal when in acceptedForms with matching value", () => {
    const spec: AnswerSpec = {
      ...baseSpec,
      answerType: "fraction",
      canonicalValue: "3/4",
      acceptedForms: ["0.75"],
      normalisation: "numeric_default",
    };
    expect(validate("0.75", spec).isCorrect).toBe(true);
  });

  it("ratio array input", () => {
    expect(validate([], { ...baseSpec, answerType: "ratio", canonicalValue: "1:2", acceptedForms: ["1:2"] }).isCorrect).toBe(
      false,
    );
  });

  it("ratio wrong values and common error", () => {
    const spec: AnswerSpec = {
      ...baseSpec,
      answerType: "ratio",
      canonicalValue: "3:5",
      acceptedForms: ["3:5"],
      form: { simplestRatio: false },
      commonErrorValues: [{ key: "wrong", value: "4:5" }],
    };
    expect(validate("4:5", spec).matchedCommonErrorKey).toBe("wrong");
    expect(validate("3:6", spec).isCorrect).toBe(false);
  });

  it("fraction array input", () => {
    expect(validate([], { ...baseSpec, answerType: "fraction", canonicalValue: "1/2", acceptedForms: ["1/2"] }).isCorrect).toBe(
      false,
    );
  });

  it("numeric tolerance unparseable paths", () => {
    expect(validate("abc", { ...baseSpec, answerType: "numeric_tolerance" }).reason).toBe("unparseable");
    expect(
      validate("1", { ...baseSpec, answerType: "numeric_tolerance", canonicalValue: "bad" }).reason,
    ).toBe("unparseable");
  });

  it("numeric exact unparseable canonical", () => {
    expect(validate("1", { ...baseSpec, answerType: "numeric_exact", canonicalValue: "bad" }).reason).toBe(
      "unparseable",
    );
  });

  it("boolean common error match", () => {
    const spec: AnswerSpec = {
      ...baseSpec,
      answerType: "boolean",
      canonicalValue: "false",
      acceptedForms: ["false"],
      commonErrorValues: [{ key: "picked_true", value: "true" }],
    };
    expect(validate("true", spec).matchedCommonErrorKey).toBe("picked_true");
  });

  it("with_units array input", () => {
    expect(validate([], { ...baseSpec, answerType: "with_units", canonicalValue: "1 cm^2" }).isCorrect).toBe(false);
  });

  it("coordinate canonical y unparseable", () => {
    expect(
      validate("(1,2)", {
        ...baseSpec,
        answerType: "coordinate",
        canonicalValue: "(1, bad)",
        acceptedForms: [],
      }).reason,
    ).toBe("unparseable");
  });

  it("expression factorised reorder match", () => {
    const spec: AnswerSpec = {
      ...baseSpec,
      answerType: "expression",
      canonicalValue: "(x+1)(x+2)",
      acceptedForms: ["(x+1)(x+2)"],
      normalisation: "expression_default",
      form: { specifiedForm: "factorised" },
    };
    expect(validate("(x+2)(x+1)", spec).isCorrect).toBe(true);
  });

  it("expression acceptedForms tier1 match", () => {
    const spec: AnswerSpec = {
      ...baseSpec,
      answerType: "expression",
      canonicalValue: "2x",
      acceptedForms: ["x*2"],
      normalisation: "expression_default",
    };
    expect(validate("2*x", spec).reason).toBe("equivalent_form");
  });

  it("expression factorised expanded equivalent rejected", () => {
    const spec: AnswerSpec = {
      ...baseSpec,
      answerType: "expression",
      canonicalValue: "(x+1)(x+2)",
      acceptedForms: ["(x+1)(x+2)"],
      normalisation: "expression_default",
      form: { specifiedForm: "factorised" },
    };
    expect(validate("x^2+3x+2", spec).isCorrect).toBe(false);
  });

  it("parseDecimal empty normalized", () => {
    expect(parseNumeric(".")).toBeNull();
    expect(parseNumeric("-")).toBeNull();
  });

  it("compareTerms via multi-like terms", () => {
    expect(canonicaliseExpression("2a+3a")).toBeTruthy();
  });

  it("extractFactors with leading factor", () => {
    expect(factorisedFormsEquivalent("2(x+1)(x+2)", "2(x+1)(x+2)")).toBe(true);
  });

  it("coefficient and compareTerms branches", () => {
    expect(canonicaliseExpression("-a+2a")).toBeTruthy();
    expect(canonicaliseExpression("2a+3a")).toBeTruthy();
  });

  it("fraction branches", () => {
    const withAccepted: AnswerSpec = {
      ...baseSpec,
      answerType: "fraction",
      canonicalValue: "23/20",
      acceptedForms: ["46/40"],
      form: { lowestTerms: false },
      normalisation: "numeric_default",
    };
    expect(validate("46/40", withAccepted).reason).toBe("not_simplified");

    const decimalLoop: AnswerSpec = {
      ...baseSpec,
      answerType: "fraction",
      canonicalValue: "3/4",
      acceptedForms: ["0.75"],
      normalisation: "numeric_default",
    };
    expect(validate("0.75", decimalLoop).isCorrect).toBe(true);

    expect(
      validate("1/2", {
        ...baseSpec,
        answerType: "fraction",
        canonicalValue: "1/2",
        acceptedForms: ["1/2"],
        commonErrorValues: [{ key: "half", value: "1/2" }],
      }).matchedCommonErrorKey,
    ).toBe("half");
  });

  it("numeric exact wrong value and tolerance common error", () => {
    expect(validate("2", { ...baseSpec, answerType: "numeric_exact", canonicalValue: "3" }).isCorrect).toBe(false);
    expect(
      validate("5", {
        ...baseSpec,
        answerType: "numeric_tolerance",
        canonicalValue: "10",
        tolerance: { kind: "absolute", value: 1 },
        commonErrorValues: [{ key: "five", value: "5" }],
      }).matchedCommonErrorKey,
    ).toBe("five");
  });

  it("expression common error", () => {
    expect(
      validate("9a", {
        ...expressionSpec,
        commonErrorValues: [{ key: "wrong", value: "9a" }],
      }).matchedCommonErrorKey,
    ).toBe("wrong");
  });

  it("option_set string canonical", () => {
    const spec: AnswerSpec = {
      ...baseSpec,
      answerType: "option_set",
      canonicalValue: "A" as unknown as string[],
      acceptedForms: ["A"],
    };
    expect(validate("A", spec).isCorrect).toBe(true);
  });

  it("option_id empty and boolean unparsed", () => {
    const spec: AnswerSpec = {
      ...baseSpec,
      answerType: "option_id",
      canonicalValue: "B",
      acceptedForms: ["B"],
    };
    expect(validate("", spec).isCorrect).toBe(false);
    expect(
      validate("maybe", {
        ...baseSpec,
        answerType: "boolean",
        canonicalValue: "true",
        acceptedForms: ["true"],
      }).isCorrect,
    ).toBe(false);
  });

  it("with_units withinTol default branch", () => {
    const spec: AnswerSpec = {
      ...baseSpec,
      answerType: "with_units",
      canonicalValue: "10 cm^2",
      acceptedForms: ["10 cm^2"],
      normalisation: "units_default",
      units: { requirement: "required", canonical: "cm^2", acceptedSet: ["cm^2"] },
      tolerance: { kind: "none" as "absolute", value: 0 },
    };
    expect(validate("10 cm^2", spec).isCorrect).toBe(true);
  });

  it("coordinate common error", () => {
    expect(
      validate("(0,0)", {
        ...baseSpec,
        answerType: "coordinate",
        canonicalValue: "(1,1)",
        acceptedForms: ["(1,1)"],
        commonErrorValues: [{ key: "origin", value: "(0,0)" }],
      }).matchedCommonErrorKey,
    ).toBe("origin");
  });

  it("normalise comma without two parts", () => {
    expect(normalise("1,2,3", { profile: "numeric_default" })).toBe("1,2,3");
  });

  it("countSignificantFigures no digits", () => {
    expect(countSignificantFigures(".")).toBe(0);
  });

  it("splitValueAndUnits no numeric match", () => {
    expect(splitValueAndUnits("hello world").units).toBeNull();
  });

  it("numeric acceptedForms loop in dp", () => {
    const spec: AnswerSpec = {
      ...baseSpec,
      answerType: "numeric_dp",
      canonicalValue: "10.00",
      acceptedForms: ["10"],
      normalisation: "numeric_default",
      precision: { kind: "decimal_places", value: 2, required: false },
      tolerance: { kind: "absolute", value: 0.01 },
    };
    expect(validate("10", spec).isCorrect).toBe(true);
  });

  it("numeric exact common error and unparseable", () => {
    expect(validate("abc", { ...baseSpec, answerType: "numeric_exact" }).reason).toBe("unparseable");
    expect(
      validate("99", {
        ...baseSpec,
        answerType: "numeric_exact",
        canonicalValue: "1",
        commonErrorValues: [{ key: "n99", value: "99" }],
      }).matchedCommonErrorKey,
    ).toBe("n99");
  });

  it("option wrong key", () => {
    expect(validate("C", { ...baseSpec, answerType: "option_id", canonicalValue: "B", acceptedForms: ["B"] }).isCorrect).toBe(
      false,
    );
  });

  it("expression acceptedForms only equivalence", () => {
    expect(
      validate("3*x", {
        ...baseSpec,
        answerType: "expression",
        canonicalValue: "5x",
        acceptedForms: ["x*3"],
        normalisation: "expression_default",
      }).reason,
    ).toBe("equivalent_form");
  });

  it("normalise token with comma and dot together", () => {
    expect(normalise("1.2,3", { profile: "numeric_default" })).toBe("1.2,3");
  });

  it("splitValueAndUnits empty unit suffix", () => {
    expect(splitValueAndUnits("40 ").units).toBeNull();
  });

  it("equivalence internal helpers", () => {
    expect(compareTerms("2a", "3a")).not.toBe(0);
    expect(compareTerms("a", "b")).not.toBe(0);
    expect(coefficientOf("-a")).toBe(-1);
    expect(coefficientOf("3a")).toBe(3);
    expect(extractFactors("a(x+1)(x+2)").length).toBeGreaterThan(0);
  });

  it("numeric exact array input", () => {
    expect(validate([], { ...baseSpec, answerType: "numeric_exact" }).isCorrect).toBe(false);
  });

  it("with_units wrong value tolerance none", () => {
    expect(
      validate("99 cm^2", {
        ...withUnitsSpec,
        tolerance: { kind: "none", value: 0 },
      }).isCorrect,
    ).toBe(false);
  });

  it("numericToNumber decimal and rational", () => {
    expect(numericToNumber({ kind: "decimal", value: "3.5" })).toBe(3.5);
    expect(numericToNumber({ kind: "rational", num: 3n, den: 2n })).toBe(1.5);
  });

  it("currency bad canonical", () => {
    expect(
      validate("100", {
        ...baseSpec,
        answerType: "currency",
        canonicalValue: "bad",
        normalisation: "currency_default",
        precision: { kind: "none", value: 0, required: false },
        tolerance: { kind: "absolute", value: 1 },
      }).reason,
    ).toBe("unparseable");
  });

  it("option_id array canonical value", () => {
    expect(
      validate("A", {
        ...baseSpec,
        answerType: "option_id",
        canonicalValue: ["A"] as unknown as string,
        acceptedForms: ["A"],
      }).isCorrect,
    ).toBe(true);
  });

  it("with_units relative zero canonical", () => {
    expect(
      validate("0 cm^2", {
        ...withUnitsSpec,
        canonicalValue: "0 cm^2",
        tolerance: { kind: "relative", value: 0.5 },
      }).isCorrect,
    ).toBe(true);
  });

  it("coordinate bad x component", () => {
    expect(
      validate("(bad,1)", {
        ...baseSpec,
        answerType: "coordinate",
        canonicalValue: "(1,1)",
        acceptedForms: ["(1,1)"],
      }).reason,
    ).toBe("unparseable");
  });

  it("decimal places partial dp branch", () => {
    const spec: AnswerSpec = {
      ...baseSpec,
      answerType: "numeric_dp",
      canonicalValue: "10.00",
      acceptedForms: [],
      normalisation: "numeric_default",
      precision: { kind: "decimal_places", value: 2, required: true },
      tolerance: { kind: "absolute", value: 0.01 },
    };
    expect(validate("10.0", spec).reason).toBe("wrong_precision");
  });
});

describe("index re-exports", () => {
  it("exports parseNumeric from index", async () => {
    const mod = await import("../index.js");
    expect(mod.parseNumeric("1/2")?.kind).toBe("rational");
    expect(mod.normalise("1", { profile: "default" })).toBe("1");
  });
});
