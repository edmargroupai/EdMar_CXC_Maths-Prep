import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Two-step account deletion — requires confirm=true (§O.9, P22). */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let confirm = false;
  try {
    const body = (await request.json()) as { confirm?: boolean };
    confirm = Boolean(body.confirm);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (!confirm) {
    return NextResponse.json({ error: "confirmation required" }, { status: 400 });
  }

  const { error } = await supabase.rpc("fn_delete_own_account", { p_confirm: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
