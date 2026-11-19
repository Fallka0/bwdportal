import { getHome } from "@bwd/db";
import { withUser } from "@/lib/api";

export const GET = withUser(({ env, userId }) => getHome(env.db, userId, env.now));
