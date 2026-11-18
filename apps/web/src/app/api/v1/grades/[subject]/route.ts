import { getSubjectGrades } from "@bwd/db";
import { apiError, withUser } from "@/lib/api";

export const GET = withUser(async ({ env, userId, req }) => {
  const code = decodeURIComponent(new URL(req.url).pathname.split("/").pop() ?? "").toUpperCase();
  const r = await getSubjectGrades(env.db, userId, code);
  return r ?? apiError(404, "not_found", "Dieses Fach gibt es nicht.");
});
