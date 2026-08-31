import type { QuestionPayload, ResponseBlocks, ValidationResult } from "@edmar/types";

export type AnswerInput = string | string[];

export type QuestionPhase =
  | { phase: "loading" }
  | {
      phase: "answering";
      payload: QuestionPayload;
      input: AnswerInput | null;
      startedAt: number;
    }
  | {
      phase: "checking";
      payload: QuestionPayload;
      input: AnswerInput;
      clientAttemptId: string;
      wasSkipped: boolean;
    }
  | {
      phase: "revealing";
      payload: QuestionPayload;
      input: AnswerInput;
      result: ValidationResult;
      clientAttemptId: string;
      wasSkipped: boolean;
    }
  | {
      phase: "result";
      payload: QuestionPayload;
      input: AnswerInput;
      result: ValidationResult;
      response: ResponseBlocks;
      revealedSteps: number;
      clientAttemptId: string;
      wasSkipped: boolean;
    }
  | { phase: "advancing" };

export type QuestionAction =
  | { type: "LOAD_START" }
  | { type: "LOAD_SUCCESS"; payload: QuestionPayload; startedAt: number }
  | { type: "LOAD_ERROR" }
  | { type: "SET_INPUT"; input: AnswerInput | null }
  | { type: "CHECK"; input: AnswerInput; clientAttemptId: string }
  | { type: "VERDICT"; result: ValidationResult }
  | { type: "REVEAL_SUCCESS"; response: ResponseBlocks }
  | { type: "ADVANCE" }
  | { type: "SKIP"; clientAttemptId: string };

export function questionReducer(state: QuestionPhase, action: QuestionAction): QuestionPhase {
  switch (action.type) {
    case "LOAD_START":
      return { phase: "loading" };

    case "LOAD_SUCCESS":
      return {
        phase: "answering",
        payload: action.payload,
        input: null,
        startedAt: action.startedAt,
      };

    case "LOAD_ERROR":
      return { phase: "loading" };

    case "SET_INPUT":
      if (state.phase !== "answering") return state;
      return { ...state, input: action.input };

    case "CHECK":
      if (state.phase !== "answering") return state;
      return {
        phase: "checking",
        payload: state.payload,
        input: action.input,
        clientAttemptId: action.clientAttemptId,
        wasSkipped: false,
      };

    case "VERDICT":
      if (state.phase !== "checking") return state;
      return {
        phase: "revealing",
        payload: state.payload,
        input: state.input,
        result: action.result,
        clientAttemptId: state.clientAttemptId,
        wasSkipped: state.wasSkipped,
      };

    case "REVEAL_SUCCESS":
      if (state.phase !== "revealing") return state;
      return {
        phase: "result",
        payload: state.payload,
        input: state.input,
        result: state.result,
        response: action.response,
        revealedSteps: action.response.solutionSteps.length,
        clientAttemptId: state.clientAttemptId,
        wasSkipped: state.wasSkipped,
      };

    case "SKIP":
      if (state.phase !== "answering") return state;
      return {
        phase: "checking",
        payload: state.payload,
        input: "",
        clientAttemptId: action.clientAttemptId,
        wasSkipped: true,
      };

    case "ADVANCE":
      return { phase: "advancing" };

    default:
      return state;
  }
}

export function isInputNonEmpty(input: AnswerInput | null): boolean {
  if (input === null) return false;
  if (Array.isArray(input)) return input.length > 0;
  return input.trim().length > 0;
}
