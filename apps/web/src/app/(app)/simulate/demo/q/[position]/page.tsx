"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { demoExamQuestion } from "@/lib/mock/app-shell";

export default function DemoExamQuestionPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [marked, setMarked] = useState(false);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <article className="rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(13,27,62,0.08)] sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <span className="rounded-full bg-sky px-3 py-1 text-xs font-semibold text-royal">
            Question {demoExamQuestion.position}
          </span>
          <span className="text-sm font-medium text-navy/50">
            {demoExamQuestion.marks} mark
          </span>
        </div>

        <p className="mt-6 text-lg leading-relaxed text-navy">{demoExamQuestion.stem}</p>

        <fieldset className="mt-8 space-y-3">
          <legend className="sr-only">Select an answer</legend>
          {demoExamQuestion.options.map((option) => (
            <label
              key={option.key}
              className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 px-4 py-4 transition-colors ${
                selected === option.key
                  ? "border-royal bg-sky/50"
                  : "border-navy/10 hover:border-royal/40 hover:bg-sky/20"
              }`}
            >
              <input
                type="radio"
                name="answer"
                value={option.key}
                checked={selected === option.key}
                onChange={() => setSelected(option.key)}
                className="h-4 w-4 border-navy/20 text-royal focus:ring-royal"
              />
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy/5 text-sm font-bold text-navy">
                {option.key}
              </span>
              <span className="text-navy">{option.label}</span>
            </label>
          ))}
        </fieldset>
      </article>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <label className="flex items-center gap-2 text-sm text-navy/70">
          <input
            type="checkbox"
            checked={marked}
            onChange={(e) => setMarked(e.target.checked)}
            className="h-4 w-4 rounded border-navy/20 text-royal focus:ring-royal"
          />
          Mark for review
        </label>
        <div className="flex gap-3">
          <Button variant="ghost" size="sm" disabled>
            Previous
          </Button>
          <Button variant="secondary" size="sm">
            Next
          </Button>
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-navy/50">
        <Link href="/simulate" className="text-royal hover:underline">
          Exit simulation
        </Link>
      </p>
    </div>
  );
}
