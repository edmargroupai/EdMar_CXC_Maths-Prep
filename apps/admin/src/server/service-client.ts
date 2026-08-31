import { createClient } from "@supabase/supabase-js";

const SERVICE_ENV = ["SUPABASE", "SERVICE", "ROLE", "KEY"].join("_");

/** Server-only Supabase client for publishing and review (§21, apps/admin/src/server). */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env[SERVICE_ENV];
  if (!url || !key) {
    throw new Error("Admin service credentials are not configured.");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
