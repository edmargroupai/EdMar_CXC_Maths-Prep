import { Button } from "@/components/ui/button";

export const metadata = { title: "Diagnostic" };

export default function DiagnosticPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
      <span className="text-5xl" aria-hidden>
        🎯
      </span>
      <h1 className="mt-6 text-3xl font-bold text-navy">Diagnostic assessment</h1>
      <p className="mt-4 text-navy/70">
        A twenty-minute assessment across key syllabus topics. You will see a coverage map
        and your first readiness reading when you finish.
      </p>
      <ul className="mt-8 space-y-2 text-left text-sm text-navy/60">
        <li>· About 20 questions across multiple topics</li>
        <li>· No per-question feedback during the run</li>
        <li>· Results unlock your personalised study plan</li>
      </ul>
      <Button className="mt-10" size="lg">
        Start diagnostic
      </Button>
      <p className="mt-4 text-xs text-navy/40">
        Available after your first practice session (per product spec).
      </p>
    </div>
  );
}
