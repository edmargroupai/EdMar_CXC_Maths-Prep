import Link from "next/link";
import { createServiceClient } from "@/server/service-client";

export const metadata = { title: "Projection calibration" };

export default async function CalibrationPage() {
  let payload: Record<string, unknown> | null = null;
  let error: string | null = null;

  try {
    const supabase = createServiceClient();
    const { data, error: rpcError } = await supabase.rpc("fn_projection_calibration");
    if (rpcError) {
      error = rpcError.message;
    } else {
      payload = data as Record<string, unknown>;
    }
  } catch (err) {
    error = err instanceof Error ? err.message : "Calibration unavailable.";
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/review" className="text-sm text-blue-700 hover:underline">
        ← Review queue
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Projection calibration</h1>
      <p className="mt-2 text-sm text-slate-600">§42.6 aggregate view for staff review.</p>

      {error ? (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : (
        <pre className="mt-6 overflow-auto rounded-xl bg-white p-4 text-xs shadow-sm">
          {JSON.stringify(payload, null, 2)}
        </pre>
      )}
    </div>
  );
}
