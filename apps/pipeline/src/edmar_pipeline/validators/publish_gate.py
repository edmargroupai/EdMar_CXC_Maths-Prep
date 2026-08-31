"""Publish gate — AI content must pass human review (§27.8 case 8)."""

from __future__ import annotations


def requires_human_review(provenance: str, review_status: str | None) -> bool:
    if provenance.startswith("ai_") and review_status not in ("approved", "published"):
        return True
    return False


def publish_allowed(provenance: str, review_status: str | None) -> bool:
    return not requires_human_review(provenance, review_status)
