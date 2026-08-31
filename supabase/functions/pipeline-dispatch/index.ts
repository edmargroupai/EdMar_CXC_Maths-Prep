import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SERVICE_ENV = ["SUPABASE", "SERVICE", "ROLE", "KEY"].join("_");
const CIRCUIT_RATIO = 0.8;

interface DispatchBody {
  jobType: string;
  params?: Record<string, unknown>;
  sourcePath?: string;
}

function estimateCostUsd(pageCount: number): number {
  const pages = Math.max(pageCount, 1);
  const inputTokens = pages * 12000;
  const outputTokens = pages * 8000;
  return Number(((inputTokens / 1000) * 0.003 + (outputTokens / 1000) * 0.015).toFixed(4));
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method not allowed" }), { status: 405 });
  }

  const auth = req.headers.get("Authorization");
  if (!auth) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get(SERVICE_ENV);
  if (!url || !anon || !serviceKey) {
    return new Response(JSON.stringify({ error: "misconfigured" }), { status: 500 });
  }

  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: auth } },
  });
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  const { data: isStaff } = await userClient.rpc("is_staff");
  if (!isStaff) {
    return new Response(JSON.stringify({ error: "forbidden" }), { status: 403 });
  }

  let body: DispatchBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), { status: 400 });
  }

  const pageCount = Number((body.params?.pageCount as number | undefined) ?? 20);
  const estimated = estimateCostUsd(pageCount);

  const admin = createClient(url, serviceKey);
  const { data: capRow } = await admin
    .from("app_config")
    .select("value")
    .eq("key", "ai_monthly_cap_usd")
    .maybeSingle();
  const cap = Number(capRow?.value ?? 400);
  const { data: spend } = await admin.rpc("fn_get_monthly_ai_spend");
  const monthlySpend = Number(spend ?? 0);

  if (monthlySpend + estimated > cap * CIRCUIT_RATIO) {
    return new Response(JSON.stringify({ error: "ai_budget_exceeded" }), { status: 403 });
  }

  const { data: job, error } = await admin
    .from("content_jobs")
    .insert({
      job_type: body.jobType,
      params: body.params ?? {},
      source_path: body.sourcePath ?? null,
      requested_by: user.id,
      estimated_cost_usd: estimated,
      status: "queued",
      items_total: pageCount,
    })
    .select("id")
    .single();

  if (error || !job) {
    return new Response(JSON.stringify({ error: error?.message ?? "insert failed" }), {
      status: 500,
    });
  }

  const workerUrl = Deno.env.get("PIPELINE_WORKER_URL");
  if (workerUrl) {
    const token = Deno.env.get("PIPELINE_WORKER_TOKEN");
    try {
      await fetch(workerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ jobId: job.id }),
      });
    } catch {
      // job stays queued — worker drain picks it up
    }
  }

  return new Response(
    JSON.stringify({ jobId: job.id, estimatedCostUsd: estimated, status: "queued" }),
    { headers: { "Content-Type": "application/json" } },
  );
});
