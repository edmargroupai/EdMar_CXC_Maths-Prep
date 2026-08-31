import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Bookmarks" };

export default function BookmarksPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-navy dark:text-white">Bookmarks</h1>
      <p className="mt-1 text-navy/60 dark:text-white/70">
        Questions you saved to revisit later.
      </p>
      <div className="mt-8">
        <EmptyState
          title="No bookmarks yet"
          description="Bookmark a question during practice to find it here."
          actionLabel="Start practising"
          actionHref="/practice"
        />
      </div>
    </div>
  );
}
