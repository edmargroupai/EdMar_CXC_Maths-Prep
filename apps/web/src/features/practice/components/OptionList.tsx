import type { QuestionOption } from "@edmar/types";
import { BlockRenderer } from "@edmar/design/blocks";
import type { MathRender } from "@edmar/types";

type OptionListProps = {
  options: QuestionOption[];
  selected: string | null;
  onSelect: (key: string) => void;
  disabled?: boolean;
  multi?: boolean;
  selectedSet?: string[];
  mathRenders?: Record<string, MathRender>;
};

export function OptionList({
  options,
  selected,
  onSelect,
  disabled = false,
  multi = false,
  selectedSet = [],
  mathRenders = {},
}: OptionListProps) {
  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="sr-only">Choose an answer</legend>
      {options.map((option) => {
        const isSelected = multi
          ? selectedSet.includes(option.optionKey)
          : selected === option.optionKey;
        return (
          <label
            key={option.optionKey}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
              isSelected
                ? "border-royal bg-sky/50 text-navy dark:bg-royal/20 dark:text-white"
                : "border-navy/10 text-navy/80 hover:bg-sky/30 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/5"
            }`}
          >
            <input
              type={multi ? "checkbox" : "radio"}
              name="answer"
              value={option.optionKey}
              checked={isSelected}
              onChange={() => onSelect(option.optionKey)}
              className="mt-1 h-4 w-4 border-navy/20 text-royal focus:ring-royal"
            />
            <span className="flex gap-2">
              <span className="font-semibold">{option.optionKey}.</span>
              <BlockRenderer blocks={option.contentBlocks} mathRenders={mathRenders} />
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
