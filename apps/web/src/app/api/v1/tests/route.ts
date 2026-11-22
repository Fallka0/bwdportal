import { createTest, listTests, testsBetween } from "@bwd/db";
import { TestInput } from "@bwd/shared";
import { json, parseBody, withUser } from "@/lib/api";

/** Prüfungskalender: ab heute, mit ?vergangen=1 die vergangenen, mit ?von=&bis= ein Zeitraum (Kalender). */
export const GET = withUser(async ({ env, userId, req }) => {
  const q = new URL(req.url).searchParams;
  const from = q.get("von");
  const to = q.get("bis");
  const day = /^\d{4}-\d{2}-\d{2}$/;
  if (from && to && day.test(from) && day.test(to)) return { tests: await testsBetween(env.db, userId, from, to) };
  return { tests: await listTests(env.db, userId, env.now, { past: q.get("vergangen") === "1" }) };
});

/** Prüfung erfassen: Lehrpersonen für eine zugeteilte Klasse, Lernende eine eigene. */
export const POST = withUser(async ({ env, userId, req }) => json(await createTest(env.db, userId, await parseBody(req, TestInput), env.now), 201));
