import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb, type Db } from "@bwd/db";
import { getNow, type Now } from "@bwd/shared";
import type { MsSettings } from "./auth/microsoft";

export type AuthMethod = "mock" | "microsoft" | "planary";

/** AUTH_METHODS "planary,microsoft"; das frühere AUTH_MODE (mock, microsoft, both) gilt weiter. */
export function parseAuthMethods(methods?: string, mode?: string): Set<AuthMethod> {
  const list = methods ? methods.split(",").map((m) => m.trim()) : mode === "both" ? ["mock", "microsoft"] : [mode || "mock"];
  return new Set(list.filter((m): m is AuthMethod => m === "mock" || m === "microsoft" || m === "planary"));
}

export type ServerEnv = {
  db: Db;
  /** D1 direkt, z. B. für das Zurücksetzen der Demo-Daten */
  d1: D1Database;
  files: R2Bucket;
  now: Now;
  /** true mit DEMO_NOW: Zeit steht still (Jetzt-Linie wie im Design) */
  demo: boolean;
  /** Erlaubte Anmeldungen: planary (Planary-Konto), microsoft (Entra ID), mock (Demo-Konten, nur lokal und in Tests) */
  authMethods: Set<AuthMethod>;
  ms: MsSettings | null;
  /** Adresse des Planary-Logins (auth.planary.ch) */
  planaryUrl: string | null;
  /** Zugelassene E-Mail-Domains ausser der Schul-Domain (nur zum Testen) */
  extraDomains: string[];
  /** Klasse für neue Microsoft-Konten (Kürzel, z. B. IM24a), solange keine Zuordnung aus dem Schulsystem kommt */
  defaultClass: string | null;
  isProd: boolean;
};

/** Bindings und Variablen aus Cloudflare (lokal über wrangler, siehe next.config.ts). */
export async function serverEnv(): Promise<ServerEnv> {
  const { env } = await getCloudflareContext({ async: true });
  const e = env as Omit<CloudflareEnv, "AUTH_MODE" | "DEMO_NOW"> & { DEMO_NOW?: string; AUTH_MODE?: string; AUTH_METHODS?: string; PLANARY_AUTH_URL?: string; MS_CLIENT_ID?: string; MS_CLIENT_SECRET?: string; MS_TENANT?: string; AUTH_EXTRA_DOMAINS?: string; DEFAULT_CLASS?: string };
  const extraDomains = (e.AUTH_EXTRA_DOMAINS ?? "").split(",").map((d) => d.trim().toLowerCase()).filter(Boolean);
  return {
    db: createDb(e.DB),
    d1: e.DB,
    files: e.FILES,
    now: getNow(e.DEMO_NOW),
    demo: !!e.DEMO_NOW,
    authMethods: parseAuthMethods(e.AUTH_METHODS, e.AUTH_MODE),
    ms: e.MS_CLIENT_ID ? { clientId: e.MS_CLIENT_ID, clientSecret: e.MS_CLIENT_SECRET ?? "", tenant: e.MS_TENANT || "common", extraDomains } : null,
    planaryUrl: e.PLANARY_AUTH_URL?.replace(/\/$/, "") || null,
    extraDomains,
    defaultClass: e.DEFAULT_CLASS?.trim() || null,
    isProd: process.env.NODE_ENV === "production",
  };
}
