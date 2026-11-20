import { adminSubjects } from "@bwd/db";
import { internal } from "@/lib/internal";

export const GET = internal(async ({ env }) => ({ subjects: await adminSubjects(env.db) }));
