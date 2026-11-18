import { getAbsences, submitAbsence } from "@bwd/db";
import { AbsenceSubmit } from "@bwd/shared";
import { json, parseBody, withUser } from "@/lib/api";

export const GET = withUser(({ env, userId }) => getAbsences(env.db, userId));

/** Absenz entschuldigen oder neu melden. Anhang vorher über /absences/attachment hochladen. */
export const POST = withUser(async ({ env, userId, req }) => json(await submitAbsence(env.db, userId, await parseBody(req, AbsenceSubmit), env.now), 201));
