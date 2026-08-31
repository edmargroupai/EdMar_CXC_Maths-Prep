import { ProgressDashboard } from "@/features/progress/ProgressDashboard";

export const metadata = { title: "Progress" };

export default function ProgressPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-2xl font-bold text-navy">Progress</h1>
        <p className="mt-1 text-navy/60">Weak areas ranked by mark impact and your next focus.</p>
      </header>
      <ProgressDashboard />
    </div>
  );
}
