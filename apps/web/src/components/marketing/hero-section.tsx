import { Button } from "@/components/ui/button";

function ProgressGauge() {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = 0.78;
  const offset = circumference * (1 - progress);

  return (
    <div className="relative flex h-44 w-44 items-center justify-center rounded-full bg-white p-4 shadow-[0_12px_40px_rgba(13,27,62,0.12)]">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden>
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#E5F1FF"
          strokeWidth="10"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#F2C94C"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-3xl font-bold text-navy">78%</p>
        <p className="text-xs font-medium text-navy/60">Good Progress!</p>
      </div>
    </div>
  );
}

function HeroIllustration() {
  return (
    <div className="relative mx-auto flex max-w-md items-end justify-center gap-4">
      <div className="rounded-3xl bg-sky px-6 py-8 shadow-[0_12px_40px_rgba(13,27,62,0.08)]">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-royal/10 text-4xl">
            📚
          </div>
          <div className="space-y-2">
            <div className="h-2 w-28 rounded-full bg-royal/20" />
            <div className="h-2 w-20 rounded-full bg-royal/15" />
          </div>
        </div>
      </div>
      <div className="absolute -right-2 top-0 sm:right-0">
        <ProgressGauge />
      </div>
      <div className="hidden rounded-2xl bg-purple/10 p-4 sm:block">
        <span className="text-2xl" aria-hidden>
          🎓
        </span>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="overflow-hidden bg-gradient-to-b from-sky/40 via-white to-white pb-16 pt-12 sm:pt-16">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-royal">
            CSEC Mathematics · Caribbean students
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight text-navy sm:text-5xl">
            Master CSEC Mathematics
            <span className="block text-royal">The Smart Way</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-navy/70 sm:text-lg">
            Built for Caribbean students. Aligned to the CXC syllabus. Diagnostic.
            Practice. Exam simulation. Results.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button href="/sign-in" size="lg">
              Start Free Diagnostic
            </Button>
            <Button href="/#how-it-works" variant="secondary" size="lg">
              See How It Works
            </Button>
          </div>
        </div>
        <HeroIllustration />
      </div>
    </section>
  );
}
