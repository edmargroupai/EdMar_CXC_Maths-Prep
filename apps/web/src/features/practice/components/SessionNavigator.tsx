"use client";

type SessionNavigatorProps = {
  total: number;
  current: number;
  sessionId: string;
  onSelect: (position: number) => void;
};

export function SessionNavigator({
  total,
  current,
  sessionId,
  onSelect,
}: SessionNavigatorProps) {
  return (
    <nav aria-label="Question navigator" className="flex flex-wrap gap-2">
      {Array.from({ length: total }, (_, index) => {
        const position = index;
        const isCurrent = position === current;
        return (
          <button
            key={position}
            type="button"
            aria-current={isCurrent ? "step" : undefined}
            aria-label={`Question ${position + 1} of ${total}`}
            onClick={() => onSelect(position)}
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
              isCurrent
                ? "bg-royal text-white"
                : "bg-sky text-navy hover:bg-sky-deep dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
            }`}
          >
            {position + 1}
          </button>
        );
      })}
      <span className="sr-only">Session {sessionId}</span>
    </nav>
  );
}
