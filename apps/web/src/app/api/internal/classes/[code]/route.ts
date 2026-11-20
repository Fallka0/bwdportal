import { adminUpdateClass } from "@bwd/db";
import { z } from "zod";
import { body, internal } from "@/lib/internal";

const Patch = z.object({ program: z.string().max(120).nullable().optional(), classTeacherId: z.string().max(64).nullable().optional() });

/** Lehrgang oder Klassenlehrperson ändern. */
export const PATCH = internal(async ({ env, req, url }) => adminUpdateClass(env.db, decodeURIComponent(url.pathname.split("/").pop() ?? ""), await body(req, Patch)));
