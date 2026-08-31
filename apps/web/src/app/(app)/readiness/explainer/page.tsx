import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Readiness explainer" };

export default function ReadinessExplainerPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-navy dark:text-white">How readiness works</h1>
      <p className="mt-2 text-navy/70 dark:text-white/70">
        Readiness is computed from your practice and diagnostic evidence. Grade projections are
        only shown when there is enough data — never guessed.
      </p>
      <div className="mt-8">
        <EmptyState
          title="Full explainer ships with readiness"
          description="This page will explain evidence gates, confidence bands, and what each mastery level means."
          actionLabel="View progress"
          actionHref="/progress"
        />
      </div>
    </div>
  );
}
