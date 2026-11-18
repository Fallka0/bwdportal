import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb, type Db } from "@bwd/db";
import { getNow, type Now } from "@bwd/shared";

export type ServerEnv = {
  db: Db;
  /** D1 direkt, z. B. für das Zurücksetzen der Demo-Daten */
  d1: D1Database;
  files: R2Bucket;
  now: Now;
  authMode: "mock" | "microsoft";
  isProd: boolean;
};

/** Bindings und Variablen aus Cloudflare (lokal über wrangler, siehe next.config.ts). */
export async function serverEnv(): Promise<ServerEnv> {
  const { env } = await getCloudflareContext({ async: true });
  const e = env as Omit<CloudflareEnv, "AUTH_MODE" | "DEMO_NOW"> & { DEMO_NOW?: string; AUTH_MODE?: string };
  return {
    db: createDb(e.DB),
    d1: e.DB,
    files: e.FILES,
    now: getNow(e.DEMO_NOW),
    authMode: e.AUTH_MODE === "microsoft" ? "microsoft" : "mock",
    isProd: process.env.NODE_ENV === "production",
  };
}
