import { currentUserId } from "@/lib/auth";
import { serverEnv } from "@/lib/env";
import { NEXT_COOKIE } from "@/lib/next-cookie";

/**
 * Ziel des QR-Codes in der Lernzone. Angemeldet: weiter zur Bestätigung. Sonst zum Login; das Ziel merkt sich ein
 * Cookie für fünf Minuten, die Übersicht leitet nach dem Login dorthin weiter.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = (url.searchParams.get("c") ?? "").replace(/[^0-9a-f]/g, "").slice(0, 64);
  const target = `/sol/checkin?c=${code}`;
  const env = await serverEnv();
  const signedIn = !!(await currentUserId(env, req));
  const out = new Response(null, { status: 303, headers: { location: new URL(signedIn ? target : "/login", url).toString(), "cache-control": "no-store" } });
  if (!signedIn) out.headers.append("set-cookie", `${NEXT_COOKIE}=${encodeURIComponent(target)}; Path=/; Max-Age=300; HttpOnly; SameSite=Lax${url.protocol === "https:" ? "; Secure" : ""}`);
  return out;
}
