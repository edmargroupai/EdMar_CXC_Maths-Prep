"""Thirteen named pipeline stages (§13.3)."""

from __future__ import annotations

from typing import Callable

StageFn = Callable[[dict], dict]

STAGE_NAMES: tuple[str, ...] = (
    "01_extract",
    "02_normalise",
    "03_classify",
    "04_map_curriculum",
    "05_generate_question",
    "06_answer_spec",
    "07_generate_solution",
    "08_generate_explanation",
    "09_common_errors",
    "10_render_math",
    "11_validate",
    "12_dedupe",
    "13_queue_review",
)


def _identity(stage: str) -> StageFn:
    def run(ctx: dict) -> dict:
        ctx.setdefault("completed_stages", []).append(stage)
        return ctx

    return run


STAGES: dict[str, StageFn] = {name: _identity(name) for name in STAGE_NAMES}


def run_pipeline(ctx: dict, through: str | None = None) -> dict:
    limit = STAGE_NAMES.index(through) + 1 if through and through in STAGE_NAMES else len(STAGE_NAMES)
    for name in STAGE_NAMES[:limit]:
        ctx = STAGES[name](ctx)
    return ctx
