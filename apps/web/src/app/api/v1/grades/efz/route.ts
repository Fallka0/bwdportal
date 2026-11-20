import { getEfz } from "@bwd/db";
import { withUser } from "@/lib/api";

/** EFZ-Übersicht: gibb-Module und üK pro Ausbildungsjahr. */
export const GET = withUser(({ env, userId }) => getEfz(env.db, userId));
