import Ajv2020, { type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { validate as validateAnswerCore } from "@edmar/answer-core";
import type { AnswerSpec } from "@edmar/types";
import answerSpecSchema from "../schemas/edmar-answer-spec.schema.json";
import questionSchema from "../schemas/edmar-question.schema.json";

export interface ValidationOutcome {
  valid: boolean;
  errors: string[];
}

export interface RoundTripResult {
  ok: boolean;
  reason?: string;
}

function formatErrors(errors: ErrorObject[] | null | undefined): string[] {
  if (!errors?.length) {
    return ["unknown schema validation error"];
  }
  return errors.map((error) => {
    const path = error.instancePath.length > 0 ? error.instancePath : "/";
    const detail = error.message ?? "invalid";
    return `${path}: ${detail}`;
  });
}

function createValidators(): {
  validateQuestionFn: ValidateFunction;
  validateAnswerSpecFn: ValidateFunction;
} {
  const ajv = new Ajv2020({ strict: false, allErrors: true });
  addFormats(ajv);
  ajv.addSchema(answerSpecSchema);
  ajv.addSchema(questionSchema);

  const validateQuestionFn = ajv.getSchema(questionSchema.$id as string);
  const validateAnswerSpecFn = ajv.getSchema(answerSpecSchema.$id as string);

  if (!validateQuestionFn || !validateAnswerSpecFn) {
    throw new Error("Failed to compile EdMar content schemas");
  }

  return { validateQuestionFn, validateAnswerSpecFn };
}

const { validateQuestionFn, validateAnswerSpecFn } = createValidators();

export function validateQuestion(data: unknown): ValidationOutcome {
  const valid = validateQuestionFn(data) as boolean;
  return {
    valid,
    errors: valid ? [] : formatErrors(validateQuestionFn.errors),
  };
}

export function validateAnswerSpec(data: unknown): ValidationOutcome {
  const valid = validateAnswerSpecFn(data) as boolean;
  return {
    valid,
    errors: valid ? [] : formatErrors(validateAnswerSpecFn.errors),
  };
}

export function roundTripCheck(spec: AnswerSpec): RoundTripResult {
  try {
    const result = validateAnswerCore(spec.displayValue, spec);
    if (result.isCorrect) {
      return { ok: true };
    }
    return { ok: false, reason: result.reason ?? "incorrect" };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}
