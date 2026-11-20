import { config } from "@bwd/shared";
import { serverEnv } from "@/lib/env";
import { downloadHeaders } from "@/lib/files";

/** Android-App (APK) zum Herunterladen, ohne Anmeldung. Liegt in R2 unter app/bwd-portal.apk. */
export async function GET() {
  const env = await serverEnv();
  const obj = config.app.android.version ? await env.files.get("app/bwd-portal.apk").catch(() => null) : null;
  if (!obj) return new Response("Die App ist noch nicht verfügbar.", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
  return new Response(obj.body as unknown as BodyInit, {
    headers: { ...downloadHeaders(`bwd-Portal-${config.app.android.version}.apk`, "application/vnd.android.package-archive", false), "content-length": String(obj.size), "cache-control": "public, max-age=300" },
  });
}
