import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { isL2Duplicate, L2_SIMILARITY_THRESHOLD, trigramSimilarity } from "./text-similarity.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
const diagnosticBank = JSON.parse(
  readFileSync(join(repoRoot, "content/legacy/diagnostic_bank_phase3.json"), "utf8"),
) as Array<{ id: string; question: string }>;
const lessonBank = JSON.parse(
  readFileSync(join(repoRoot, "content/legacy/lesson_bank_phase4.json"), "utf8"),
) as Array<{ quiz?: Array<{ question: string }> }>;

describe("text-similarity", () => {
  it("returns 1 for identical strings", () => {
    expect(trigramSimilarity("hello world", "hello world")).toBe(1);
  });

  it("returns low similarity for ratio quiz vs diagnostic Q3 (§12.11 finding)", () => {
    const q3 = diagnosticBank.find((q) => q.id === "Q3")!.question;
    const ratioQuiz = lessonBank[0]!.quiz![2]!.question;
    const similarity = trigramSimilarity(q3, ratioQuiz);
    expect(similarity).toBeLessThan(L2_SIMILARITY_THRESHOLD);
    expect(similarity).toBeGreaterThan(0.4);
  });

  it("L2 duplicate requires matching canonical answer and high similarity", () => {
    const a = "Find the simple interest on $12,000 at 10% per annum for 18 months.";
    const b = "Find the simple interest on $12,000 at 10% per annum for 18 months.";
    expect(isL2Duplicate(a, b, "1800.00", "1800.00")).toBe(true);
    expect(isL2Duplicate(a, b, "1800.00", "1200.00")).toBe(false);
  });

  it("does not flag structurally different stems with same answer type", () => {
    const q3 = diagnosticBank.find((q) => q.id === "Q3")!.question;
    const ratioQuiz = lessonBank[0]!.quiz![2]!.question;
    expect(isL2Duplicate(q3, ratioQuiz, "360", "1000")).toBe(false);
  });
});
