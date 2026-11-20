import { ApiFailure } from "@bwd/shared/api";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, API_URL, setApiToken, setUnauthorizedHandler } from "./api";
import { clearCache } from "./cache";
import { storage } from "./storage";

const KEY = "session";

type Status = "loading" | "in" | "out";
type SignInResult = { ok: true } | { ok: false; foreign: boolean; message: string };

type Ctx = {
  status: Status;
  signIn: (accountId: string) => Promise<SignInResult>;
  signInWith: (provider: "microsoft" | "planary", mode?: "signup" | "switch") => Promise<SignInResult | { ok: false; cancelled: true }>;
  signOut: () => Promise<void>;
};
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
    // Gespeicherte Daten sind persönlich: beim Abmelden weg.
    await clearCache();
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

  /**
   * Login über das Portal (Microsoft oder Planary): der Server spricht mit dem Anbieter und schickt einen
   * Einmal-Code zurück an die App (bwdportal://auth oder in Expo Go exp://…/--/auth). Der Code wird gegen das Token getauscht.
   */
  const signInWith = useCallback(async (provider: "microsoft" | "planary", mode?: "signup" | "switch") => {
    const name = provider === "planary" ? "Planary" : "Microsoft";
    const returnUrl = Linking.createURL("auth");
    const r = await WebBrowser.openAuthSessionAsync(`${API_URL}/api/v1/auth/${provider}?app=${encodeURIComponent(returnUrl)}${mode === "signup" ? "&signup=1" : mode === "switch" ? "&wechseln=1" : ""}`, returnUrl);
    if (r.type !== "success") return { ok: false as const, cancelled: true as const };
    const params = new URL(r.url).searchParams;
    const fehler = params.get("fehler");
    if (fehler) return { ok: false as const, foreign: fehler === "konto", message: fehler === "konto" ? "Dieses Konto gehört nicht zur bwd." : `Die Anmeldung mit ${name} hat nicht geklappt.` };
    try {
      const { token } = await api.exchange(params.get("code") ?? "");
      setApiToken(token);
      await storage.set(KEY, token);
      setStatus("in");
      return { ok: true as const };
    } catch (e) {
      return { ok: false as const, foreign: false, message: e instanceof ApiFailure ? e.message : `Die Anmeldung mit ${name} hat nicht geklappt.` };
    }
  }, []);

  const signOut = useCallback(async () => {
    await api.logout().catch(() => {});
    await clear();
  }, [clear]);

  const value = useMemo(() => ({ status, signIn, signInWith, signOut }), [status, signIn, signInWith, signOut]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
