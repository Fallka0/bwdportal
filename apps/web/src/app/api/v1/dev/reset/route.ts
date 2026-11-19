import { seedStatements } from "@bwd/db";
import { apiError, json } from "@/lib/api";
import { serverEnv } from "@/lib/env";
import { mockAllowed } from "@/lib/auth";

/** Demo-Daten auf den Stand des Seeds zurücksetzen. Nur mit AUTH_MODE=mock (Entwicklung, Tests, Demo). */
export async function POST() {
  const env = await serverEnv();
  if (!mockAllowed(env)) return apiError(404, "not_found", "Nicht verfügbar.");
  // Batch läuft als eine Transaktion. Sessions fallen mit den Konten weg: danach neu anmelden.
  await env.d1.batch(seedStatements().map((sql) => env.d1.prepare(sql)));
  return json({ ok: true });
}
