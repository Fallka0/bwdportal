import { adminSetAssignments } from "@bwd/db";
import { z } from "zod";
import { body, internal } from "@/lib/internal";

const Body = z.object({ assignments: z.array(z.object({ classCode: z.string().min(1).max(12), subject: z.string().min(1).max(8) })).max(200) });

/** Zuteilungen einer Lehrperson ersetzen (Klasse und Fach). */
export const PUT = internal(async ({ env, req, url }) => {
  const id = decodeURIComponent(url.pathname.split("/").at(-2) ?? "");
  return adminSetAssignments(env.db, id, (await body(req, Body)).assignments);
});
