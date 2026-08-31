import Link from "next/link";
import {
  CONFIDENCE_LABELS,
  PROJECTION_DISCLOSURE,
  READINESS_DISCLOSURE,
  WITHHELD_LABELS,
} from "@edmar/assessment-core";

export const metadata = { title: "Readiness explainer" };

export default function ReadinessExplainerPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-navy dark:text-white">How readiness works</h1>
      <p className="mt-2 text-navy/70 dark:text-white/70">
        EdMar computes readiness and grade projections from your practice, diagnostic, and simulation
        evidence — never from guesses.
      </p>

      <section className="mt-8 space-y-4 rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(13,27,62,0.06)] dark:bg-navy">
        <h2 className="text-lg font-semibold text-navy dark:text-white">Readiness index</h2>
        <p className="text-sm text-navy/70 dark:text-white/70">{READINESS_DISCLOSURE}</p>
        <p className="text-sm text-navy/70 dark:text-white/70">
          The index blends weighted topic mastery with conformant timed simulations when you have
          them. Without a simulation, practice-only evidence is discounted until you complete one.
        </p>
      </section>

      <section className="mt-6 space-y-3 rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(13,27,62,0.06)] dark:bg-navy">
        <h2 className="text-lg font-semibold text-navy dark:text-white">When we withhold a reading</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-navy/70 dark:text-white/70">
          {Object.entries(WITHHELD_LABELS).map(([key, label]) => (
            <li key={key}>{label}</li>
          ))}
        </ul>
      </section>

      <section className="mt-6 space-y-3 rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(13,27,62,0.06)] dark:bg-navy">
        <h2 className="text-lg font-semibold text-navy dark:text-white">Grade projections</h2>
        <p className="text-sm text-navy/70 dark:text-white/70">{PROJECTION_DISCLOSURE}</p>
        <p className="text-sm text-navy/70 dark:text-white/70">
          Projections are banded (for example Grades 3–4), always carry a confidence level (
          {Object.values(CONFIDENCE_LABELS).join(", ")}), and require Premium entitlement plus
          sufficient evidence including at least one conformant simulation.
        </p>
      </section>

      <p className="mt-8">
        <Link href="/progress" className="text-royal hover:underline">
          ← Back to progress
        </Link>
      </p>
    </div>
  );
}
