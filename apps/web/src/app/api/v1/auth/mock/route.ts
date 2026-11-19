import { z } from "zod";
import { DomainError } from "@bwd/db";
import { apiError, json, parseBody } from "@/lib/api";
import { authProvider, mockAllowed, sessionCookie } from "@/lib/auth";
import { serverEnv } from "@/lib/env";

const Body = z.object({ accountId: z.string().min(1) });

/** Demo-Konto wählen, Session anlegen. Web bekommt ein HttpOnly-Cookie, die App das Token im Body. */
export async function POST(req: Request) {
  const env = await serverEnv();
  if (!mockAllowed(env)) return apiError(404, "not_found", "Nicht verfügbar.");
  try {
    const { accountId } = await parseBody(req, Body);
    const r = await authProvider(env, "mock").signIn({ kind: "mock", accountId });
    if (!r.ok) return apiError(r.code === "foreign_account" ? 403 : 400, r.code, r.message);
    const res = json({ token: r.sessionId, expiresAt: r.expiresAt });
    res.cookies.set(sessionCookie(r.sessionId, env.isProd));
    return res;
  } catch (e) {
    if (e instanceof DomainError) return apiError(422, e.code, e.message, e.field);
    throw e;
  }
}
