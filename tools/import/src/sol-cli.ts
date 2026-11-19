/**
 * SOL-Import: pnpm sol:import -- --file .local/im24a-sol.json [--remote] [--dry-run]
 * Schreibt Blöcke, SOL-Tage, Aufträge, Präsenzen und Fach-Lehrpersonen einer Klasse per wrangler in D1.
 * Die Fächer müssen in D1 existieren (kommen mit dem Stundenplan-Import).
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { solSql, type SolInput } from "./sol";

const { values } = parseArgs({
  args: process.argv.slice(2).filter((a) => a !== "--"),
  options: {
    file: { type: "string" },
    remote: { type: "boolean", default: false },
    "dry-run": { type: "boolean", default: false },
  },
});

if (!values.file) {
  console.error("--file fehlt (JSON mit den SOL-Daten)");
  process.exit(2);
}
const input = JSON.parse(readFileSync(resolve(values.file), "utf8")) as SolInput;
const statements = solSql(input);
if (values["dry-run"]) {
  console.log(statements.join("\n"));
} else {
  const dir = mkdtempSync(join(tmpdir(), "bwd-sol-"));
  const file = join(dir, "sol.sql");
  writeFileSync(file, statements.join("\n") + "\n");
  execFileSync("npx", ["wrangler", "d1", "execute", "DB", values.remote ? "--remote" : "--local", `--file=${file}`, "--yes"], { cwd: resolve(import.meta.dirname, "../../../apps/web"), stdio: "inherit" });
}
console.log(`SOL ${input.classId}: ${input.blocks.length} Blöcke, ${input.tasks.length} Aufträge, ${input.presence.length} Präsenzen${values.remote ? " (remote)" : values["dry-run"] ? " (nur angezeigt)" : " (lokal)"}.`);
