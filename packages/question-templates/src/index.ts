import type { AnswerSpec } from "@edmar/types";

export type TemplateGeneratorKey = "percent_discount" | "simple_interest" | "linear_solve";

export interface GeneratedTemplateQuestion {
  generatorKey: TemplateGeneratorKey;
  stem: string;
  answerSpec: AnswerSpec;
  solutionSteps: string[];
  finalAnswer: string;
  difficultyBand: 1 | 2 | 3 | 4 | 5;
  category: string;
  parameters: Record<string, number>;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pickInt(rng: () => number, min: number, max: number, step = 1): number {
  const steps = Math.floor((max - min) / step);
  return min + step * Math.floor(rng() * (steps + 1));
}

function numericExact(value: number, display?: string): AnswerSpec {
  const canonical = Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
  return {
    answerType: "numeric_exact",
    canonicalValue: canonical,
    displayValue: display ?? canonical,
    acceptedForms: [canonical],
    normalisation: "numeric_default",
  };
}

/** Jacket/cost discount → sale price. Deterministic; zero AI. */
export function generatePercentDiscount(seed: number): GeneratedTemplateQuestion {
  const rng = mulberry32(seed);
  const original = pickInt(rng, 1000, 20000, 50);
  const discountPct = pickInt(rng, 5, 40, 5);
  const discount = Math.round((original * discountPct) / 100);
  const sale = original - discount;

  return {
    generatorKey: "percent_discount",
    category: "consumer_arithmetic",
    difficultyBand: 2,
    parameters: { original, discountPct, discount, sale },
    stem: `A jacket costs $${original.toLocaleString("en-US")} and is discounted by ${discountPct}%. What is the sale price?`,
    answerSpec: numericExact(sale, `$${sale}`),
    finalAnswer: `$${sale}`,
    solutionSteps: [
      `Discount amount = ${discountPct}% of $${original} = $${discount}.`,
      `Sale price = $${original} − $${discount} = $${sale}.`,
    ],
  };
}

export function generateSimpleInterest(seed: number): GeneratedTemplateQuestion {
  const rng = mulberry32(seed);
  const principal = pickInt(rng, 500, 50000, 100);
  const rate = pickInt(rng, 2, 15, 1);
  const timeYears = pickInt(rng, 1, 5, 1);
  const interest = Math.round((principal * rate * timeYears) / 100);

  return {
    generatorKey: "simple_interest",
    category: "consumer_arithmetic",
    difficultyBand: 2,
    parameters: { principal, rate, timeYears, interest },
    stem: `Calculate the simple interest on $${principal.toLocaleString("en-US")} at ${rate}% per annum for ${timeYears} year(s).`,
    answerSpec: numericExact(interest, `$${interest}`),
    finalAnswer: `$${interest}`,
    solutionSteps: [
      `I = PRT / 100 = (${principal} × ${rate} × ${timeYears}) / 100.`,
      `I = $${interest}.`,
    ],
  };
}

export function generateLinearSolve(seed: number): GeneratedTemplateQuestion {
  const rng = mulberry32(seed);
  const a = pickInt(rng, 2, 12, 1);
  const x = pickInt(rng, -10, 15, 1);
  const b = pickInt(rng, -20, 20, 1);
  const c = a * x + b;

  return {
    generatorKey: "linear_solve",
    category: "algebra",
    difficultyBand: 2,
    parameters: { a, b, c, x },
    stem: `Solve for x: ${a}x ${b >= 0 ? `+ ${b}` : `− ${Math.abs(b)}`} = ${c}.`,
    answerSpec: numericExact(x),
    finalAnswer: String(x),
    solutionSteps: [
      b === 0
        ? `${a}x = ${c}.`
        : `${a}x = ${c} ${b >= 0 ? `− ${b}` : `+ ${Math.abs(b)}`} = ${c - b}.`,
      `x = ${x}.`,
    ],
  };
}

export function generateFromTemplate(
  key: TemplateGeneratorKey,
  seed: number,
): GeneratedTemplateQuestion {
  switch (key) {
    case "percent_discount":
      return generatePercentDiscount(seed);
    case "simple_interest":
      return generateSimpleInterest(seed);
    case "linear_solve":
      return generateLinearSolve(seed);
    default: {
      const _exhaustive: never = key;
      throw new Error(`Unknown template: ${_exhaustive}`);
    }
  }
}

/**
 * Offline replenishment plan — NEVER invokes an LLM and NEVER auto-publishes.
 * Student practice must continue on the existing approved bank.
 */
export function planReplenishment(args: {
  topicId: string;
  approvedCount: number;
  minApproved: number;
  templateKeys: TemplateGeneratorKey[];
}): {
  syncAiAllowed: false;
  autoPublishAllowed: false;
  action: "none" | "enqueue_template_job" | "enqueue_ai_draft_job";
  preferredGenerators: TemplateGeneratorKey[];
} {
  if (args.approvedCount >= args.minApproved) {
    return {
      syncAiAllowed: false,
      autoPublishAllowed: false,
      action: "none",
      preferredGenerators: [],
    };
  }

  if (args.templateKeys.length > 0) {
    return {
      syncAiAllowed: false,
      autoPublishAllowed: false,
      action: "enqueue_template_job",
      preferredGenerators: args.templateKeys,
    };
  }

  return {
    syncAiAllowed: false,
    autoPublishAllowed: false,
    action: "enqueue_ai_draft_job",
    preferredGenerators: [],
  };
}
