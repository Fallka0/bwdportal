/**
 * Prüfungskalender. Lehrpersonen erfassen Prüfungen für ihre zugewiesenen Fächer und Klassen; Lernende sehen die
 * Prüfungen ihrer Klasse und erfassen eigene, die nur sie sehen. Klassenlehrpersonen sehen alle Prüfungen ihrer
 * Klassen. Ändern und Löschen darf nur, wer die Prüfung erfasst hat.
 */
import { and, asc, desc, eq, gte, inArray, isNull, lt, lte, or, type SQL } from "drizzle-orm";
import { fmtLong, type Lesson, type Now, type Subject, type TestInput, type TestItem } from "@bwd/shared";
import type { Db } from "./client";
import { DomainError, randomId, teacherScope } from "./queries";
import { insertNotifications } from "./push";
import * as s from "./schema";

type Who = { id: string; teacher: boolean; classId: string | null; scope: Awaited<ReturnType<typeof teacherScope>>; classTeacherOf: string[] };

async function who(db: Db, userId: string): Promise<Who> {
  const u = (await db.select({ classId: s.users.classId, role: s.users.role }).from(s.users).where(eq(s.users.id, userId)).limit(1))[0];
  if (!u) throw new DomainError("not_found", "Konto nicht gefunden.");
  const teacher = u.role === "teacher";
  return {
    id: userId,
    teacher,
    classId: teacher ? null : u.classId,
    scope: teacher ? await teacherScope(db, userId) : [],
    classTeacherOf: teacher ? (await db.select({ id: s.classes.id }).from(s.classes).where(eq(s.classes.classTeacherId, userId))).map((r) => r.id) : [],
  };
}

/** Welche Prüfungen jemand sieht. */
function visible(w: Who): SQL {
  if (w.teacher) {
    const parts: SQL[] = [eq(s.tests.ownerId, w.id)];
    for (const a of w.scope) parts.push(and(eq(s.tests.classId, a.classId), eq(s.tests.subjectCode, a.subject))!);
    if (w.classTeacherOf.length) parts.push(inArray(s.tests.classId, w.classTeacherOf));
    return or(...parts)!;
  }
  const own = and(eq(s.tests.ownerId, w.id), isNull(s.tests.classId))!;
  return w.classId ? or(eq(s.tests.classId, w.classId), own)! : own;
}

async function load(db: Db, w: Who, where: SQL, order: "asc" | "desc" = "asc"): Promise<TestItem[]> {
  const rows = await db
    .select({ t: s.tests, sub: s.subjects, c: s.classes.code, first: s.users.firstName, last: s.users.lastName })
    .from(s.tests)
    .leftJoin(s.subjects, eq(s.subjects.code, s.tests.subjectCode))
    .leftJoin(s.classes, eq(s.classes.id, s.tests.classId))
    .innerJoin(s.users, eq(s.users.id, s.tests.ownerId))
    .where(and(visible(w), where))
    .orderBy(order === "asc" ? asc(s.tests.date) : desc(s.tests.date), asc(s.tests.subjectCode));
  return rows.map(({ t, sub, c, first, last }) => ({
    id: t.id,
    date: t.date,
    subject: sub ? { code: sub.code, name: sub.name, short: sub.short } : { code: t.subjectCode, name: t.subjectCode, short: t.subjectCode },
    title: t.title,
    description: t.description,
    classCode: t.classId ? c : null,
    author: t.classId ? `${first} ${last}` : null,
    mine: t.ownerId === w.id,
  }));
}

/** Prüfungen ab heute (aufsteigend, optional bis `to`) oder vergangene (absteigend). */
export async function listTests(db: Db, userId: string, now: Now, opts: { past?: boolean; to?: string; limit?: number } = {}): Promise<TestItem[]> {
  const w = await who(db, userId);
  const list = opts.past
    ? await load(db, w, lt(s.tests.date, now.date), "desc")
    : await load(db, w, opts.to ? and(gte(s.tests.date, now.date), lte(s.tests.date, opts.to))! : gte(s.tests.date, now.date));
  return opts.limit ? list.slice(0, opts.limit) : list;
}

export async function testsBetween(db: Db, userId: string, from: string, to: string): Promise<TestItem[]> {
  return load(db, await who(db, userId), and(gte(s.tests.date, from), lte(s.tests.date, to))!);
}

/** Lektionen mit Prüfung markieren: gleiches Datum und Fach, bei Lehrpersonen auch dieselbe Klasse. */
export async function markTests(db: Db, userId: string, lessons: Lesson[]): Promise<Lesson[]> {
  if (!lessons.length) return lessons;
  const dates = lessons.map((l) => l.date).sort();
  const tests = await testsBetween(db, userId, dates[0]!, dates.at(-1)!);
  if (!tests.length) return lessons;
  return lessons.map((l) => {
    if (l.state === "cancelled" || l.state === "sol" || !l.subject) return l;
    const t = tests.find((x) => x.date === l.date && x.subject.code === l.subject!.code && (!l.classCode || !x.classCode || x.classCode === l.classCode));
    return t ? { ...l, test: t.title } : l;
  });
}

