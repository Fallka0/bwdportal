// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  { ignores: ["dist/*", ".expo/*"] },
  // Unaufgelöste Importe prüft bereits TypeScript (pnpm typecheck).
  { rules: { "import/no-unresolved": "off" } },
]);
