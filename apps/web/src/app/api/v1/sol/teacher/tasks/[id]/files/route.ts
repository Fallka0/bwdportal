import { addSolTaskFile, randomId, solUploadTarget } from "@bwd/db";
import { SolFileKind } from "@bwd/shared";
import { apiError, json, withUser } from "@/lib/api";

const MAX_BYTES = 50 * 1024 * 1024;
const TYPES: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

/** Datei zu einem SOL-Auftrag (Formular: file, kind = task, material oder solution). */
export const POST = withUser(async ({ env, userId, req }) => {
  const parts = new URL(req.url).pathname.split("/");
  const taskId = decodeURIComponent(parts[parts.length - 2] ?? "");
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const kind = SolFileKind.safeParse(form?.get("kind"));
  if (!(file instanceof File)) return apiError(422, "invalid", "Datei fehlt.", "file");
  if (!kind.success) return apiError(422, "invalid", "Art der Datei fehlt.", "kind");
  const ext = (/\.([a-z0-9]{1,5})$/i.exec(file.name)?.[1] ?? "").toLowerCase();
  const mime = TYPES[ext];
  if (!mime) return apiError(422, "invalid_type", "Erlaubt sind PDF, Word, PowerPoint, Excel, MP3, MP4 und Bilder.", "file");
  if (file.size > MAX_BYTES) return apiError(422, "too_large", "Die Datei ist grösser als 50 MB.", "file");
  const classId = await solUploadTarget(env.db, userId, taskId);
  const key = `sol/${classId}/${randomId(12)}.${ext}`;
  await env.files.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: mime } });
  return json(await addSolTaskFile(env.db, userId, taskId, { kind: kind.data, name: file.name.replace(/\.[^.]+$/, ""), ext: ext === "jpeg" ? "jpg" : ext, key, bytes: file.size }), 201);
});
