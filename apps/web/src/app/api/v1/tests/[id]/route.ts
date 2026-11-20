import { deleteTest, updateTest } from "@bwd/db";
import { TestInput } from "@bwd/shared";
import { parseBody, withUser } from "@/lib/api";

const idOf = (req: Request) => decodeURIComponent(new URL(req.url).pathname.split("/").pop() ?? "");

export const PATCH = withUser(async ({ env, userId, req }) => updateTest(env.db, userId, idOf(req), await parseBody(req, TestInput), env.now));

export const DELETE = withUser(async ({ env, userId, req }) => {
  await deleteTest(env.db, userId, idOf(req));
  return { ok: true };
});
