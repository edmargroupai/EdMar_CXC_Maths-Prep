"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function DiagnosticStarter() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startDiagnostic() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("fn_create_diagnostic");
    setLoading(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    const diagnosticId = (data as { diagnostic_session_id?: string })?.diagnostic_session_id;
    if (!diagnosticId) {
      setError("Diagnostic could not be started.");
      return;
    }

    router.push(`/diagnostic/session/${diagnosticId}`);
  }

  return (
    <div className="mt-8 space-y-4">
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      <Button onClick={() => void startDiagnostic()} disabled={loading} size="lg">
        {loading ? "Starting…" : "Start diagnostic"}
      </Button>
      <p className="text-sm text-navy/60">
        22 items across all modules. No worked solutions during the run — feedback comes at the end.
      </p>
    </div>
  );
}
