"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { BlockRenderer } from "@edmar/design/blocks";
import type { ResponseBlocks, SolutionStep } from "@edmar/types";

type ResponsePaneProps = {
  response: ResponseBlocks;
};

function SolutionSteps({ steps, mathRenders }: { steps: SolutionStep[]; mathRenders: ResponseBlocks["mathRenders"] }) {
  const [revealed, setRevealed] = useState(1);
  const showAll = revealed >= steps.length;

  return (
    <div className="space-y-4">
      {steps.slice(0, showAll ? steps.length : revealed).map((step) => (
        <div key={step.stepNo} className="rounded-xl border border-navy/10 p-4 dark:border-white/10">
          <p className="text-sm font-semibold text-navy dark:text-white">
            Step {step.stepNo}
            {step.marks != null ? ` · ${step.marks} mark${step.marks === 1 ? "" : "s"}` : ""}
          </p>
          <p className="mt-1 text-sm text-navy/70 dark:text-white/70">{step.instruction}</p>
          <BlockRenderer blocks={step.contentBlocks} mathRenders={mathRenders} className="mt-2" />
          {step.resultBlocks && step.resultBlocks.length > 0 ? (
            <div className="mt-2 inline-flex rounded-lg bg-gold/20 px-2 py-1 text-sm">
              <BlockRenderer blocks={step.resultBlocks} mathRenders={mathRenders} />
            </div>
          ) : null}
        </div>
      ))}
      {!showAll && steps.length > 1 ? (
        <button
          type="button"
          onClick={() => setRevealed(steps.length)}
          className="text-sm font-medium text-royal hover:underline"
        >
          Show all steps
        </button>
      ) : null}
    </div>
  );
}

function AccordionSection({
  title,
  number,
  defaultOpen = false,
  children,
}: {
  title: string;
  number: number;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-navy/10 dark:border-white/10">
      <button
        type="button"
        className="flex w-full items-center justify-between py-3 text-left text-sm font-semibold text-navy dark:text-white"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span>
          {number}. {title}
        </span>
        <span aria-hidden>{open ? "−" : "+"}</span>
      </button>
      {open ? <div className="pb-4">{children}</div> : null}
    </div>
  );
}

export function ResponsePane({ response }: ResponsePaneProps) {
  const { mathRenders } = response;
  const tabs = [
    {
      id: "solution",
      label: "Solution",
      content: (
        <div className="space-y-4">
          <SolutionSteps steps={response.solutionSteps} mathRenders={mathRenders} />
          <div>
            <h4 className="text-sm font-semibold text-navy dark:text-white">Final answer</h4>
            <BlockRenderer blocks={response.finalAnswerBlocks} mathRenders={mathRenders} />
          </div>
          <BlockRenderer blocks={response.whyThisWorks} mathRenders={mathRenders} />
          {response.explanation ? (
            <p className="text-sm text-navy/80 dark:text-white/80">{response.explanation}</p>
          ) : null}
          <BlockRenderer blocks={response.examTip} mathRenders={mathRenders} />
        </div>
      ),
    },
    {
      id: "concepts",
      label: "Concepts",
      content: (
        <div className="space-y-3">
          <ul className="flex flex-wrap gap-2">
            {response.conceptsRequired.map((concept) => (
              <li
                key={concept.objectiveId}
                className="rounded-full bg-sky px-3 py-1 text-xs font-medium text-navy dark:bg-white/10 dark:text-white"
              >
                {concept.code}: {concept.label}
              </li>
            ))}
          </ul>
          <BlockRenderer blocks={response.strategyBlocks} mathRenders={mathRenders} />
        </div>
      ),
    },
    {
      id: "quick-check",
      label: "Quick Check",
      content: response.quickCheck ? (
        <div>
          <BlockRenderer blocks={response.quickCheck.promptBlocks} mathRenders={mathRenders} />
          {response.quickCheck.solutionNote ? (
            <p className="mt-2 text-xs text-navy/60 dark:text-white/60">
              After you try: {response.quickCheck.solutionNote}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-navy/60 dark:text-white/60">No quick check for this item.</p>
      ),
    },
    {
      id: "notes",
      label: "Notes",
      content: (
        <textarea
          className="min-h-24 w-full rounded-xl border border-navy/15 bg-white p-3 text-sm text-navy dark:border-white/15 dark:bg-navy dark:text-white"
          placeholder="Your notes for this question…"
          aria-label="Question notes"
        />
      ),
    },
  ] as const;

  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("solution");

  return (
    <div className="@container">
      <div className="hidden @[64rem]:block">
        <div className="flex gap-1 border-b border-navy/10 dark:border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === tab.id
                  ? "border-b-2 border-royal text-royal"
                  : "text-navy/60 dark:text-white/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="pt-4">{tabs.find((tab) => tab.id === activeTab)?.content}</div>
      </div>

      <div className="@[64rem]:hidden">
        <AccordionSection title="Concepts required" number={2}>
          <ul className="flex flex-wrap gap-2">
            {response.conceptsRequired.map((concept) => (
              <li
                key={concept.objectiveId}
                className="rounded-full bg-sky px-3 py-1 text-xs font-medium text-navy"
              >
                {concept.label}
              </li>
            ))}
          </ul>
        </AccordionSection>
        <AccordionSection title="Strategy" number={3}>
          <BlockRenderer blocks={response.strategyBlocks} mathRenders={mathRenders} />
        </AccordionSection>
        <AccordionSection title="Guided solution" number={4} defaultOpen>
          <SolutionSteps steps={response.solutionSteps} mathRenders={mathRenders} />
        </AccordionSection>
        <AccordionSection title="Final answer" number={5}>
          <BlockRenderer blocks={response.finalAnswerBlocks} mathRenders={mathRenders} />
        </AccordionSection>
        <AccordionSection title="Why this works" number={6}>
          <BlockRenderer blocks={response.whyThisWorks} mathRenders={mathRenders} />
        </AccordionSection>
        <AccordionSection title="Common mistakes" number={7}>
          <ul className="space-y-2 text-sm">
            {response.commonErrors.map((err) => (
              <li key={err.key} className="rounded-lg bg-error/5 p-3 dark:bg-error/10">
                <p className="font-medium text-navy dark:text-white">{err.misconception}</p>
                <p className="mt-1 text-navy/70 dark:text-white/70">{err.correctiveNote}</p>
              </li>
            ))}
          </ul>
        </AccordionSection>
        <AccordionSection title="Exam tip" number={8}>
          <BlockRenderer blocks={response.examTip} mathRenders={mathRenders} />
        </AccordionSection>
        <AccordionSection title="Quick check" number={9}>
          {response.quickCheck ? (
            <BlockRenderer blocks={response.quickCheck.promptBlocks} mathRenders={mathRenders} />
          ) : (
            <p className="text-sm text-navy/60">No quick check.</p>
          )}
        </AccordionSection>
        <AccordionSection title="Answer validation" number={10}>
          <p className="text-sm text-navy/70 dark:text-white/70">
            Cognitive level: {response.answerValidation.cognitiveLevel}
            {response.answerValidation.marks != null
              ? ` · ${response.answerValidation.marks} marks`
              : ""}
          </p>
        </AccordionSection>
      </div>
    </div>
  );
}
