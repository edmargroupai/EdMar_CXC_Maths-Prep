import type { EntitlementView } from "@edmar/types";
import { FREE_ENTITLEMENT_VIEW } from "@/lib/entitlement";

/** Stub until P18 wires fn_get_entitlement. Premium logic must stay here only. */
export function useEntitlement(): EntitlementView {
  return FREE_ENTITLEMENT_VIEW;
}
