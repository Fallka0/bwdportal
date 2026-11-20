import { schema } from "@bwd/db";
import { eq } from "drizzle-orm";
import { apiError, withUser } from "@/lib/api";
import { downloadHeaders, fileName } from "@/lib/files";

const TYPES: Record<string, string> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

/**
 * Datei eines SOL-Auftrags: das Original, mit ?format=pdf die PDF-Fassung (Word, PowerPoint).
 * PDF, Audio, Video und Bilder öffnen im Browser, alles andere wird heruntergeladen. Grosse Dateien werden gestreamt.
 */
export const GET = withUser(async ({ env, req }) => {
  const url = new URL(req.url);
  const id = decodeURIComponent(url.pathname.split("/").pop() ?? "");
  const f = (await env.db.select().from(schema.solTaskFiles).where(eq(schema.solTaskFiles.id, id)).limit(1))[0];
  if (!f) return apiError(404, "not_found", "Diese Datei gibt es nicht.");
  const asPdf = url.searchParams.get("format") === "pdf" && !!f.pdfKey;
  const ext = asPdf ? "pdf" : f.ext;
  const obj = await env.files.get(asPdf ? f.pdfKey! : f.key).catch(() => null);
  if (!obj) return apiError(404, "not_found", "Diese Datei gibt es nicht.");
  const type = TYPES[ext] ?? "application/octet-stream";
  const inline = /^(application\/pdf|audio|video|image)/.test(type);
  return new Response(obj.body as unknown as BodyInit, { headers: { ...downloadHeaders(fileName(f.name, ext), type, inline), "content-length": String(obj.size) } });
});
