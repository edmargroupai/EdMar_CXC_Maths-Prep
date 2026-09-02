"""Template-first inventory replenishment (ADR-023).

Never auto-publishes. Never called from the student path.
AI drafts are only planned when no template generator applies.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal


Action = Literal["none", "enqueue_template_job", "enqueue_ai_draft_job"]


@dataclass(frozen=True)
class ReplenishmentPlan:
    sync_ai_allowed: bool
    auto_publish_allowed: bool
    action: Action
    preferred_generators: tuple[str, ...]
    reason: str


def plan_replenishment(
    *,
    approved_count: int,
    min_approved: int,
    template_keys: list[str],
    coverage_holes: list[str] | None = None,
) -> ReplenishmentPlan:
    """Decide offline replenishment. Student practice is unaffected."""
    if approved_count >= min_approved and not coverage_holes:
        return ReplenishmentPlan(
            sync_ai_allowed=False,
            auto_publish_allowed=False,
            action="none",
            preferred_generators=(),
            reason="healthy",
        )

    if template_keys:
        return ReplenishmentPlan(
            sync_ai_allowed=False,
            auto_publish_allowed=False,
            action="enqueue_template_job",
            preferred_generators=tuple(template_keys),
            reason="template_first",
        )

    return ReplenishmentPlan(
        sync_ai_allowed=False,
        auto_publish_allowed=False,
        action="enqueue_ai_draft_job",
        preferred_generators=(),
        reason="ai_when_necessary",
    )


def assert_no_student_sync_ai(plan: ReplenishmentPlan) -> None:
    assert plan.sync_ai_allowed is False
    assert plan.auto_publish_allowed is False
