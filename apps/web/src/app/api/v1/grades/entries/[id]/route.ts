import { deletePortfolioEntry, updatePortfolioEntry } from "@bwd/db";
import { PortfolioEntryInput } from "@bwd/shared";
import { parseBody, withUser } from "@/lib/api";

const idOf = (req: Request) => decodeURIComponent(new URL(req.url).pathname.split("/").pop() ?? "");

export const PATCH = withUser(async ({ env, userId, req }) => updatePortfolioEntry(env.db, userId, idOf(req), await parseBody(req, PortfolioEntryInput)));

export const DELETE = withUser(async ({ env, userId, req }) => {
  await deletePortfolioEntry(env.db, userId, idOf(req));
  return { ok: true };
});
