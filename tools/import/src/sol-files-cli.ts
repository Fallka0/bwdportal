/**
 * SOL-Dateien einer Klasse importieren, in zwei Schritten:
 *
 *   pnpm sol:files -- suggest --dir <ordner> --tasks .local/im24a-sol.json --out .local/sol-files-map.json
 *   (Zuordnung prüfen: "task" je Datei, "kind" task/material/solution, "name")
 *   pnpm sol:files -- import --dir <ordner> --map .local/sol-files-map.json [--class c-im24a] [--remote]
 *
 * Der Import legt jede Datei im Original in R2 ab, Word und PowerPoint zusätzlich als PDF (LibreOffice), und ersetzt die Dateien
 * der betroffenen Aufträge in D1. Dateien mit "task": null werden übersprungen.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { parseArgs } from "node:util";
import { convertible, extOf, solFileKey, solFilesSql, suggestMapping, type Imported, type MapEntry } from "./sol-files";
import type { SolInput } from "./sol";

const args = process.argv.slice(2).filter((a) => a !== "--");
const mode = args[0];
const { values } = parseArgs({
  args: args.slice(1),
  options: {
    dir: { type: "string" },
    tasks: { type: "string" },
    out: { type: "string" },
    map: { type: "string" },
    class: { type: "string", default: "c-im24a" },
    remote: { type: "boolean", default: false },
  },
});

if ((mode !== "suggest" && mode !== "import") || !values.dir) {
  console.error("Aufruf: sol:files -- suggest --dir <ordner> --tasks <sol.json> --out <map.json>  |  import --dir <ordner> --map <map.json> [--remote]");
  process.exit(2);
}
const dir = resolve(values.dir);

function walk(d: string): string[] {
  return readdirSync(d).flatMap((n) => {
    const p = join(d, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

if (mode === "suggest") {
  if (!values.tasks || !values.out) {
    console.error("--tasks und --out fehlen");
    process.exit(2);
  }
  const input = JSON.parse(readFileSync(resolve(values.tasks), "utf8")) as SolInput;
  const map = suggestMapping(
    walk(dir).map((p) => relative(dir, p)),
    input.tasks,
  );
  writeFileSync(resolve(values.out), JSON.stringify(map, null, 2) + "\n");
  const open = map.filter((m) => !m.task);
  const covered = new Set(map.filter((m) => m.task && m.kind === "task").map((m) => m.task));
  console.log(`${map.length} Dateien, ${open.length} ohne Auftrag. Aufträge ohne Hauptdatei: ${input.tasks.filter((t) => !covered.has(`${t.subject} ${t.code}`)).map((t) => `${t.subject} ${t.code}`).join(", ") || "keine"}`);
  process.exit(0);
}

if (!values.map) {
  console.error("--map fehlt");
  process.exit(2);
}
const classId = values.class!;
const web = resolve(import.meta.dirname, "../../../apps/web");
const where = values.remote ? "--remote" : "--local";
const map = (JSON.parse(readFileSync(resolve(values.map), "utf8")) as MapEntry[]).filter((m): m is MapEntry & { task: string } => !!m.task);
const soffice = ["/Applications/LibreOffice.app/Contents/MacOS/soffice", "soffice"].find((p) => p === "soffice" || existsSync(p))!;
const tmp = mkdtempSync(join(tmpdir(), "bwd-solfiles-"));
const put = (key: string, file: string, type: string) =>
  execFileSync("npx", ["wrangler", "r2", "object", "put", `bwd-portal-files/${key}`, `--file=${file}`, `--content-type=${type}`, where], { cwd: web, stdio: "pipe" });

const TYPES: Record<string, string> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  pdf: "application/pdf",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};
const counter = new Map<string, number>();
const done: Imported[] = [];
for (const m of map) {
  const src = join(dir, m.file);
  if (!existsSync(src)) {
    console.warn(`fehlt: ${m.file}`);
    continue;
  }
  const n = (counter.get(m.task) ?? 0) + 1;
  counter.set(m.task, n);
  const ext = extOf(m.file);
  let pdf = false;
  if (convertible(ext)) {
    // Eigener Ordner pro Datei, damit gleich benannte PDFs sich nicht überschreiben
    const out = mkdtempSync(join(tmp, "f-"));
    try {
      execFileSync(soffice, ["--headless", "--convert-to", "pdf", "--outdir", out, src], { stdio: "pipe", timeout: 180_000 });
      const made = readdirSync(out).find((x) => x.endsWith(".pdf"));
      if (made) {
        put(solFileKey(classId, m.task, n, "as.pdf"), join(out, made), "application/pdf");
        pdf = true;
      }
    } catch (e) {
      console.warn(`PDF fehlgeschlagen: ${m.file} (${(e as Error).message.split("\n")[0]})`);
    }
  }
  put(solFileKey(classId, m.task, n, ext), src, TYPES[ext] ?? "application/octet-stream");
  done.push({ ...m, n, ext, bytes: statSync(src).size, pdf });
  console.log(`${m.task} ${m.kind}: ${m.name}.${ext}${convertible(ext) && !pdf ? " (ohne PDF)" : ""}`);
}

const sqlFile = join(tmp, "sol-files.sql");
writeFileSync(sqlFile, solFilesSql(classId, done).join("\n") + "\n");
execFileSync("npx", ["wrangler", "d1", "execute", "DB", where, `--file=${sqlFile}`, "--yes"], { cwd: web, stdio: "pipe" });
console.log(`${done.length} Dateien für ${counter.size} Aufträge (${done.filter((d) => d.pdf).length} als PDF)${values.remote ? " (remote)" : " (lokal)"}.`);
