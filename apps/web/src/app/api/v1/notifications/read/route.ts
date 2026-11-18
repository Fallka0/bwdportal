import { markNotificationsRead } from "@bwd/db";
import { withUser } from "@/lib/api";

/** Alle als gelesen markieren (oder nur ids aus dem Body). */
export const POST = withUser(async ({ env, userId, req }) => {
  const body = (await req.json().catch(() => ({}))) as { ids?: unknown };
  const ids = Array.isArray(body.ids) ? body.ids.filter((x): x is string => typeof x === "string") : undefined;
  await markNotificationsRead(env.db, userId, env.now, ids);
  return { ok: true };
});
