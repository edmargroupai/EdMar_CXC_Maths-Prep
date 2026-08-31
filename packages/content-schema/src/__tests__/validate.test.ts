import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { AnswerSpec } from "@edmar/types";
import {
  roundTripCheck,
  validateAnswerSpec,
  validateQuestion,
} from "../validate.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
const goldenDir = join(repoRoot, "content", "golden");

const GOLDEN_FILES = readdirSync(goldenDir)
  .filter((name) => name.endsWith(".json"))
  .sort();

function loadGolden(name: string): unknown {
  return JSON.parse(readFileSync(join(goldenDir, name), "utf8"));
}

const minimalQuestion = {
  schemaVersion: "2.0.0",
  questionType: "numeric",
  provenance: "original_authored",
  rightsStatus: "edmar_owned",
  difficultyBand: 2,
  status: "draft",
  stemBlocks: [{ type: "text", value: "What is 2 + 2?" }],
  solutionSteps: [
    {
      stepNo: 1,
      instruction: "Add the two numbers together.",
      contentBlocks: [{ type: "text", value: "2 + 2 = 4" }],
    },
  ],
  curriculum: {
    syllabusCode: "V2018",
    objectiveCodes: ["M1-1.1"],
  },
  conceptsRequired: [
    {
      objectiveId: "00000000-0000-4000-8000-000000000001",
      code: "M1-1.1",
      label: "Number operations",
    },
  ],
  strategyBlocks: [{ type: "text", value: "Use addition." }],
  finalAnswerBlocks: [{ type: "text", value: "4" }],
  whyThisWorks: [{ type: "text", value: "Addition combines the two values." }],
  commonErrors: [
    {
      key: "off_by_one",
      wrongValue: "3",
      misconception: "Student counted incorrectly by one.",
      correctiveNote: "Recount both operands before adding.",
    },
  ],
  examTip: [{ type: "text", value: "Check your arithmetic." }],
  quickCheck: {
    promptBlocks: [{ type: "text", value: "Is 4 correct?" }],
    answerSpec: {
      answerType: "numeric_exact",
      canonicalValue: "4",
      displayValue: "4",
      acceptedForms: ["4"],
      tolerance: { kind: "absolute", value: 0 },
      normalisation: "numeric_default",
    },
  },
  answerValidation: {
    cognitiveLevel: "CK",
    accuracyRule: "exact",
    verification: "machine_verified",
  },
  answerSpec: {
    answerType: "numeric_exact",
    canonicalValue: "4",
    displayValue: "4",
    acceptedForms: ["4"],
    tolerance: { kind: "absolute", value: 0 },
    normalisation: "numeric_default",
  },
};

