import { deleteDispensation, updateDispensation } from "@bwd/db";
import { DispensationSubmit } from "@bwd/shared";
import { apiError, parseBody, withUser } from "@/lib/api";

const idOf = (req: Request) => decodeURIComponent(new URL(req.url).pathname.split("/").pop() ?? "");

/** Gesuch ändern, solange es eingereicht ist. Ersetzte Anhänge werden aus R2 gelöscht. */
export const PATCH = withUser(async ({ env, userId, req }) => {
  const body = await parseBody(req, DispensationSubmit);
  if (body.attachmentKeys?.some((k) => !k.startsWith(`absenzen/${userId}/`))) return apiError(403, "forbidden", "Dieser Anhang gehört nicht zu dir.", "attachmentKeys");
  const r = await updateDispensation(env.db, userId, idOf(req), body, env.now);
  if (r.removedKeys.length) await env.files.delete(r.removedKeys);
  return r.dispensation;
});

/** Gesuch zurückziehen, solange es eingereicht ist. */
export const DELETE = withUser(async ({ env, userId, req }) => {
  const keys = await deleteDispensation(env.db, userId, idOf(req));
  if (keys.length) await env.files.delete(keys);
  return { ok: true };
});
