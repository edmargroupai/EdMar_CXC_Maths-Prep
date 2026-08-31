import { Suspense } from "react";
import { PracticeSetupForm } from "./practice-setup-form";

export const metadata = { title: "Practice setup" };

export default function PracticeSetupPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-navy dark:text-white">Start a session</h1>
      <p className="mt-1 text-navy/60 dark:text-white/70">
        Choose how many questions and the difficulty level.
      </p>
      <Suspense
        fallback={
          <div className="mt-8 h-40 animate-pulse rounded-xl bg-sky/40" aria-busy="true" />
        }
      >
        <PracticeSetupForm />
      </Suspense>
    </div>
  );
}
