import { randomId } from "@bwd/db";
import { apiError, withUser } from "@/lib/api";

export const MAX_BYTES = 5 * 1024 * 1024;
const TYPES: Record<string, string> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png" };

/** Bestätigung (Arztzeugnis) hochladen. Ablage in R2 unter absenzen/<person>/. Danach den Schlüssel bei POST /absences mitgeben. */
export const POST = withUser(async ({ env, userId, req }) => {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return apiError(422, "invalid", "Datei fehlt.", "file");
  const ext = TYPES[file.type];
  if (!ext) return apiError(422, "invalid_type", "Nur PDF, JPG oder PNG.", "file");
  if (file.size > MAX_BYTES) return apiError(422, "too_large", "Die Datei ist grösser als 5 MB.", "file");
  const key = `absenzen/${userId}/${randomId(12)}.${ext}`;
  await env.files.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type }, customMetadata: { name: file.name.slice(0, 120) } });
  return { key };
});
