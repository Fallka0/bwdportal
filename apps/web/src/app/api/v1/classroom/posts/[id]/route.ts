import { z } from "zod";
import { deleteClassPost, updateClassPost } from "@bwd/db";
import { parseBody, withUser } from "@/lib/api";

const idOf = (req: Request) => decodeURIComponent(new URL(req.url).pathname.split("/").pop() ?? "");

export const PATCH = withUser(async ({ env, userId, req }) => {
  const { body } = await parseBody(req, z.object({ body: z.string().max(5000) }));
  await updateClassPost(env.db, userId, idOf(req), body, env.now);
  return { ok: true };
});

/** Beitrag samt angehängten Dateien löschen (auch in R2). */
export const DELETE = withUser(async ({ env, userId, req }) => {
  const keys = await deleteClassPost(env.db, userId, idOf(req));
  if (keys.length) await env.files.delete(keys).catch(() => {});
  return { ok: true };
});
