import { createServiceClient } from "@/server/service-client";

export type InventoryHealthRow = {
  topic_id: string;
  topic_code: string;
  topic_name: string;
  approved_count: number;
  draft_count: number;
  pending_review_count: number;
  template_generated_count: number;
  ai_generated_count: number;
  objective_coverage: number;
  objective_total: number;
  skill_coverage: number;
  skill_total: number;
  health_status: "healthy" | "low" | "critical";
};

/** Admin inventory health (§21.4a / ADR-023). */
export async function listTopicInventoryHealth(): Promise<InventoryHealthRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("fn_topic_inventory_health");
  if (error) {
    throw new Error(error.message);
  }
  return (data as InventoryHealthRow[]) ?? [];
}
