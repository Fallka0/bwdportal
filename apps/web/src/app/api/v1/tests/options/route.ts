import { testOptions } from "@bwd/db";
import { withUser } from "@/lib/api";

/** Auswahl im Formular: Fächer (Lernende) oder Klasse und Fach (Lehrpersonen). */
export const GET = withUser(({ env, userId }) => testOptions(env.db, userId));
