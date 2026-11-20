import { addPortfolioEntry } from "@bwd/db";
import { PortfolioEntryInput } from "@bwd/shared";
import { json, parseBody, withUser } from "@/lib/api";

/** Probe erfassen. */
export const POST = withUser(async ({ env, userId, req }) => {
  const body = await parseBody(req, PortfolioEntryInput);
  return json(await addPortfolioEntry(env.db, userId, body, env.now), 201);
});
