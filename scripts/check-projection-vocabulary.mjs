import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const BAND_PATTERN =
  /\bgrade\s*[1-6]\b|\bgrades?\s*[1-6]\s*[-–]\s*[1-6]\b|\bpredicted\s+grade\b/i;

const ALLOWED = [
  "apps/web/src/features/readiness",
  "apps/web/src/app/(app)/readiness",
  "packages/assessment-core",
  "apps/web/src/components/PremiumGate.tsx",
  "apps/web/src/hooks/useEntitlement.ts",
];

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (["node_modules", ".next"].includes(name)) continue;
      walk(full, acc);
    } else if (/\.(tsx|ts|md)$/.test(name)) {
      acc.push(full.replace(/\\/g, "/"));
    }
  }
  return acc;
}

let fail = 0;
for (const file of walk("apps/web/src/app/(marketing)")) {
  const text = readFileSync(file, "utf8");
  if (BAND_PATTERN.test(text) && !ALLOWED.some((a) => file.includes(a))) {
    console.error(`check-projection-vocabulary: band language on marketing route: ${file}`);
    fail = 1;
  }
}

if (fail) process.exit(1);
console.log("check-projection-vocabulary: ok");
