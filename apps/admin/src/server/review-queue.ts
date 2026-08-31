import { createServiceClient } from "@/server/service-client";

/** Staff-only review queue (§21). Full ten-block editor ships in a later pass. */
export async function listReviewQueue() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("questions")
    .select("id, status, difficulty_band, question_type, updated_at")
    .eq("status", "pending_review")
    .order("updated_at", { ascending: true })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
