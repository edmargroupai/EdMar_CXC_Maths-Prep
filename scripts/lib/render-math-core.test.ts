import { describe, expect, it } from "vitest";
import {
  computeRenderHash,
  renderLatexToSvg,
  validateLatex,
} from "./render-math-core.js";

describe("render-math-core", () => {
  it("computes a stable 64-char sha256 hash", () => {
    const hash = computeRenderHash("\\frac{1}{2}", "display");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(computeRenderHash("\\frac{1}{2}", "display")).toBe(hash);
  });

  it("changes hash when style changes", () => {
    const displayHash = computeRenderHash("x^2", "display");
    const inlineHash = computeRenderHash("x^2", "inline");
    expect(displayHash).not.toBe(inlineHash);
  });

  it("deduplicates identical latex and style to the same hash", () => {
    const first = computeRenderHash("\\sin\\theta", "inline");
    const second = computeRenderHash("\\sin\\theta", "inline");
    expect(first).toBe(second);
  });

  it("renders allowlisted LaTeX to SVG with ex metrics", () => {
    expect(validateLatex("\\frac{3}{4}")).toEqual({ ok: true });
    const rendered = renderLatexToSvg("\\frac{3}{4}", "display");
    expect(rendered.svg).toContain("<svg");
    expect(rendered.widthEx).toBeGreaterThan(0);
    expect(rendered.heightEx).toBeGreaterThan(0);
    expect(rendered.depthEx).toBeGreaterThanOrEqual(0);
  });

  it("is idempotent for repeated renders", () => {
    const first = renderLatexToSvg("\\pi r^2", "display");
    const second = renderLatexToSvg("\\pi r^2", "display");
    expect(first.svg).toBe(second.svg);
    expect(first.widthEx).toBe(second.widthEx);
    expect(first.heightEx).toBe(second.heightEx);
    expect(first.depthEx).toBe(second.depthEx);
  });

  it("refuses to render disallowed LaTeX", () => {
    expect(() => renderLatexToSvg("\\def\\x{1}", "display")).toThrow(
      "Forbidden command \\def",
    );
  });
});
