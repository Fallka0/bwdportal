import { deleteSolTaskFile } from "@bwd/db";
import { withUser } from "@/lib/api";

export const DELETE = withUser(async ({ env, userId, req }) => {
  const keys = await deleteSolTaskFile(env.db, userId, decodeURIComponent(new URL(req.url).pathname.split("/").pop() ?? ""));
  await env.files.delete(keys).catch(() => {});
  return { ok: true };
});
