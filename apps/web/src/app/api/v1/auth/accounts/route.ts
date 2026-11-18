import { demoAccounts } from "@bwd/db";
import { apiError, json } from "@/lib/api";
import { serverEnv } from "@/lib/env";

/** Demo-Konten für die Auswahl beim Mock-Login. Nur mit AUTH_MODE=mock. */
export async function GET() {
  const env = await serverEnv();
  if (env.authMode !== "mock") return apiError(404, "not_found", "Nicht verfügbar.");
  return json({ accounts: await demoAccounts(env.db) });
}
