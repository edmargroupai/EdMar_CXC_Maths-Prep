/** Candidate URLs for a question figure. Public files first, then Supabase storage. */
export function questionAssetCandidates(
  storagePath: string,
  supabaseUrl?: string | null,
): string[] {
  const trimmed = storagePath.trim();
  if (!trimmed) return [];
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:")) {
    return [trimmed];
  }
  if (trimmed.startsWith("/")) {
    return [trimmed];
  }

  const fileName = trimmed.split("/").pop() ?? trimmed;
  const stem = fileName.replace(/\.(jpe?g|png|webp|svg)$/i, "");
  const candidates = [
    `/question-visuals/${stem}.svg`,
    `/question-visuals/${stem}.webp`,
    `/question-visuals/${stem}.png`,
    `/question-visuals/${fileName}`,
  ];

  if (supabaseUrl) {
    const base = supabaseUrl.replace(/\/$/, "");
    candidates.push(
      `${base}/storage/v1/object/public/question-assets/${trimmed.replace(/^\//, "")}`,
    );
  }

  return [...new Set(candidates)];
}
