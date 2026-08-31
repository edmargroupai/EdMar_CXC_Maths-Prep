import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

/** Stripe-shaped billing webhook (§23.5). Idempotent via fn_process_billing_webhook. */
export async function POST(request: Request) {
  const token = request.headers.get("x-edmar-webhook-token");
  if (!token) {
    return NextResponse.json({ error: "missing token" }, { status: 401 });
  }

  let event: Record<string, unknown>;
  try {
    event = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { url, key } = getSupabasePublicEnv();
  const supabase = createClient(url, key);
  const { data, error } = await supabase.rpc("fn_process_billing_webhook", {
    p_token: token,
    p_event: event,
  });

  if (error) {
    const status = error.message.includes("invalid webhook") ? 401 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json(data);
}
