/**
 * Cross-check @edmar/answer-core validate() vs Postgres fn_validate_answer.
 * Expression types are excluded (spec §6.6 — server uses acceptedForms membership only).
 *
 * Usage: pnpm test:crosscheck
 * Env: CROSSCHECK_CASES (default 5000) — each case is one round-trip; full 5000 takes several minutes.
 */
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { validate } from "@edmar/answer-core";
import type { AnswerSpec } from "@edmar/types";

const CASE_COUNT = Number(process.env.CROSSCHECK_CASES ?? "5000");

type GeneratedCase = {
  id: number;
  input: string;
  spec: AnswerSpec;
};

const ANSWER_TYPES = [
  "numeric_exact",
  "numeric_tolerance",
  "numeric_sf",
  "numeric_dp",
  "boolean",
  "option_id",
  "currency",
] as const;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSpec(answerType: (typeof ANSWER_TYPES)[number]): GeneratedCase["spec"] {
  switch (answerType) {
    case "boolean": {
      const canonical = Math.random() < 0.5 ? "true" : "false";
      return {
        answerType: "boolean",
        canonicalValue: canonical,
        displayValue: canonical,
        acceptedForms: [canonical],
        normalisation: "default",
      };
    }
    case "option_id": {
      const key = (["A", "B", "C", "D"] as const)[randomInt(0, 3)];
      return {
        answerType: "option_id",
        canonicalValue: key,
        displayValue: key,
        acceptedForms: [key],
        normalisation: "default",
      };
    }
    default: {
      const value = randomInt(1, 999);
      const canonical = String(value);
      const base: AnswerSpec = {
        answerType,
        canonicalValue: canonical,
        displayValue: canonical,
        acceptedForms: [canonical, `${canonical}.0`],
        normalisation: answerType === "currency" ? "currency_default" : "numeric_default",
        tolerance: { kind: "absolute", value: answerType === "numeric_tolerance" ? 2 : 0 },
      };
      if (answerType === "numeric_sf") {
        base.precision = {
          kind: "significant_figures",
          value: String(value).length,
          required: true,
        };
      }
      if (answerType === "numeric_dp" || answerType === "currency") {
        base.precision = { kind: "decimal_places", value: 0, required: false };
      }
      return base;
    }
  }
}

function generateCases(count: number): GeneratedCase[] {
  const cases: GeneratedCase[] = [];
  for (let i = 0; i < count; i++) {
    const type = ANSWER_TYPES[i % ANSWER_TYPES.length]!;
    const spec = generateSpec(type);
    let input: string;
    if (type === "boolean") {
      const canonical = spec.canonicalValue as string;
      input =
        canonical === "true"
          ? (["true", "yes", "1", "T"] as const)[randomInt(0, 3)]
          : (["false", "no", "0", "F"] as const)[randomInt(0, 3)];
    } else if (type === "option_id") {
      input = Math.random() < 0.7 ? (spec.canonicalValue as string) : (["A", "B", "C", "D", "E"] as const)[randomInt(0, 4)];
    } else {
      const value = Number(spec.canonicalValue);
      input = String(value + randomInt(-5, 5));
    }
    cases.push({ id: i, input, spec });
  }
  return cases;
}

function sqlLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function runPostgresBatch(cases: GeneratedCase[]): Array<{ id: number; is_correct: boolean; reason?: string }> {
  const values = cases
    .map(
      (c) =>
        `(${c.id}, ${sqlLiteral(JSON.stringify(c.spec))}::jsonb, ${sqlLiteral(c.input)}, null)`,
    )
    .join(",\n");

  const sql = `
with cases(id, spec, raw, part_key) as (
  values
  ${values}
)
select coalesce(
  jsonb_agg(
    jsonb_build_object(
      'id', c.id,
      'is_correct', (public.fn_validate_answer(c.spec, c.raw, c.part_key) ->> 'is_correct')::boolean,
      'reason', public.fn_validate_answer(c.spec, c.raw, c.part_key) ->> 'reason'
    )
    order by c.id
  ),
  '[]'::jsonb
) as results
from cases c;
`;

  const file = join(tmpdir(), "edmar-crosscheck-batch.sql");
  writeFileSync(file, sql, "utf8");
  const supabaseCmd =
    process.platform === "win32"
      ? `"${process.env.APPDATA ?? ""}\\npm\\supabase.cmd"`
      : "supabase";
  const result = spawnSync(`${supabaseCmd} db query --local -f "${file}"`, {
    encoding: "utf8",
    shell: true,
  });

  if (result.status !== 0) {
    throw new Error(
      [result.stderr, result.stdout, `exit=${result.status}`, `file=${file}`].filter(Boolean).join("\n"),
    );
  }

  const jsonStart = result.stdout.indexOf("{");
  const jsonEnd = result.stdout.lastIndexOf("}");
  const envelope = JSON.parse(result.stdout.slice(jsonStart, jsonEnd + 1)) as {
    rows?: Array<{ results?: string | unknown[] }>;
  };
  const rawResults = envelope.rows?.[0]?.results;
  if (!rawResults) {
    throw new Error(`missing results row: ${result.stdout}`);
  }
  return (typeof rawResults === "string" ? JSON.parse(rawResults) : rawResults) as Array<{
    id: number;
    is_correct: boolean;
    reason?: string;
  }>;
}

function main(): void {
  const start = Date.now();
  const batchSize = Math.min(500, CASE_COUNT);
  let disagreements = 0;
  const samples: string[] = [];

  for (let offset = 0; offset < CASE_COUNT; offset += batchSize) {
    const chunk = generateCases(Math.min(batchSize, CASE_COUNT - offset)).map((c, i) => ({
      ...c,
      id: offset + i,
    }));

    const pgResults = runPostgresBatch(chunk);
    const pgById = new Map(pgResults.map((r) => [r.id, r]));

    for (const c of chunk) {
      const nodeResult = validate(c.input, c.spec);
      const pgResult = pgById.get(c.id);
      if (!pgResult) {
        throw new Error(`missing postgres result for case ${c.id}`);
      }
      if (nodeResult.isCorrect !== pgResult.is_correct) {
        disagreements++;
        if (samples.length < 10) {
          samples.push(
            `#${c.id} ${c.spec.answerType} input=${JSON.stringify(c.input)} node=${nodeResult.isCorrect}/${nodeResult.reason} pg=${pgResult.is_correct}/${pgResult.reason}`,
          );
        }
      }
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(
    `Cross-check complete: ${CASE_COUNT} cases, ${disagreements} disagreements, ${elapsed}s`,
  );
  if (Number(CASE_COUNT) >= 5000 && Number(elapsed) > 120) {
    console.log(
      "Note: full 5000-case batch run exceeded 120s locally — use smaller CROSSCHECK_CASES for dev.",
    );
  }
  if (disagreements > 0) {
    console.error(samples.join("\n"));
    process.exit(1);
  }
}

main();
