import { getAttendanceSheet, saveAttendance } from "@bwd/db";
import { AttendanceInput } from "@bwd/shared";
import { parseBody, withUser } from "@/lib/api";

const idOf = (req: Request) => decodeURIComponent(new URL(req.url).pathname.split("/").pop() ?? "");

/** Klassenliste einer Lektion mit Stand der Präsenz. */
export const GET = withUser(({ env, userId, req }) => getAttendanceSheet(env.db, userId, idOf(req), env.now));

/** Präsenz speichern: Liste der Fehlenden (alle anderen anwesend). */
export const PUT = withUser(async ({ env, userId, req }) => saveAttendance(env.db, userId, idOf(req), (await parseBody(req, AttendanceInput)).absent, env.now));
