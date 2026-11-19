import { json } from "@/lib/api";
import { microsoftAllowed, mockAllowed } from "@/lib/auth";
import { msConfigured } from "@/lib/auth/microsoft";
import { serverEnv } from "@/lib/env";

/** Welche Anmeldungen es gibt (für die App). */
export async function GET() {
  const env = await serverEnv();
  return json({ mock: mockAllowed(env), microsoft: microsoftAllowed(env) && msConfigured(env.ms) });
}
