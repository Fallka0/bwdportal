import { getClassroom } from "@bwd/db";
import { withUser } from "@/lib/api";

/** Klassenraum: Lernende ihre Klasse, Lehrpersonen ?klasse=IM24b; optional ?fach=MA. */
export const GET = withUser(({ env, userId, req }) => {
  const q = new URL(req.url).searchParams;
  return getClassroom(env.db, userId, q.get("klasse"), q.get("fach"));
});
