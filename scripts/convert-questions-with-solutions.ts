/**
 * Convert questions_with_solutions.json → content/staging/from-workbook/*.json
 *
 * Mapping (post-attempt student surface = app_sections):
 *   guided_solution → solutionSteps
 *   strategy         → strategyBlocks
 *   final_answer     → finalAnswerBlocks (+ answerSpec)
 *   why_it_works     → whyThisWorks
 *   common_mistakes  → commonErrors
 *   exam_tip         → examTip
 *   quick_check      → quickCheck
 *   think_first      → strategyBlocks (prefixed) / stem context
 *
 * Usage:
 *   pnpm tsx scripts/convert-questions-with-solutions.ts
 *   pnpm validate:staging
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { inferAnswerSpec } from "./infer-answer-spec.js";
import type { AnswerSpec, Block } from "@edmar/types";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(root, "questions_with_solutions.json");
const OUT_DIR = join(root, "content", "staging", "from-workbook");

type GuidedStep = {
  step: number;
  instruction: string;
  note?: string | null;
  result?: string | null;
};

type SourceQ = {
  id: string;
  course?: string;
  section?: string;
  source?: {
    document?: string;
    pdf_page?: number;
    question_number?: string;
    question_visual_asset?: string;
  };
  question?: {
    question_restated?: string | null;
    subpart_labels_detected?: string[];
    visual_types?: string[];
  };
  app_sections?: {
    think_first?: string | null;
    concepts_required?: string[];
    strategy?: string | null;
    guided_solution?: GuidedStep[];
    final_answer?: string | null;
    why_it_works?: string | null;
    common_mistakes?: string[];
    exam_tip?: string | null;
    quick_check?: { prompt?: string; answer?: string } | null;
    answer_validation?: {
      cognitive_level?: string | null;
      difficulty?: string | null;
      marks?: number | null;
      syllabus_code?: string | null;
    };
  };
  readiness?: { status?: string };
};

function text(value: string): Block {
  return { type: "text", value };
}

function slugKey(s: string, i: number): string {
  const base = s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);
  return (base.length >= 3 ? base : `mistake_${i + 1}`).slice(0, 60);
}

function mapCognitive(level: string | null | undefined): "CK" | "AK" | "R" {
  switch ((level ?? "").toLowerCase()) {
    case "knowledge":
    case "comprehension":
      return "CK";
    case "reasoning":
      return "R";
    default:
      return "AK";
  }
}

function mapDifficulty(d: string | null | undefined): number {
  switch ((d ?? "").toLowerCase()) {
    case "easy":
      return 2;
    case "hard":
      return 5;
    default:
      return 3;
  }
}

/** Stable fake UUID from id string (schema requires uuid format). */
function uuidFromId(id: string): string {
  const h = createHash("sha256").update(id).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

const SECTION_OBJECTIVE: Record<string, { code: string; label: string }> = {
  "NUMBER THEORY AND COMPUTATION": { code: "M1-1.1", label: "Number theory and computation" },
  Algebra: { code: "M1-4.1", label: "Algebra" },
  "Algebra 1": { code: "M1-4.1", label: "Algebra" },
  "Simultaneous Linear Equations": { code: "M1-5.1", label: "Simultaneous linear equations" },
  "Quadratic Equations": { code: "M1-6.1", label: "Quadratic equations" },
  Probability: { code: "M3-2.1", label: "Probability" },
  Statistics: { code: "M3-1.1", label: "Statistics" },
  Vectors: { code: "M2-5.1", label: "Vectors" },
  Matrices: { code: "M2-4.1", label: "Matrices" },
  "Compound Interest": { code: "M1-3.1", label: "Consumer arithmetic" },
  "Decimal Approximation": { code: "M1-1.2", label: "Approximation" },
  Indirect: { code: "M1-3.2", label: "Indirect measurement / ratios" },
};

function objectiveFor(section?: string): { code: string; label: string } {
  if (section && SECTION_OBJECTIVE[section]) return SECTION_OBJECTIVE[section]!;
  if (section) {
    for (const [k, v] of Object.entries(SECTION_OBJECTIVE)) {
      if (section.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(section.toLowerCase())) {
        return v;
      }
    }
  }
  return { code: "M1-1.1", label: section ?? "CSEC Mathematics" };
}

/** Pull primary machine-checkable token from a free-text final answer. */
function extractPrimaryAnswer(finalAnswer: string): string {
  let s = finalAnswer.trim();
  // Prefer first alternative before "or" / "which is"
  const orSplit = s.split(/\s+or\s+/i)[0] ?? s;
  s = orSplit.split(/,\s*which is/i)[0]?.trim() ?? orSplit.trim();

  // Multipart: take first segment value after (i)/(a)
  const partMatch = s.match(/^\(?[ivxabcd]+\)?[.\s]+(.+?)(?:\s{2,}|\s+\(?[ivxabcd]+\)|$)/i);
  if (partMatch?.[1]) {
    s = partMatch[1].trim();
  }

  // Scientific notation like 4 × 10⁴ or 3 x 10^-4
  const sci = s.match(/^(-?\d+(?:\.\d+)?)\s*[×xX]\s*10\s*([¹²³⁴⁵⁶⁷⁸⁹⁰\-−]?\d+|[\^]?[+\-]?\d+)/);
  if (sci) {
    return `${sci[1]}e${sci[2]!.replace(/[¹²³⁴⁵⁶⁷⁸⁹⁰]/g, (c) => "⁰¹²³⁴⁵⁶⁷⁸⁹".indexOf(c).toString()).replace(/[−–—]/g, "-").replace(/^\^/, "")}`;
  }

  // Fraction or mixed
  const frac = s.match(/^(-?\d+\s+\d+\/\d+|-?\d+\/\d+)/);
  if (frac) return frac[1]!;

  // Currency
  const cur = s.match(/^(\$?[\d,]+(?:\.\d{2})?)/);
  if (cur && s.includes("$")) return cur[1]!.startsWith("$") ? cur[1]! : `$${cur[1]}`;

  // Plain number / percent
  const num = s.match(/^(-?\d+(?:\.\d+)?%?)/);
  if (num) return num[1]!;

  // Ratio
  const ratio = s.match(/^(\d+\s*:\s*\d+(?:\s*:\s*\d+)?)/);
  if (ratio) return ratio[1]!.replace(/\s+/g, "");

  return s.slice(0, 120);
}

function buildAnswerSpec(raw: string): AnswerSpec {
  const primary = extractPrimaryAnswer(raw);
  const inferred = inferAnswerSpec(primary);
  if (inferred.ok) {
    return inferred.spec;
  }
  const display = primary || raw.trim().slice(0, 80);
  return {
    answerType: "expression",
    canonicalValue: display.replace(/\s+/g, ""),
    displayValue: display,
    acceptedForms: [display, display.replace(/\s+/g, "")],
    normalisation: "expression_default",
  };
}

function parseMultipartAnswers(
  finalAnswer: string,
  labels: string[],
): Array<{ partKey: string; answer: string }> | null {
  if (!labels.length) return null;
  const parts: Array<{ partKey: string; answer: string }> = [];
  // Normalise labels like (i), (ii), a., (a)
  const keys = labels.map((l) =>
    l
      .replace(/[().]/g, "")
      .trim()
      .toLowerCase(),
  );

  // Pattern: (i) ans  (ii) ans   or i. ans ii. ans
  const re = /\(?([ivx]+|[a-d])\)?[.\s]+([^]*?)(?=\s*\(?([ivx]+|[a-d])\)?[.\s]|$)/gi;
  const found: Array<{ key: string; answer: string }> = [];
  let m: RegExpExecArray | null;
  const text = finalAnswer.replace(/\s+/g, " ").trim();
  while ((m = re.exec(text)) !== null) {
    found.push({ key: m[1]!.toLowerCase(), answer: m[2]!.trim() });
  }

  if (found.length < 2) return null;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]!;
    const hit = found.find((f) => f.key === key) ?? found[i];
    if (!hit?.answer) return null;
    // partKey pattern: ^[a-z](\.(i|ii|iii|iv|v))?$
    let partKey: string;
    if (/^[ivx]+$/.test(key)) {
      partKey = `a.${key}` as string;
      if (!/^(i|ii|iii|iv|v)$/.test(key)) {
        // map beyond v → sequential letters
        partKey = String.fromCharCode(97 + i);
      }
    } else {
      partKey = key.slice(0, 1);
    }
    parts.push({ partKey, answer: hit.answer });
  }

  // Validate partKey pattern
  for (const p of parts) {
    if (!/^[a-z](\.(i|ii|iii|iv|v))?$/.test(p.partKey)) {
      p.partKey = String.fromCharCode(97 + parts.indexOf(p));
    }
  }

  return parts.length >= 2 ? parts : null;
}

