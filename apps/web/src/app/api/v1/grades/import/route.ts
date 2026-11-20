import { importPortfolio } from "@bwd/db";
import { PortfolioError, readPortfolio } from "@bwd/shared";
import { apiError, withUser } from "@/lib/api";

const MAX_BYTES = 15 * 1024 * 1024;

/**
 * Notenportfolio (Excel-Vorlage der Schule) hochladen: ersetzt alle eigenen Noten und die EFZ-Übersicht.
 * Die Datei wird nur gelesen, nicht gespeichert.
 */
export const POST = withUser(async ({ env, userId, req }) => {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return apiError(422, "invalid", "Datei fehlt.", "file");
  if (!/\.xlsx$/i.test(file.name)) return apiError(422, "invalid_type", "Lade das Notenportfolio als .xlsx hoch.", "file");
  if (file.size > MAX_BYTES) return apiError(422, "too_large", "Die Datei ist grösser als 15 MB.", "file");
  try {
    const p = readPortfolio(new Uint8Array(await file.arrayBuffer()));
    return await importPortfolio(env.db, userId, p, env.now);
  } catch (e) {
    if (e instanceof PortfolioError) return apiError(422, "invalid_file", e.message, "file");
    throw e;
  }
});
