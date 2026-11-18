import { getNotifications } from "@bwd/db";
import { withUser } from "@/lib/api";

export const GET = withUser(async ({ env, userId }) => ({ items: await getNotifications(env.db, userId) }));
