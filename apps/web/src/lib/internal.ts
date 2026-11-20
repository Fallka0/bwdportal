import "server-only";
import { DomainError } from "@bwd/db";
import { z } from "zod";
import { serverEnv, type ServerEnv } from "./env";

/**
 * Interne API für planary-org (admin.planary.ch): Header x-internal-key mit dem Secret INTERNAL_KEY.
 * Rechte der Console prüft planary-org; hier zählt nur der Schlüssel. Antworten ohne Sessions, ohne Cookies.
 */
type Handler = (ctx: { env: ServerEnv; req: Request; url: URL }) => Promise<unknown>;

const enc = new TextEncoder();
/** Vergleich in konstanter Zeit (über SHA-256, damit die Länge nichts verrät). */
async function same(a: string, b: string) {
  const [x, y] = await Promise.all([crypto.subtle.digest("SHA-256", enc.encode(a)), crypto.subtle.digest("SHA-256", enc.encode(b))]);
  const u = new Uint8Array(x);
  const v = new Uint8Array(y);
  let d = 0;
  for (let i = 0; i < u.length; i++) d |= u[i]! ^ v[i]!;
  return d === 0;
}

const err = (status: number, code: string, message: string, field?: string) => Response.json({ error: { code, message, field } }, { status, headers: { "cache-control": "no-store" } });

export function internal(fn: Handler) {
  return async (req: Request) => {
    const env = await serverEnv();
    const key = req.headers.get("x-internal-key") ?? "";
    if (!env.internalKey) return err(503, "not_configured", "Interne API ist nicht eingerichtet.");
    if (!key || !(await same(key, env.internalKey))) return err(401, "unauthorized", "Schlüssel fehlt oder stimmt nicht.");
    try {
      const out = await fn({ env, req, url: new URL(req.url) });
      return Response.json(out, { headers: { "cache-control": "no-store" } });
    } catch (e) {
      if (e instanceof DomainError) return err(e.code === "not_found" ? 404 : e.code === "exists" ? 409 : 422, e.code, e.message, e.field);
      if (e instanceof z.ZodError) return err(422, "invalid", e.issues[0]?.message ?? "Ungültige Eingabe.", e.issues[0]?.path.join("."));
      console.error(e);
      return err(500, "server", "Etwas ist schiefgelaufen.");
    }
  };
}

export const body = async <S extends z.ZodType>(req: Request, schema: S): Promise<z.infer<S>> => schema.parse(await req.json().catch(() => null));
