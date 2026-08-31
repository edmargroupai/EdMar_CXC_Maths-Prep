import path from "node:path";
import { fileURLToPath } from "node:url";
import boundaries from "eslint-plugin-boundaries";
import { edmarIgnores } from "../eslint.preset.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

/** Monorepo element types for eslint-plugin-boundaries (§2.2). */
export const edmarBoundaryElements = [
  { type: "app", pattern: "apps/*", mode: "folder", capture: ["appName"] },
  { type: "package", pattern: "packages/*", mode: "folder", capture: ["packageName"] },
];

/** Allowed dependency edges between element types. */
export const edmarBoundaryRules = [
  { from: ["package"], allow: ["package"] },
  { from: ["app"], allow: ["package", "app"] },
];

export function createEdmarBoundariesConfig({ files = ["**/*.{ts,tsx,js,jsx,mjs}"] } = {}) {
  return {
    files,
    plugins: { boundaries },
    settings: {
      "boundaries/root-path": repoRoot,
      "boundaries/elements": edmarBoundaryElements,
      "boundaries/include": ["apps/**/*", "packages/**/*"],
      "boundaries/ignore": edmarIgnores,
    },
    rules: {
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          rules: edmarBoundaryRules,
        },
      ],
    },
  };
}
