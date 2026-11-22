import { DomainError, getTeacherHome, userById } from "@bwd/db";
import { withUser } from "@/lib/api";

/** Übersicht einer Lehrperson (App). Lernende nutzen /api/v1/home. */
export const GET = withUser(async ({ env, userId }) => {
  if ((await userById(env.db, userId))?.role !== "teacher") throw new DomainError("forbidden", "Nur für Lehrpersonen.");
  return getTeacherHome(env.db, userId, env.now);
});
