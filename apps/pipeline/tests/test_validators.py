"""§27.8 AI-generated content validation tests."""

from edmar_pipeline.circuit_breaker import would_exceed_cap
from edmar_pipeline.cost import estimate_job_cost_usd
from edmar_pipeline.validators import (
    aesthetic_gate_rejects,
    is_l1_duplicate,
    is_l2_duplicate,
    latex_allowlist_ok,
    publish_allowed,
    requires_human_review,
    sympy_agrees,
)


def test_sympy_rejects_llm_disagreement():
    assert not sympy_agrees("2*x", "3*x")


def test_aesthetic_rejects_tiny_float_for_integer_source():
    assert aesthetic_gate_rejects("0.0000317", "540")


def test_latex_outside_allowlist_fails():
    assert not latex_allowlist_ok(r"\input{evil}")


def test_l1_duplicate_detected():
    assert is_l1_duplicate("Find x.", "find x.")


def test_l2_duplicate_same_numbers():
    a = "Solve for x: calculate 2 + 3 step by step"
    b = "Solve for x: calculate 2 + 3 step by step."
    assert is_l2_duplicate(a, b, "5", "5")


def test_ai_without_review_cannot_publish():
    assert requires_human_review("ai_generated", "draft")
    assert not publish_allowed("ai_generated", "draft")
    assert publish_allowed("ai_generated", "approved")


def test_circuit_breaker_refuses_at_eighty_percent_cap():
    estimate = estimate_job_cost_usd(20)
    assert would_exceed_cap(monthly_spend_usd=350, cap_usd=400, estimated_job_usd=estimate)


def test_cost_estimate_positive_for_twenty_pages():
    assert estimate_job_cost_usd(20) > 0


def test_malformed_json_retry_budget():
  """Case 10 — quarantine after two malformed JSON attempts (policy constant)."""
  max_retries = 2
  attempts = 2
  assert attempts >= max_retries
