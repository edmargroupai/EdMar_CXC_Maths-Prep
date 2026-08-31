"use client";

type NumericInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

const KEYS = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "0", ".", "-", "⌫"] as const;

export function NumericInput({ value, onChange, disabled = false }: NumericInputProps) {
  function press(key: (typeof KEYS)[number]) {
    if (disabled) return;
    if (key === "⌫") {
      onChange(value.slice(0, -1));
      return;
    }
    onChange(value + key);
  }

  return (
    <div className="space-y-3">
      <div
        className="rounded-xl border border-navy/15 bg-white px-4 py-3 font-mono text-lg text-navy dark:border-white/15 dark:bg-navy dark:text-white"
        aria-live="polite"
      >
        {value || "Enter your answer"}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {KEYS.map((key) => (
          <button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => press(key)}
            className="rounded-xl bg-sky py-3 text-lg font-semibold text-navy transition-colors hover:bg-sky-deep disabled:opacity-50 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  );
}
