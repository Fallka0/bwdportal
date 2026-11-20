import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createLoginCode, randomId } from "@bwd/db";
import { z } from "zod";
import { apiError, json } from "@/lib/api";
import { authProvider, planaryAllowed, sessionCookie } from "@/lib/auth";
import { decodeFlow, encodeFlow, FLOW_COOKIE, safeAppReturn } from "@/lib/auth/flow";
import { planaryRevoke, planaryStartUrl } from "@/lib/auth/planary";
import { serverEnv } from "@/lib/env";

/** Start: weiter zu auth.planary.ch. ?signup=1 öffnet "Konto erstellen", ?app=<Rücksprung> für die App. */
export async function GET(req: Request) {
  const env = await serverEnv();
  const url = new URL(req.url);
  if (!planaryAllowed(env)) return NextResponse.redirect(new URL("/login?fehler=planary", req.url));
  const flow = { state: randomId(16), nonce: "", verifier: "", returnTo: safeAppReturn(url.searchParams.get("app")) };
  const res = NextResponse.redirect(planaryStartUrl(env.planaryUrl!, url.origin, url.searchParams.has("signup")));
  // Der Rücksprung zählt nur in dem Browser, der den Login begonnen hat.
  res.cookies.set({ name: FLOW_COOKIE, value: encodeFlow(flow), httpOnly: true, secure: env.isProd, sameSite: "lax", path: "/api/v1/auth", maxAge: 900 });
  return res;
}

const Body = z.object({ access_token: z.string().min(10), refresh_token: z.string().optional() });

/** Rücksprung (von /login/planary): Token prüfen, Session anlegen. Antwort: wohin es weitergeht. */
export async function POST(req: Request) {
  const env = await serverEnv();
  if (!planaryAllowed(env)) return apiError(403, "not_configured", "Die Anmeldung mit Planary ist nicht eingerichtet.");
  const flow = decodeFlow((await cookies()).get(FLOW_COOKIE)?.value);
  if (!flow) return apiError(400, "no_flow", "Die Anmeldung ist abgelaufen. Versuche es nochmals.");
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError(422, "invalid", "Die Anmeldung mit Planary hat nicht geklappt.");
  const r = await authProvider(env, "planary").signIn({ kind: "planary", accessToken: parsed.data.access_token });
  if (parsed.data.refresh_token) await planaryRevoke(env.planaryUrl!, parsed.data.refresh_token);
  const done = (to: string) => {
    const res = json({ redirect: to });
    res.cookies.set({ name: FLOW_COOKIE, value: "", path: "/api/v1/auth", maxAge: 0 });
    return res;
  };
  if (!r.ok) return done(flow.returnTo ? withParam(flow.returnTo, "fehler", r.code === "foreign_account" ? "konto" : "planary") : `/login?fehler=${r.code === "foreign_account" ? "konto" : "planary"}`);
  if (flow.returnTo) return done(withParam(flow.returnTo, "code", await createLoginCode(env.db, r.sessionId, env.now)));
  const res = done("/");
  res.cookies.set(sessionCookie(r.sessionId, env.isProd));
  return res;
}

function withParam(target: string, key: string, value: string) {
  const u = new URL(target);
  u.searchParams.set(key, value);
  return u.toString();
}
