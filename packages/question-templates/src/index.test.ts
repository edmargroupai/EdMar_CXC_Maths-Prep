import { describe, expect, it } from "vitest";
import { validate } from "@edmar/answer-core";
import {
  generateFromTemplate,
  generateLinearSolve,
  generatePercentDiscount,
  generateSimpleInterest,
  planReplenishment,
} from "./index.js";

describe("deterministic templates", () => {
  it("percent_discount is stable for a seed and matches answer-core", () => {
    const a = generatePercentDiscount(42);
    const b = generatePercentDiscount(42);
    expect(a.parameters).toEqual(b.parameters);
    const result = validate(String(a.parameters.sale), a.answerSpec);
    expect(result.isCorrect).toBe(true);
  });

  it("simple_interest matches answer-core", () => {
    const q = generateSimpleInterest(7);
    const result = validate(String(q.parameters.interest), q.answerSpec);
    expect(result.isCorrect).toBe(true);
  });

  it("linear_solve solution matches answer-core", () => {
    const q = generateLinearSolve(99);
    const result = validate(String(q.parameters.x), q.answerSpec);
    expect(result.isCorrect).toBe(true);
  });

  it("generateFromTemplate covers registered keys", () => {
    for (const key of ["percent_discount", "simple_interest", "linear_solve"] as const) {
      const q = generateFromTemplate(key, 1);
      expect(q.generatorKey).toBe(key);
      const numeric = Object.values(q.parameters).at(-1);
      expect(validate(String(numeric), q.answerSpec).isCorrect).toBe(true);
    }
  });
});

describe("replenishment policy", () => {
  it("never allows sync AI or auto-publish", () => {
    const plan = planReplenishment({
      topicId: "t1",
      approvedCount: 10,
      minApproved: 40,
      templateKeys: ["percent_discount"],
    });
    expect(plan.syncAiAllowed).toBe(false);
    expect(plan.autoPublishAllowed).toBe(false);
    expect(plan.action).toBe("enqueue_template_job");
  });

  it("falls back to AI draft job only when templates unavailable — still offline", () => {
    const plan = planReplenishment({
      topicId: "t1",
      approvedCount: 5,
      minApproved: 40,
      templateKeys: [],
    });
    expect(plan.action).toBe("enqueue_ai_draft_job");
    expect(plan.syncAiAllowed).toBe(false);
    expect(plan.autoPublishAllowed).toBe(false);
  });

  it("does nothing when inventory is healthy", () => {
    const plan = planReplenishment({
      topicId: "t1",
      approvedCount: 60,
      minApproved: 40,
      templateKeys: ["linear_solve"],
    });
    expect(plan.action).toBe("none");
  });
});
