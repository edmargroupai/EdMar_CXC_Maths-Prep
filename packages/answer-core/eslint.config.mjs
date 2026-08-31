import tsParser from "@typescript-eslint/parser";
import { defineConfig, globalIgnores } from "eslint/config";
import { createEdmarBoundariesConfig } from "@edmar/config/eslint/boundaries.mjs";

export default defineConfig([
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
  },
  createEdmarBoundariesConfig(),
  globalIgnores(["coverage/**", "src/**/__tests__/**"]),
]);
