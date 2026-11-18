import { setSolProgress } from "@bwd/db";
import { z } from "zod";
import { parseBody, withUser } from "@/lib/api";

const Body = z.object({ percent: z.number().int().min(0).max(100) });

export const PATCH = withUser(async ({ env, userId, req }) => {
  const id = decodeURIComponent(new URL(req.url).pathname.split("/").pop() ?? "");
  const { percent } = await parseBody(req, Body);
  await setSolProgress(env.db, userId, id, percent);
  return { ok: true };
});
