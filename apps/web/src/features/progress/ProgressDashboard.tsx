"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/ui/progress-ring";
import { GradeProjectionCard } from "@/features/readiness/GradeProjectionCard";
import { ReadinessCard } from "@/features/readiness/ReadinessCard";
import { createClient } from "@/lib/supabase/client";

interface WeakAreaRow {
  topic_id: string;
  topic_name: string;
  marks_at_stake: number;
  mastery_score: number;
  mark_impact: number;
}

export function ProgressDashboard() {
  const [weakAreas, setWeakAreas] = useState<WeakAreaRow[]>([]);
  const [recommendation, setRecommendation] = useState<{
    label: string;
    reason: string;
    marks_at_stake?: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const [{ data: weakData, error: weakError }, { data: recData, error: recError }] =
        await Promise.all([
          supabase.rpc("fn_weak_areas"),
          supabase.rpc("fn_get_recommendation"),
        ]);

      if (weakError || recError) {
        setError(weakError?.message ?? recError?.message ?? "Could not load progress.");
        return;
      }

      setWeakAreas((weakData as WeakAreaRow[] | null) ?? []);
      setRecommendation((recData as typeof recommendation) ?? null);
    })();
  }, []);

  const averageMastery =
    weakAreas.length > 0
      ? Math.round(
          weakAreas.reduce((sum, row) => sum + Number(row.mastery_score), 0) / weakAreas.length,
        )
      : 0;

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 lg:col-span-2">
          {error}
        </p>
      ) : null}

      <div className="lg:col-span-2 grid gap-6 lg:grid-cols-2">
        <ReadinessCard />
        <GradeProjectionCard />
      </div>

      <section className="rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(13,27,62,0.06)]">
        <h2 className="text-lg font-semibold text-navy">Topic mastery snapshot</h2>
        <div className="mt-6 flex justify-center">
          <ProgressRing
            value={averageMastery}
            label={`${averageMastery}%`}
            sublabel="Average across weighted topics"
          />
        </div>
        {recommendation ? (
          <p className="mt-4 text-center text-sm text-navy/70">
            <span className="font-medium text-navy">{recommendation.label}</span> —{" "}
            {recommendation.reason}
            {recommendation.marks_at_stake != null ? (
              <> ({recommendation.marks_at_stake} marks at stake)</>
            ) : null}
          </p>
        ) : (
          <p className="mt-4 text-center text-sm text-navy/60">
            Complete practice sessions to unlock personalised recommendations.
          </p>
        )}
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(13,27,62,0.06)]">
        <h2 className="text-lg font-semibold text-navy">Weak areas by mark impact</h2>
        <ul className="mt-6 space-y-4">
          {weakAreas.length === 0 ? (
            <li className="text-sm text-navy/60">No topic evidence yet — start practising.</li>
          ) : (
            weakAreas.slice(0, 8).map((row) => (
              <li key={row.topic_id} className="flex items-center justify-between gap-4">
                <div>
                  <Link
                    href={`/progress/topic/${row.topic_id}`}
                    className="text-sm font-medium text-navy hover:text-royal"
                  >
                    {row.topic_name}
                  </Link>
                  <p className="text-xs text-navy/50">
                    {row.marks_at_stake} marks · impact {row.mark_impact}
                  </p>
                </div>
                <span className="text-sm text-navy/50">{Math.round(row.mastery_score)}%</span>
              </li>
            ))
          )}
        </ul>
        {recommendation ? (
          <Button href="/practice/setup" size="sm" className="mt-6">
            Practise recommended skill
          </Button>
        ) : null}
      </section>
    </div>
  );
}
