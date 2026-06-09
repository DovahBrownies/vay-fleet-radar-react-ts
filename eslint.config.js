import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

const projectStyleRules = {
  "id-length": [
    "error",
    {
      min: 2,
      properties: "never",
      exceptionPatterns: ["^_"],
      exceptions: ["i", "j", "k", "t", "x", "y", "_"],
    },
  ],

  "no-restricted-imports": [
    "error",
    {
      patterns: [
        {
          group: ["../**"],
          message:
            "Use a path alias (@shared, @server, @app) instead of relative parent imports.",
        },
      ],
    },
  ],

  "padding-line-between-statements": [
    "error",
    { blankLine: "always", prev: "*", next: "return" },
    { blankLine: "always", prev: "multiline-block-like", next: "*" },
    { blankLine: "always", prev: "*", next: "multiline-block-like" },
  ],

  "@typescript-eslint/consistent-type-imports": [
    "error",
    { prefer: "type-imports" },
  ],

  "@typescript-eslint/no-unused-vars": [
    "error",
    {
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_",
      caughtErrorsIgnorePattern: "^_",
    },
  ],
};

export default defineConfig([
  globalIgnores(["dist", "node_modules"]),

  // Frontend
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: { globals: globals.browser },
    rules: projectStyleRules,
  },

  // Server
  {
    files: ["server/**/*.ts"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: { globals: globals.node },
    rules: projectStyleRules,
  },

  // Shared types
  {
    files: ["shared/**/*.ts"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    rules: projectStyleRules,
  },
]);
