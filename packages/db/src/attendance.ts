/**
 * Präsenz (Pilot neben der Absenzendatenbank). Lehrpersonen kontrollieren ihre Lektionen; wer fehlt, steht als
 * absence_lessons wie in der Absenzendatenbank. Kontingent und "unentschuldigt" rechnet getAbsences daraus mit den
 * Abmeldungen und Gesuchen der Lernenden. Doppellektionen (gleiches Fach, gleiche Klasse, direkt hintereinander)
 * werden zusammen erfasst. Erfassen darf, wem das Fach in der Klasse zugeteilt ist, und die Klassenlehrperson.
 */
import { and, asc, eq, gte, inArray, lte } from "drizzle-orm";
import { fmtLong, fmtPeriods, initials, periodOf, type AttendanceSheet, type AttendanceSlot, type ClassView, type Lesson, type Now } from "@bwd/shared";
import type { Db } from "./client";
import { DomainError, getAbsences, lessonsBetween, randomId, teacherClasses, teacherScope } from "./queries";
import { insertNotifications } from "./push";
import * as s from "./schema";

async function requireTeacher(db: Db, userId: string) {
  const u = (await db.select({ role: s.users.role }).from(s.users).where(eq(s.users.id, userId)).limit(1))[0];
  if (u?.role !== "teacher") throw new DomainError("forbidden", "Nur für Lehrpersonen.");
}

/** Darf die Lehrperson dieses Fach in dieser Klasse erfassen? */
async function mayRecord(db: Db, userId: string, classId: string, subject: string) {
  const assigned = (await teacherScope(db, userId)).some((a) => a.classId === classId && a.subject === subject);
  if (assigned) return true;
  const own = (await db.select({ id: s.classes.id }).from(s.classes).where(and(eq(s.classes.id, classId), eq(s.classes.classTeacherId, userId))).limit(1))[0];
  return !!own;
}

const counts = (l: Lesson) => l.state === "normal" || l.state === "room_changed";

/** Lektionen eines Tages zu Kontrollen: direkt folgende Lektionen desselben Fachs in derselben Klasse gehören zusammen. */
function runs(lessons: Lesson[]): Lesson[][] {
  const sorted = lessons.filter(counts).sort((a, b) => (a.date + a.start + (a.classCode ?? "")).localeCompare(b.date + b.start + (b.classCode ?? "")));
  const out: Lesson[][] = [];
  for (const l of sorted) {
    const p = periodOf(l.start);
    const run = out.find((r) => {
      const last = r.at(-1)!;
      const lp = periodOf(last.start);
      return last.date === l.date && last.classCode === l.classCode && last.subject?.code === l.subject?.code && lp !== null && p !== null && p === lp + 1;
    });
    if (run) run.push(l);
    else out.push([l]);
  }
  return out.sort((a, b) => (a[0]!.date + a[0]!.start).localeCompare(b[0]!.date + b[0]!.start));
}

/** Kontrollen der Lehrperson zwischen zwei Daten (eigene Lektionen), mit Stand der Erfassung. */
export async function attendanceSlots(db: Db, userId: string, from: string, to: string): Promise<AttendanceSlot[]> {
  const lessons = await lessonsBetween(db, userId, from, to);
  const groups = runs(lessons).filter((r) => r[0]!.subject && r[0]!.classCode);
  if (!groups.length) return [];
  const classIds = new Map((await db.select({ id: s.classes.id, code: s.classes.code }).from(s.classes)).map((c) => [c.code, c.id]));
  const checks = await db
    .select()
    .from(s.attendanceChecks)
    .where(and(inArray(s.attendanceChecks.classId, [...new Set(groups.map((g) => classIds.get(g[0]!.classCode!) ?? ""))]), gte(s.attendanceChecks.date, from), lte(s.attendanceChecks.date, to)));
  return groups.map((g) => {
    const first = g[0]!;
    const c = checks.find((x) => x.classId === classIds.get(first.classCode!) && x.date === first.date && x.startTime === first.start && x.subjectCode === first.subject!.code);
    return {
      id: first.id,
      date: first.date,
      start: first.start,
      end: g.at(-1)!.end,
      periods: g.map((l) => periodOf(l.start)).filter((p): p is number => p !== null),
      classCode: first.classCode!,
      subject: first.subject!,
      room: first.room,
      checked: c ? { at: c.recordedAt, absent: c.absent } : null,
    };
  });
}

