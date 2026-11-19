import "server-only";

/** Kurzlebiges Cookie für den Microsoft-Login: state, nonce, PKCE-Verifier und das Ziel (Web oder App). */
export const FLOW_COOKIE = "bwd_oidc";

export type Flow = { state: string; nonce: string; verifier: string; returnTo: string | null };

export const encodeFlow = (f: Flow) => btoa(JSON.stringify(f));

export function decodeFlow(v: string | undefined): Flow | null {
  if (!v) return null;
  try {
    return JSON.parse(atob(v)) as Flow;
  } catch {
    return null;
  }
}

/**
 * Rücksprung in die App: nur das eigene Schema (Build) oder Expo Go (exp://, exps://).
 * Alles andere wird abgelehnt, damit der Login niemanden auf fremde Seiten umleitet.
 */
export function safeAppReturn(v: string | null): string | null {
  if (!v) return null;
  return /^(bwdportal:\/\/|exps?:\/\/)/.test(v) ? v : null;
}

export const redirectUri = (req: Request) => `${new URL(req.url).origin}/api/v1/auth/callback`;
