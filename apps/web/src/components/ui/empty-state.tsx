import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: ReactNode;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-navy/15 bg-white px-6 py-16 text-center dark:border-white/15 dark:bg-navy">
      {icon ? <div className="mb-4 text-4xl text-royal">{icon}</div> : null}
      <h2 className="text-lg font-semibold text-navy dark:text-white">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-navy/60 dark:text-white/70">{description}</p>
      ) : null}
      {actionLabel && actionHref ? (
        <Button href={actionHref} className="mt-6" size="sm">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
