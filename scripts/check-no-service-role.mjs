import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === ".next") continue;
      walk(full, acc);
    } else if (/\.(ts|tsx|js|jsx)$/.test(name)) {
      acc.push(full.replace(/\\/g, "/"));
    }
  }
  return acc;
}

let fail = 0;
if (existsSync("apps/mobile")) {
  for (const file of walk("apps/mobile")) {
    if (readFileSync(file, "utf8").includes("service_role")) {
      console.error("check-no-service-role: service_role must not appear in apps/mobile");
      fail = 1;
    }
  }
}

if (existsSync("apps/admin")) {
  for (const file of walk("apps/admin")) {
    if (
      file.startsWith("apps/admin/app/api/") ||
      file.startsWith("apps/admin/src/server/")
    ) {
      continue;
    }
    if (readFileSync(file, "utf8").includes("service_role")) {
      console.error(`check-no-service-role: ${file} is not an allowed admin server path`);
      fail = 1;
    }
  }
}

if (fail) process.exit(1);
console.log("check-no-service-role: ok");
