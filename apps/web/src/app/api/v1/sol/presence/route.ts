import { getSolCalendar } from "@bwd/db";
import { withUser } from "@/lib/api";

/** Lehrpersonen am SOL-Tag. */
export const GET = withUser(async ({ env, userId, req }) => {
  const c = await getSolCalendar(env.db, userId, env.now, new URL(req.url).searchParams.get("day") ?? undefined);
  return { day: c.day, presence: c.presence };
});
