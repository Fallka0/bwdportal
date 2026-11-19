import { submitAbsenceNotice } from "@bwd/db";
import { AbsenceNoticeSubmit } from "@bwd/shared";
import { json, parseBody, withUser } from "@/lib/api";

/** Abmeldung im Voraus erfassen (von Lektion bis Lektion). */
export const POST = withUser(async ({ env, userId, req }) => {
  const body = await parseBody(req, AbsenceNoticeSubmit);
  return json(await submitAbsenceNotice(env.db, userId, body, env.now), 201);
});
