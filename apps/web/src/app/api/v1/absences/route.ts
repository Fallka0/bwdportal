import { getAbsences, submitAbsence } from "@bwd/db";
import { AbsenceSubmit } from "@bwd/shared";
import { apiError, json, parseBody, withUser } from "@/lib/api";

export const GET = withUser(({ env, userId }) => getAbsences(env.db, userId));

/** Absenz entschuldigen oder neu melden. Anhang vorher über /absences/attachment hochladen. */
export const POST = withUser(async ({ env, userId, req }) => {
  const body = await parseBody(req, AbsenceSubmit);
  if (body.attachmentKey && !body.attachmentKey.startsWith(`absenzen/${userId}/`)) return apiError(403, "forbidden", "Dieser Anhang gehört nicht zu dir.", "attachmentKey");
  return json(await submitAbsence(env.db, userId, body, env.now), 201);
});