/** Die Kontrolle zu einer Lektion: Lektion laden, Rechte prüfen, Doppellektion dazunehmen. */
async function slotOf(db: Db, userId: string, lessonId: string) {
  await requireTeacher(db, userId);
  const row = (
    await db
      .select({ l: s.lessons, c: s.classes, sub: s.subjects })
      .from(s.lessons)
      .innerJoin(s.classes, eq(s.classes.id, s.lessons.classId))
      .leftJoin(s.subjects, eq(s.subjects.code, s.lessons.subjectCode))
      .where(eq(s.lessons.id, lessonId))
      .limit(1)
  )[0];
  if (!row || !row.sub || (row.l.state !== "normal" && row.l.state !== "room_changed")) throw new DomainError("not_found", "Diese Lektion gibt es nicht.");
  if (!(await mayRecord(db, userId, row.c.id, row.sub.code))) throw new DomainError("forbidden", "Diese Lektion ist dir nicht zugeteilt.");
  const sameDay = await db
    .select()
    .from(s.lessons)
    .where(and(eq(s.lessons.classId, row.c.id), eq(s.lessons.date, row.l.date), eq(s.lessons.subjectCode, row.sub.code)))
    .orderBy(asc(s.lessons.startTime));
  const asLesson = (l: typeof s.lessons.$inferSelect): Lesson => ({
    id: l.id,
    date: l.date,
    start: l.startTime,
    end: l.endTime,
    subject: { code: row.sub!.code, name: row.sub!.name, short: row.sub!.short },
    teacher: null,
    room: l.room,
    state: l.state,
    originalRoom: l.originalRoom,
    classCode: row.c.code,
  });
  const run = runs(sameDay.map(asLesson)).find((r) => r.some((l) => l.id === lessonId)) ?? [asLesson(row.l)];
  const periods = run.map((l) => periodOf(l.start)).filter((p): p is number => p !== null);
  if (!periods.length) throw new DomainError("invalid", "Diese Lektion hat keine Lektionsnummer.");
  return { classId: row.c.id, classCode: row.c.code, subject: run[0]!.subject!, date: run[0]!.date, start: run[0]!.start, end: run.at(-1)!.end, room: run[0]!.room, firstId: run[0]!.id, periods };
}

async function studentsOf(db: Db, classId: string) {
  return db
    .select({ id: s.users.id, first: s.users.firstName, last: s.users.lastName, email: s.users.email })
    .from(s.users)
    .where(and(eq(s.users.classId, classId), eq(s.users.role, "student")))
    .orderBy(asc(s.users.lastName), asc(s.users.firstName));
}

export async function getAttendanceSheet(db: Db, userId: string, lessonId: string, now: Now): Promise<AttendanceSheet> {
  const sl = await slotOf(db, userId, lessonId);
  const students = await studentsOf(db, sl.classId);
  const ids = students.map((x) => x.id);
  const missed = ids.length
    ? await db
        .select({ user: s.absences.userId, period: s.absenceLessons.period })
        .from(s.absenceLessons)
        .innerJoin(s.absences, eq(s.absences.id, s.absenceLessons.absenceId))
        .where(and(inArray(s.absences.userId, ids), eq(s.absences.date, sl.date), inArray(s.absenceLessons.period, sl.periods)))
    : [];
  const notices = ids.length ? await db.select().from(s.absenceNotices).where(and(inArray(s.absenceNotices.userId, ids), eq(s.absenceNotices.date, sl.date))) : [];
  const dispensed = ids.length
    ? await db
        .select({ user: s.dispensations.userId, period: s.dispensationLessons.period })
        .from(s.dispensationLessons)
        .innerJoin(s.dispensations, eq(s.dispensations.id, s.dispensationLessons.dispensationId))
        .where(and(inArray(s.dispensations.userId, ids), eq(s.dispensations.date, sl.date), eq(s.dispensations.status, "approved"), inArray(s.dispensationLessons.period, sl.periods)))
    : [];
  const check = (
    await db
      .select()
      .from(s.attendanceChecks)
      .where(and(eq(s.attendanceChecks.classId, sl.classId), eq(s.attendanceChecks.date, sl.date), eq(s.attendanceChecks.startTime, sl.start), eq(s.attendanceChecks.subjectCode, sl.subject.code)))
      .limit(1)
  )[0];
  return {
    slot: { id: sl.firstId, date: sl.date, start: sl.start, end: sl.end, periods: sl.periods, classCode: sl.classCode, subject: sl.subject, room: sl.room, checked: check ? { at: check.recordedAt, absent: check.absent } : null },
    students: students.map((x) => ({
      id: x.id,
      name: `${x.first} ${x.last}`,
      initials: initials(x.first, x.last),
      absent: missed.some((m) => m.user === x.id),
      notice: notices.some((n) => n.userId === x.id && sl.periods.some((p) => p >= n.fromPeriod && p <= n.toPeriod)),
      dispensed: dispensed.some((d) => d.user === x.id),
    })),
    editable: sl.date <= now.date,
  };
}