describe("golden fixtures", () => {
  it.each(GOLDEN_FILES)("validates %s against the question schema", (file) => {
    const question = loadGolden(file);
    const result = validateQuestion(question);
    expect(result.errors, result.errors.join("\n")).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it.each(GOLDEN_FILES)("passes round-trip check for %s", (file) => {
    const question = loadGolden(file) as { answerSpec: AnswerSpec };
    const result = roundTripCheck(question.answerSpec);
    expect(result.ok, result.reason).toBe(true);
  });
});

describe("validateQuestion", () => {
  it("accepts a minimal valid question", () => {
    expect(validateQuestion(minimalQuestion).valid).toBe(true);
  });

  it("rejects missing schemaVersion", () => {
    const { schemaVersion: _removed, ...rest } = minimalQuestion;
    const result = validateQuestion(rest);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("schemaVersion"))).toBe(true);
  });

  it("rejects wrong schemaVersion", () => {
    const result = validateQuestion({ ...minimalQuestion, schemaVersion: "1.0.0" });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("schemaVersion"))).toBe(true);
  });

  it("rejects multiple_choice without options", () => {
    const result = validateQuestion({
      ...minimalQuestion,
      questionType: "multiple_choice",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("options"))).toBe(true);
  });

  it("rejects structured without parts", () => {
    const result = validateQuestion({
      ...minimalQuestion,
      questionType: "structured",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("parts"))).toBe(true);
  });

  it("rejects invalid provenance", () => {
    const result = validateQuestion({ ...minimalQuestion, provenance: "made_up" });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("provenance"))).toBe(true);
  });

  it("rejects empty stemBlocks", () => {
    const result = validateQuestion({ ...minimalQuestion, stemBlocks: [] });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("stemBlocks"))).toBe(true);
  });

  it("rejects invalid curriculum objective code", () => {
    const result = validateQuestion({
      ...minimalQuestion,
      curriculum: { syllabusCode: "V2018", objectiveCodes: ["BAD"] },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("objectiveCodes"))).toBe(true);
  });

  it("rejects commonErrors without wrongValue or wrongOptionKey", () => {
    const result = validateQuestion({
      ...minimalQuestion,
      commonErrors: [
        {
          key: "no_target",
          misconception: "Student forgot to simplify the fraction completely.",
          correctiveNote: "Reduce the fraction to lowest terms before answering.",
        },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe("validateAnswerSpec", () => {
  const baseSpec: AnswerSpec = {
    answerType: "numeric_exact",
    canonicalValue: "7",
    displayValue: "7",
    acceptedForms: ["7"],
    tolerance: { kind: "absolute", value: 0 },
    normalisation: "numeric_default",
  };

  it("accepts a valid numeric_exact spec", () => {
    expect(validateAnswerSpec(baseSpec).valid).toBe(true);
  });

  it("rejects missing answerType", () => {
    const { answerType: _removed, ...rest } = baseSpec;
    const result = validateAnswerSpec(rest);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("answerType"))).toBe(true);
  });

  it("rejects unknown answerType", () => {
    const result = validateAnswerSpec({ ...baseSpec, answerType: "not_real" });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("answerType"))).toBe(true);
  });

  it("rejects empty displayValue", () => {
    const result = validateAnswerSpec({ ...baseSpec, displayValue: "" });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("displayValue"))).toBe(true);
  });

  it("rejects empty acceptedForms", () => {
    const result = validateAnswerSpec({ ...baseSpec, acceptedForms: [] });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("acceptedForms"))).toBe(true);
  });

  it("requires tolerance for numeric_tolerance", () => {
    const result = validateAnswerSpec({
      answerType: "numeric_tolerance",
      canonicalValue: "10",
      displayValue: "10",
      acceptedForms: ["10"],
      normalisation: "numeric_default",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("tolerance"))).toBe(true);
  });

  it("requires precision for numeric_sf", () => {
    const result = validateAnswerSpec({
      answerType: "numeric_sf",
      canonicalValue: "58.7",
      displayValue: "58.7",
      acceptedForms: ["58.7"],
      tolerance: { kind: "absolute", value: 0.05 },
      normalisation: "numeric_default",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("precision"))).toBe(true);
  });

  it("requires units for with_units", () => {
    const result = validateAnswerSpec({
      answerType: "with_units",
      canonicalValue: "5 m",
      displayValue: "5 m",
      acceptedForms: ["5 m"],
      tolerance: { kind: "absolute", value: 0 },
      normalisation: "units_default",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("units"))).toBe(true);
  });

  it("requires tolerance for currency", () => {
    const result = validateAnswerSpec({
      answerType: "currency",
      canonicalValue: "10.00",
      displayValue: "$10.00",
      acceptedForms: ["10.00"],
      precision: { kind: "decimal_places", value: 2, required: true },
      normalisation: "currency_default",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("tolerance"))).toBe(true);
  });

  it("requires precision for numeric_dp", () => {
    const result = validateAnswerSpec({
      answerType: "numeric_dp",
      canonicalValue: "3.14",
      displayValue: "3.14",
      acceptedForms: ["3.14"],
      tolerance: { kind: "absolute", value: 0 },
      normalisation: "numeric_default",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("precision"))).toBe(true);
  });

  it("rejects additional properties", () => {
    const result = validateAnswerSpec({ ...baseSpec, extraField: true });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("additional"))).toBe(true);
  });
});

describe("roundTripCheck", () => {
  it("passes when displayValue validates as correct", () => {
    const spec: AnswerSpec = {
      answerType: "numeric_exact",
      canonicalValue: "12",
      displayValue: "12",
      acceptedForms: ["12"],
      tolerance: { kind: "absolute", value: 0 },
      normalisation: "numeric_default",
    };
    expect(roundTripCheck(spec)).toEqual({ ok: true });
  });

  it("fails when displayValue does not match canonical", () => {
    const spec: AnswerSpec = {
      answerType: "numeric_exact",
      canonicalValue: "12",
      displayValue: "13",
      acceptedForms: ["12"],
      tolerance: { kind: "absolute", value: 0 },
      normalisation: "numeric_default",
    };
    const result = roundTripCheck(spec);
    expect(result.ok).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it("surfaces unsupported answer types", () => {
    const spec = {
      answerType: "set",
      canonicalValue: "{1,2}",
      displayValue: "{1,2}",
      acceptedForms: ["{1,2}"],
      normalisation: "default",
    } as AnswerSpec;
    const result = roundTripCheck(spec);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/not supported/);
  });

  it("passes for every golden fixture answerSpec", () => {
    for (const file of GOLDEN_FILES) {
      const question = loadGolden(file) as { answerSpec: AnswerSpec };
      expect(roundTripCheck(question.answerSpec).ok, file).toBe(true);
    }
  });
});
