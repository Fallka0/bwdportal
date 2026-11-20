import "server-only";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { createSession, deleteSession, findOrCreateUser, randomId, sessionUser } from "@bwd/db";
import { config, nameFromSchoolEmail } from "@bwd/shared";
import type { ServerEnv } from "../env";
import { MSG_FOREIGN, type AuthProvider, type SignInRequest, type SignInResult } from "./types";

/**
 * Microsoft-Login (Entra ID, OpenID Connect, Authorization Code mit PKCE).
 * Der Server tauscht den Code gegen ein ID-Token, prüft Signatur, Aussteller, Empfänger und Nonce
 * und lässt nur Konten mit der Schul-Domain zu (config.school.emailDomain, für Tests AUTH_EXTRA_DOMAINS).
 * Sessions sind dieselben wie beim Mock.
 */

const AUTHORITY = "https://login.microsoftonline.com";
const JWKS = createRemoteJWKSet(new URL(`${AUTHORITY}/common/discovery/v2.0/keys`));

export type MsSettings = { clientId: string; clientSecret: string; tenant: string; extraDomains: string[] };

export function msConfigured(ms: MsSettings | null): ms is MsSettings {
  return !!ms?.clientId && !!ms.clientSecret;
}

const b64url = (bytes: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

/** PKCE: zufälliger Verifier und dessen SHA-256 als Challenge. */
export async function pkce() {
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(32)));
  const challenge = b64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
  return { verifier, challenge };
}

export function authorizeUrl(ms: MsSettings, o: { redirectUri: string; state: string; nonce: string; challenge: string }) {
  const u = new URL(`${AUTHORITY}/${ms.tenant}/oauth2/v2.0/authorize`);
  u.search = new URLSearchParams({
    client_id: ms.clientId,
    response_type: "code",
    redirect_uri: o.redirectUri,
    response_mode: "query",
    scope: "openid profile email",
    state: o.state,
    nonce: o.nonce,
    code_challenge: o.challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  return u.toString();
}

export type MsClaims = { email: string; firstName: string; lastName: string; oid: string; trustedName: boolean };

/** Code gegen ID-Token tauschen und das Token prüfen. */
export async function redeemCode(ms: MsSettings, o: { code: string; verifier: string; redirectUri: string; nonce: string }): Promise<MsClaims> {
  const res = await fetch(`${AUTHORITY}/${ms.tenant}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: ms.clientId, client_secret: ms.clientSecret, grant_type: "authorization_code", code: o.code, redirect_uri: o.redirectUri, code_verifier: o.verifier, scope: "openid profile email" }),
  });
  const body = (await res.json().catch(() => null)) as { id_token?: string; error_description?: string } | null;
  if (!res.ok || !body?.id_token) throw new Error(body?.error_description?.split("\n")[0] ?? `Token-Anfrage fehlgeschlagen (${res.status})`);
  const { payload } = await jwtVerify(body.id_token, JWKS, { audience: ms.clientId });
  // Aussteller hängt vom Mandanten ab (bei "common" jeder Mandant): muss zu tid passen.
  if (typeof payload.tid !== "string" || payload.iss !== `${AUTHORITY}/${payload.tid}/v2.0`) throw new Error("Unerwarteter Aussteller");
  if (payload.nonce !== o.nonce) throw new Error("Nonce stimmt nicht");
  const email = String(payload.email ?? payload.preferred_username ?? "").toLowerCase();
  const name = String(payload.name ?? "");
  // Name aus dem Verzeichnis der Schule (mit Umlauten und Doppelnamen); fehlt er, aus der Adresse
  const school = nameFromSchoolEmail(email);
  const given = String(payload.given_name ?? "").trim();
  const family = String(payload.family_name ?? "").trim();
  return {
    email,
    firstName: given || school?.firstName || (name.split(" ")[0] ?? ""),
    lastName: family || school?.lastName || name.split(" ").slice(1).join(" "),
    trustedName: !!(given && family),
    oid: String(payload.oid ?? payload.sub ?? randomId(8)),
  };
}

export function allowedDomain(email: string, ms: MsSettings) {
  const domain = email.split("@")[1] ?? "";
  return [config.school.emailDomain, ...ms.extraDomains].some((d) => d.toLowerCase() === domain);
}

export class MicrosoftAuthProvider implements AuthProvider {
  readonly name = "microsoft" as const;
  constructor(private env: ServerEnv) {}

  /** Nach dem Redirect: Konto prüfen und Session anlegen. Die Anfrage an Microsoft passiert in der Callback-Route. */
  async signIn(req: SignInRequest): Promise<SignInResult> {
    if (req.kind !== "oidc") return { ok: false, code: "not_configured", message: "Nur über Microsoft." };
    const ms = this.env.ms;
    if (!msConfigured(ms)) return { ok: false, code: "not_configured", message: "Die Anmeldung mit Microsoft ist noch nicht eingerichtet." };
    const claims = req.claims;
    if (!claims.email || !allowedDomain(claims.email, ms)) return { ok: false, code: "foreign_account", message: MSG_FOREIGN };
    const user = await findOrCreateUser(this.env.db, claims, this.env.now, this.env.defaultClass);
    const s = await createSession(this.env.db, user.id, this.env.now);
    return { ok: true, sessionId: s.id, expiresAt: s.expiresAt };
  }

  signOut(sessionId: string) {
    return deleteSession(this.env.db, sessionId);
  }

  getSession(sessionId: string) {
    return sessionUser(this.env.db, sessionId, this.env.now);
  }
}
