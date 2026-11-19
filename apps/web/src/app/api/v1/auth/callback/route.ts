import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createLoginCode } from "@bwd/db";
import { authProvider, sessionCookie } from "@/lib/auth";
import { decodeFlow, FLOW_COOKIE, redirectUri } from "@/lib/auth/flow";
import { msConfigured, redeemCode } from "@/lib/auth/microsoft";
import { serverEnv } from "@/lib/env";

/**
 * Rücksprung von Microsoft. Prüft state, tauscht den Code, prüft das Konto, legt die Session an.
 * Web: Session-Cookie und weiter zur Übersicht. App: Einmal-Code an die App (gegen Token tauschen über /auth/exchange).
 */
export async function GET(req: Request) {
  const env = await serverEnv();
  const url = new URL(req.url);
  const flow = decodeFlow((await cookies()).get(FLOW_COOKIE)?.value);
  const fail = (code: "konto" | "microsoft") => {
    const target = flow?.returnTo ? new URL(flow.returnTo) : new URL("/login", req.url);
    target.searchParams.set("fehler", code);
    const res = NextResponse.redirect(target);
    res.cookies.set({ name: FLOW_COOKIE, value: "", path: "/api/v1/auth", maxAge: 0 });
    return res;
  };
  const msError = url.searchParams.get("error");
  if (msError) console.error("Microsoft-Login:", msError, url.searchParams.get("error_description") ?? "", url.searchParams.get("error_uri") ?? "");
  if (!flow || !msConfigured(env.ms) || url.searchParams.get("state") !== flow.state || !url.searchParams.get("code")) return fail("microsoft");
  try {
    const claims = await redeemCode(env.ms, { code: url.searchParams.get("code")!, verifier: flow.verifier, redirectUri: redirectUri(req), nonce: flow.nonce });
    const r = await authProvider(env, "microsoft").signIn({ kind: "oidc", claims });
    if (!r.ok) return fail(r.code === "foreign_account" ? "konto" : "microsoft");
    if (flow.returnTo) {
      const target = new URL(flow.returnTo);
      target.searchParams.set("code", await createLoginCode(env.db, r.sessionId, env.now));
      const res = NextResponse.redirect(target);
      res.cookies.set({ name: FLOW_COOKIE, value: "", path: "/api/v1/auth", maxAge: 0 });
      return res;
    }
    const res = NextResponse.redirect(new URL("/", req.url));
    res.cookies.set(sessionCookie(r.sessionId, env.isProd));
    res.cookies.set({ name: FLOW_COOKIE, value: "", path: "/api/v1/auth", maxAge: 0 });
    return res;
  } catch (e) {
    console.error("Microsoft-Login:", e instanceof Error ? e.message : e);
    return fail("microsoft");
  }
}
