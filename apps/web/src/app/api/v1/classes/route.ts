import { teacherClasses } from "@bwd/db";
import { withUser } from "@/lib/api";

/** Klassen der Lehrperson. */
export const GET = withUser(async ({ env, userId }) => ({ classes: await teacherClasses(env.db, userId) }));
