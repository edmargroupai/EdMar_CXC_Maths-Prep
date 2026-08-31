import { Button } from "@/components/ui/button";

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      className="rounded-2xl border border-error/30 bg-error/5 px-6 py-8 text-center dark:border-error/40 dark:bg-error/10"
      role="alert"
    >
      <h2 className="text-lg font-semibold text-navy dark:text-white">{title}</h2>
      <p className="mt-2 text-sm text-navy/70 dark:text-white/70">{message}</p>
      {onRetry ? (
        <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
