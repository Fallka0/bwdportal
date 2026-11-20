import { adminPerson, adminUpdatePerson } from "@bwd/db";
import { z } from "zod";
import { body, internal } from "@/lib/internal";

const idOf = (url: URL) => decodeURIComponent(url.pathname.split("/").pop() ?? "");
const Patch = z.object({ role: z.enum(["student", "teacher"], { message: "Rolle ist student oder teacher." }).optional(), classCode: z.string().max(12).nullable().optional() });

export const GET = internal(async ({ env, url }) => adminPerson(env.db, idOf(url)));

/** Rolle (student, teacher) oder Klasse ändern. */
export const PATCH = internal(async ({ env, req, url }) => adminUpdatePerson(env.db, idOf(url), await body(req, Patch)));
