import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const depPattern =
  /@anthropic-ai\/|"openai"|@google\/generative-ai|mathjax|sympy|"llm"|claude|gpt-/i;
const sourcePattern =
  /@anthropic-ai\/|from ['"]openai['"]|from ['"]@google\/generative-ai|mathjax|sympy|\/llm|gpt-|claude|openai/i;

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === ".next") continue;
      walk(full, acc);
    } else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(name)) {
      acc.push(full);
    }
  }
  return acc;
}

let fail = 0;
for (const app of ["apps/web", "apps/mobile"]) {
  const pkg = join(app, "package.json");
  if (existsSync(pkg) && depPattern.test(readFileSync(pkg, "utf8"))) {
    console.error(`check-no-ai-in-client: forbidden dependency in ${pkg}`);
    fail = 1;
  }
  for (const file of walk(app)) {
    if (sourcePattern.test(readFileSync(file, "utf8"))) {
      console.error(`check-no-ai-in-client: forbidden import in ${file}`);
      fail = 1;
    }
  }
}

if (fail) process.exit(1);
console.log("check-no-ai-in-client: ok");
