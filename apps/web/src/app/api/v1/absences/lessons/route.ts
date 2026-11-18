import { lessonsForAbsence } from "@bwd/db";
import { apiError, withUser } from "@/lib/api";

export const GET = withUser(async ({ env, userId, req }) => {
  const date = new URL(req.url).searchParams.get("date") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return apiError(422, "invalid", "Datum fehlt.", "date");
  return { lessons: await lessonsForAbsence(env.db, userId, date) };
});
