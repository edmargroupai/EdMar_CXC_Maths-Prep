import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join } from "node:path";

const pattern = /=== ['"]premium['"]|tier ===/;

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (["node_modules", ".next", "docs", ".git", ".turbo", ".vercel"].includes(name)) {
        continue;
      }
      walk(full, acc);
    } else if (/\.(ts|tsx)$/.test(name)) {
      acc.push(full);
    }
  }
  return acc;
}

let fail = 0;
for (const file of walk(".")) {
  const base = basename(file);
  if (base === "useEntitlement.ts" || base === "PremiumGate.tsx") continue;
  if (pattern.test(readFileSync(file, "utf8"))) {
    console.error(`check-entitlement: premium/tier check outside permitted files: ${file}`);
    fail = 1;
  }
}

if (fail) process.exit(1);
console.log("check-entitlement: ok");
