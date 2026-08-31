import type { EntitlementView } from "@edmar/types";

type RpcEntitlement = Record<string, unknown>;

/** Maps fn_get_entitlement jsonb (snake_case) to EntitlementView. */
export function mapEntitlementPayload(raw: RpcEntitlement | null): EntitlementView {
  if (!raw) {
    return {
      tier: "free",
      isPremium: false,
      status: "active",
      daysRemaining: null,
      allowanceRemaining: null,
      dailyLimit: null,
      resetsAt: null,
    };
  }

  return {
    tier: (raw.tier as EntitlementView["tier"]) ?? "free",
    isPremium: Boolean(raw.isPremium ?? raw.is_premium),
    status: (raw.status as EntitlementView["status"]) ?? "active",
    daysRemaining:
      (raw.daysRemaining as number | null | undefined) ??
      (raw.days_remaining as number | null | undefined) ??
      null,
    allowanceRemaining:
      (raw.allowanceRemaining as number | null | undefined) ??
      (raw.allowance_remaining as number | null | undefined) ??
      null,
    dailyLimit:
      (raw.dailyLimit as number | null | undefined) ??
      (raw.daily_limit as number | null | undefined) ??
      null,
    resetsAt:
      (raw.resetsAt as string | null | undefined) ??
      (raw.resets_at as string | null | undefined) ??
      null,
  };
}
