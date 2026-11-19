import { calendarEvents, userByCalendarToken } from "@bwd/db";
import { buildIcs } from "@bwd/shared";
import { serverEnv } from "@/lib/env";

/**
 * Kalender-Abo im iCalendar-Format. Ohne Anmeldung: der Token im Pfad ist das Geheimnis.
 * Kalender-Apps holen den Stand etwa stündlich neu.
 */
export async function GET(req: Request) {
  const file = decodeURIComponent(new URL(req.url).pathname.split("/").pop() ?? "");
  const token = file.replace(/\.ics$/, "");
  const env = await serverEnv();
  const userId = /^[0-9a-f]{48}$/.test(token) ? await userByCalendarToken(env.db, token) : null;
  if (!userId) return new Response("Diesen Kalender gibt es nicht.", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const ics = buildIcs({ name: "bwd Portal", events: await calendarEvents(env.db, userId, env.now), stamp });
  return new Response(ics, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": 'inline; filename="bwd-portal.ics"',
      "cache-control": "private, max-age=900",
    },
  });
}
