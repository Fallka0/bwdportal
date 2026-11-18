import { defineConfig } from "drizzle-kit";

// Migrationen werden mit drizzle-kit erzeugt und mit wrangler (d1 migrations apply) angewendet.
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/schema.ts",
  out: "./migrations",
});
