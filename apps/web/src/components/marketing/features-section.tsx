const features = [
  {
    title: "Diagnostic",
    description:
      "Find your strengths and gaps across the full syllabus before you practise blindly.",
    icon: "🎯",
  },
  {
    title: "Topic Practice",
    description:
      "Work through CXC-aligned questions with instant feedback and step-by-step solutions.",
    icon: "✏️",
  },
  {
    title: "Exam Simulation",
    description:
      "Sit timed papers with server-anchored countdowns that match real exam conditions.",
    icon: "⏱️",
  },
  {
    title: "Progress Tracking",
    description:
      "See readiness trends and where to focus next — always with honest confidence levels.",
    icon: "📈",
  },
] as const;

export function FeaturesSection() {
  return (
    <section id="features" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold text-navy">Everything you need to prepare</h2>
          <p className="mt-3 text-navy/70">
            From your first diagnostic to full paper simulations — one platform, aligned to
            CXC.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-navy/8 bg-sky/30 p-6 transition-shadow hover:shadow-[0_4px_24px_rgba(13,27,62,0.08)]"
            >
              <span className="text-3xl" aria-hidden>
                {feature.icon}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-navy">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy/70">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
