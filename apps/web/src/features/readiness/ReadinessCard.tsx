"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CONFIDENCE_LABELS,
  READINESS_DISCLOSURE,
  withheldMessage,
  type ConfidenceLevel,
  type WithheldReason,
} from "@edmar/assessment-core";
import { ProgressRing } from "@/components/ui/progress-ring";
import { createClient } from "@/lib/supabase/client";

interface ReadinessPayload {
  index_value: number | null;
  confidence: ConfidenceLevel;
  withheld_reason: WithheldReason | null;
  weighted_mastery?: number;
  coverage_ratio?: number;
  simulation_count?: number;
}

export function ReadinessCard({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<ReadinessPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const { data: payload, error: rpcError } = await supabase.rpc("fn_get_readiness");
      if (rpcError) {
        setError(rpcError.message);
        return;
      }
      setData(payload as ReadinessPayload);
    })();
  }, []);

  if (error) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {error}
      </p>
    );
  }

  if (!data) {
    return <p className="text-sm text-navy/60">Loading readiness…</p>;
  }

  const issued = data.index_value != null;
  const index = issued ? Math.round(Number(data.index_value)) : null;
  const confidenceLabel =
    data.confidence && data.confidence !== "none"
      ? CONFIDENCE_LABELS[data.confidence]
      : null;

  return (
    <section className="rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(13,27,62,0.06)] dark:bg-navy">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy/50 dark:text-white/50">
          Readiness index
        </h2>
        {!compact ? (
          <Link href="/readiness/explainer" className="text-xs text-royal hover:underline">
            How this works
          </Link>
        ) : null}
      </div>
      <div className="mt-6 flex flex-col items-center">
        {issued ? (
          <ProgressRing
            value={index ?? 0}
            label={`${index}%`}
            sublabel={confidenceLabel ?? "Readiness"}
          />
        ) : (
          <div className="flex h-32 w-32 items-center justify-center rounded-full border-2 border-dashed border-navy/20 text-center text-sm text-navy/50">
            Withheld
          </div>
        )}
        <p className="mt-4 text-center text-sm text-navy/60 dark:text-white/60">
          {issued
            ? READINESS_DISCLOSURE
            : withheldMessage(data.withheld_reason)}
        </p>
        {!compact && issued ? (
          <p className="mt-2 text-center text-xs text-navy/40">
            {data.simulation_count ?? 0} simulation(s) ·{" "}
            {Math.round((data.coverage_ratio ?? 0) * 100)}% syllabus coverage
          </p>
        ) : null}
      </div>
    </section>
  );
}
