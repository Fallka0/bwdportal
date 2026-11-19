// Schreibt packages/db/seed/seed.sql aus den Fixtures. Danach: pnpm db:reset (lokales D1 neu aufsetzen).
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { seedSql } from "../src/seed/build";

const out = resolve(import.meta.dirname, "../seed/seed.sql");
const sql = seedSql();
writeFileSync(out, sql);
console.log(`seed.sql geschrieben: ${sql.split("\n").filter((l) => l.startsWith("INSERT")).length} Zeilen`);
