import { deleteClassFile } from "@bwd/db";
import { withUser } from "@/lib/api";

export const DELETE = withUser(async ({ env, userId, req }) => {
  const key = await deleteClassFile(env.db, userId, decodeURIComponent(new URL(req.url).pathname.split("/").pop() ?? ""));
  await env.files.delete(key).catch(() => {});
  return { ok: true };
});
