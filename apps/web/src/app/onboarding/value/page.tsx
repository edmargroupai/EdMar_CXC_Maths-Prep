import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Welcome",
};

export default function OnboardingValuePage() {
  return (
    <div className="flex flex-1 flex-col justify-center text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-royal">
        CSEC Mathematics
      </p>
      <h1 className="mt-3 text-3xl font-bold text-navy sm:text-4xl">
        Built for Caribbean students
      </h1>
      <p className="mx-auto mt-4 max-w-lg text-navy/70">
        EdMar helps you practise with real CXC-style questions, track your progress, and
        prepare for exam day — starting with three free questions before you create an
        account.
      </p>
      <ul className="mx-auto mt-8 max-w-md space-y-3 text-left text-sm text-navy/80">
        <li className="flex gap-3 rounded-xl border border-navy/10 bg-sky/30 px-4 py-3">
          <span aria-hidden>✓</span>
          <span>Aligned to the official CXC syllabus</span>
        </li>
        <li className="flex gap-3 rounded-xl border border-navy/10 bg-sky/30 px-4 py-3">
          <span aria-hidden>✓</span>
          <span>Instant feedback on every answer</span>
        </li>
        <li className="flex gap-3 rounded-xl border border-navy/10 bg-sky/30 px-4 py-3">
          <span aria-hidden>✓</span>
          <span>Your progress carries over when you sign up</span>
        </li>
      </ul>
      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Button href="/onboarding/sitting" size="lg">
          Get started
        </Button>
        <Link
          href="/sign-in"
          className="text-sm font-medium text-royal hover:underline"
        >
          I already have an account
        </Link>
      </div>
    </div>
  );
}
