import { checkinBoard, DomainError } from "@bwd/db";
import { withUser } from "@/lib/api";

/** Tafel der Lehrperson: neuer QR-Code (am SOL-Tag) und Stand der Klasse. Wird alle 20 Sekunden abgefragt. */
export const GET = withUser(({ env, userId, req }) => {
  const cls = new URL(req.url).searchParams.get("klasse");
  if (!cls) throw new DomainError("invalid", "Klasse fehlt.");
  return checkinBoard(env.db, userId, cls, env.now, Date.now());
});
