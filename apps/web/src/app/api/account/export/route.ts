import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Self-service account export (§8.6). Returns JSON for the signed-in student. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("fn_get_account_export");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="edmar-export.json"',
    },
  });
}
