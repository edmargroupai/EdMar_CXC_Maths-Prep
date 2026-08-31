"""L1/L2 dedupe (§27.8 cases 6–7)."""

from __future__ import annotations


def _trigrams(text: str) -> set[str]:
    normalised = f"  {text.lower().strip()}  "
    return {normalised[i : i + 3] for i in range(len(normalised) - 2)}


def trigram_similarity(a: str, b: str) -> float:
    if a == b:
        return 1.0
    ta, tb = _trigrams(a), _trigrams(b)
    if not ta or not tb:
        return 0.0
    intersection = len(ta & tb)
    return (2 * intersection) / (len(ta) + len(tb))


L2_THRESHOLD = 0.85


def is_l1_duplicate(stem_a: str, stem_b: str) -> bool:
    return stem_a.strip().lower() == stem_b.strip().lower()


def is_l2_duplicate(
    stem_a: str,
    stem_b: str,
    canonical_a: str,
    canonical_b: str,
) -> bool:
    if canonical_a != canonical_b:
        return False
    return trigram_similarity(stem_a, stem_b) >= L2_THRESHOLD
