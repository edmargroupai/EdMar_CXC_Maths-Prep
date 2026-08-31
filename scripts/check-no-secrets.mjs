import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const pattern =
  /SUPABASE_SERVICE_ROLE_KEY|service_role|sk-ant-|sk-proj-|-----BEGIN PRIVATE KEY-----|"role"\s*:\s*"service_role"/;

function excluded(file) {
  return (
    file === ".env.example" ||
    file === "supabase/config.toml" ||
    file.startsWith("supabase/functions/") ||
    file.startsWith("supabase/migrations/") ||
    file.startsWith("docs/") ||
    file.startsWith("scripts/check-") ||
    file.startsWith(".cursor/")
  );
}

const files = execFileSync("git", ["ls-files", "-co", "--exclude-standard"], {
  encoding: "utf8",
})
  .split(/\r?\n/)
  .filter(Boolean);

let hits = 0;
for (const file of files) {
  if (excluded(file)) continue;
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  if (pattern.test(text)) {
    console.error(`check-no-secrets: forbidden secret material in ${file}`);
    hits = 1;
  }
}

if (hits) process.exit(1);
console.log("check-no-secrets: ok");
