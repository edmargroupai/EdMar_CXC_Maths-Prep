import { Button } from "@/components/ui/button";
import {
  practiceCards,
  practiceTopics,
  recommendedPractice,
} from "@/lib/mock/app-shell";

export const metadata = { title: "Practice" };

export default function PracticePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-2xl font-bold text-navy">Practice</h1>
        <p className="mt-1 text-navy/60">Choose a topic and build your skills.</p>
      </header>

      <div className="mt-6 flex flex-wrap gap-2">
        {practiceTopics.map((topic) => (
          <button
            key={topic.id}
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              topic.active
                ? "bg-navy text-white"
                : "bg-white text-navy/70 hover:bg-sky"
            }`}
          >
            {topic.name}
          </button>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-navy">Continue practising</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {practiceCards.map((card) => (
            <article
              key={card.id}
              className="rounded-2xl bg-white p-5 shadow-[0_4px_24px_rgba(13,27,62,0.06)]"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-royal">
                {card.topic}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-navy">{card.title}</h3>
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs text-navy/50">
                  <span>
                    {card.completed} of {card.total} questions
                  </span>
                  <span>{card.progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-sky">
                  <div
                    className="h-full rounded-full bg-gold"
                    style={{ width: `${card.progress}%` }}
                  />
                </div>
              </div>
              <Button href="/practice/setup" size="sm" className="mt-4">
                Continue
              </Button>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-navy">Recommended for you</h2>
        <ul className="mt-4 space-y-3">
          {recommendedPractice.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-[0_4px_24px_rgba(13,27,62,0.06)]"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky text-lg">
                  📐
                </span>
                <div>
                  <p className="font-medium text-navy">{item.title}</p>
                  <p className="text-sm text-navy/50">{item.questions} questions available</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold text-navy">{item.mastery}%</p>
                  <p className="text-xs text-navy/50">mastery</p>
                </div>
                <Button href="/practice/setup" size="sm">
                  Start
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
