/**
 * Stundenplan-Import: pnpm timetable:import --source webuntis|ical|file|mock [--file lektionen.json] [--class c-im24a] [--from 2026-10-26 --to 2026-11-20] [--remote] [--dry-run]
 * Holt Lektionen aus der Quelle und schreibt sie per wrangler in D1 (lokal, oder mit --remote ins Deployment).
 * Zugangsdaten nur in tools/import/.env.local. Das Portal selbst speichert keine WebUntis-Passwörter.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { CLASS_ID } from "@bwd/db";
import { addDays, getNow, mondayOf } from "@bwd/shared";
import { SOURCES } from "./sources";
import { failedRunSql, importSql } from "./sql";

const { values } = parseArgs({
  // pnpm reicht ein "--" durch: weglassen
  args: process.argv.slice(2).filter((a) => a !== "--"),
  options: {
    source: { type: "string", default: "mock" },
    from: { type: "string" },
    to: { type: "string" },
    class: { type: "string", default: CLASS_ID },
    file: { type: "string" },
    remote: { type: "boolean", default: false },
    "dry-run": { type: "boolean", default: false },
  },
});

const source = SOURCES[values.source as keyof typeof SOURCES];
if (!source) {
  console.error(`Unbekannte Quelle: ${values.source}. Möglich: ${Object.keys(SOURCES).join(", ")}`);
  process.exit(2);
}

if (values.file) process.env.TIMETABLE_FILE = resolve(values.file);

const now = getNow(process.env.DEMO_NOW);
const from = values.from ?? mondayOf(now.date);
const to = values.to ?? addDays(from, 4 * 7 - 3);
const runId = `run-${source.name}-${Date.now()}`;

function apply(statements: string[]) {
  if (values["dry-run"]) {
    console.log(statements.join("\n"));
    return;
  }
  const dir = mkdtempSync(join(tmpdir(), "bwd-import-"));
  const file = join(dir, "import.sql");
  writeFileSync(file, statements.join("\n") + "\n");
  const web = resolve(import.meta.dirname, "../../../apps/web");
  execFileSync("npx", ["wrangler", "d1", "execute", "DB", values.remote ? "--remote" : "--local", `--file=${file}`, "--yes"], { cwd: web, stdio: "inherit" });
}

console.log(`Import aus ${source.name}: ${from} bis ${to}, Klasse ${values.class}${values.remote ? " (remote)" : " (lokal)"}`);
try {
  const lessons = await source.fetchLessons({ from, to });
  apply(importSql({ classId: values.class!, source: source.name, range: { from, to }, lessons, runId, startedAt: now.stamp, finishedAt: getNow(process.env.DEMO_NOW).stamp }));
  console.log(`${lessons.length} Lektionen geschrieben.`);
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e);
  console.error(`Import fehlgeschlagen: ${msg}`);
  apply(failedRunSql({ source: source.name, runId, startedAt: now.stamp, error: msg }));
  process.exit(1);
}
