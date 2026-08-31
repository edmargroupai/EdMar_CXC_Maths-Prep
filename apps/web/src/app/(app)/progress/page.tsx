import { ProgressRing } from "@/components/ui/progress-ring";
import { skillSummaries } from "@/lib/mock/app-shell";

export const metadata = { title: "Progress" };

export default function ProgressPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-2xl font-bold text-navy">Progress</h1>
        <p className="mt-1 text-navy/60">Readiness, trends, and weak areas.</p>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(13,27,62,0.06)]">
          <h2 className="text-lg font-semibold text-navy">Readiness</h2>
          <div className="mt-6 flex justify-center">
            <ProgressRing value={45} label="45%" sublabel="Developing · low confidence" />
          </div>
          <p className="mt-4 text-center text-sm text-navy/60">
            Complete more practice and at least one simulation to improve confidence.
          </p>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(13,27,62,0.06)]">
          <h2 className="text-lg font-semibold text-navy">Topic mastery</h2>
          <ul className="mt-6 space-y-4">
            {skillSummaries.map((skill) => (
              <li key={skill.name} className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-navy">{skill.name}</span>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-32 overflow-hidden rounded-full bg-sky">
                    <div
                      className="h-full rounded-full bg-royal"
                      style={{ width: `${skill.progress}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-sm text-navy/50">
                    {skill.progress}%
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
