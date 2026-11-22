import { cookies } from "next/headers";
import { allowedNext, NEXT_COOKIE } from "@/lib/next-cookie";

/** Nach dem Login: gemerktes Ziel (nur QR-Check-in) einlösen und das Cookie löschen. */
export async function GET(req: Request) {
  const raw = (await cookies()).get(NEXT_COOKIE)?.value;
  const next = raw ? decodeURIComponent(raw) : null;
  const out = new Response(null, { status: 303, headers: { location: new URL(allowedNext(next) ? next! : "/", req.url).toString(), "cache-control": "no-store" } });
  out.headers.append("set-cookie", `${NEXT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`);
  return out;
}
