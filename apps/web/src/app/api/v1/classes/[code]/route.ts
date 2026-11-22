import { getClassView } from "@bwd/db";
import { withUser } from "@/lib/api";

/** Klasse mit Lernenden; Absenzen nur für die Klassenlehrperson. */
export const GET = withUser(({ env, userId, req }) => getClassView(env.db, userId, decodeURIComponent(new URL(req.url).pathname.split("/").pop() ?? ""), env.now));
