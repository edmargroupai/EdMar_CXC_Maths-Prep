/**
 * Batch-render the CSEC-style LaTeX corpus into public.math_renders.
 *
 * Usage: pnpm render-math
 * Env: DATABASE_URL (defaults to supabase status or local port 54522)
 */
import { spawnSync } from "node:child_process";
import { Pool } from "pg";
import { LATEX_CORPUS } from "./lib/latex-corpus.js";
import { computeRenderHash, upsertMathRender, validateLatex } from "./lib/render-math-core.js";

const DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:54522/postgres";

function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const status = spawnSync("supabase", ["status", "-o", "env"], {
    encoding: "utf8",
  });

  if (status.status === 0) {
    const match = status.stdout.match(/DATABASE_URL="([^"]+)"/);
    if (match?.[1]) {
      return match[1];
    }
  }

  return DEFAULT_DATABASE_URL;
}

async function main(): Promise<void> {
  const pool = new Pool({ connectionString: resolveDatabaseUrl() });
  let inserted = 0;
  let skipped = 0;
  let failed = 0;
  const distinctHashes = new Set<string>();

  try {
    for (const [index, entry] of LATEX_CORPUS.entries()) {
      const validation = validateLatex(entry.latex);
      if (!validation.ok) {
        failed += 1;
        console.error(`[${index + 1}] allowlist rejected: ${validation.reason}`);
        continue;
      }

      try {
        const result = await upsertMathRender(pool, entry.latex, entry.style);
        distinctHashes.add(result.hash);
        if (result.inserted) {
          inserted += 1;
        } else {
          skipped += 1;
        }
      } catch (error) {
        failed += 1;
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[${index + 1}] render failed: ${message}`);
      }
    }

    console.log(
      JSON.stringify(
        {
          corpusSize: LATEX_CORPUS.length,
          inserted,
          skipped,
          failed,
          distinctHashes: distinctHashes.size,
          expectedDistinct: new Set(
            LATEX_CORPUS.map((entry) => computeRenderHash(entry.latex, entry.style)),
          ).size,
        },
        null,
        2,
      ),
    );

    if (failed > 0) {
      process.exitCode = 1;
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
