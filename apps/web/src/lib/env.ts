import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb, type Db } from "@bwd/db";
import { getNow, type Now } from "@bwd/shared";
import type { MsSettings } from "./auth/microsoft";

export type ServerEnv = {
  db: Db;
  /** D1 direkt, z. B. für das Zurücksetzen der Demo-Daten */
  d1: D1Database;
  files: R2Bucket;
  now: Now;
  /** true mit DEMO_NOW: Zeit steht still (Jetzt-Linie wie im Design) */
  demo: boolean;
  /** mock: nur Demo-Konten; microsoft: nur Microsoft; both: Demo-Konten und Microsoft (Vorführung) */
  authMode: "mock" | "microsoft" | "both";
  ms: MsSettings | null;
  isProd: boolean;
};

/** Bindings und Variablen aus Cloudflare (lokal über wrangler, siehe next.config.ts). */
export async function serverEnv(): Promise<ServerEnv> {
  const { env } = await getCloudflareContext({ async: true });
  const e = env as Omit<CloudflareEnv, "AUTH_MODE" | "DEMO_NOW"> & { DEMO_NOW?: string; AUTH_MODE?: string; MS_CLIENT_ID?: string; MS_CLIENT_SECRET?: string; MS_TENANT?: string; AUTH_EXTRA_DOMAINS?: string };
  return {
    db: createDb(e.DB),
    d1: e.DB,
    files: e.FILES,
    now: getNow(e.DEMO_NOW),
    demo: !!e.DEMO_NOW,
    authMode: e.AUTH_MODE === "microsoft" || e.AUTH_MODE === "both" ? e.AUTH_MODE : "mock",
    ms: e.MS_CLIENT_ID ? { clientId: e.MS_CLIENT_ID, clientSecret: e.MS_CLIENT_SECRET ?? "", tenant: e.MS_TENANT || "common", extraDomains: (e.AUTH_EXTRA_DOMAINS ?? "").split(",").map((d) => d.trim().toLowerCase()).filter(Boolean) } : null,
    isProd: process.env.NODE_ENV === "production",
  };
}
