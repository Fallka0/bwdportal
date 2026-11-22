/**
 * QR-Check-in in der Lernzone. Die Lehrperson zeigt am SOL-Tag einen Code, der alle 20 Sekunden neu entsteht und
 * 45 Sekunden gilt. Lernende der Klasse scannen ihn: der erste Scan setzt "Check-in", der zweite "Check-out" im
 * SOL-Portfolio (dieselben Felder, die sie sonst von Hand eintragen). Zeiten in Wanduhrzeit des Portals.
 */
import { and, asc, eq, gte, lt, sql } from "drizzle-orm";
import { type CheckinBoard, type CheckinInfo, type Now } from "@bwd/shared";
import type { Db } from "./client";
import { DomainError, randomId, teacherScope } from "./queries";
import * as s from "./schema";

export const CHECKIN_TTL_MS = 45_000;

async function teacherClass(db: Db, userId: string, classCode: string) {
  const u = (await db.select({ role: s.users.role }).from(s.users).where(eq(s.users.id, userId)).limit(1))[0];
  if (u?.role !== "teacher") throw new DomainError("forbidden", "Nur für Lehrpersonen.");
  const c = (await db.select().from(s.classes).where(sql`lower(${s.classes.code}) = ${classCode.toLowerCase()}`).limit(1))[0];
  if (!c) throw new DomainError("not_found", "Diese Klasse gibt es nicht.");
  const assigned = (await teacherScope(db, userId)).some((a) => a.classId === c.id);
  if (!assigned && c.classTeacherId !== userId) throw new DomainError("not_found", "Diese Klasse ist dir nicht zugeteilt.");
  return c;
}

async function solDayOf(db: Db, classId: string, date: string) {
  return (
    await db
      .select({ id: s.solDays.id, date: s.solDays.date })
      .from(s.solDays)
      .innerJoin(s.solBlocks, eq(s.solBlocks.id, s.solDays.blockId))
      .where(and(eq(s.solBlocks.classId, classId), eq(s.solDays.date, date)))
      .limit(1)
  )[0];
}

/** Tafel der Lehrperson: neuer Code (am SOL-Tag) und Stand der Klasse. `ms` ist die echte Uhrzeit für die Gültigkeit. */
export async function checkinBoard(db: Db, userId: string, classCode: string, now: Now, ms: number): Promise<CheckinBoard> {
  const c = await teacherClass(db, userId, classCode);
  const day = await solDayOf(db, c.id, now.date);
  const next = day
    ? null
    : ((
        await db
          .select({ date: s.solDays.date })
          .from(s.solDays)
          .innerJoin(s.solBlocks, eq(s.solBlocks.id, s.solDays.blockId))
          .where(and(eq(s.solBlocks.classId, c.id), sql`${s.solDays.date} > ${now.date}`))
          .orderBy(asc(s.solDays.date))
          .limit(1)
      )[0]?.date ?? null);
  let code: string | null = null;
  let expiresAt: number | null = null;
  if (day) {
    await db.delete(s.solCheckinCodes).where(lt(s.solCheckinCodes.expiresAt, ms));
    code = randomId(12);
    expiresAt = ms + CHECKIN_TTL_MS;
    await db.insert(s.solCheckinCodes).values({ code, classId: c.id, solDayId: day.id, createdBy: userId, expiresAt });
  }
  const students = await db
    .select({ id: s.users.id, first: s.users.firstName, last: s.users.lastName, inT: s.solPortfolio.checkIn, outT: s.solPortfolio.checkOut })
    .from(s.users)
    .leftJoin(s.solPortfolio, and(eq(s.solPortfolio.userId, s.users.id), eq(s.solPortfolio.solDayId, day?.id ?? "")))
    .where(and(eq(s.users.classId, c.id), eq(s.users.role, "student")))
    .orderBy(asc(s.users.lastName), asc(s.users.firstName));
  return {
    classCode: c.code,
    date: now.date,
    day: day ?? null,
    nextDay: next,
    code,
    expiresAt,
    students: students.map((x) => ({ id: x.id, name: `${x.first} ${x.last}`, checkIn: day ? (x.inT ?? null) : null, checkOut: day ? (x.outT ?? null) : null })),
  };
}

/** Gültiger Code (nicht abgelaufen) mit Klasse und Datum des SOL-Tags, sonst null. */
async function validCode(db: Db, code: string, ms: number) {
  return (
    (
      await db
        .select({ k: s.solCheckinCodes, cls: s.classes.code, date: s.solDays.date })
        .from(s.solCheckinCodes)
        .innerJoin(s.classes, eq(s.classes.id, s.solCheckinCodes.classId))
        .innerJoin(s.solDays, eq(s.solDays.id, s.solCheckinCodes.solDayId))
        .where(and(eq(s.solCheckinCodes.code, code), gte(s.solCheckinCodes.expiresAt, ms)))
        .limit(1)
    )[0] ?? null
  );
}

async function portfolioRow(db: Db, userId: string, dayId: string) {
  return (await db.select().from(s.solPortfolio).where(and(eq(s.solPortfolio.userId, userId), eq(s.solPortfolio.solDayId, dayId))).limit(1))[0];
}

/** Nach dem Scannen: gilt der Code für mich, und ist der nächste Schritt Check-in oder Check-out? */
export async function checkinInfo(db: Db, userId: string, code: string, ms: number): Promise<CheckinInfo> {
  const v = await validCode(db, code, ms);
  const u = (await db.select({ classId: s.users.classId, role: s.users.role }).from(s.users).where(eq(s.users.id, userId)).limit(1))[0];
  if (!v || u?.role === "teacher" || u?.classId !== v.k.classId) return { valid: false, classCode: null, date: null, next: null, checkIn: null, checkOut: null };
  const row = await portfolioRow(db, userId, v.k.solDayId);
  const next = !row?.checkIn ? "in" : !row.checkOut ? "out" : "done";
  return { valid: true, classCode: v.cls, date: v.date, next, checkIn: row?.checkIn ?? null, checkOut: row?.checkOut ?? null };
}

/** Code einlösen: setzt Check-in, beim zweiten Mal Check-out. */
export async function redeemCheckin(db: Db, userId: string, code: string, now: Now, ms: number): Promise<CheckinInfo> {
  const info = await checkinInfo(db, userId, code, ms);
  if (!info.valid) throw new DomainError("invalid", "Dieser Code ist abgelaufen oder nicht für deine Klasse. Scanne den Code in der Lernzone nochmals.");
  if (info.next === "done") throw new DomainError("invalid", "Du bist heute schon ein- und ausgecheckt.");
  const v = (await validCode(db, code, ms))!;
  const row = await portfolioRow(db, userId, v.k.solDayId);
  if (!row) await db.insert(s.solPortfolio).values({ id: `pf-${randomId(8)}`, userId, solDayId: v.k.solDayId, checkIn: now.time, checkOut: null, updatedAt: now.stamp });
  else await db.update(s.solPortfolio).set(info.next === "in" ? { checkIn: now.time, updatedAt: now.stamp } : { checkOut: now.time, updatedAt: now.stamp }).where(eq(s.solPortfolio.id, row.id));
  return checkinInfo(db, userId, code, ms);
}
