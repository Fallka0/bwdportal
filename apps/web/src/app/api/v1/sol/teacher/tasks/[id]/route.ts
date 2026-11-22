import { deleteSolTask, updateSolTask } from "@bwd/db";
import { SolTaskInput } from "@bwd/shared";
import { parseBody, withUser } from "@/lib/api";

const idOf = (req: Request) => decodeURIComponent(new URL(req.url).pathname.split("/").pop() ?? "");
const Change = SolTaskInput.pick({ code: true, title: true, minutes: true, sharepointUrl: true });

export const PATCH = withUser(async ({ env, userId, req }) => {
  await updateSolTask(env.db, userId, idOf(req), await parseBody(req, Change));
  return { ok: true };
});

/** Auftrag samt Stand, Plan-Einträgen und Dateien (auch in R2) löschen. */
export const DELETE = withUser(async ({ env, userId, req }) => {
  const keys = await deleteSolTask(env.db, userId, idOf(req));
  if (keys.length) await env.files.delete(keys).catch(() => {});
  return { ok: true };
});
