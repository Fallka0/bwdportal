import { getPortfolioSubject } from "@bwd/db";
import { apiError, withUser } from "@/lib/api";

/** Proben eines Fachs in einem Semester (?semester=, für Informatik ?modul=320). */
export const GET = withUser(async ({ env, userId, req }) => {
  const url = new URL(req.url);
  const code = decodeURIComponent(url.pathname.split("/").pop() ?? "").toUpperCase();
  const n = Number(url.searchParams.get("semester") ?? 0);
  const r = await getPortfolioSubject(env.db, userId, env.now, code, n || undefined, url.searchParams.get("modul"));
  return r ?? apiError(404, "not_found", "Dieses Fach gibt es nicht.");
});
