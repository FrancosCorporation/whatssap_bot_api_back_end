import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.node, // <- aqui troca de 'browser' para 'node'
    },
    plugins: { js },
    rules: {
      ...js.configs.recommended.rules,
    },
  },
]);
