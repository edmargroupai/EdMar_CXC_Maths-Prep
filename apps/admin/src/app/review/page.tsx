import Link from "next/link";
import { listReviewQueue } from "@/server/review-queue";

export const metadata = { title: "Review queue" };

export default async function ReviewQueuePage() {
  let rows: Awaited<ReturnType<typeof listReviewQueue>> = [];
  let error: string | null = null;
  try {
    rows = await listReviewQueue();
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not load review queue.";
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Review queue</h1>
          <p className="mt-1 text-sm text-slate-600">Questions awaiting human review before publish.</p>
        </div>
        <Link href="/calibration" className="text-sm text-blue-700 hover:underline">
          Calibration
        </Link>
      </header>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-600">No items in the queue.</p>
      ) : (
        <ul className="divide-y rounded-xl border bg-white">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium">{row.question_type}</p>
                <p className="text-xs text-slate-500">
                  Difficulty {row.difficulty_band} · updated {row.updated_at}
                </p>
              </div>
              <Link href={`/review/${row.id}`} className="text-sm text-blue-700 hover:underline">
                Open
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
