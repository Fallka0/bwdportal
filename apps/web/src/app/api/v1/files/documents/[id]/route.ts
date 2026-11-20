import { getDocument } from "@bwd/db";
import { apiError, withUser } from "@/lib/api";
import { downloadHeaders, fileName, fileOrPlaceholder } from "@/lib/files";

/** Dokument aus R2 (oder Platzhalter in der Demo). ?inline=1 öffnet im Browser. */
export const GET = withUser(async ({ env, userId, req }) => {
  const url = new URL(req.url);
  const d = await getDocument(env.db, userId, decodeURIComponent(url.pathname.split("/").pop() ?? ""));
  if (!d) return apiError(404, "not_found", "Dieses Dokument gibt es nicht.");
  const f = await fileOrPlaceholder(env.files, d.r2Key, d.title, [d.grp, d.note ?? "", "Beispieldokument im bwd Portal (Schulprojekt)."].filter(Boolean));
  return new Response(f.body, { headers: downloadHeaders(fileName(d.title, d.fileType.toLowerCase()), f.type, url.searchParams.has("inline")) });
});
