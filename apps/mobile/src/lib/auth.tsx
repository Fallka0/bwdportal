import { ApiFailure } from "@bwd/shared/api";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, setApiToken, setUnauthorizedHandler } from "./api";
import { storage } from "./storage";

const KEY = "session";

type Status = "loading" | "in" | "out";
type SignInResult = { ok: true } | { ok: false; foreign: boolean; message: string };

type Ctx = { status: Status; signIn: (accountId: string) => Promise<SignInResult>; signOut: () => Promise<void> };
const AuthCtx = createContext<Ctx | null>(null);

export function useAuth() {
  const c = useContext(AuthCtx);
  if (!c) throw new Error("useAuth ausserhalb von AuthProvider");
  return c;
}

/**
 * Anmeldung in der App: Token vom Portal (Mock-Login), gespeichert im SecureStore.
 * Später ersetzt ein Microsoft-Login (Entra ID) signIn, der Rest bleibt gleich.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");

  const clear = useCallback(async () => {
    setApiToken(null);
    await storage.remove(KEY).catch(() => {});
    setStatus("out");
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => void clear());
    storage
      .get(KEY)
      .then((t) => {
        setApiToken(t);
        setStatus(t ? "in" : "out");
      })
      .catch(() => setStatus("out"));
  }, [clear]);

  const signIn = useCallback(async (accountId: string): Promise<SignInResult> => {
    try {
      const r = await api.signInMock(accountId);
      setApiToken(r.token);
      await storage.set(KEY, r.token);
      setStatus("in");
      return { ok: true };
    } catch (e) {
      const f = e instanceof ApiFailure ? e : null;
      return { ok: false, foreign: f?.code === "foreign_account", message: f?.message ?? "Anmeldung fehlgeschlagen." };
    }
  }, []);

  const signOut = useCallback(async () => {
    await api.logout().catch(() => {});
    await clear();
  }, [clear]);

  const value = useMemo(() => ({ status, signIn, signOut }), [status, signIn, signOut]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
