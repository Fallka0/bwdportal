import { deleteAbsenceNotice, updateAbsenceNotice } from "@bwd/db";
import { AbsenceNoticeSubmit } from "@bwd/shared";
import { parseBody, withUser } from "@/lib/api";

const idOf = (req: Request) => decodeURIComponent(new URL(req.url).pathname.split("/").pop() ?? "");

/** Abmeldung ändern, solange ihre erste Lektion nicht begonnen hat. */
export const PATCH = withUser(async ({ env, userId, req }) => {
  const body = await parseBody(req, AbsenceNoticeSubmit);
  return updateAbsenceNotice(env.db, userId, idOf(req), body, env.now);
});

export const DELETE = withUser(async ({ env, userId, req }) => {
  await deleteAbsenceNotice(env.db, userId, idOf(req), env.now);
  return { ok: true };
});
