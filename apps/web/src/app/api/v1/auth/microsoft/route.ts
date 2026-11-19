import { NextResponse } from "next/server";
import { randomId } from "@bwd/db";
import { microsoftAllowed } from "@/lib/auth";
import { encodeFlow, FLOW_COOKIE, redirectUri, safeAppReturn } from "@/lib/auth/flow";
import { authorizeUrl, msConfigured, pkce } from "@/lib/auth/microsoft";
import { serverEnv } from "@/lib/env";

/** Start des Microsoft-Logins. ?app=<Rücksprung-URL> für die App. */
export async function GET(req: Request) {
  const env = await serverEnv();
  const back = new URL("/login", req.url);
  if (!microsoftAllowed(env) || !msConfigured(env.ms)) {
    back.searchParams.set("fehler", "microsoft");
    return NextResponse.redirect(back);
  }
  const returnTo = safeAppReturn(new URL(req.url).searchParams.get("app"));
  const { verifier, challenge } = await pkce();
  const flow = { state: randomId(16), nonce: randomId(16), verifier, returnTo };
  const res = NextResponse.redirect(authorizeUrl(env.ms, { redirectUri: redirectUri(req), state: flow.state, nonce: flow.nonce, challenge }));
  res.cookies.set({ name: FLOW_COOKIE, value: encodeFlow(flow), httpOnly: true, secure: env.isProd, sameSite: "lax", path: "/api/v1/auth", maxAge: 600 });
  return res;
}
