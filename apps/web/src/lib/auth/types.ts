/**
 * Schnittstelle für die Anmeldung. Heute: MockAuthProvider (Demo-Konten).
 * Später: MicrosoftAuthProvider (Entra ID, OIDC) mit derselben Schnittstelle, die Screens bleiben gleich.
 */
export type SignInRequest =
  /** Mock: gewähltes Demo-Konto. "foreign" simuliert ein Konto, das nicht zur Schule gehört. */
  | { kind: "mock"; accountId: string }
  /** Microsoft: geprüfte Angaben aus dem ID-Token (siehe microsoft.ts) */
  | { kind: "oidc"; claims: { email: string; firstName: string; lastName: string; oid: string } }
  /** Planary: Access-Token von auth.planary.ch (siehe planary.ts) */
  | { kind: "planary"; accessToken: string };

export type SignInResult = { ok: true; sessionId: string; expiresAt: string } | { ok: false; code: "foreign_account" | "unknown_account" | "not_configured"; message: string };

export interface AuthProvider {
  readonly name: "mock" | "microsoft" | "planary";
  signIn(req: SignInRequest): Promise<SignInResult>;
  signOut(sessionId: string): Promise<void>;
  /** Benutzer-ID zur Session oder null, wenn ungültig oder abgelaufen. */
  getSession(sessionId: string): Promise<string | null>;
}

export const FOREIGN_ACCOUNT_ID = "foreign";
export const MSG_FOREIGN = "Dieses Konto gehört nicht zur bwd.";
