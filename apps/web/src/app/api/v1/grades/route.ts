import { getGrades } from "@bwd/db";
import { withUser } from "@/lib/api";

export const GET = withUser(({ env, userId, req }) => {
  const sem = Number(new URL(req.url).searchParams.get("semester") ?? 1);
  return getGrades(env.db, userId, sem === 2 ? 2 : 1);
});
