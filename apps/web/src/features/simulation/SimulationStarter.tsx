"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function SimulationStarter() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function startSimulation() {
    setLoading(true);
    setError(null);
    setNotice(null);
    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("fn_create_simulation", {
      p_form: "p01_regular",
    });
    setLoading(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    const payload = data as {
      exam_session_id?: string;
      blueprint_ok?: boolean;
      item_count?: number;
    };

    if (!payload.exam_session_id) {
      setError("Simulation could not be created.");
      return;
    }

    if (!payload.blueprint_ok) {
      setNotice(
        "Practice mock — your bank does not yet have the right mix for a full exam-standard paper, so this one will not change readiness.",
      );
    }

    router.push(`/simulate/${payload.exam_session_id}`);
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {notice}
        </p>
      ) : null}
      <Button onClick={() => void startSimulation()} disabled={loading}>
        {loading ? "Creating paper…" : "Start Paper 01 simulation"}
      </Button>
    </div>
  );
}
