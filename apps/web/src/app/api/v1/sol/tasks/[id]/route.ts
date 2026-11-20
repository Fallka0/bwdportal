import { setSolStatus } from "@bwd/db";
import { SolStatus } from "@bwd/shared";
import { z } from "zod";
import { parseBody, withUser } from "@/lib/api";

const Body = z.object({ status: SolStatus });

/** Stand eines Auftrags setzen: offen, angefangen, erledigt. */
export const PATCH = withUser(async ({ env, userId, req }) => {
  const id = decodeURIComponent(new URL(req.url).pathname.split("/").pop() ?? "");
  const { status } = await parseBody(req, Body);
  await setSolStatus(env.db, userId, id, status);
  return { ok: true };
});
