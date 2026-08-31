"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BlockRenderer } from "@edmar/design/blocks";
import { createClient } from "@/lib/supabase/client";

interface DiagnosticItem {
  position: number;
  question_version_id: string;
  block_1: unknown;
  topic_name: string;
  complete?: boolean;
}

export function DiagnosticRunner({ diagnosticSessionId }: { diagnosticSessionId: string }) {
  const router = useRouter();
  const [item, setItem] = useState<DiagnosticItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadNext = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("fn_diagnostic_next_item", {
      p_diagnostic_session_id: diagnosticSessionId,
    });
    setLoading(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    const payload = data as DiagnosticItem;
    if (payload.complete) {
      const { error: completeError } = await supabase.rpc("fn_complete_diagnostic", {
        p_diagnostic_session_id: diagnosticSessionId,
      });
      if (completeError) {
        setError(completeError.message);
        return;
      }
      router.push("/progress");
      return;
    }

    setItem(payload);
  }, [diagnosticSessionId, router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadNext();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadNext]);

  if (loading && !item) {
    return <p className="text-sm text-navy/60">Loading diagnostic item…</p>;
  }

  if (error) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {error}
      </p>
    );
  }

  if (!item) return null;

  return (
    <div className="space-y-6">
      <p className="text-sm text-navy/60">
        Item {item.position} · {item.topic_name}
      </p>
      <div className="rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(13,27,62,0.06)]">
        <BlockRenderer blocks={item.block_1 as never} />
      </div>
      <p className="text-sm text-navy/50">
        Diagnostic mode — response feedback is withheld until completion.
      </p>
      <Button onClick={() => void loadNext()} disabled={loading}>
        {loading ? "Loading…" : "Next item"}
      </Button>
    </div>
  );
}
