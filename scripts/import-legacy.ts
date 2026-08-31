#!/usr/bin/env tsx
/**
 * §12 Legacy JSON importer — staging-first, idempotent, one transaction per record.
 *
 * Usage:
 *   pnpm tsx scripts/import-legacy.ts --source content/legacy/ --env staging --dry-run
 *   pnpm tsx scripts/import-legacy.ts --source content/legacy/ --env staging --commit
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool, type PoolClient } from "pg";
import { roundTripCheck, validateAnswerSpec } from "@edmar/content-schema";
import type { AnswerSpec, Block } from "@edmar/types";
import { inferAnswerSpec, normaliseLegacyAnswer, resolveOptionKey } from "./infer-answer-spec.js";
import { isL2Duplicate } from "./lib/text-similarity.js";
import {
  computeRenderHash,
  renderLatexToSvg,
  upsertMathRender,
  validateLatex,
} from "./lib/render-math-core.js";
import { textToStemBlocks } from "./unicode-math-to-latex.js";

const DEFAULT_DB_URL = "postgresql://postgres:postgres@127.0.0.1:54522/postgres";
const AUTO_DERIVED_NOTE = "AUTO-DERIVED FROM EXPLANATION — REVIEWER MUST EXPAND";
const OPTION_KEYS = ["A", "B", "C", "D", "E"] as const;

type SkillRow = {
  id: string;
  module: number;
  topic: string;
  skill: string;
  prerequisites: string[];
  lesson: string;
  month?: string;
};

type DiagnosticRow = {
  id: string;
  skillId: string;
  difficulty: number;
  type: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  mistakeTags?: Record<string, string>;
};

type LessonQuiz = {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

type LessonPractice = {
  prompt: string;
  answer: string;
  hint?: string;
};

type WorkedExample = {
  question: string;
  solution: string[];
  answer: string;
};

type LessonRow = {
  id: string;
  module: number;
  topic: string;
  skill: string;
  title: string;
  workedExample?: WorkedExample;
  guidedPractice?: LessonPractice[];
  independentPractice?: LessonPractice[];
  quiz?: LessonQuiz[];
};

type RecordReport = {
  legacyId: string;
  questionId?: string;
  status:
    | "inserted"
    | "skipped_existing"
    | "rejected_duplicate"
    | "held"
    | "failed";
  duplicateOf?: string;
  layer?: "L1" | "L2";
  flags?: string[];
  latexConversions?: number;
  mathRenders?: number;
  holdReason?: string;
  error?: string;
};

type ImportReport = {
  jobId?: string;
  env: string;
  dryRun: boolean;
  startedAt: string;
  finishedAt?: string;
  totals: {
    skillsInserted: number;
    prerequisiteEdges: number;
    skillObjectivesProvisional: number;
    questionsRead: number;
    questionsInserted: number;
    questionsSkipped: number;
    questionsRejectedDuplicate: number;
    questionsHeld: number;
    questionsFailed: number;
  };
  skillObjectivesProvisionalNote: string;
  heldSources: string[];
  files: Record<string, { read: number; inserted: number; rejected_duplicate: number; held: number; failed: number }>;
  records: RecordReport[];
};

type PendingQuestion = {
  legacyId: string;
  sourceFile: string;
  skillCode: string;
  topic: string;
  questionType: "multiple_choice" | "numeric";
  difficultyBand: number;
  stemPlain: string;
  stemBlocks: Block[];
  answerSpec: AnswerSpec;
  explanation?: string;
  hint?: string;
  options?: string[];
  mistakeTags?: Record<string, string>;
  solutionSteps: Array<{ stepNo: number; instruction: string; note?: string }>;
  flags: string[];
  latexConversions: number;
  marks?: number;
};

type HashEntry = {
  legacyId: string;
  stemPlain: string;
  canonicalValue: string;
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");

function parseArgs(argv: string[]): {
  sourceDir: string;
  env: string;
  dryRun: boolean;
  commit: boolean;
  dbUrl: string;
} {
  let sourceDir = join(repoRoot, "content", "legacy");
  let env = "staging";
  let dryRun = false;
  let commit = false;
  let dbUrl = process.env.IMPORT_DB_URL ?? DEFAULT_DB_URL;

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "--source" && argv[i + 1]) {
      sourceDir = join(repoRoot, argv[++i]!);
    } else if (arg === "--env" && argv[i + 1]) {
      env = argv[++i]!;
    } else if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--commit") {
      commit = true;
    } else if (arg === "--db-url" && argv[i + 1]) {
      dbUrl = argv[++i]!;
    }
  }

  if (dryRun === commit) {
    throw new Error("Specify exactly one of --dry-run or --commit");
  }

  return { sourceDir, env, dryRun, commit, dbUrl };
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function canonicalStem(stemPlain: string): string {
  return stemPlain
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\d+/g, "#");
}

function computeNormalisedHash(stemPlain: string): string {
  return createHash("sha256").update(canonicalStem(stemPlain)).digest("hex");
}

function canonicalValueOf(spec: AnswerSpec): string {
  return Array.isArray(spec.canonicalValue)
    ? spec.canonicalValue.join("|")
    : String(spec.canonicalValue);
}

async function ensureMathRender(
  pool: Pool | null,
  latex: string,
  style: "inline" | "display",
  dryRun: boolean,
): Promise<string> {
  const validation = validateLatex(latex);
  if (!validation.ok) {
    throw new Error(`LaTeX validation failed: ${validation.reason}`);
  }
  renderLatexToSvg(latex, style);
  if (dryRun || !pool) {
    return computeRenderHash(latex, style);
  }
  const result = await upsertMathRender(pool, latex, style);
  return result.hash;
}

async function renderBlocks(
  pool: Pool | null,
  blocks: Block[],
  dryRun: boolean,
): Promise<{ blocks: Block[]; renderCount: number }> {
  let renderCount = 0;
  const rendered: Block[] = [];

  for (const block of blocks) {
    if (block.type === "math") {
      const hash = await ensureMathRender(pool, block.latex, block.style, dryRun);
      rendered.push({ ...block, renderHash: hash });
      renderCount += 1;
    } else {
      rendered.push(block);
    }
  }

  return { blocks: rendered, renderCount };
}

function transformDiagnostic(row: DiagnosticRow): PendingQuestion {
  const legacyId = `diag:${row.id}`;
  if (row.type !== "mcq") {
    throw new Error(`Unsupported diagnostic type: ${row.type}`);
  }

  const { stemPlain, stemBlocks, conversionCount, flags: latexFlags } = textToStemBlocks(row.question);
  const inferred = inferAnswerSpec(row.answer, row.options);
  if (!inferred.ok) {
    throw new Error(inferred.reason);
  }

  const flags = [
    ...latexFlags,
    ...inferred.flags,
    "solution_placeholder",
    "objective_unmapped",
  ];
  if (row.explanation.length < 40) {
    flags.push("explanation_too_short");
  }

  return {
    legacyId,
    sourceFile: "diagnostic_bank_phase3.json",
    skillCode: row.skillId,
    topic: "",
    questionType: "multiple_choice",
    difficultyBand: row.difficulty,
    stemPlain,
    stemBlocks,
    answerSpec: inferred.spec,
    explanation: row.explanation,
    options: row.options,
    mistakeTags: row.mistakeTags,
    solutionSteps: [
      {
        stepNo: 1,
        instruction: row.explanation,
        note: AUTO_DERIVED_NOTE,
      },
    ],
    flags,
    latexConversions: conversionCount,
    marks: 1,
  };
}

function transformLessonMcq(
  lesson: LessonRow,
  quiz: LessonQuiz,
  index: number,
  skillCode: string,
): PendingQuestion {
  const legacyId = `lesson:${lesson.id}:quiz:${index}`;
  const { stemPlain, stemBlocks, conversionCount, flags: latexFlags } = textToStemBlocks(quiz.question);
  const inferred = inferAnswerSpec(quiz.answer, quiz.options);
  if (!inferred.ok) {
    throw new Error(inferred.reason);
  }

  const flags = [...latexFlags, ...inferred.flags, "solution_placeholder", "objective_unmapped"];
  if (quiz.explanation.length < 40) {
    flags.push("explanation_too_short");
  }

  return {
    legacyId,
    sourceFile: "lesson_bank_phase4.json",
    skillCode,
    topic: lesson.topic,
    questionType: "multiple_choice",
    difficultyBand: 2,
    stemPlain,
    stemBlocks,
    answerSpec: inferred.spec,
    explanation: quiz.explanation,
    options: quiz.options,
    solutionSteps: [
      {
        stepNo: 1,
        instruction: quiz.explanation,
        note: AUTO_DERIVED_NOTE,
      },
    ],
    flags,
    latexConversions: conversionCount,
    marks: 1,
  };
}

function transformLessonPractice(
  lesson: LessonRow,
  practice: LessonPractice,
  index: number,
  skillCode: string,
  kind: "independent" | "workedExample",
): PendingQuestion | { held: true; legacyId: string; reason: string } {
  const legacyId =
    kind === "workedExample"
      ? `lesson:${lesson.id}:workedExample`
      : `lesson:${lesson.id}:independent:${index}`;

  const { stemPlain, stemBlocks, conversionCount, flags: latexFlags } = textToStemBlocks(practice.prompt);
  const inferred = inferAnswerSpec(practice.answer);
  if (!inferred.ok) {
    return { held: true, legacyId, reason: inferred.reason };
  }

  const flags = [...latexFlags, ...inferred.flags, "objective_unmapped"];
  const solutionSteps =
    kind === "workedExample" && lesson.workedExample?.solution
      ? lesson.workedExample.solution.map((instruction, i) => ({
          stepNo: i + 1,
          instruction,
        }))
      : [
          {
            stepNo: 1,
            instruction: practice.hint ?? "Apply the method from the lesson.",
            note: AUTO_DERIVED_NOTE,
          },
        ];

  if (!lesson.workedExample?.solution && kind !== "workedExample") {
    flags.push("solution_placeholder");
  }

  return {
    legacyId,
    sourceFile: "lesson_bank_phase4.json",
    skillCode,
    topic: lesson.topic,
    questionType: "numeric",
    difficultyBand: 2,
    stemPlain,
    stemBlocks,
    answerSpec: inferred.spec,
    hint: practice.hint,
    solutionSteps,
    flags,
    latexConversions: conversionCount,
  };
}

function transformWorkedExampleQuestion(
  lesson: LessonRow,
  skillCode: string,
): PendingQuestion | { held: true; legacyId: string; reason: string } {
  const worked = lesson.workedExample;
  if (!worked) {
    throw new Error("Missing workedExample");
  }
  return transformLessonPractice(
    lesson,
    { prompt: worked.question, answer: worked.answer },
    0,
    skillCode,
    "workedExample",
  );
}

function findDuplicate(
  candidate: PendingQuestion,
  hashIndex: Map<string, HashEntry>,
  stemIndex: HashEntry[],
): { duplicateOf: string; layer: "L1" | "L2" } | null {
  const hash = computeNormalisedHash(candidate.stemPlain);
  const l1 = hashIndex.get(hash);
  if (l1) {
    return { duplicateOf: l1.legacyId, layer: "L1" };
  }

  const canonical = canonicalValueOf(candidate.answerSpec);
  for (const existing of stemIndex) {
    if (
      isL2Duplicate(candidate.stemPlain, existing.stemPlain, canonical, existing.canonicalValue)
    ) {
      return { duplicateOf: existing.legacyId, layer: "L2" };
    }
  }

  return null;
}

async function loadExistingHashes(client: PoolClient): Promise<Map<string, HashEntry>> {
  const result = await client.query<{ legacy_id: string; stem_plain: string; answer_spec: AnswerSpec }>(
    `
      select q.legacy_id, qv.stem_plain, qv.answer_spec
      from public.questions q
      join public.question_versions qv on qv.question_id = q.id and qv.version_no = 1
      where q.legacy_id is not null
    `,
  );
  const map = new Map<string, HashEntry>();
  for (const row of result.rows) {
    map.set(computeNormalisedHash(row.stem_plain), {
      legacyId: row.legacy_id!,
      stemPlain: row.stem_plain,
      canonicalValue: canonicalValueOf(row.answer_spec as AnswerSpec),
    });
  }
  return map;
}

async function importSkills(
  client: PoolClient,
  skills: SkillRow[],
  dryRun: boolean,
): Promise<{ inserted: number; skillIdByCode: Map<string, string> }> {
  const skillIdByCode = new Map<string, string>();
  let inserted = 0;

  for (const skill of skills) {
    const existing = await client.query<{ id: string }>(
      `select id from public.skills where code = $1`,
      [skill.id],
    );
    if (existing.rows[0]) {
      skillIdByCode.set(skill.id, existing.rows[0].id);
      continue;
    }
    if (dryRun) {
      skillIdByCode.set(skill.id, `dry-run-${skill.id}`);
      inserted += 1;
      continue;
    }
    const result = await client.query<{ id: string }>(
      `
        insert into public.skills (code, name, description)
        values ($1, $2, $3)
        on conflict (code) do update set name = excluded.name
        returning id
      `,
      [skill.id, skill.skill, `Lesson: ${skill.lesson}`],
    );
    skillIdByCode.set(skill.id, result.rows[0]!.id);
    inserted += 1;
  }

  return { inserted, skillIdByCode };
}

async function importPrerequisites(
  client: PoolClient,
  skills: SkillRow[],
  skillIdByCode: Map<string, string>,
  dryRun: boolean,
): Promise<number> {
  let inserted = 0;
  for (const skill of skills) {
    for (const prereq of skill.prerequisites) {
      const skillId = skillIdByCode.get(skill.id);
      const prereqId = skillIdByCode.get(prereq);
      if (!skillId || !prereqId) {
        throw new Error(`Unresolved prerequisite ${prereq} for ${skill.id}`);
      }
      if (dryRun) {
        inserted += 1;
        continue;
      }
      const result = await client.query(
        `
          insert into public.skill_prerequisites (skill_id, prerequisite_skill_id)
          values ($1, $2)
          on conflict do nothing
        `,
        [skillId, prereqId],
      );
      if (result.rowCount === 1) {
        inserted += 1;
      }
    }
  }
  return inserted;
}

async function resolveSkillCodeByName(
  client: PoolClient,
  name: string,
  skillIdByCode: Map<string, string>,
  skills: SkillRow[],
  lesson?: Pick<LessonRow, "module" | "topic">,
): Promise<string> {
  const normalised = name.trim().toLowerCase();
  for (const skill of skills) {
    if (skill.skill.toLowerCase() === normalised) {
      return skill.id;
    }
  }
  if (lesson) {
    const topicMatches = skills.filter(
      (s) => s.module === lesson.module && s.topic.toLowerCase() === lesson.topic.toLowerCase(),
    );
    if (topicMatches.length === 1) {
      return topicMatches[0]!.id;
    }
    const partial = topicMatches.find((s) => {
      const skillLower = s.skill.toLowerCase();
      const words = normalised.split(/\s+/).filter(Boolean);
      return words.length > 0 && words.every((word) => skillLower.includes(word));
    });
    if (partial) {
      return partial.id;
    }
  }
  const result = await client.query<{ code: string }>(
    `select code from public.skills where lower(name) = $1 limit 1`,
    [normalised],
  );
  if (result.rows[0]) {
    return result.rows[0].code;
  }
  throw new Error(`Skill not found for name: ${name}`);
}

async function linkSkillObjectivesProvisional(
  client: PoolClient,
  skills: SkillRow[],
  skillIdByCode: Map<string, string>,
  dryRun: boolean,
): Promise<number> {
  let linked = 0;
  for (const skill of skills) {
    const skillId = skillIdByCode.get(skill.id);
    if (!skillId || skillId.startsWith("dry-run-")) {
      continue;
    }
    const topics = await client.query<{ id: string }>(
      `
        select t.id
        from public.topics t
        join public.modules m on m.id = t.module_id
        where m.module_no = $1 and lower(t.name) = lower($2)
        limit 1
      `,
      [skill.module, skill.topic],
    );
    const topicId = topics.rows[0]?.id;
    if (!topicId) {
      continue;
    }
    const objectives = await client.query<{ id: string }>(
      `select id from public.specific_objectives where topic_id = $1`,
      [topicId],
    );
    for (const objective of objectives.rows) {
      if (dryRun) {
        linked += 1;
        continue;
      }
      const result = await client.query(
        `
          insert into public.skill_objectives (skill_id, specific_objective_id)
          values ($1, $2)
          on conflict do nothing
        `,
        [skillId, objective.id],
      );
      if (result.rowCount === 1) {
        linked += 1;
      }
    }
  }
  return linked;
}

async function insertQuestionRecord(
  client: PoolClient,
  pool: Pool,
  question: PendingQuestion,
  skillIdByCode: Map<string, string>,
  dryRun: boolean,
  freeCountByTopic: Map<string, number>,
): Promise<{ questionId?: string; mathRenders: number; skipped?: boolean }> {
  const existing = await client.query<{ id: string }>(
    `select id from public.questions where legacy_id = $1`,
    [question.legacyId],
  );
  if (existing.rows[0]) {
    return { questionId: existing.rows[0].id, mathRenders: 0, skipped: true };
  }

  const skillId = skillIdByCode.get(question.skillCode);
  if (!skillId) {
    throw new Error(`Skill ${question.skillCode} not found for ${question.legacyId}`);
  }

  const schemaCheck = validateAnswerSpec(question.answerSpec);
  if (!schemaCheck.valid) {
    throw new Error(`Answer spec schema invalid: ${schemaCheck.errors.join("; ")}`);
  }
  const roundTripSpec = { ...question.answerSpec };
  delete roundTripSpec.parts;
  const roundTrip = roundTripCheck(roundTripSpec);
  if (!roundTrip.ok) {
    throw new Error(`Round-trip check failed: ${roundTrip.reason ?? "unknown"}`);
  }

  const { blocks: stemBlocks, renderCount: stemRenders } = await renderBlocks(
    dryRun ? null : pool,
    question.stemBlocks,
    dryRun,
  );

  let optionRenderCount = 0;
  const optionBlocks: Block[][] = [];
  if (question.options) {
    for (const option of question.options) {
      const converted = textToStemBlocks(option);
      const rendered = await renderBlocks(dryRun ? null : pool, converted.stemBlocks, dryRun);
      optionBlocks.push(rendered.blocks);
      optionRenderCount += rendered.renderCount;
    }
  }

  const topicKey = question.topic || question.skillCode;
  const freeUsed = freeCountByTopic.get(topicKey) ?? 0;
  const isFree = freeUsed < 3;
  freeCountByTopic.set(topicKey, freeUsed + 1);

  if (dryRun) {
    return { mathRenders: stemRenders + optionRenderCount };
  }

  await client.query("BEGIN");

  try {
    const questionResult = await client.query<{ id: string }>(
      `
        insert into public.questions (
          subject_code, question_type, provenance, rights_status, status,
          difficulty_band, calculator_allowed, is_free, legacy_id
        )
        values ('CSEC_MATH', $1, 'legacy_import', 'edmar_owned', 'pending_review', $2, true, $3, $4)
        on conflict (legacy_id) where legacy_id is not null do nothing
        returning id
      `,
      [question.questionType, question.difficultyBand, isFree, question.legacyId],
    );

    if (questionResult.rowCount === 0) {
      await client.query("ROLLBACK");
      const skipped = await client.query<{ id: string }>(
        `select id from public.questions where legacy_id = $1`,
        [question.legacyId],
      );
      return { questionId: skipped.rows[0]?.id, mathRenders: 0, skipped: true };
    }

    const questionId = questionResult.rows[0]!.id;
    const normalisedHash = computeNormalisedHash(question.stemPlain);

    const versionResult = await client.query<{ id: string }>(
      `
        insert into public.question_versions (
          question_id, version_no, stem_blocks, stem_plain, answer_spec,
          explanation, cognitive_level, marks, hint, normalised_hash,
          validation_report
        )
        values ($1, 1, $2, $3, $4, $5, 'CK', $6, $7, $8, $9)
        returning id
      `,
      [
        questionId,
        JSON.stringify(stemBlocks),
        question.stemPlain,
        JSON.stringify(question.answerSpec),
        question.explanation ?? null,
        question.marks ?? null,
        question.hint ?? null,
        normalisedHash,
        JSON.stringify({ flags: question.flags, import: "legacy" }),
      ],
    );
    const versionId = versionResult.rows[0]!.id;

    const commonErrorIds = new Map<string, string>();
    if (question.mistakeTags && question.options) {
      for (const [wrongValue, misconception] of Object.entries(question.mistakeTags)) {
        let wrongOptionKey: string | null = null;
        try {
          wrongOptionKey = resolveOptionKey(wrongValue, question.options);
        } catch {
          wrongOptionKey = null;
        }
        const ce = await client.query<{ id: string }>(
          `
            insert into public.common_errors (
              question_version_id, wrong_value, wrong_option_key,
              misconception, corrective_note, skill_id
            )
            values ($1, $2, $3, $4, $4, $5)
            returning id
          `,
          [
            versionId,
            normaliseLegacyAnswer(wrongValue),
            wrongOptionKey,
            misconception,
            skillId,
          ],
        );
        commonErrorIds.set(wrongValue, ce.rows[0]!.id);
      }
    }

    if (question.options) {
      const correctKey = question.answerSpec.canonicalValue as string;
      for (let i = 0; i < question.options.length; i++) {
        const key = OPTION_KEYS[i]!;
        const plain = question.options[i]!;
        let commonErrorId: string | null = null;
        for (const [wrongValue, id] of commonErrorIds) {
          try {
            if (resolveOptionKey(wrongValue, question.options) === key) {
              commonErrorId = id;
              break;
            }
          } catch {
            // no match
          }
        }
        await client.query(
          `
            insert into public.question_options (
              question_version_id, option_key, content_blocks, content_plain,
              is_correct, common_error_id, sequence
            )
            values ($1, $2, $3, $4, $5, $6, $7)
          `,
          [
            versionId,
            key,
            JSON.stringify(optionBlocks[i] ?? [{ type: "text", value: plain }]),
            plain,
            key === correctKey,
            commonErrorId,
            i,
          ],
        );
      }
    }

    for (const step of question.solutionSteps) {
      await client.query(
        `
          insert into public.solution_steps (
            question_version_id, step_no, instruction, sub_note, working_blocks, result_blocks
          )
          values ($1, $2, $3, $4, '[]', '[]')
        `,
        [versionId, step.stepNo, step.instruction, step.note ?? null],
      );
    }

    await client.query(
      `insert into public.question_skills (question_id, skill_id) values ($1, $2) on conflict do nothing`,
      [questionId, skillId],
    );

    await client.query(
      `update public.questions set current_version_id = $1 where id = $2`,
      [versionId, questionId],
    );

    await client.query("COMMIT");
    return { questionId, mathRenders: stemRenders + optionRenderCount };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  const sourceDir = args.sourceDir;
  const report: ImportReport = {
    env: args.env,
    dryRun: args.dryRun,
    startedAt: new Date().toISOString(),
    totals: {
      skillsInserted: 0,
      prerequisiteEdges: 0,
      skillObjectivesProvisional: 0,
      questionsRead: 0,
      questionsInserted: 0,
      questionsSkipped: 0,
      questionsRejectedDuplicate: 0,
      questionsHeld: 0,
      questionsFailed: 0,
    },
    skillObjectivesProvisionalNote:
      "Provisional skill→objective links use confidence 0.30 per §12.4; recorded here only — skill_objectives has no confidence column.",
    heldSources: [
      "reasoning_bank_phase7.json",
      "question_tagger_sample_bank.json",
      "bulk_tagger_sample_bank.json",
    ],
    files: {},
    records: [],
  };

  const pool = new Pool({ connectionString: args.dbUrl });
  const client = await pool.connect();

  try {
    if (args.commit) {
      const job = await client.query<{ id: string }>(
        `
          insert into public.content_jobs (job_type, status, params, source_path, started_at)
          values ('import_legacy', 'running', $1, $2, now())
          returning id
        `,
        [JSON.stringify({ env: args.env }), sourceDir],
      );
      report.jobId = job.rows[0]!.id;
    }

    const skills = readJson<SkillRow[]>(join(sourceDir, "csec_skill_map_phase3.json"));
    const { inserted: skillsInserted, skillIdByCode } = await importSkills(
      client,
      skills,
      args.dryRun,
    );
    report.totals.skillsInserted = skillsInserted;
    report.totals.prerequisiteEdges = await importPrerequisites(
      client,
      skills,
      skillIdByCode,
      args.dryRun,
    );

    const hashIndex = args.dryRun ? new Map<string, HashEntry>() : await loadExistingHashes(client);
    const stemIndex: HashEntry[] = [...hashIndex.values()];
    const freeCountByTopic = new Map<string, number>();
    const pendingQuestions: PendingQuestion[] = [];
    const heldRecords: Array<{ legacyId: string; reason: string; sourceFile: string }> = [];

    const lessons = readJson<LessonRow[]>(join(sourceDir, "lesson_bank_phase4.json"));
    report.files["lesson_bank_phase4.json"] = {
      read: 0,
      inserted: 0,
      rejected_duplicate: 0,
      held: 0,
      failed: 0,
    };

    for (const lesson of lessons) {
      const skillCode = await resolveSkillCodeByName(
        client,
        lesson.skill,
        skillIdByCode,
        skills,
        lesson,
      );

      if (lesson.workedExample) {
        report.totals.questionsRead += 1;
        report.files["lesson_bank_phase4.json"]!.read += 1;
        const transformed = transformWorkedExampleQuestion(lesson, skillCode);
        if ("held" in transformed && transformed.held) {
          heldRecords.push({
            legacyId: transformed.legacyId,
            reason: transformed.reason,
            sourceFile: "lesson_bank_phase4.json",
          });
          report.files["lesson_bank_phase4.json"]!.held += 1;
          report.totals.questionsHeld += 1;
          report.records.push({
            legacyId: transformed.legacyId,
            status: "held",
            holdReason: transformed.reason,
          });
        } else {
          pendingQuestions.push(transformed as PendingQuestion);
        }
      }

      for (let i = 0; i < (lesson.independentPractice?.length ?? 0); i++) {
        const practice = lesson.independentPractice![i]!;
        report.totals.questionsRead += 1;
        report.files["lesson_bank_phase4.json"]!.read += 1;
        const transformed = transformLessonPractice(lesson, practice, i, skillCode, "independent");
        if ("held" in transformed && transformed.held) {
          heldRecords.push({
            legacyId: transformed.legacyId,
            reason: transformed.reason,
            sourceFile: "lesson_bank_phase4.json",
          });
          report.files["lesson_bank_phase4.json"]!.held += 1;
          report.totals.questionsHeld += 1;
          report.records.push({
            legacyId: transformed.legacyId,
            status: "held",
            holdReason: transformed.reason,
          });
        } else {
          pendingQuestions.push(transformed as PendingQuestion);
        }
      }

      for (let i = 0; i < (lesson.quiz?.length ?? 0); i++) {
        report.totals.questionsRead += 1;
        report.files["lesson_bank_phase4.json"]!.read += 1;
        pendingQuestions.push(
          transformLessonMcq(lesson, lesson.quiz![i]!, i, skillCode),
        );
      }
    }

    report.files["diagnostic_bank_phase3.json"] = {
      read: 0,
      inserted: 0,
      rejected_duplicate: 0,
      held: 0,
      failed: 0,
    };
    const diagnostics = readJson<DiagnosticRow[]>(join(sourceDir, "diagnostic_bank_phase3.json"));
    for (const row of diagnostics) {
      report.totals.questionsRead += 1;
      report.files["diagnostic_bank_phase3.json"]!.read += 1;
      pendingQuestions.push(transformDiagnostic(row));
    }

    for (const question of pendingQuestions) {
      const dup = findDuplicate(question, hashIndex, stemIndex);
      if (dup) {
        report.totals.questionsRejectedDuplicate += 1;
        report.files[question.sourceFile]!.rejected_duplicate += 1;
        report.records.push({
          legacyId: question.legacyId,
          status: "rejected_duplicate",
          duplicateOf: dup.duplicateOf,
          layer: dup.layer,
        });
        continue;
      }

      try {
        const result = await insertQuestionRecord(
          client,
          pool,
          question,
          skillIdByCode,
          args.dryRun,
          freeCountByTopic,
        );
        if (result.skipped) {
          report.totals.questionsSkipped += 1;
          report.records.push({
            legacyId: question.legacyId,
            questionId: result.questionId,
            status: "skipped_existing",
          });
          continue;
        }

        report.totals.questionsInserted += 1;
        report.files[question.sourceFile]!.inserted += 1;
        const entry: HashEntry = {
          legacyId: question.legacyId,
          stemPlain: question.stemPlain,
          canonicalValue: canonicalValueOf(question.answerSpec),
        };
        hashIndex.set(computeNormalisedHash(question.stemPlain), entry);
        stemIndex.push(entry);

        report.records.push({
          legacyId: question.legacyId,
          questionId: result.questionId,
          status: "inserted",
          flags: question.flags,
          latexConversions: question.latexConversions,
          mathRenders: result.mathRenders,
        });
      } catch (error) {
        report.totals.questionsFailed += 1;
        report.files[question.sourceFile]!.failed += 1;
        const message = error instanceof Error ? error.message : String(error);
        report.records.push({
          legacyId: question.legacyId,
          status: "failed",
          error: message,
        });
        const failedDir = join(sourceDir, "failed");
        mkdirSync(failedDir, { recursive: true });
        writeFileSync(
          join(failedDir, `${question.legacyId.replace(/[:/\\]/g, "_")}.json`),
          JSON.stringify({ question, error: message }, null, 2),
        );
        if (args.commit) {
          throw error;
        }
      }
    }

    report.totals.skillObjectivesProvisional = await linkSkillObjectivesProvisional(
      client,
      skills,
      skillIdByCode,
      args.dryRun,
    );

    report.finishedAt = new Date().toISOString();
    const reportPath = join(
      sourceDir,
      `import-report-${Date.now()}.json`,
    );
    writeFileSync(reportPath, JSON.stringify(report, null, 2));

    if (args.commit && report.jobId) {
      await client.query(
        `
          update public.content_jobs
          set status = 'succeeded', finished_at = now(), result = $1,
              items_total = $2, items_done = $3, items_failed = $4
          where id = $5
        `,
        [
          JSON.stringify(report.totals),
          report.totals.questionsRead,
          report.totals.questionsInserted,
          report.totals.questionsFailed,
          report.jobId,
        ],
      );
    }

    console.log(JSON.stringify(report.totals, null, 2));
    console.log(`Report written to ${reportPath}`);

    if (report.totals.questionsFailed > 0) {
      process.exit(1);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
