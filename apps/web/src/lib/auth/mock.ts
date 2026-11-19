import { createSession, deleteSession, sessionUser, userById } from "@bwd/db";
import { config } from "@bwd/shared";
import type { ServerEnv } from "../env";
import { FOREIGN_ACCOUNT_ID, MSG_FOREIGN, type AuthProvider, type SignInRequest, type SignInResult } from "./types";

/** Demo-Anmeldung: nur mit AUTH_MODE=mock. Konten kommen aus dem Seed. */
export class MockAuthProvider implements AuthProvider {
  readonly name = "mock" as const;
  constructor(private env: ServerEnv) {}

  async signIn(req: SignInRequest): Promise<SignInResult> {
    if (req.kind !== "mock") return { ok: false, code: "not_configured", message: "Diese Anmeldung ist im Demo-Modus nicht verfügbar." };
    if (req.accountId === FOREIGN_ACCOUNT_ID) return { ok: false, code: "foreign_account", message: MSG_FOREIGN };
    const user = await userById(this.env.db, req.accountId);
    if (!user) return { ok: false, code: "unknown_account", message: "Dieses Konto gibt es nicht." };
    if (!user.email.endsWith(`@${config.school.emailDomain}`)) return { ok: false, code: "foreign_account", message: MSG_FOREIGN };
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
