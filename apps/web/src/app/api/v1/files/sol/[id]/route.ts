import { schema } from "@bwd/db";
import { eq } from "drizzle-orm";
import { apiError, withUser } from "@/lib/api";
import { downloadHeaders, fileName, fileOrPlaceholder } from "@/lib/files";

/** Auftrag der Beispieldaten als PDF (Platzhalter). Echte Dateien laufen über /files/sol-file. ?inline=1 öffnet im Browser. */
export const GET = withUser(async ({ env, req }) => {
  const url = new URL(req.url);
  const id = decodeURIComponent(url.pathname.split("/").pop() ?? "");
  const t = (await env.db.select().from(schema.solTasks).where(eq(schema.solTasks.id, id)).limit(1))[0];
  if (!t) return apiError(404, "not_found", "Diesen Auftrag gibt es nicht.");
  const f = await fileOrPlaceholder(env.files, t.r2Key, `SOL ${t.subjectCode} ${t.code}: ${t.title}`, [`Bearbeitungszeit: ${t.minutes} Minuten`, "Beispieldokument im bwd Portal (Schulprojekt)."]);
  return new Response(f.body, { headers: downloadHeaders(fileName(`${t.subjectCode} ${t.code} ${t.title}`, "pdf"), f.type, url.searchParams.has("inline")) });
});
