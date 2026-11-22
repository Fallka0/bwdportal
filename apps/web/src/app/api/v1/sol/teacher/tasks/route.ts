import { createSolTask } from "@bwd/db";
import { SolTaskInput } from "@bwd/shared";
import { json, parseBody, withUser } from "@/lib/api";

export const POST = withUser(async ({ env, userId, req }) => json(await createSolTask(env.db, userId, await parseBody(req, SolTaskInput)), 201));
