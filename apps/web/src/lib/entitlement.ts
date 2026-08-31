import type { EntitlementView } from "@edmar/types";
import { tokens } from "@edmar/design/tokens";

/** Placeholder until useEntitlement() loads (P18). */
export const FREE_ENTITLEMENT_VIEW: EntitlementView = {
  tier: "free",
  isPremium: false,
  status: "active",
  daysRemaining: null,
  allowanceRemaining: null,
  dailyLimit: 10,
  resetsAt: null,
};

export const brandPrimary = tokens.colour.royal.DEFAULT;