/** Präsenz speichern: Fehlende als Absenz-Lektionen, Anwesende ohne. Neu Fehlende erhalten eine Benachrichtigung. */
export async function saveAttendance(db: Db, userId: string, lessonId: string, absentIds: string[], now: Now): Promise<AttendanceSheet> {
  const sl = await slotOf(db, userId, lessonId);
  if (sl.date > now.date) throw new DomainError("invalid", "Die Präsenz lässt sich erst ab dem Tag der Lektion erfassen.");
  const students = await studentsOf(db, sl.classId);
  const absent = new Set(absentIds);
  for (const id of absent) if (!students.some((x) => x.id === id)) throw new DomainError("invalid", "Diese Person ist nicht in der Klasse.", "absent");
  const before = await getAttendanceSheet(db, userId, lessonId, now);
  const newly: string[] = [];

  for (const st of students) {
    const day = (await db.select().from(s.absences).where(and(eq(s.absences.userId, st.id), eq(s.absences.date, sl.date))).limit(1))[0];
    if (absent.has(st.id)) {
      const absenceId = day?.id ?? `ab-${randomId(8)}`;
      if (!day) await db.insert(s.absences).values({ id: absenceId, userId: st.id, date: sl.date, createdAt: now.stamp });
      for (const period of sl.periods) {
        await db
          .insert(s.absenceLessons)
          .values({ absenceId, period, subjectCode: sl.subject.code, recordedBy: userId, recordedAt: now.stamp })
          .onConflictDoUpdate({ target: [s.absenceLessons.absenceId, s.absenceLessons.period], set: { subjectCode: sl.subject.code, recordedBy: userId, recordedAt: now.stamp } });
      }
      if (!before.students.find((x) => x.id === st.id)?.absent) newly.push(st.id);
    } else if (day) {
      await db.delete(s.absenceLessons).where(and(eq(s.absenceLessons.absenceId, day.id), inArray(s.absenceLessons.period, sl.periods)));
      const left = await db.select({ p: s.absenceLessons.period }).from(s.absenceLessons).where(eq(s.absenceLessons.absenceId, day.id)).limit(1);
      if (!left.length) await db.delete(s.absences).where(eq(s.absences.id, day.id));
    }
  }

  await db
    .insert(s.attendanceChecks)
    .values({ classId: sl.classId, date: sl.date, startTime: sl.start, subjectCode: sl.subject.code, recordedBy: userId, recordedAt: now.stamp, absent: absent.size })
    .onConflictDoUpdate({
      target: [s.attendanceChecks.classId, s.attendanceChecks.date, s.attendanceChecks.startTime, s.attendanceChecks.subjectCode],
      set: { recordedBy: userId, recordedAt: now.stamp, absent: absent.size },
    });

  if (newly.length) {
    const on = await db.select({ id: s.settings.userId, on: s.settings.nAbsences }).from(s.settings).where(inArray(s.settings.userId, newly));
    const rows = newly
      .filter((id) => on.find((x) => x.id === id)?.on !== false)
      .map((id) => ({
        id: `nt-${randomId(10)}`,
        userId: id,
        kind: "warn",
        icon: "clock",
        title: `Absenz erfasst: ${sl.subject.name}`,
        body: `${fmtLong(sl.date)} · ${fmtPeriods(sl.periods)}`,
        href: "/absenzen",
        createdAt: now.stamp,
      }));
    await insertNotifications(db, rows);
  }
  return getAttendanceSheet(db, userId, lessonId, now);
}

/** Klasse aus Sicht der Lehrperson. Absenzen der Lernenden sieht nur die Klassenlehrperson. */
export async function getClassView(db: Db, userId: string, code: string, now: Now): Promise<ClassView> {
  await requireTeacher(db, userId);
  const mine = (await teacherClasses(db, userId)).find((c) => c.code.toLowerCase() === code.toLowerCase());
  if (!mine) throw new DomainError("not_found", "Diese Klasse ist dir nicht zugeteilt.");
  const cls = (await db.select({ id: s.classes.id }).from(s.classes).where(eq(s.classes.code, mine.code)).limit(1))[0]!;
  const students = await studentsOf(db, cls.id);
  const out: ClassView["students"] = [];
  for (const st of students) {
    let absences: ClassView["students"][number]["absences"] = null;
    if (mine.classTeacher) {
      const a = await getAbsences(db, st.id, now);
      const lessons = a.items.flatMap((i) => i.lessons);
      absences = {
        missed: a.contingent.missed,
        unexcused: lessons.filter((l) => l.state === "unexcused").length,
        contingentAvailable: a.contingent.available,
        contingentSize: a.contingent.size,
        lastDate: a.items[0]?.date ?? null,
      };
    }
    out.push({ id: st.id, name: `${st.first} ${st.last}`, initials: initials(st.first, st.last), email: st.email, absences });
  }
  return { code: mine.code, program: mine.program, classTeacher: mine.classTeacher, subjects: mine.subjects, students: out };
}

/** Wie viele Tage zurück die Präsenzliste reicht. */
export const ATTENDANCE_DAYS_BACK = 7;
