import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Pricing",
};

export default function PricingPage() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h1 className="text-4xl font-bold text-navy">Simple, student-friendly plans</h1>
        <p className="mt-4 text-lg text-navy/70">
          Start free with daily practice. Upgrade when you need unlimited questions, timed
          simulations, and full progress insights.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          <article className="rounded-2xl border border-navy/10 bg-white p-8 text-left shadow-sm">
            <h2 className="text-xl font-semibold text-navy">Free</h2>
            <p className="mt-2 text-3xl font-bold text-navy">
              $0 <span className="text-base font-normal text-navy/50">/ month</span>
            </p>
            <ul className="mt-6 space-y-2 text-sm text-navy/70">
              <li>10 questions per day</li>
              <li>Topic practice</li>
              <li>Basic progress view</li>
            </ul>
            <Button href="/sign-in" className="mt-8 w-full">
              Get started
            </Button>
          </article>
          <article className="rounded-2xl border-2 border-gold bg-navy p-8 text-left text-white shadow-lg">
            <h2 className="text-xl font-semibold">Premium</h2>
            <p className="mt-2 text-3xl font-bold text-gold">
              Coming soon
            </p>
            <ul className="mt-6 space-y-2 text-sm text-white/80">
              <li>Unlimited practice</li>
              <li>Timed exam simulations</li>
              <li>Full readiness insights</li>
            </ul>
            <Button href="/sign-in" variant="primary" className="mt-8 w-full">
              Join waitlist
            </Button>
          </article>
        </div>
        <p className="mt-8 text-sm text-navy/50">
          <Link href="/" className="text-royal hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </section>
  );
}
