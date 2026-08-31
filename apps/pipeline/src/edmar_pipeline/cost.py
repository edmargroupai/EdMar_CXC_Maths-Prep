"""Cost estimation for pipeline-dispatch (§13.9)."""

from __future__ import annotations

# USD per 1k tokens — conservative defaults for budgeting only.
INPUT_USD_PER_1K = 0.003
OUTPUT_USD_PER_1K = 0.015

STAGE_TOKEN_ESTIMATES: dict[str, tuple[int, int]] = {
    "01_extract": (0, 0),
    "02_normalise": (0, 0),
    "03_classify": (800, 200),
    "04_map_curriculum": (1200, 400),
    "05_generate_question": (2500, 1800),
    "06_answer_spec": (600, 300),
    "07_generate_solution": (2000, 1500),
    "08_generate_explanation": (1800, 1200),
    "09_common_errors": (1000, 800),
    "10_render_math": (0, 0),
    "11_validate": (0, 0),
    "12_dedupe": (0, 0),
    "13_queue_review": (0, 0),
}


def estimate_job_cost_usd(page_count: int, stages: list[str] | None = None) -> float:
    """Estimate USD for a workbook slice job."""
    active = stages or list(STAGE_TOKEN_ESTIMATES.keys())
    input_tokens = 0
    output_tokens = 0
    for stage in active:
        est = STAGE_TOKEN_ESTIMATES.get(stage, (500, 500))
        input_tokens += est[0] * max(page_count, 1)
        output_tokens += est[1] * max(page_count, 1)
    return round(
        (input_tokens / 1000) * INPUT_USD_PER_1K + (output_tokens / 1000) * OUTPUT_USD_PER_1K,
        4,
    )
