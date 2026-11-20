import { adminClasses, adminCreateClass } from "@bwd/db";
import { z } from "zod";
import { body, internal } from "@/lib/internal";

export const GET = internal(async ({ env }) => ({ classes: await adminClasses(env.db) }));

/** Klasse anlegen (Kürzel wie IM25a). */
export const POST = internal(async ({ env, req }) => adminCreateClass(env.db, await body(req, z.object({ code: z.string().min(2).max(12), program: z.string().max(120).nullable().optional() }))));
