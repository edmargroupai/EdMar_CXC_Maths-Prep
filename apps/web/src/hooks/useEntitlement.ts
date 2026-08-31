"use client";

import { useEffect, useState } from "react";
import type { EntitlementView } from "@edmar/types";
import { createClient } from "@/lib/supabase/client";
import { FREE_ENTITLEMENT_VIEW } from "@/lib/entitlement";
import { mapEntitlementPayload } from "@/lib/map-entitlement";

/** Network-only entitlement source (§20.5). Premium logic must stay in this hook and PremiumGate. */
export function useEntitlement(): EntitlementView & { loading: boolean; error: string | null } {
  const [view, setView] = useState<EntitlementView>(FREE_ENTITLEMENT_VIEW);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const { data, error: rpcError } = await supabase.rpc("fn_get_entitlement");
      if (rpcError) {
        setError(rpcError.message);
        setLoading(false);
        return;
      }
      setView(mapEntitlementPayload(data as Record<string, unknown> | null));
      setLoading(false);
    })();
  }, []);

  return { ...view, loading, error };
}
