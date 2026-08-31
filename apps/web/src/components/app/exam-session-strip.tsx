type ExamSessionStripProps = {
  paperTitle: string;
  position: number;
  total: number;
  timeRemaining?: string;
};

export function ExamSessionStrip({
  paperTitle,
  position,
  total,
  timeRemaining = "01:24:36",
}: ExamSessionStripProps) {
  return (
    <div className="sticky top-0 z-30 border-b border-navy/10 bg-white px-4 py-3 sm:px-6">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-navy">{paperTitle}</p>
          <p className="text-xs text-navy/50">
            Question {position} of {total}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-sky px-4 py-1.5 text-sm font-semibold text-navy">
            {position}/{total}
          </div>
          <div
            className="rounded-full bg-navy px-4 py-1.5 font-mono text-sm font-semibold text-gold"
            aria-live="polite"
          >
            {timeRemaining}
          </div>
        </div>
      </div>
    </div>
  );
}
