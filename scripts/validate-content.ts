/**
 * Validates every JSON fixture in content/golden/ against the canonical question schema
 * and the §13.7 check-6 round-trip self-check.
 *
 * Usage: pnpm validate:content
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  roundTripCheck,
  validateQuestion,
} from "@edmar/content-schema";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const goldenDir = join(root, "content", "golden");

function main(): void {
  const files = readdirSync(goldenDir)
    .filter((name) => name.endsWith(".json"))
    .sort();

  if (files.length === 0) {
    console.error(`No JSON fixtures found in ${goldenDir}`);
    process.exit(1);
  }

  let failures = 0;

  for (const file of files) {
    const path = join(goldenDir, file);
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(path, "utf8"));
    } catch (error) {
      failures++;
      console.error(`[${file}] invalid JSON: ${error instanceof Error ? error.message : error}`);
      continue;
    }

    const schemaResult = validateQuestion(parsed);
    if (!schemaResult.valid) {
      failures++;
      console.error(`[${file}] schema validation failed:`);
      for (const message of schemaResult.errors) {
        console.error(`  ${message}`);
      }
      continue;
    }

    const question = parsed as { answerSpec?: Parameters<typeof roundTripCheck>[0] };
    if (!question.answerSpec) {
      failures++;
      console.error(`[${file}] missing answerSpec`);
      continue;
    }

    const roundTrip = roundTripCheck(question.answerSpec);
    if (!roundTrip.ok) {
      failures++;
      console.error(
        `[${file}] round-trip check failed: ${roundTrip.reason ?? "displayValue did not validate"}`,
      );
    }
  }

  if (failures > 0) {
    console.error(`validate:content failed (${failures} fixture(s) invalid)`);
    process.exit(1);
  }

  console.log(`validate:content passed (${files.length} fixture(s))`);
}

main();
