import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "src"),
      // server-only wirft ausserhalb von React Server Components; in Tests ein leeres Modul.
      "server-only": resolve(import.meta.dirname, "src/test/empty.ts"),
    },
  },
  test: { include: ["src/**/*.test.ts"] },
});
