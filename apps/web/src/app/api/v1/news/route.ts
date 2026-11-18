import { getNews } from "@bwd/db";
import { withUser } from "@/lib/api";

export const GET = withUser(async ({ env, userId }) => ({ items: await getNews(env.db, userId) }));
