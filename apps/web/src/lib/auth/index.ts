import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getMe } from "@bwd/db";
import type { Me } from "@bwd/shared";
import { serverEnv, type ServerEnv } from "../env";
import { MicrosoftAuthProvider } from "./microsoft";
import { MockAuthProvider } from "./mock";
import { PlanaryAuthProvider } from "./planary";
import type { AuthProvider } from "./types";

export const SESSION_COOKIE = "bwd_session";

/** Anbieter für eine Anmeldeart. Sessions sind bei beiden gleich, darum genügt für getSession/signOut einer. */
export function authProvider(env: ServerEnv, kind?: "mock" | "microsoft" | "planary"): AuthProvider {
  if (kind === "planary") return new PlanaryAuthProvider(env);
  if (kind === "microsoft") return new MicrosoftAuthProvider(env);
  return new MockAuthProvider(env);
}

export const mockAllowed = (env: ServerEnv) => env.authMethods.has("mock");
export const microsoftAllowed = (env: ServerEnv) => env.authMethods.has("microsoft");
export const planaryAllowed = (env: ServerEnv) => env.authMethods.has("planary") && !!env.planaryUrl;

/**
 * Session-ID aus dem Bearer-Token (App), dem Cookie (Web) oder, nur für Downloads unter /api/v1/files,
 * aus dem Parameter `t`: Links aus der App können keinen Header mitsenden.
 */
export async function sessionToken(req?: Request): Promise<string | null> {
  const h = await headers();
  const auth = h.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim() || null;
  const cookie = (await cookies()).get(SESSION_COOKIE)?.value;
  if (cookie) return cookie;
  if (req) {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/api/v1/files/")) return url.searchParams.get("t");
  }
  return null;
}

export async function currentUserId(env: ServerEnv, req?: Request): Promise<string | null> {
  const t = await sessionToken(req);
  return t ? authProvider(env).getSession(t) : null;
}

/** Für Seiten: angemeldete Person oder Weiterleitung zum Login. */
export async function requireUser(): Promise<{ env: ServerEnv; me: Me }> {
  const env = await serverEnv();
  const id = await currentUserId(env);
  const me = id ? await getMe(env.db, id, env.now) : null;
  if (!me) redirect("/login");
  return { env, me };
}

/** Für Seiten nur für Lernende (Noten, SOL, Absenzen): Lehrpersonen gehen zur Übersicht. */
export async function requireStudent(): Promise<{ env: ServerEnv; me: Me }> {
  const r = await requireUser();
  if (r.me.role === "teacher") redirect("/");
  return r;
}

/** Für Seiten nur für Lehrpersonen (Präsenz, Klassen): Lernende gehen zur Übersicht. */
export async function requireTeacher(): Promise<{ env: ServerEnv; me: Me }> {
  const r = await requireUser();
  if (r.me.role !== "teacher") redirect("/");
  return r;
}

export function sessionCookie(value: string, isProd: boolean, maxAge = 60 * 60 * 24 * 30) {
  return { name: SESSION_COOKIE, value, httpOnly: true, secure: isProd, sameSite: "lax" as const, path: "/", maxAge };
}
