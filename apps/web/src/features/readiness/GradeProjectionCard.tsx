"use client";

import {
  formatGradeBand,
  PROJECTION_DISCLOSURE,
  withheldMessage,
  type ConfidenceLevel,
  type WithheldReason,
} from "@edmar/assessment-core";
import { PremiumGate } from "@/components/PremiumGate";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

interface ProjectionPayload {
  state: "issued" | "withheld";
  band_low?: number | null;
  band_high?: number | null;
  confidence?: ConfidenceLevel;
  withheld_reason?: WithheldReason | null;
}

export function GradeProjectionCard() {
  const [data, setData] = useState<ProjectionPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const { data: payload, error: rpcError } = await supabase.rpc("fn_get_grade_projection");
      if (rpcError) {
        setError(rpcError.message);
        return;
      }
      setData(payload as ProjectionPayload);
    })();
  }, []);

  return (
    <PremiumGate featureLabel="Grade projection">
      <section className="rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(13,27,62,0.06)] dark:bg-navy">
        <h2 className="text-lg font-semibold text-navy dark:text-white">Grade projection</h2>
        {error ? (
          <p className="mt-4 text-sm text-red-700">{error}</p>
        ) : !data ? (
          <p className="mt-4 text-sm text-navy/60">Loading projection…</p>
        ) : data.state === "issued" && data.band_low != null && data.band_high != null ? (
          <div className="mt-4">
            <p className="text-3xl font-bold text-navy dark:text-white">
              {formatGradeBand(data.band_low, data.band_high)}
            </p>
            {data.confidence && data.confidence !== "none" ? (
              <p className="mt-2 text-sm text-navy/60 capitalize">{data.confidence} confidence</p>
            ) : null}
            <p className="mt-4 text-sm text-navy/60 dark:text-white/60">{PROJECTION_DISCLOSURE}</p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-navy/70 dark:text-white/70">
            {withheldMessage(data.withheld_reason)}
          </p>
        )}
      </section>
    </PremiumGate>
  );
}
