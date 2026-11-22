import { addClassFile, classroomUploadTarget, randomId } from "@bwd/db";
import { apiError, json, withUser } from "@/lib/api";

const MAX_BYTES = 20 * 1024 * 1024;
const TYPES: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  odt: "application/vnd.oasis.opendocument.text",
  ods: "application/vnd.oasis.opendocument.spreadsheet",
  odp: "application/vnd.oasis.opendocument.presentation",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  txt: "text/plain",
  zip: "application/zip",
};

/** Datei in den Klassenraum hochladen (Formular: file, classCode, subject leer = ganze Klasse). */
export const POST = withUser(async ({ env, userId, req }) => {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const classCode = String(form?.get("classCode") ?? "");
  const subject = String(form?.get("subject") ?? "") || null;
  if (!(file instanceof File)) return apiError(422, "invalid", "Datei fehlt.", "file");
  const ext = (/\.([a-z0-9]{1,5})$/i.exec(file.name)?.[1] ?? "").toLowerCase();
  const mime = TYPES[ext];
  if (!mime) return apiError(422, "invalid_type", "Erlaubt sind PDF, Word, Excel, PowerPoint, OpenDocument, Bilder, Text und ZIP.", "file");
  if (file.size > MAX_BYTES) return apiError(422, "too_large", "Die Datei ist grösser als 20 MB.", "file");
  const classId = await classroomUploadTarget(env.db, userId, classCode, subject);
  const key = `klassenraum/${classId}/${randomId(12)}.${ext}`;
  await env.files.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: mime } });
  return json(await addClassFile(env.db, userId, { classCode, subject, name: file.name, ext: ext === "jpeg" ? "jpg" : ext, mime, bytes: file.size, r2Key: key }, env.now), 201);
});
