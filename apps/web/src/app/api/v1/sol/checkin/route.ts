import { z } from "zod";
import { checkinInfo, redeemCheckin } from "@bwd/db";
import { parseBody, withUser } from "@/lib/api";
import { NEXT_COOKIE } from "@/lib/next-cookie";

export const GET = withUser(({ env, userId, req }) => checkinInfo(env.db, userId, new URL(req.url).searchParams.get("c") ?? "", Date.now()));

/** Code einlösen: Check-in, beim zweiten Mal Check-out. */
export const POST = withUser(async ({ env, userId, req }) => {
  const { code } = await parseBody(req, z.object({ code: z.string().max(64) }));
  const info = await redeemCheckin(env.db, userId, code, env.now, Date.now());
  const res = Response.json(info, { headers: { "cache-control": "no-store" } });
  res.headers.append("set-cookie", `${NEXT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`);
  return res;
});
