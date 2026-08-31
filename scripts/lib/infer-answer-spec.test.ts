import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { inferAnswerSpec, normaliseLegacyAnswer, resolveOptionKey } from "../infer-answer-spec.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
const diagnosticBank = JSON.parse(
  readFileSync(join(repoRoot, "content/legacy/diagnostic_bank_phase3.json"), "utf8"),
) as Array<{ id: string; answer: string; options?: string[] }>;

describe("infer-answer-spec", () => {
  it("infers fraction for diagnostic Q1", () => {
    const q1 = diagnosticBank.find((q) => q.id === "Q1")!;
    const result = inferAnswerSpec(q1.answer);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.spec.answerType).toBe("fraction");
      expect(result.spec.canonicalValue).toBe("23/20");
    }
  });

  it("infers option_id for diagnostic Q3 with currency underlying", () => {
    const q3 = diagnosticBank.find((q) => q.id === "Q3")!;
    const result = inferAnswerSpec(q3.answer, q3.options);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.spec.answerType).toBe("option_id");
      expect(result.spec.canonicalValue).toBe("B");
    }
  });

  it("matches $360 answer to option B after normalisation", () => {
    const q3 = diagnosticBank.find((q) => q.id === "Q3")!;
    const key = resolveOptionKey("$360", q3.options!);
    expect(key).toBe("B");
  });

  it("infers currency for diagnostic Q5 interest answer", () => {
    const q5 = diagnosticBank.find((q) => q.id === "Q5")!;
    const result = inferAnswerSpec(q5.answer, q5.options);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.spec.parts?.underlying.answerType).toBe("currency");
    }
  });

  it("holds compound ratio worked-example answer as text", () => {
    const result = inferAnswerSpec("A = $270, B = $360, C = $630");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.underlyingType).toBe("text");
      expect(result.reason).toBe("compound_or_untyped_answer");
    }
  });

  it("expression branch rejects commas, $ and =", () => {
    expect(inferAnswerSpec("8a + b").ok).toBe(true);
    expect(inferAnswerSpec("A = $270").ok).toBe(false);
    expect(inferAnswerSpec("1,800").ok).toBe(true);
  });

  it("normaliseLegacyAnswer collapses whitespace", () => {
    expect(normaliseLegacyAnswer("  $360  ")).toBe("$360");
  });
});
