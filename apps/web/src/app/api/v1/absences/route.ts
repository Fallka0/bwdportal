import { getAbsences } from "@bwd/db";
import { withUser } from "@/lib/api";

/** Cockpit: Absenzen, Kontingent, Fachkontingente, Abmeldungen und Dispensationsgesuche. */
export const GET = withUser(({ env, userId }) => getAbsences(env.db, userId, env.now));
