import { getPortfolioSemester } from "@bwd/db";
import { withUser } from "@/lib/api";

/** Ein BM-Semester des Notenportfolios (?semester=1 bis 6, sonst das laufende). */
export const GET = withUser(({ env, userId, req }) => {
  const n = Number(new URL(req.url).searchParams.get("semester") ?? 0);
  return getPortfolioSemester(env.db, userId, env.now, n || undefined);
});
