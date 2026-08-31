import { describe, expect, it } from "vitest";
import { resolvePostAuthPath } from "./post-auth-destination";

describe("resolvePostAuthPath", () => {
  it("sends incomplete registered users to onboarding", () => {
    expect(
      resolvePostAuthPath({ onboarding_completed_at: null }, {
        isAnonymous: false,
      }),
    ).toBe("/onboarding/value");
  });

  it("sends incomplete anonymous users to first question", () => {
    expect(
      resolvePostAuthPath({ onboarding_completed_at: null }, {
        isAnonymous: true,
      }),
    ).toBe("/onboarding/first-question");
  });

  it("honours a safe next path after onboarding", () => {
    expect(
      resolvePostAuthPath({ onboarding_completed_at: "2026-01-01T00:00:00Z" }, {
        isAnonymous: false,
        nextPath: "/practice/setup",
      }),
    ).toBe("/practice/setup");
  });

  it("rejects open redirects", () => {
    expect(
      resolvePostAuthPath({ onboarding_completed_at: "2026-01-01T00:00:00Z" }, {
        isAnonymous: false,
        nextPath: "//evil.test",
      }),
    ).toBe("/home");
  });
});
