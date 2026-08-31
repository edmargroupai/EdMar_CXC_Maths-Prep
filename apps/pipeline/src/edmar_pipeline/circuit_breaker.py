"""AI budget circuit breaker (§13.9, §8.3)."""

from __future__ import annotations

CIRCUIT_BREAKER_RATIO = 0.8


def would_exceed_cap(
    monthly_spend_usd: float,
    cap_usd: float,
    estimated_job_usd: float,
) -> bool:
    """Refuse enqueue when spend + estimate would exceed 80% of cap."""
    threshold = cap_usd * CIRCUIT_BREAKER_RATIO
    return (monthly_spend_usd + estimated_job_usd) > threshold
