import { createTest, listTests } from "@bwd/db";
import { TestInput } from "@bwd/shared";
import { json, parseBody, withUser } from "@/lib/api";

/** Prüfungskalender: ab heute, mit ?vergangen=1 die vergangenen. */
export const GET = withUser(async ({ env, userId, req }) => ({ tests: await listTests(env.db, userId, env.now, { past: new URL(req.url).searchParams.get("vergangen") === "1" }) }));

/** Prüfung erfassen: Lehrpersonen für eine zugeteilte Klasse, Lernende eine eigene. */
export const POST = withUser(async ({ env, userId, req }) => json(await createTest(env.db, userId, await parseBody(req, TestInput), env.now), 201));
