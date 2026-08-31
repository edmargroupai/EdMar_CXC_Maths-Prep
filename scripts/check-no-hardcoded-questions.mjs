import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const pattern = /stem_blocks\s*:|answer_spec\s*:|"stemBlocks"\s*:/;

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === ".next") continue;
      walk(full, acc);
    } else if (/\.(ts|tsx)$/.test(name) && /components/.test(full.replace(/\\/g, "/"))) {
      acc.push(full);
    }
  }
  return acc;
}

let fail = 0;
for (const file of walk(".")) {
  if (pattern.test(readFileSync(file, "utf8"))) {
    console.error(`check-no-hardcoded-questions: question-shaped literal in ${file}`);
    fail = 1;
  }
}

if (fail) process.exit(1);
console.log("check-no-hardcoded-questions: ok");
