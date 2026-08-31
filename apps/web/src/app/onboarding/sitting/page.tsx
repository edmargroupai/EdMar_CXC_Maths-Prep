"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SittingMonth } from "@edmar/types";
import { Button } from "@/components/ui/button";
import { useOnboardingStore } from "@/stores/onboardingStore";

const YEARS = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035] as const;

const MONTHS: { value: SittingMonth; label: string }[] = [
  { value: "january", label: "January" },
  { value: "may_june", label: "May / June" },
];

export default function OnboardingSittingPage() {
  const router = useRouter();
  const storedYear = useOnboardingStore((s) => s.examSittingYear);
  const storedMonth = useOnboardingStore((s) => s.examSittingMonth);
  const setExamSitting = useOnboardingStore((s) => s.setExamSitting);

  const [year, setYear] = useState<number>(storedYear ?? 2027);
  const [month, setMonth] = useState<SittingMonth>(storedMonth ?? "may_june");

  function handleContinue() {
    setExamSitting(year, month);
    router.push("/onboarding/interests");
  }

  return (
    <div className="flex flex-1 flex-col justify-center">
      <h1 className="text-2xl font-bold text-navy">When are you sitting CSEC Maths?</h1>
      <p className="mt-2 text-navy/70">
        This helps us tailor your practice timeline. You can change it later in your profile.
      </p>

      <div className="mt-8 space-y-6">
        <div>
          <label htmlFor="exam-year" className="block text-sm font-medium text-navy">
            Exam year
          </label>
          <select
            id="exam-year"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="mt-1.5 w-full rounded-xl border border-navy/15 bg-white px-4 py-3 text-sm text-navy outline-none ring-royal/30 focus:border-royal focus:ring-2"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <fieldset>
          <legend className="block text-sm font-medium text-navy">Sitting period</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {MONTHS.map(({ value, label }) => (
              <label
                key={value}
                className={`flex cursor-pointer items-center justify-center rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                  month === value
                    ? "border-royal bg-sky/50 text-navy"
                    : "border-navy/15 text-navy/70 hover:bg-sky/30"
                }`}
              >
                <input
                  type="radio"
                  name="sitting-month"
                  value={value}
                  checked={month === value}
                  onChange={() => setMonth(value)}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="mt-10">
        <Button type="button" size="lg" className="w-full sm:w-auto" onClick={handleContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
