/**
 * Character-trigram similarity for §9.8 L2 duplicate detection.
 * Pure-TS approximation of pg_trgm for the legacy import batch.
 */

function trigrams(text: string): Set<string> {
  const normalised = `  ${text.toLowerCase().replace(/\s+/g, " ").trim()}  `;
  const result = new Set<string>();
  for (let i = 0; i < normalised.length - 2; i++) {
    result.add(normalised.slice(i, i + 3));
  }
  return result;
}

/** Sørensen–Dice coefficient on character trigrams. */
export function trigramSimilarity(a: string, b: string): number {
  if (a === b) {
    return 1;
  }
  const ta = trigrams(a);
  const tb = trigrams(b);
  if (ta.size === 0 && tb.size === 0) {
    return 1;
  }
  if (ta.size === 0 || tb.size === 0) {
    return 0;
  }
  let intersection = 0;
  for (const t of ta) {
    if (tb.has(t)) {
      intersection += 1;
    }
  }
  return (2 * intersection) / (ta.size + tb.size);
}

export const L2_SIMILARITY_THRESHOLD = 0.85;

export function isL2Duplicate(
  stemA: string,
  stemB: string,
  canonicalA: string,
  canonicalB: string,
): boolean {
  if (canonicalA !== canonicalB) {
    return false;
  }
  return trigramSimilarity(stemA, stemB) >= L2_SIMILARITY_THRESHOLD;
}
