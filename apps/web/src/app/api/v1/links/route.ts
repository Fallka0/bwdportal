import { getLinks } from "@bwd/db";
import { withUser } from "@/lib/api";

export const GET = withUser(async ({ env }) => ({ items: await getLinks(env.db) }));
