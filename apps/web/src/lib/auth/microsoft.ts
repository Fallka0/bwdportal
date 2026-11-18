import { deleteSession, sessionUser } from "@bwd/db";
import type { ServerEnv } from "../env";
import type { AuthProvider, SignInResult } from "./types";

/**
 * Platz für den Microsoft-Login (Entra ID, OIDC mit PKCE). Noch nicht eingerichtet.
 * Vorgehen: App-Registrierung der Schule, Redirect auf /api/v1/auth/callback, ID-Token prüfen,
 * Domain der E-Mail gegen config.school.emailDomain prüfen (sonst "foreign_account"), dann createSession().
 * Sessions bleiben dieselben wie beim Mock.
 */
export class MicrosoftAuthProvider implements AuthProvider {
  readonly name = "microsoft" as const;
  constructor(private env: ServerEnv) {}

  async signIn(): Promise<SignInResult> {
    return { ok: false, code: "not_configured", message: "Die Anmeldung mit Microsoft ist noch nicht eingerichtet." };
  }

  signOut(sessionId: string) {
    return deleteSession(this.env.db, sessionId);
  }

  getSession(sessionId: string) {
    return sessionUser(this.env.db, sessionId, this.env.now);
  }
}
