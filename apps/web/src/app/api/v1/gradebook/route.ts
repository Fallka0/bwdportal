import { DomainError, getGradebook } from "@bwd/db";
import { withUser } from "@/lib/api";

/** Notenbuch: ?klasse=IM24b&fach=MA&semester=5 (ohne Semester das laufende). */
export const GET = withUser(({ env, userId, req }) => {
  const q = new URL(req.url).searchParams;
  const cls = q.get("klasse");
  const subject = q.get("fach");
  if (!cls || !subject) throw new DomainError("invalid", "Klasse und Fach fehlen.");
  return getGradebook(env.db, userId, cls, subject, env.now, Number(q.get("semester")) || undefined);
});
