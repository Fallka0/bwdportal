import { getSolTasks, schema } from "@bwd/db";
import { inArray } from "drizzle-orm";
import { apiError, withUser } from "@/lib/api";
import { downloadHeaders, fileName, placeholderPdf, zip } from "@/lib/files";

const FOLDER = { task: "", material: "Unterlagen/", solution: "Lösungen/" } as const;

/** Audio und Video bleiben draussen (zu gross für ein ZIP), sie gibt es einzeln. */
const MEDIA = /^(mp3|m4a|wav|mp4|mov|m4v)$/i;

/**
 * Alle Aufträge eines Blocks als ZIP: pro Fach und Auftrag ein Ordner mit dem Auftrag (Original und PDF),
 * Unterlagen und Lösungen im Original. Aufträge ohne Dateien (Beispieldaten) bekommen ein Platzhalter-PDF.
 */
export const GET = withUser(async ({ env, userId, req }) => {
  const n = Number(new URL(req.url).pathname.split("/").pop());
  const t = await getSolTasks(env.db, userId, env.now, n);
  if (!t.block) return apiError(404, "not_found", "Diesen Block gibt es nicht.");
  const ids = t.groups.flatMap((g) => g.tasks.map((x) => x.id));
  const rows = ids.length ? await env.db.select().from(schema.solTaskFiles).where(inArray(schema.solTaskFiles.taskId, ids)) : [];
  const read = async (key: string | null) => {
    const obj = key ? await env.files.get(key).catch(() => null) : null;
    return obj ? new Uint8Array(await obj.arrayBuffer()) : null;
  };
  const files: { name: string; data: Uint8Array }[] = [];
  for (const g of t.groups) {
    for (const task of g.tasks) {
      const dir = `${g.subject.name}/${fileName(`${task.code} ${task.title}`, "x").slice(0, -2)}/`;
      const mine = rows.filter((r) => r.taskId === task.id);
      if (!mine.length) {
        files.push({ name: `${dir}${fileName(task.title, "pdf")}`, data: placeholderPdf(`SOL ${g.subject.name} ${task.code}: ${task.title}`, [`Bearbeitungszeit: ${task.minutes} Minuten`]) });
        continue;
      }
      for (const f of mine) {
        if (MEDIA.test(f.ext)) continue;
        const base = `${dir}${FOLDER[f.kind]}${fileName(f.name, "x").slice(0, -2)}`;
        const original = await read(f.key);
        if (original) files.push({ name: `${base}.${f.ext}`, data: original });
        if (f.kind === "task" && f.pdfKey) {
          const pdf = await read(f.pdfKey);
          if (pdf) files.push({ name: `${base}.pdf`, data: pdf });
        }
      }
    }
  }
  return new Response(zip(files), { headers: downloadHeaders(`SOL Block ${n}.zip`, "application/zip", false) });
});
