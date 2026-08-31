import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const typesPkg = path.join(root, "packages", "types");
const fixture = "src/__fixtures__/imports-app.ts";

try {
  execSync(`pnpm exec eslint -c eslint.boundary-test.config.mjs ${fixture}`, {
    cwd: typesPkg,
    stdio: "pipe",
    encoding: "utf8",
  });
  console.error("FAIL: expected eslint to reject packages → apps import");
  process.exit(1);
} catch (error) {
  const output = `${error.stdout ?? ""}${error.stderr ?? ""}`;
  if (!output.includes("boundaries/element-types")) {
    console.error("FAIL: eslint failed but not for boundaries/element-types");
    console.error(output);
    process.exit(1);
  }
  console.log("PASS: eslint-plugin-boundaries rejects packages → apps import");
}
