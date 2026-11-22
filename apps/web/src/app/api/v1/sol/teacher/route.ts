import { DomainError, getSolOverview } from "@bwd/db";
import { withUser } from "@/lib/api";

/** SOL einer Klasse für Lehrpersonen: ?klasse=IM24b&block=2 (ohne Block der aktuelle). */
export const GET = withUser(({ env, userId, req }) => {
  const q = new URL(req.url).searchParams;
  const cls = q.get("klasse");
  if (!cls) throw new DomainError("invalid", "Klasse fehlt.");
  return getSolOverview(env.db, userId, cls, env.now, Number(q.get("block")) || undefined);
});
