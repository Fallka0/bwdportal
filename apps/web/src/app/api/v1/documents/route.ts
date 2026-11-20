import { getDocuments } from "@bwd/db";
import { withUser } from "@/lib/api";

export const GET = withUser(({ env, userId, req }) => {
  const sp = new URL(req.url).searchParams;
  return getDocuments(env.db, userId, env.now, sp.get("q") ?? "", sp.get("group") ?? undefined);
});
