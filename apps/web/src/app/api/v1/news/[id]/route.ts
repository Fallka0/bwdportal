import { getNewsArticle } from "@bwd/db";
import { apiError, withUser } from "@/lib/api";

export const GET = withUser(async ({ env, userId, req }) => {
  const id = decodeURIComponent(new URL(req.url).pathname.split("/").pop() ?? "");
  return (await getNewsArticle(env.db, userId, id, env.now)) ?? apiError(404, "not_found", "Diese Mitteilung gibt es nicht.");
});
