from edmar_pipeline.replenishment import assert_no_student_sync_ai, plan_replenishment


def test_template_first_when_low():
    plan = plan_replenishment(
        approved_count=10,
        min_approved=40,
        template_keys=["percent_discount"],
    )
    assert plan.action == "enqueue_template_job"
    assert_no_student_sync_ai(plan)


def test_ai_only_when_no_templates():
    plan = plan_replenishment(approved_count=10, min_approved=40, template_keys=[])
    assert plan.action == "enqueue_ai_draft_job"
    assert_no_student_sync_ai(plan)


def test_healthy_inventory():
    plan = plan_replenishment(approved_count=80, min_approved=40, template_keys=["linear_solve"])
    assert plan.action == "none"
