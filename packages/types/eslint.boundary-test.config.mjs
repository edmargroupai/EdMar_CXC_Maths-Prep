import tsParser from "@typescript-eslint/parser";
import { defineConfig } from "eslint/config";
import { createEdmarBoundariesConfig } from "@edmar/config/eslint/boundaries.mjs";

/** Lint config for the packages → apps violation fixture only. */
export default defineConfig([
  {
    files: ["src/__fixtures__/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
  },
  createEdmarBoundariesConfig({ files: ["src/__fixtures__/**/*.ts"] }),
]);
