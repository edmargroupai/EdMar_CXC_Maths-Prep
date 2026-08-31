import { describe, expect, it } from "vitest";
import type { QuestionPayload, ResponseBlocks } from "@edmar/types";
import { questionReducer } from "../question-reducer";

const mockPayload: QuestionPayload = {
  questionId: "q1",
  questionVersionId: "v1",
  contentVersion: 1,
  payload: {
    questionType: "multiple_choice",
    difficultyBand: 2,
    calculatorAllowed: false,
    marks: 1,
    estimatedSeconds: 60,
    stemBlocks: [{ type: "text", value: "Test?" }],
    options: null,
    answerSpec: {
      answerType: "option_id",
      canonicalValue: "A",
      displayValue: "A",
      acceptedForms: ["A"],
      normalisation: "default",
    },
    assets: [],
    mathRenders: {},
    topicName: "Algebra",
    objectiveCodes: ["M1-1.1"],
  },
};

const mockResponse: ResponseBlocks = {
  conceptsRequired: [],
  strategyBlocks: [],
  solutionSteps: [],
  finalAnswerBlocks: [],
  whyThisWorks: [],
  explanation: null,
  commonErrors: [],
  examTip: [],
  quickCheck: null,
  answerValidation: {
    marks: 1,
    cognitiveLevel: "CK",
    methodClass: null,
    accuracyRule: "exact",
    verification: "verified",
    ambiguityNote: null,
    objectiveCodes: [],
  },
  mathRenders: {},
};

describe("questionReducer", () => {
  it("loads into answering", () => {
    const next = questionReducer(
      { phase: "loading" },
      { type: "LOAD_SUCCESS", payload: mockPayload, startedAt: 1000 },
    );
    expect(next.phase).toBe("answering");
    if (next.phase === "answering") {
      expect(next.input).toBeNull();
    }
  });

  it("checks then reveals with verdict", () => {
    let state = questionReducer(
      { phase: "loading" },
      { type: "LOAD_SUCCESS", payload: mockPayload, startedAt: 1000 },
    );
    state = questionReducer(state, { type: "SET_INPUT", input: "A" });
    state = questionReducer(state, {
      type: "CHECK",
      input: "A",
      clientAttemptId: "attempt-1",
    });
    expect(state.phase).toBe("checking");
    state = questionReducer(state, {
      type: "VERDICT",
      result: { isCorrect: true, normalised: "A" },
    });
    expect(state.phase).toBe("revealing");
    if (state.phase === "revealing") {
      expect(state.result.isCorrect).toBe(true);
    }
  });

  it("reveals response only after REVEAL_SUCCESS", () => {
    let state = questionReducer(
      { phase: "loading" },
      { type: "LOAD_SUCCESS", payload: mockPayload, startedAt: 1000 },
    );
    state = questionReducer(state, {
      type: "SKIP",
      clientAttemptId: "skip-1",
    });
    state = questionReducer(state, {
      type: "VERDICT",
      result: { isCorrect: false, normalised: "" },
    });
    expect(state.phase).toBe("revealing");
    state = questionReducer(state, { type: "REVEAL_SUCCESS", response: mockResponse });
    expect(state.phase).toBe("result");
    if (state.phase === "result") {
      expect(state.response).toEqual(mockResponse);
      expect(state.wasSkipped).toBe(true);
    }
  });

  it("advances to advancing phase", () => {
    let state = questionReducer(
      { phase: "loading" },
      { type: "LOAD_SUCCESS", payload: mockPayload, startedAt: 1000 },
    );
    state = questionReducer(state, { type: "ADVANCE" });
    expect(state.phase).toBe("advancing");
  });
});