/** Fächer zur Auswahl: Lernende die Fächer ihres Stundenplans, Lehrpersonen ihre Zuteilungen (mit Klasse). */
export async function testOptions(db: Db, userId: string): Promise<{ subjects: Subject[]; classes: { classCode: string; subject: Subject }[] }> {
  const w = await who(db, userId);
  if (w.teacher) {
    return {
      subjects: [],
      classes: w.scope.map((a) => ({ classCode: a.classCode, subject: { code: a.subject, name: a.subjectName ?? a.subject, short: a.subjectShort ?? a.subject } })),
    };
  }
  const rows = w.classId
    ? await db
        .selectDistinct({ code: s.subjects.code, name: s.subjects.name, short: s.subjects.short })
        .from(s.lessons)
        .innerJoin(s.subjects, eq(s.subjects.code, s.lessons.subjectCode))
        .where(eq(s.lessons.classId, w.classId))
    : [];
  const subjects = rows.length ? rows : await db.select({ code: s.subjects.code, name: s.subjects.name, short: s.subjects.short }).from(s.subjects);
  return { subjects: subjects.filter((x) => x.code !== "SOL").sort((a, b) => a.name.localeCompare(b.name, "de")), classes: [] };
}

/** Prüft die Eingabe und liefert Klasse (Lehrperson) oder null (eigene Prüfung). */
async function resolve(db: Db, w: Who, input: TestInput): Promise<{ classId: string | null }> {
  if (w.teacher) {
    if (!input.classCode) throw new DomainError("invalid", "Wähle eine Klasse.", "classCode");
    const a = w.scope.find((x) => x.classCode.toLowerCase() === input.classCode!.toLowerCase() && x.subject === input.subject);
    if (!a) throw new DomainError("forbidden", "Dieses Fach in dieser Klasse ist dir nicht zugeteilt.", "subject");
    return { classId: a.classId };
  }
  const known = (await db.select({ c: s.subjects.code }).from(s.subjects).where(eq(s.subjects.code, input.subject)).limit(1))[0];
  if (!known) throw new DomainError("invalid", "Unbekanntes Fach.", "subject");
  return { classId: null };
}

const clean = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);

export async function createTest(db: Db, userId: string, input: TestInput, now: Now): Promise<TestItem> {
  const w = await who(db, userId);
  const { classId } = await resolve(db, w, input);
  const id = `ts-${randomId(10)}`;
  await db.insert(s.tests).values({ id, ownerId: userId, classId, subjectCode: input.subject, date: input.date, title: input.title.trim(), description: clean(input.description), createdAt: now.stamp, updatedAt: now.stamp });
  if (classId && input.date >= now.date) await notifyClass(db, classId, input, now);
  return (await load(db, w, eq(s.tests.id, id)))[0]!;
}

export async function updateTest(db: Db, userId: string, id: string, input: TestInput, now: Now): Promise<TestItem> {
  const w = await who(db, userId);
  await own(db, userId, id);
  const { classId } = await resolve(db, w, input);
  await db.update(s.tests).set({ classId, subjectCode: input.subject, date: input.date, title: input.title.trim(), description: clean(input.description), updatedAt: now.stamp }).where(eq(s.tests.id, id));
  return (await load(db, w, eq(s.tests.id, id)))[0]!;
}

export async function deleteTest(db: Db, userId: string, id: string): Promise<void> {
  await own(db, userId, id);
  await db.delete(s.tests).where(eq(s.tests.id, id));
}

async function own(db: Db, userId: string, id: string) {
  const t = (await db.select({ owner: s.tests.ownerId }).from(s.tests).where(eq(s.tests.id, id)).limit(1))[0];
  if (!t) throw new DomainError("not_found", "Diese Prüfung gibt es nicht.");
  if (t.owner !== userId) throw new DomainError("forbidden", "Nur wer die Prüfung erfasst hat, kann sie ändern.");
}

/** Benachrichtigung an die Lernenden der Klasse (Einstellung "Noten und Prüfungen"). */
async function notifyClass(db: Db, classId: string, input: TestInput, now: Now) {
  const sub = (await db.select({ name: s.subjects.name }).from(s.subjects).where(eq(s.subjects.code, input.subject)).limit(1))[0];
  const students = await db
    .select({ id: s.users.id, on: s.settings.nGrades })
    .from(s.users)
    .leftJoin(s.settings, eq(s.settings.userId, s.users.id))
    .where(and(eq(s.users.classId, classId), eq(s.users.role, "student")));
  const rows = students
    .filter((u) => u.on !== false)
    .map((u) => ({ id: `nt-${randomId(10)}`, userId: u.id, kind: "info", icon: "cal", title: `Neue Prüfung in ${sub?.name ?? input.subject}`, body: `${input.title.trim()} · ${fmtLong(input.date)}`, href: "/pruefungen", createdAt: now.stamp }));
  await insertNotifications(db, rows);
}
