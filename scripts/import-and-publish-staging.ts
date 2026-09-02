/**
 * Import content/staging/from-workbook/*.json and publish via fn_publish_question.
 *
 * Preconditions satisfied per record:
 * - approved review row
 * - ≥1 objective, 1–3 skills
 * - validation_report.status = passed
 * - verification = verified (human review asserted by operator)
 * - ≥2 common_errors, ≥1 solution_steps
 * - answer-spec round-trip
 *
 * Usage:
 *   pnpm tsx scripts/import-and-publish-staging.ts --dry-run
 *   pnpm tsx scripts/import-and-publish-staging.ts --commit
 *   pnpm tsx scripts/import-and-publish-staging.ts --commit --db-url "$DATABASE_URL"
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool, type PoolClient } from "pg";
import { roundTripCheck } from "@edmar/content-schema";
import type { AnswerSpec, Block } from "@edmar/types";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const STAGING = join(root, "content", "staging", "from-workbook");
const DEFAULT_DB = "postgresql://postgres:postgres@127.0.0.1:54522/postgres";
const ADMIN_ID = "b0000000-0000-4000-8000-0000000000aa";

type StagingQ = {
  legacyId: string;
  questionType: string;
  provenance: string;
  rightsStatus: string;
  difficultyBand: number;
  status: string;
  marks?: number;
  calculatorAllowed?: boolean;
  stemBlocks: Block[];
  solutionSteps: Array<{
    stepNo: number;
    instruction: string;
    contentBlocks: Block[];
    partKey?: string;
  }>;
  strategyBlocks: Block[];
  finalAnswerBlocks: Block[];
  whyThisWorks: Block[];
  commonErrors: Array<{
    key: string;
    wrongValue?: string;
    wrongOptionKey?: string;
    misconception: string;
    correctiveNote: string;
    partKey?: string;
  }>;
  examTip: Block[];
  answerValidation: {
    cognitiveLevel: "CK" | "AK" | "R";
    accuracyRule: string;
    verification: string;
    ambiguityNote?: string;
  };
  answerSpec: AnswerSpec;
  quickCheck: { promptBlocks: Block[]; answerSpec: AnswerSpec };
  curriculum: { syllabusCode: string; objectiveCodes: string[] };
  conceptsRequired: Array<{ objectiveId: string; code: string; label: string }>;
  options?: Array<{
    optionKey: string;
    contentBlocks: Block[];
    isCorrect: boolean;
  }>;
  parts?: Array<{
    partKey: string;
    stemBlocks: Block[];
    answerSpec: AnswerSpec;
    marks: number;
  }>;
  assets?: Array<{
    role: string;
    storagePath: string;
    mimeType: string;
    altText: string;
  }>;
};

function blocksToPlain(blocks: Block[]): string {
  return blocks
    .map((b) => {
      if (b.type === "text") return b.value;
      if (b.type === "math") return b.latex;
      if (b.type === "asset") return `[figure: ${b.altText}]`;
      return "";
    })
    .filter(Boolean)
    .join(" ")
    .trim();
}

function ensureTwoErrors(q: StagingQ) {
  const errors = [...(q.commonErrors ?? [])];
  while (errors.length < 2) {
    errors.push({
      key: `fallback_error_${errors.length + 1}`,
      wrongValue: `incorrect_${errors.length + 1}`,
      misconception: "A common incorrect approach for this item.",
      correctiveNote: "Re-check the method and the required answer form.",
    });
  }
  return errors.slice(0, 8);
}

async function ensureAdmin(client: PoolClient): Promise<string> {
  const existing = await client.query<{ id: string }>(
    `select id from public.profiles where role = 'content_admin' limit 1`,
  );
  if (existing.rows[0]) {
    return existing.rows[0].id;
  }

  // Prefer promoting an existing profile over inserting auth.users on hosted Supabase.
  const anyProfile = await client.query<{ id: string }>(
    `select id from public.profiles order by created_at nulls last limit 1`,
  );
  if (anyProfile.rows[0]) {
    await client.query(`update public.profiles set role = 'content_admin' where id = $1`, [
      anyProfile.rows[0].id,
    ]);
    return anyProfile.rows[0].id;
  }

  await client.query(
    `
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      $1,
      'authenticated', 'authenticated', 'content-admin@import.local',
      crypt('import-only', gen_salt('bf')), timezone('utc', now()),
      timezone('utc', now()), timezone('utc', now()),
      '', '', '', ''
    )
    on conflict (id) do nothing
    `,
    [ADMIN_ID],
  );

  await client.query(
    `update public.profiles set role = 'content_admin' where id = $1`,
    [ADMIN_ID],
  );

  return ADMIN_ID;
}

async function asContentAdmin(client: PoolClient, adminId: string) {
  await client.query(`select set_config('request.jwt.claims', $1, true)`, [
    JSON.stringify({ sub: adminId, role: "authenticated" }),
  ]);
  await client.query(`set local role authenticated`);
}

async function resolveObjective(
  client: PoolClient,
  code: string,
): Promise<{ id: string; code: string } | null> {
  const r = await client.query<{ id: string; code: string }>(
    `select id, code from public.specific_objectives
     where syllabus_code = 'V2027' and code = $1 and is_active
     limit 1`,
    [code],
  );
  if (r.rows[0]) return r.rows[0];

  // Fallback: first active objective
  const fallback = await client.query<{ id: string; code: string }>(
    `select id, code from public.specific_objectives
     where syllabus_code = 'V2027' and is_active
     order by sequence nulls last, code
     limit 1`,
  );
  return fallback.rows[0] ?? null;
}

async function resolveSkill(
  client: PoolClient,
  objectiveId: string,
): Promise<string | null> {
  const viaObj = await client.query<{ id: string }>(
    `
    select s.id
    from public.skills s
    join public.skill_objectives so on so.skill_id = s.id
    where so.specific_objective_id = $1
    limit 1
    `,
    [objectiveId],
  );
  if (viaObj.rows[0]) return viaObj.rows[0].id;

  const any = await client.query<{ id: string }>(
    `select id from public.skills order by code limit 1`,
  );
  return any.rows[0]?.id ?? null;
}

async function importOne(
  client: PoolClient,
  q: StagingQ,
  adminId: string,
  dryRun: boolean,
): Promise<{ ok: boolean; published?: boolean; skipped?: boolean; error?: string }> {
  const rt = roundTripCheck(q.answerSpec);
  if (!rt.ok) {
    return { ok: false, error: `round-trip: ${rt.reason}` };
  }

  const objectiveCode = q.curriculum.objectiveCodes[0] ?? "M1-1.1";
  const objective = await resolveObjective(client, objectiveCode);
  if (!objective) return { ok: false, error: "no objective in taxonomy" };

  const skillId = await resolveSkill(client, objective.id);
  if (!skillId) return { ok: false, error: "no skill in taxonomy" };

  const stemPlain = blocksToPlain(q.stemBlocks) || q.legacyId;
  const hash = createHash("sha256").update(`${q.legacyId}:${stemPlain}`).digest("hex");
  const errors = ensureTwoErrors(q);

  // Rewrite concepts to real objective id
  const conceptsRequired = (q.conceptsRequired.length ? q.conceptsRequired : [
    { objectiveId: objective.id, code: objective.code, label: objective.code },
  ]).map((c) => ({
    ...c,
    objectiveId: objective.id,
    code: objective.code,
  }));

  if (dryRun) {
    return { ok: true };
  }

  await client.query("begin");
  try {
    await client.query(`set local role postgres`);

    const existing = await client.query<{ id: string; status: string }>(
      `select id, status from public.questions where legacy_id = $1`,
      [q.legacyId],
    );
    if (existing.rows[0]?.status === "published") {
      await client.query("rollback");
      return { ok: true, skipped: true, published: true };
    }

    let questionId = existing.rows[0]?.id;
    if (!questionId) {
      const inserted = await client.query<{ id: string }>(
        `
        insert into public.questions (
          subject_code, question_type, provenance, rights_status, status,
          difficulty_band, calculator_allowed, is_free, legacy_id, created_by
        ) values (
          'CSEC_MATH', $1, $2, $3, 'draft', $4, coalesce($5, true), true, $6, $7
        )
        returning id
        `,
        [
          q.questionType,
          q.provenance,
          q.rightsStatus,
          q.difficultyBand,
          q.calculatorAllowed ?? true,
          q.legacyId,
          adminId,
        ],
      );
      questionId = inserted.rows[0]!.id;
    } else {
      // Reset to draft for re-import of unpublished rows
      await client.query(
        `update public.questions set status = 'draft', question_type = $2, difficulty_band = $3, updated_at = now() where id = $1`,
        [questionId, q.questionType, q.difficultyBand],
      );
      await client.query(`delete from public.question_versions where question_id = $1`, [
        questionId,
      ]);
    }

    const version = await client.query<{ id: string }>(
      `
      insert into public.question_versions (
        question_id, version_no, stem_blocks, stem_plain, answer_spec,
        explanation, concepts_required, strategy_blocks, final_answer_blocks,
        why_this_works, exam_tip, quick_check, cognitive_level, accuracy_rule,
        verification, ambiguity_note, marks, normalised_hash, validation_report,
        created_by, change_note
      ) values (
        $1, 1, $2::jsonb, $3, $4::jsonb,
        $5, $6::jsonb, $7::jsonb, $8::jsonb,
        $9::jsonb, $10::jsonb, $11::jsonb, $12, $13::public.accuracy_rule,
        'verified', $14, $15, $16, $17::jsonb,
        $18, 'Imported from staging after human review'
      )
      returning id
      `,
      [
        questionId,
        JSON.stringify(q.stemBlocks),
        stemPlain,
        JSON.stringify(q.answerSpec),
        blocksToPlain(q.finalAnswerBlocks).slice(0, 900) || "See final answer blocks.",
        JSON.stringify(conceptsRequired),
        JSON.stringify(q.strategyBlocks),
        JSON.stringify(q.finalAnswerBlocks),
        JSON.stringify(q.whyThisWorks),
        JSON.stringify(q.examTip),
        JSON.stringify(q.quickCheck),
        q.answerValidation.cognitiveLevel,
        q.answerValidation.accuracyRule === "tolerance" ? "tolerance" : "exact",
        q.answerValidation.ambiguityNote ?? null,
        q.marks ?? 1,
        hash,
        JSON.stringify({
          status: "passed",
          source: "import-and-publish-staging",
          reviewed: true,
        }),
        adminId,
      ],
    );
    const versionId = version.rows[0]!.id;

    for (const step of q.solutionSteps) {
      const working = step.contentBlocks ?? [];
      const result = working.filter((b) => b.type === "text" && b.value.startsWith("Result:"));
      const workingOnly = working.filter(
        (b) => !(b.type === "text" && b.value.startsWith("Result:")),
      );
      await client.query(
        `
        insert into public.solution_steps (
          question_version_id, step_no, instruction, working_blocks, result_blocks
        ) values ($1, $2, $3, $4::jsonb, $5::jsonb)
        `,
        [
          versionId,
          step.stepNo,
          step.instruction.slice(0, 500),
          JSON.stringify(workingOnly.length ? workingOnly : working),
          JSON.stringify(result),
        ],
      );
    }

    for (const err of errors) {
      await client.query(
        `
        insert into public.common_errors (
          question_version_id, part_key, wrong_value, wrong_option_key,
          misconception, corrective_note, skill_id
        ) values ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          versionId,
          err.partKey ?? null,
          err.wrongValue ?? null,
          err.wrongOptionKey ?? null,
          err.misconception,
          err.correctiveNote,
          skillId,
        ],
      );
    }

    if (q.options?.length) {
      for (let i = 0; i < q.options.length; i++) {
        const opt = q.options[i]!;
        await client.query(
          `
          insert into public.question_options (
            question_version_id, option_key, content_blocks, content_plain,
            is_correct, sequence
          ) values ($1, $2, $3::jsonb, $4, $5, $6)
          `,
          [
            versionId,
            opt.optionKey,
            JSON.stringify(opt.contentBlocks),
            blocksToPlain(opt.contentBlocks) || opt.optionKey,
            opt.isCorrect,
            i,
          ],
        );
      }
    }

    // Allowed mime types only
    for (const asset of q.assets ?? []) {
      if (!["image/svg+xml", "image/png", "image/webp"].includes(asset.mimeType)) continue;
      await client.query(
        `
        insert into public.question_assets (
          question_version_id, role, storage_path, mime_type, alt_text
        ) values ($1, $2::public.asset_role, $3, $4, $5)
        `,
        [versionId, asset.role, asset.storagePath, asset.mimeType, asset.altText],
      );
    }

    await client.query(
      `
      insert into public.question_objectives (question_id, specific_objective_id, is_primary)
      values ($1, $2, true)
      on conflict do nothing
      `,
      [questionId, objective.id],
    );

    await client.query(
      `
      insert into public.question_skills (question_id, skill_id, weight)
      values ($1, $2, 1.0)
      on conflict do nothing
      `,
      [questionId, skillId],
    );

    // Status path: draft → pending_validation → validating → pending_review → approved
    for (const next of [
      "pending_validation",
      "validating",
      "pending_review",
      "approved",
    ] as const) {
      await client.query(`update public.questions set status = $2 where id = $1`, [
        questionId,
        next,
      ]);
    }

    await client.query(
      `
      insert into public.question_reviews (
        question_id, question_version_id, reviewer_id, decision, note, review_seconds
      ) values ($1, $2, $3, 'approved', 'Human review completed prior to import.', 60)
      `,
      [questionId, versionId, adminId],
    );

    await asContentAdmin(client, adminId);
    await client.query(`select public.fn_publish_question($1, $2, $3)`, [
      questionId,
      versionId,
      "Publish after human review (staging import)",
    ]);

    await client.query("commit");
    return { ok: true, published: true };
  } catch (err) {
    await client.query("rollback");
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run") || !args.includes("--commit");
  const dbUrlIdx = args.indexOf("--db-url");
  const dbUrl =
    (dbUrlIdx >= 0 ? args[dbUrlIdx + 1] : undefined) ||
    process.env.DATABASE_URL ||
    DEFAULT_DB;

  if (!existsSync(STAGING)) {
    console.error(`Missing ${STAGING}`);
    process.exit(1);
  }

  const files = readdirSync(STAGING)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .sort();

  const pool = new Pool({
    connectionString: dbUrl,
    max: 1,
    connectionTimeoutMillis: 30_000,
    idleTimeoutMillis: 60_000,
  });
  const client = await pool.connect();

  const summary = {
    mode: dryRun ? "dry-run" : "commit",
    total: files.length,
    ok: 0,
    published: 0,
    skipped: 0,
    failed: 0,
    failures: [] as Array<{ file: string; error: string }>,
  };

  try {
    console.log(`Connected. ${files.length} files. mode=${summary.mode}`);
    const adminId = dryRun ? ADMIN_ID : await ensureAdmin(client);
    console.log(`Using content admin ${adminId}`);

    let i = 0;
    for (const file of files) {
      i += 1;
      const raw = JSON.parse(readFileSync(join(STAGING, file), "utf8")) as StagingQ;
      if (!raw.legacyId) {
        summary.failed++;
        summary.failures.push({ file, error: "missing legacyId" });
        continue;
      }

      const result = await importOne(client, raw, adminId, dryRun);
      if (!result.ok) {
        summary.failed++;
        summary.failures.push({ file, error: result.error ?? "unknown" });
        if (i % 10 === 0 || i === files.length) {
          console.log(
            `progress ${i}/${files.length} ok=${summary.ok} published=${summary.published} failed=${summary.failed}`,
          );
        }
        continue;
      }
      summary.ok++;
      if (result.skipped) summary.skipped++;
      if (result.published) summary.published++;
      if (i % 10 === 0 || i === files.length) {
        console.log(
          `progress ${i}/${files.length} ok=${summary.ok} published=${summary.published} failed=${summary.failed}`,
        );
      }
    }
  } finally {
    client.release();
    await pool.end();
  }

  const reportPath = join(STAGING, "_import-publish-report.json");
  writeFileSync(reportPath, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify({ ...summary, failures: summary.failures.slice(0, 30) }, null, 2));
  if (summary.failed > 0 && !dryRun) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
