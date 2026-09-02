/**
 * Validates JSON question files under content/staging/ (excluding templates/).
 *
 * Usage: pnpm validate:staging
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import {
  roundTripCheck,
  validateQuestion,
} from "@edmar/content-schema";
import type { AnswerSpec } from "@edmar/types";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const stagingDir = join(root, "content", "staging");

function collectJsonFiles(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === "templates") continue;
      collectJsonFiles(full, acc);
    } else if (name.endsWith(".json") && !name.startsWith("_")) {
      acc.push(full);
    }
  }
  return acc;
}

function checkSpec(label: string, spec: AnswerSpec): string | null {
  const roundTrip = roundTripCheck(spec);
  if (!roundTrip.ok) {
    return `${label}: round-trip failed (${roundTrip.reason ?? "unknown"})`;
  }
  return null;
}

function main(): void {
  const files = collectJsonFiles(stagingDir).sort();

  if (files.length === 0) {
    console.log("validate:staging — no question files yet (copy a template from content/staging/templates/)");
    return;
  }

  let failures = 0;

  for (const path of files) {
    const rel = relative(root, path);
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(path, "utf8"));
    } catch (error) {
      failures++;
      console.error(`[${rel}] invalid JSON: ${error instanceof Error ? error.message : error}`);
      continue;
    }

    if (String((parsed as { legacyId?: string }).legacyId ?? "").includes("REPLACE_")) {
      console.warn(`[${rel}] skipped — still contains REPLACE_ placeholders`);
      continue;
    }

    const schemaResult = validateQuestion(parsed);
    if (!schemaResult.valid) {
      failures++;
      console.error(`[${rel}] schema validation failed:`);
      for (const message of schemaResult.errors) {
        console.error(`  ${message}`);
      }
      continue;
    }

    const question = parsed as {
      answerSpec?: AnswerSpec;
      parts?: Array<{ partKey: string; answerSpec: AnswerSpec }>;
    };

    if (!question.answerSpec) {
      failures++;
      console.error(`[${rel}] missing answerSpec`);
      continue;
    }

    const topError = checkSpec(`${rel} answerSpec`, question.answerSpec);
    if (topError) {
      failures++;
      console.error(`[${rel}] ${topError}`);
      continue;
    }

    if (question.parts?.length) {
      for (const part of question.parts) {
        const partError = checkSpec(`${rel} part ${part.partKey}`, part.answerSpec);
        if (partError) {
          failures++;
          console.error(`[${rel}] ${partError}`);
        }
      }
    }
  }

  if (failures > 0) {
    console.error(`validate:staging failed (${failures} issue(s))`);
    process.exit(1);
  }

  console.log(`validate:staging passed (${files.length} file(s))`);
}

main();
