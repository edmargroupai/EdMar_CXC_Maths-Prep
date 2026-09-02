import Link from "next/link";
import { listTopicInventoryHealth } from "@/server/inventory-health";

export const metadata = { title: "Inventory health" };

function statusClass(status: string) {
  switch (status) {
    case "healthy":
      return "bg-emerald-50 text-emerald-800";
    case "low":
      return "bg-amber-50 text-amber-900";
    case "critical":
      return "bg-red-50 text-red-800";
    default:
      return "bg-slate-50 text-slate-700";
  }
}

export default async function InventoryHealthPage() {
  let rows: Awaited<ReturnType<typeof listTopicInventoryHealth>> = [];
  let error: string | null = null;
  try {
    rows = await listTopicInventoryHealth();
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not load inventory health.";
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Topic inventory health</h1>
          <p className="mt-1 text-sm text-slate-600">
            Coverage-aware reserves (ADR-023). Low totals alone do not justify AI refill if one skill is short.
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <Link href="/review" className="text-blue-700 hover:underline">
            Review queue
          </Link>
          <Link href="/calibration" className="text-blue-700 hover:underline">
            Calibration
          </Link>
        </div>
      </header>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-600">No active topics found.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Topic</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Approved</th>
                <th className="px-3 py-2">Draft</th>
                <th className="px-3 py-2">Pending</th>
                <th className="px-3 py-2">Template</th>
                <th className="px-3 py-2">AI</th>
                <th className="px-3 py-2">Objectives</th>
                <th className="px-3 py-2">Skills</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row) => (
                <tr key={row.topic_id}>
                  <td className="px-3 py-2">
                    <div className="font-medium">{row.topic_code}</div>
                    <div className="text-xs text-slate-500">{row.topic_name}</div>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${statusClass(row.health_status)}`}
                    >
                      {row.health_status}
                    </span>
                  </td>
                  <td className="px-3 py-2">{row.approved_count}</td>
                  <td className="px-3 py-2">{row.draft_count}</td>
                  <td className="px-3 py-2">{row.pending_review_count}</td>
                  <td className="px-3 py-2">{row.template_generated_count}</td>
                  <td className="px-3 py-2">{row.ai_generated_count}</td>
                  <td className="px-3 py-2">
                    {row.objective_coverage}/{row.objective_total}
                  </td>
                  <td className="px-3 py-2">
                    {row.skill_coverage}/{row.skill_total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
