import "server-only";
import { createSession, deleteSession, findOrCreateUser, sessionUser } from "@bwd/db";
import { config, nameFromSchoolEmail } from "@bwd/shared";
import type { ServerEnv } from "../env";
import { MSG_FOREIGN, type AuthProvider, type SignInRequest, type SignInResult } from "./types";

/**
 * Anmeldung mit dem Planary-Konto (auth.planary.ch). Planary prüft Passwort oder Google/GitHub und bestätigt
 * die E-Mail-Adresse; der Rücksprung bringt ein Access-Token im Fragment. Der Server prüft es bei
 * /api/auth/me und lässt nur Adressen der Schul-Domain zu. Danach gilt die eigene Session wie bei Microsoft.
 */

export type PlanaryUser = { id: string; email: string; name: string };

export type PlanaryStart = "login" | "signup" | "switch";

/**
 * Ziel für den Start, zurück auf die Seite /login/planary. Ohne Single Sign-on: wer bei Planary schon angemeldet
 * ist, sieht "Weiter als …" oder "Anderes Konto" und meldet sich nicht unbemerkt mit einer fremden Adresse an.
 * "switch" meldet bei Planary ab und zeigt das Anmeldeformular.
 */
export function planaryStartUrl(base: string, origin: string, mode: PlanaryStart) {
  const u = new URL(mode === "signup" ? `${base}/signup` : mode === "switch" ? `${base}/logout` : `${base}/`);
  u.searchParams.set("returnTo", `${origin}/login/planary`);
  return u.toString();
}

/** Access-Token prüfen: liefert das Konto oder null. */
export async function planaryMe(base: string, accessToken: string, f: typeof fetch = fetch): Promise<PlanaryUser | null> {
  const res = await f(`${base}/api/auth/me`, { headers: { authorization: `Bearer ${accessToken}` } }).catch(() => null);
  if (!res?.ok) return null;
  const body = (await res.json().catch(() => null)) as { user?: { id?: string; email?: string; name?: string } } | null;
  const u = body?.user;
  return u?.id && u.email ? { id: u.id, email: u.email.toLowerCase(), name: u.name ?? "" } : null;
}

/** Refresh-Token bei Planary verwerfen: das Portal braucht nur seine eigene Session. */
export async function planaryRevoke(base: string, refreshToken: string, f: typeof fetch = fetch) {
  await f(`${base}/api/auth/logout`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ refresh_token: refreshToken }) }).catch(() => null);
}

export function schoolEmail(email: string, extraDomains: string[]) {
  const domain = email.split("@")[1] ?? "";
  return [config.school.emailDomain, ...extraDomains].some((d) => d.toLowerCase() === domain);
}

/**
 * Name des Kontos: bei Schuladressen immer aus der Adresse (vorname.nachname@bwdbern.ch), damit niemand
 * einen anderen Namen wählt; sonst "Vorname Nachname" von Planary oder, ohne Namen, aus der Adresse.
 */
export function splitName(name: string, email: string) {
  const school = nameFromSchoolEmail(email);
  if (school) return school;
  const parts = name.trim() ? name.trim().split(/\s+/) : (email.split("@")[0] ?? "").split(".").map((p) => (p ? p[0]!.toUpperCase() + p.slice(1) : p));
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

export class PlanaryAuthProvider implements AuthProvider {
  readonly name = "planary" as const;
  constructor(private env: ServerEnv) {}

  async signIn(req: SignInRequest): Promise<SignInResult> {
    if (req.kind !== "planary") return { ok: false, code: "not_configured", message: "Nur über Planary." };
    if (!this.env.planaryUrl) return { ok: false, code: "not_configured", message: "Die Anmeldung mit Planary ist nicht eingerichtet." };
    const u = await planaryMe(this.env.planaryUrl, req.accessToken);
    if (!u) return { ok: false, code: "unknown_account", message: "Die Anmeldung mit Planary hat nicht geklappt. Versuche es nochmals." };
    if (!schoolEmail(u.email, this.env.extraDomains)) return { ok: false, code: "foreign_account", message: MSG_FOREIGN, email: u.email };
    const user = await findOrCreateUser(this.env.db, { email: u.email, ...splitName(u.name, u.email), oid: `pl-${u.id}` }, this.env.now, this.env.defaultClass);
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
