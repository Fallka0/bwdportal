// Gemeinsame ESLint-Konfiguration für packages/* und tools/*. Web und App haben eigene (Next, Expo).
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["**/node_modules/**", "**/dist/**", "**/migrations/**", "**/*.gen.ts"] },
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
);
