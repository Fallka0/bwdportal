import { getMe } from "@bwd/db";
import { withUser } from "@/lib/api";

export const GET = withUser(({ env, userId }) => getMe(env.db, userId, env.now));
