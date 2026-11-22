import { createClassPost } from "@bwd/db";
import { ClassPostInput } from "@bwd/shared";
import { json, parseBody, withUser } from "@/lib/api";

/** Beitrag schreiben (Lehrpersonen), Dateien vorher hochladen und mit fileIds anhängen. */
export const POST = withUser(async ({ env, userId, req }) => json(await createClassPost(env.db, userId, await parseBody(req, ClassPostInput), env.now), 201));
