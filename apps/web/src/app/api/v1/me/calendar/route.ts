import { calendarToken, resetCalendarToken } from "@bwd/db";
import { withUser } from "@/lib/api";
import { calendarUrls } from "@/lib/calendar";

/** Link fürs Kalender-Abo (wird beim ersten Mal erstellt). */
export const GET = withUser(async ({ env, userId, req }) => calendarUrls(new URL(req.url).origin, await calendarToken(env.db, userId, env.now)));

/** Neuen Link erstellen: der alte funktioniert danach nicht mehr. */
export const POST = withUser(async ({ env, userId, req }) => calendarUrls(new URL(req.url).origin, await resetCalendarToken(env.db, userId, env.now)));
