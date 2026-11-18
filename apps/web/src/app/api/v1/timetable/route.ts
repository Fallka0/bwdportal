import { getTimetable } from "@bwd/db";
import { addDays, mondayOf } from "@bwd/shared";
import { z } from "zod";
import { apiError, withUser } from "@/lib/api";

const Q = z.object({ from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() });

/** Lektionen im Zeitraum. Ohne Angabe: die aktuelle Woche. Höchstens 42 Tage. */
export const GET = withUser(async ({ env, userId, req }) => {
  const p = Q.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!p.success) return apiError(422, "invalid", "Datum im Format JJJJ-MM-TT angeben.");
  const from = p.data.from ?? mondayOf(env.now.date);
  const to = p.data.to ?? addDays(from, 4);
  if (to < from || to > addDays(from, 42)) return apiError(422, "invalid", "Zeitraum ungültig.");
  return getTimetable(env.db, userId, from, to, env.now);
});
