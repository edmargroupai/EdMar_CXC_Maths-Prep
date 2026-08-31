import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SimulationStarter } from "@/features/simulation/SimulationStarter";
import { examPapers } from "@/lib/mock/app-shell";

export const metadata = { title: "Exam Simulation" };

export default function SimulatePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-2xl font-bold text-navy">Exam simulation</h1>
        <p className="mt-1 text-navy/60">
          Sit full papers under timed or practice conditions.
        </p>
      </header>

      <section className="mt-8 rounded-2xl border border-royal/20 bg-sky/30 p-6">
        <h2 className="text-lg font-semibold text-navy">Paper 01 — regular form</h2>
        <p className="mt-2 text-sm text-navy/70">
          Timed 2½-hour simulation with server-anchored clock. Blueprint conformance is checked
          against the published question bank.
        </p>
        <div className="mt-4">
          <SimulationStarter />
        </div>
      </section>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {examPapers.map((paper) => (
          <article
            key={paper.id}
            className={`rounded-2xl border bg-white p-6 shadow-[0_4px_24px_rgba(13,27,62,0.06)] ${
              "disabled" in paper ? "opacity-60" : "border-navy/8"
            }`}
          >
            <h2 className="text-lg font-semibold text-navy">{paper.title}</h2>
            <p className="mt-1 text-sm text-royal">{paper.form}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-navy/50">Duration</dt>
                <dd className="font-medium text-navy">{paper.duration}</dd>
              </div>
              <div>
                <dt className="text-navy/50">Questions</dt>
                <dd className="font-medium text-navy">{paper.questions}</dd>
              </div>
            </dl>
            {"disabled" in paper && paper.disabled ? (
              <Button disabled className="mt-6" size="sm">
                Coming soon
              </Button>
            ) : (
              <Button href={paper.href} className="mt-6" size="sm">
                Start simulation
              </Button>
            )}
          </article>
        ))}
      </div>

      <p className="mt-8 text-sm text-navy/50">
        <Link href="/home" className="text-royal hover:underline">
          ← Back to dashboard
        </Link>
      </p>
    </div>
  );
}
