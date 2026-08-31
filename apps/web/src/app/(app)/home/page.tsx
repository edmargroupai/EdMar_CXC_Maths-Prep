import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ReadinessCard } from "@/features/readiness/ReadinessCard";
import { recommendations, skillSummaries } from "@/lib/mock/app-shell";

export const metadata = { title: "Dashboard" };

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-navy sm:text-3xl">Good afternoon</h1>
        <p className="mt-1 text-navy/60">Here is where you stand today.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ReadinessCard compact />
        </div>

        <section className="rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(13,27,62,0.06)] lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-navy/50">
            Skills summary
          </h2>
          <ul className="mt-6 space-y-4">
            {skillSummaries.map((skill) => (
              <li key={skill.name}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-navy">{skill.name}</span>
                  <span className="text-navy/50">{skill.progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-sky">
                  <div
                    className="h-full rounded-full bg-royal transition-all"
                    style={{ width: `${skill.progress}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-6 rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(13,27,62,0.06)]">
        <h2 className="text-lg font-semibold text-navy">Recommended next steps</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {recommendations.map((rec) => (
            <article
              key={rec.id}
              className="flex flex-col justify-between rounded-xl border border-navy/8 bg-sky/30 p-5"
            >
              <div>
                <h3 className="font-semibold text-navy">{rec.title}</h3>
                <p className="mt-1 text-sm text-navy/60">{rec.reason}</p>
              </div>
              <Button href={rec.href} size="sm" className="mt-4 self-start">
                Start
              </Button>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <Button href="/diagnostic" variant="secondary" className="w-full">
          Start diagnostic
        </Button>
        <Button href="/practice" className="w-full">
          Continue practising
        </Button>
      </section>

      <p className="mt-6 text-center text-sm text-navy/50">
        <Link href="/progress" className="text-royal hover:underline">
          View full progress and grade projection
        </Link>
      </p>
    </div>
  );
}
