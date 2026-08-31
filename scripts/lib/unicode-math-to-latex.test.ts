import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  buildBlocksFromConvertedText,
  convertUnicodeMathToLatex,
  textToStemBlocks,
} from "../unicode-math-to-latex.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
const diagnosticBank = JSON.parse(
  readFileSync(join(repoRoot, "content/legacy/diagnostic_bank_phase3.json"), "utf8"),
) as Array<{ id: string; question: string; options: string[] }>;

describe("unicode-math-to-latex", () => {
  it("converts diagnostic Q1 fractions without using $ as a delimiter", () => {
    const result = convertUnicodeMathToLatex("Evaluate 3/4 + 2/5.");
    expect(result.text).toContain("\\frac{3}{4}");
    expect(result.text).toContain("\\frac{2}{5}");
    expect(result.conversionCount).toBeGreaterThanOrEqual(2);
  });

  it("leaves currency $ as plain text", () => {
    const result = convertUnicodeMathToLatex("A sum of $1,260 is divided in the ratio 3:4:7.");
    expect(result.text).toContain("$1,260");
    expect(result.text).not.toMatch(/\$[^$]+\$/);
  });

  it("converts superscripts from diagnostic Q12 explanation", () => {
    const q12 = diagnosticBank.find((q) => q.id === "Q12")! as {
      explanation: string;
    };
    const result = convertUnicodeMathToLatex(q12.explanation);
    expect(result.text).toContain("a^{2}");
    expect(result.text).toContain("b^{2}");
    expect(result.text).toContain("c^{2}");
  });

  it("converts set operators from diagnostic Q6", () => {
    const q6 = diagnosticBank.find((q) => q.id === "Q6")!;
    const result = convertUnicodeMathToLatex(q6.question);
    expect(result.text).toContain("\\cap");
    expect(result.text).toContain("\\cup");
  });

  it("converts matrix bracket-semicolon from diagnostic Q17 options", () => {
    const q17 = diagnosticBank.find((q) => q.id === "Q17")!;
    const matrixOption = q17.options.find((o) => o.includes(";"))!;
    const result = convertUnicodeMathToLatex(matrixOption);
    expect(result.text).toContain("\\begin{pmatrix}");
    expect(result.text).toContain("\\end{pmatrix}");
  });

  it("builds math blocks with render hashes", () => {
    const converted = convertUnicodeMathToLatex("Evaluate 3/4 + 2/5.");
    const blocks = buildBlocksFromConvertedText(converted.text);
    const mathBlocks = blocks.filter((b) => b.type === "math");
    expect(mathBlocks.length).toBeGreaterThanOrEqual(2);
    for (const block of mathBlocks) {
      if (block.type === "math") {
        expect(block.renderHash).toMatch(/^[a-f0-9]{64}$/);
      }
    }
  });

  it("textToStemBlocks preserves original stem_plain", () => {
    const { stemPlain, stemBlocks } = textToStemBlocks("Solve 3x + 5 = 20.");
    expect(stemPlain).toBe("Solve 3x + 5 = 20.");
    expect(stemBlocks.some((b) => b.type === "text")).toBe(true);
  });
});
