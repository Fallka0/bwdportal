import { demoAccounts } from "@bwd/db";
import { apiError, json } from "@/lib/api";
import { serverEnv } from "@/lib/env";
import { mockAllowed } from "@/lib/auth";

/** Demo-Konten für die Auswahl beim Mock-Login. Nur wenn AUTH_METHODS mock enthält. */
export async function GET() {
  const env = await serverEnv();
  if (!mockAllowed(env)) return apiError(404, "not_found", "Nicht verfügbar.");
  return json({ accounts: await demoAccounts(env.db) });
}
