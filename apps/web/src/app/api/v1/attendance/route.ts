import { ATTENDANCE_DAYS_BACK, attendanceSlots } from "@bwd/db";
import { addDays } from "@bwd/shared";
import { withUser } from "@/lib/api";

/** Präsenz der Lehrperson: Kontrollen der letzten Tage bis heute. */
export const GET = withUser(async ({ env, userId }) => ({ slots: await attendanceSlots(env.db, userId, addDays(env.now.date, -ATTENDANCE_DAYS_BACK), env.now.date) }));
