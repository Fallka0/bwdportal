import { getSolTasks } from "@bwd/db";
import { withUser } from "@/lib/api";

export const GET = withUser(({ env, userId, req }) => {
  const b = Number(new URL(req.url).searchParams.get("block")) || undefined;
  return getSolTasks(env.db, userId, env.now, b);
});
