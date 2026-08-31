import { describe, expect, it } from "vitest";
import { formatGradeBand, withheldMessage } from "./index";

describe("assessment-core strings", () => {
  it("formats a single-grade band", () => {
    expect(formatGradeBand(3, 3)).toBe("Grade 3");
  });

  it("formats a ranged band", () => {
    expect(formatGradeBand(3, 4)).toBe("Grades 3–4");
  });

  it("explains withheld simulation gate", () => {
    expect(withheldMessage("no_simulation")).toContain("simulation");
  });
});