function convertOne(q: SourceQ): Record<string, unknown> | null {
  const app = q.app_sections;
  const stemText = q.question?.question_restated?.trim();
  const finalAnswer = app?.final_answer?.trim();
  const guided = app?.guided_solution ?? [];
  if (!stemText || !finalAnswer || guided.length === 0) return null;

  const labels = q.question?.subpart_labels_detected ?? [];
  const multipart = parseMultipartAnswers(finalAnswer, labels);
  const visual = q.source?.question_visual_asset;
  const obj = objectiveFor(q.section);
  const cognitive = mapCognitive(app?.answer_validation?.cognitive_level);
  const difficulty = mapDifficulty(app?.answer_validation?.difficulty);
  const marks = app?.answer_validation?.marks ?? (multipart ? multipart.length * 2 : 1);

  const stemBlocks: Block[] = [text(stemText)];
  if (app?.think_first?.trim()) {
    stemBlocks.push(text(`Think first: ${app.think_first.trim()}`));
  }

  const assets: unknown[] = [];
  if (visual) {
    const alt = `Source visual for ${q.id} from workbook page ${q.source?.pdf_page ?? "?"}.`;
    stemBlocks.push({
      type: "asset",
      storagePath: visual,
      altText: alt,
    });
    // Schema allowlist: svg / png / webp only (no jpeg). Keep stem asset; register metadata when mime is allowed.
    const mime = visual.endsWith(".png")
      ? "image/png"
      : visual.endsWith(".webp")
        ? "image/webp"
        : visual.endsWith(".svg")
          ? "image/svg+xml"
          : null;
    if (mime) {
      assets.push({
        role: "question_figure",
        storagePath: visual,
        mimeType: mime,
        altText: alt,
        requiresColour: false,
      });
    }
  }

  const solutionSteps = guided.map((s) => {
    const blocks: Block[] = [];
    if (s.note) blocks.push(text(s.note));
    if (s.result) blocks.push(text(`Result: ${s.result}`));
    if (blocks.length === 0) blocks.push(text(s.instruction));
    return {
      stepNo: s.step,
      instruction: s.instruction.slice(0, 300),
      contentBlocks: blocks,
    };
  });

  const mistakes = (app?.common_mistakes ?? []).filter(Boolean);
  const commonErrors =
    mistakes.length > 0
      ? mistakes.slice(0, 6).map((m, i) => ({
          key: slugKey(m, i),
          wrongValue: `incorrect_${i + 1}`,
          misconception: m.slice(0, 500),
          correctiveNote: `Avoid this: ${m.slice(0, 200)}`,
        }))
      : [
          {
            key: "method_error",
            wrongValue: "incorrect",
            misconception: "Student used an incorrect method for this item.",
            correctiveNote: "Re-check the order of operations and the required form of the answer.",
          },
        ];

  const concepts = (app?.concepts_required ?? []).slice(0, 4);
  const conceptsRequired =
    concepts.length > 0
      ? concepts.map((c, i) => ({
          objectiveId: uuidFromId(`${q.id}-concept-${i}`),
          code: obj.code,
          label: c.slice(0, 120),
        }))
      : [
          {
            objectiveId: uuidFromId(`${q.id}-concept-0`),
            code: obj.code,
            label: obj.label.slice(0, 120),
          },
        ];

  const strategyText = app?.strategy?.trim() || "Work carefully and show each step clearly.";
  const whyText =
    app?.why_it_works?.trim() ||
    "The method follows the syllabus approach for this objective.";
  const tipText = app?.exam_tip?.trim() || "Show working clearly and check the form of your final answer.";

  const qc = app?.quick_check;
  const topSpec = buildAnswerSpec(finalAnswer);
  const quickSpec = qc?.answer ? buildAnswerSpec(qc.answer) : topSpec;

  const base: Record<string, unknown> = {
    schemaVersion: "2.0.0",
    legacyId: q.id,
    provenance: "original_authored",
    rightsStatus: "edmar_owned",
    difficultyBand: difficulty,
    status: "draft",
    marks: Math.min(20, Math.max(1, Number(marks) || 1)),
    calculatorAllowed: true,
    stemBlocks,
    solutionSteps,
    strategyBlocks: [text(strategyText)],
    finalAnswerBlocks: [text(finalAnswer)],
    whyThisWorks: [text(whyText)],
    commonErrors,
    examTip: [text(tipText)],
    answerValidation: {
      cognitiveLevel: cognitive,
      accuracyRule:
        topSpec.answerType === "numeric_tolerance" || topSpec.answerType === "currency"
          ? "tolerance"
          : "exact",
      verification: "unverified",
      ambiguityNote: "Machine-authored solution pending human verification before student release.",
    },
    answerSpec: topSpec,
    quickCheck: {
      promptBlocks: [text(qc?.prompt?.trim() || `Quick check related to: ${stemText.slice(0, 80)}`)],
      answerSpec: quickSpec,
    },
    curriculum: {
      syllabusCode: "V2027",
      objectiveCodes: [obj.code],
    },
    conceptsRequired,
    source: {
      sourceKind: "workbook",
      sourceTitle: q.source?.document ?? "CSEC Modular Workbook",
      questionNo: Number.parseInt(String(q.source?.question_number ?? "1"), 10) || 1,
      pageRef: q.source?.pdf_page != null ? `p${q.source.pdf_page}` : undefined,
      syllabusInForce: "V2027",
    },
  };

  if (assets.length) base.assets = assets;

  if (multipart) {
    base.questionType = "structured";
    base.parts = multipart.map((p, i) => ({
      partKey: p.partKey,
      sequence: i + 1,
      marks: Math.max(1, Math.floor((Number(marks) || multipart.length) / multipart.length)),
      stemBlocks: [text(`Part (${p.partKey}): see stem.`)],
      answerSpec: buildAnswerSpec(p.answer),
    }));
    // Top-level answerSpec must round-trip — use part a
    base.answerSpec = (base.parts as Array<{ answerSpec: AnswerSpec }>)[0]!.answerSpec;
  } else if (topSpec.answerType === "expression") {
    base.questionType = "expression";
  } else {
    base.questionType = "numeric";
  }

  return base;
}

function main(): void {
  if (!existsSync(SOURCE)) {
    console.error(`Missing ${SOURCE}`);
    process.exit(1);
  }

  const raw = JSON.parse(readFileSync(SOURCE, "utf8")) as {
    questions: SourceQ[];
    solution_authoring?: unknown;
  };

  mkdirSync(OUT_DIR, { recursive: true });

  let converted = 0;
  let skipped = 0;
  const failures: string[] = [];

  for (const q of raw.questions) {
    try {
      const out = convertOne(q);
      if (!out) {
        skipped++;
        continue;
      }
      const file = join(OUT_DIR, `${q.id}.json`);
      writeFileSync(file, `${JSON.stringify(out, null, 2)}\n`, "utf8");
      converted++;
    } catch (err) {
      failures.push(`${q.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const report = {
    converted,
    skipped,
    failures: failures.length,
    failureSamples: failures.slice(0, 20),
    outDir: "content/staging/from-workbook",
    note: "status=draft; verification=unverified — human review required before student release of solutions.",
  };
  writeFileSync(join(OUT_DIR, "_conversion-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
}

main();
