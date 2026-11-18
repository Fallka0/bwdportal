import { addSolPlan, deleteSolPlan, getSolCalendar } from "@bwd/db";
import { SolPlanCreate } from "@bwd/shared";
import { apiError, json, parseBody, withUser } from "@/lib/api";

/** Kalender eines SOL-Tags: Mein Plan und Präsenz der Lehrpersonen. */
export const GET = withUser(({ env, userId, req }) => getSolCalendar(env.db, userId, env.now, new URL(req.url).searchParams.get("day") ?? undefined));

export const POST = withUser(async ({ env, userId, req }) => json({ id: await addSolPlan(env.db, userId, await parseBody(req, SolPlanCreate)) }, 201));

export const DELETE = withUser(async ({ env, userId, req }) => {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return apiError(422, "invalid", "ID fehlt.", "id");
  await deleteSolPlan(env.db, userId, id);
  return { ok: true };
});
