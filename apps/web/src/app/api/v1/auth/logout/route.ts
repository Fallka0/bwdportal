import { json } from "@/lib/api";
import { authProvider, sessionCookie, sessionToken } from "@/lib/auth";
import { serverEnv } from "@/lib/env";

export async function POST() {
  const env = await serverEnv();
  const t = await sessionToken();
  if (t) await authProvider(env).signOut(t);
  const res = json({ ok: true });
  res.cookies.set(sessionCookie("", env.isProd, 0));
  return res;
}
