import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { DomainError } from "@bwd/db";
import { serverEnv, type ServerEnv } from "./env";
import { currentUserId } from "./auth";

type Handler = (ctx: { env: ServerEnv; userId: string; req: Request }) => Promise<unknown>;

export function apiError(status: number, code: string, message: string, field?: string) {
  return NextResponse.json({ error: { code, message, ...(field ? { field } : {}) } }, { status, headers: { "cache-control": "no-store" } });
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "cache-control": "no-store" } });
}

/** Route Handler mit Session-Prüfung und einheitlichen Fehlern. */
export function withUser(fn: Handler) {
  return async (req: Request) => {
    try {
      const env = await serverEnv();
      const userId = await currentUserId(env);
      if (!userId) return apiError(401, "unauthorized", "Bitte melde dich an.");
      const out = await fn({ env, userId, req });
      return out instanceof Response ? out : json(out);
    } catch (e) {
      if (e instanceof DomainError) return apiError(e.code === "not_found" ? 404 : 422, e.code, e.message, e.field);
      console.error(e);
      return apiError(500, "server", "Etwas ist schiefgelaufen. Versuche es nochmals.");
    }
  };
}

/** Body lesen und mit Zod prüfen. Fehler wird als 422 mit Feldname zurückgegeben. */
export async function parseBody<S extends z.ZodType>(req: Request, schema: S): Promise<z.infer<S>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new DomainError("invalid_json", "Die Anfrage ist ungültig.");
  }
  const r = schema.safeParse(raw);
  if (!r.success) {
    const issue = r.error.issues[0];
    throw new DomainError("invalid", issue?.message ?? "Ungültige Eingabe.", issue?.path.join("."));
  }
  return r.data;
}
