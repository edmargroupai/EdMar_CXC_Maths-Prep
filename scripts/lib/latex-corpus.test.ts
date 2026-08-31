import { describe, expect, it } from "vitest";
import { computeRenderHash, validateLatex } from "./render-math-core.js";
import {
  LATEX_CORPUS,
  LATEX_CORPUS_SIZE,
  LATEX_CORPUS_UNIQUE_SIZE,
} from "./latex-corpus.js";

describe("latex-corpus", () => {
  it("contains exactly 200 expressions", () => {
    expect(LATEX_CORPUS_SIZE).toBe(200);
    expect(LATEX_CORPUS).toHaveLength(200);
  });

  it("includes deliberate repeats for dedup testing", () => {
    expect(LATEX_CORPUS_UNIQUE_SIZE).toBe(194);
    const hashes = LATEX_CORPUS.map((entry) =>
      computeRenderHash(entry.latex, entry.style),
    );
    expect(new Set(hashes).size).toBe(194);
  });

  it("passes the allowlist for every corpus expression", () => {
    for (const [index, entry] of LATEX_CORPUS.entries()) {
      const validation = validateLatex(entry.latex);
      expect(validation, `entry ${index + 1} (${entry.category})`).toEqual({ ok: true });
    }
  });

  it("covers all seven CSEC topic categories", () => {
    const categories = new Set(LATEX_CORPUS.map((entry) => entry.category));
    expect(categories).toEqual(
      new Set([
        "number_theory",
        "algebra",
        "geometry",
        "trigonometry",
        "sets",
        "matrices",
        "statistics",
      ]),
    );
  });
});
