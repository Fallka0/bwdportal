import { z } from "zod";
import { registerPushToken, removePushToken } from "@bwd/db";
import { parseBody, withUser } from "@/lib/api";

const Token = z.object({ token: z.string().min(10).max(200), platform: z.enum(["android", "ios", "web"]).default("android") });

/** Gerät für Push registrieren (App, nach dem Login und beim Start). */
export const POST = withUser(async ({ env, userId, req }) => {
  const b = await parseBody(req, Token);
  await registerPushToken(env.db, userId, b.token, b.platform, env.now.stamp);
  return { ok: true };
});

/** Gerät abmelden (beim Logout). */
export const DELETE = withUser(async ({ env, userId, req }) => {
  const b = await parseBody(req, Token.pick({ token: true }));
  await removePushToken(env.db, userId, b.token);
  return { ok: true };
});
