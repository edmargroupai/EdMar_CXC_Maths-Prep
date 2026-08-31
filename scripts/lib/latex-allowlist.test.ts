import { describe, expect, it } from "vitest";
import { validateLatex } from "./render-math-core.js";

describe("validateLatex allowlist", () => {
  it("rejects \\input", () => {
    expect(validateLatex("\\input{/etc/passwd}")).toEqual({
      ok: false,
      reason: "Forbidden command \\input",
    });
  });

  it("rejects \\newcommand", () => {
    expect(validateLatex("\\newcommand{\\foo}{bar} x")).toEqual({
      ok: false,
      reason: "Forbidden command \\newcommand",
    });
  });

  it("rejects \\href", () => {
    expect(validateLatex("\\href{https://evil.test}{click}")).toEqual({
      ok: false,
      reason: "Forbidden command \\href",
    });
  });

  it("rejects \\@ sequences", () => {
    expect(validateLatex("\\@ifnextchar")).toEqual({
      ok: false,
      reason: "Forbidden \\@ sequence",
    });
  });

  it("accepts a permitted fraction", () => {
    expect(validateLatex("\\frac{1}{2}")).toEqual({ ok: true });
  });
});
