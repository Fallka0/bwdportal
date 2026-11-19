import { submitDispensation } from "@bwd/db";
import { DispensationSubmit } from "@bwd/shared";
import { apiError, json, parseBody, withUser } from "@/lib/api";

/** Dispensationsgesuch einreichen. Anhänge vorher über /absences/attachment hochladen (höchstens zwei). */
export const POST = withUser(async ({ env, userId, req }) => {
  const body = await parseBody(req, DispensationSubmit);
  if (body.attachmentKeys?.some((k) => !k.startsWith(`absenzen/${userId}/`))) return apiError(403, "forbidden", "Dieser Anhang gehört nicht zu dir.", "attachmentKeys");
  return json(await submitDispensation(env.db, userId, body, env.now), 201);
});
