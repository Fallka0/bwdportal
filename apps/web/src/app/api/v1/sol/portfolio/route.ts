import { getSolPortfolio, putSolPortfolio } from "@bwd/db";
import { SolPortfolioPut } from "@bwd/shared";
import { parseBody, withUser } from "@/lib/api";

export const GET = withUser(({ env, userId }) => getSolPortfolio(env.db, userId, env.now));

export const PUT = withUser(async ({ env, userId, req }) => {
  const b = await parseBody(req, SolPortfolioPut);
  await putSolPortfolio(env.db, userId, b.solDayId, b.checkIn, b.checkOut, env.now);
  return { ok: true };
});
