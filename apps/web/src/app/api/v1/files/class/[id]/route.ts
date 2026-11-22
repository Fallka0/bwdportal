import { classFileForDownload } from "@bwd/db";
import { apiError, withUser } from "@/lib/api";
import { downloadHeaders } from "@/lib/files";

/** Datei aus dem Klassenraum (nur wer den Klassenraum lesen darf). ?inline=1 öffnet im Browser. */
export const GET = withUser(async ({ env, userId, req }) => {
  const url = new URL(req.url);
  const f = await classFileForDownload(env.db, userId, decodeURIComponent(url.pathname.split("/").pop() ?? ""));
  const obj = f ? await env.files.get(f.r2Key).catch(() => null) : null;
  if (!f || !obj) return apiError(404, "not_found", "Diese Datei gibt es nicht.");
  return new Response(obj.body as unknown as BodyInit, { headers: downloadHeaders(f.name, f.mime, url.searchParams.has("inline") && (f.ext === "pdf" || f.ext === "png" || f.ext === "jpg")) });
});
