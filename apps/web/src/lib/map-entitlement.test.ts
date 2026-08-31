import { describe, expect, it } from "vitest";
import { mapEntitlementPayload } from "./map-entitlement";

describe("mapEntitlementPayload", () => {
  it("maps snake_case rpc fields", () => {
    const view = mapEntitlementPayload({
      tier: "free",
      is_premium: true,
      status: "active",
      days_remaining: 3,
      allowance_remaining: 5,
      daily_limit: 10,
      resets_at: "2026-01-01T00:00:00Z",
    });
    expect(view.isPremium).toBe(true);
    expect(view.daysRemaining).toBe(3);
    expect(view.allowanceRemaining).toBe(5);
  });
});
