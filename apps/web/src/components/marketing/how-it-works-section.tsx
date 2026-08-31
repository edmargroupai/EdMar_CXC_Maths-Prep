const steps = [
  {
    step: "01",
    title: "Take the diagnostic",
    description: "Twenty minutes across key topics to map where you stand today.",
  },
  {
    step: "02",
    title: "Practise with purpose",
    description: "Topic sessions, weak-area drills, and recommendations that explain why.",
  },
  {
    step: "03",
    title: "Simulate the exam",
    description: "Full papers with timed mode when you are ready for the real thing.",
  },
] as const;

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-sky/40 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold text-navy">How it works</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-navy/70">
          A clear path from first login to exam day.
        </p>
        <ol className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((item) => (
            <li
              key={item.step}
              className="relative rounded-2xl bg-white p-8 shadow-[0_4px_24px_rgba(13,27,62,0.06)]"
            >
              <span className="text-4xl font-bold text-gold">{item.step}</span>
              <h3 className="mt-4 text-xl font-semibold text-navy">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy/70">
                {item.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
