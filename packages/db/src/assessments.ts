/**
 * Noten der Lehrpersonen. Eine Lehrperson erfasst Proben für ihre zugeteilten Fächer und Klassen und trägt die Noten
 * ein; ändern darf nur, wer die Probe erfasst hat. Die Klassenlehrperson sieht die Notenbücher aller Fächer ihrer
 * Klasse, ohne sie zu ändern. Informatikmodule bewertet die gibb, sie bleiben bei den Lernenden.
 */
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import {
  BM_SUBJECTS,
  bmCode,
  bmSemester,
  config,
  initials,
  round1,
  semesterLabel,
  subjectGrade,
  type Assessment,
  type AssessmentGradesInput,
  type AssessmentInput,
  type AssessmentSheet,
  type Gradebook,
  type Now,
  type Subject,
} from "@bwd/shared";
import type { Db } from "./client";
import { DomainError, randomId, teacherScope } from "./queries";
import { insertNotifications } from "./push";
import * as s from "./schema";

type Access = { classId: string; classCode: string; subject: Subject; edit: boolean };

/** Fach mit Namen der Vorlage (D = Deutsch) und Kürzel aus dem Stundenplan. */
async function subjectOf(db: Db, canon: string): Promise<Subject> {
  const alias = Object.entries({ DE: "D", EN: "E", FR: "F" }).find(([, v]) => v === canon)?.[0];
  const row = (await db.select().from(s.subjects).where(inArray(s.subjects.code, [canon, ...(alias ? [alias] : [])])).limit(1))[0];
  const bm = BM_SUBJECTS.find((b) => b.code === canon);
  return { code: canon, name: bm?.name ?? row?.name ?? canon, short: row?.short ?? canon };
}

/** Rechte für Klasse und Fach: zugeteilt = bearbeiten, Klassenlehrperson = ansehen. */
async function access(db: Db, userId: string, classCode: string, subject: string): Promise<Access> {
  const u = (await db.select({ role: s.users.role }).from(s.users).where(eq(s.users.id, userId)).limit(1))[0];
  if (u?.role !== "teacher") throw new DomainError("forbidden", "Nur für Lehrpersonen.");
  const canon = bmCode(subject);
  if (canon === "IN") throw new DomainError("invalid", "Informatikmodule bewertet die gibb.", "subject");
  const cls = (await db.select().from(s.classes).where(sql`lower(${s.classes.code}) = ${classCode.toLowerCase()}`).limit(1))[0];
  if (!cls) throw new DomainError("not_found", "Diese Klasse gibt es nicht.");
  const assigned = (await teacherScope(db, userId)).some((a) => a.classId === cls.id && bmCode(a.subject) === canon);
  if (!assigned && cls.classTeacherId !== userId) throw new DomainError("forbidden", "Dieses Fach in dieser Klasse ist dir nicht zugeteilt.");
  return { classId: cls.id, classCode: cls.code, subject: await subjectOf(db, canon), edit: assigned };
}

async function studentsOf(db: Db, classId: string) {
  return db
    .select({ id: s.users.id, first: s.users.firstName, last: s.users.lastName })
    .from(s.users)
    .where(and(eq(s.users.classId, classId), eq(s.users.role, "student")))
    .orderBy(asc(s.users.lastName), asc(s.users.firstName));
}

async function toAssessments(db: Db, userId: string, rows: (typeof s.assessments.$inferSelect)[], classCode: string, subject: Subject): Promise<Assessment[]> {
  const ids = rows.map((r) => r.id);
  const stats = ids.length
    ? await db
        .select({ id: s.assessmentGrades.assessmentId, n: sql<number>`count(*)`, v: sql<number>`avg(${s.assessmentGrades.value})` })
        .from(s.assessmentGrades)
        .where(inArray(s.assessmentGrades.assessmentId, ids))
        .groupBy(s.assessmentGrades.assessmentId)
    : [];
  return rows.map((r) => {
    const x = stats.find((t) => t.id === r.id);
    const n = Number(x?.n ?? 0);
    return { id: r.id, classCode, subject, title: r.title, date: r.date, weight: r.weight, semester: r.semester, average: n >= 3 ? round1(Number(x!.v)) : null, graded: n, mine: r.ownerId === userId };
  });
}

/** Notenbuch einer Klasse in einem Fach und Semester (ohne Angabe: das laufende). */
export async function getGradebook(db: Db, userId: string, classCode: string, subject: string, now: Now, semester?: number): Promise<Gradebook> {
  const acc = await access(db, userId, classCode, subject);
  const current = bmSemester(acc.classCode, now.date, config.secondSemesterStart);
  const used = (
    await db
      .selectDistinct({ n: s.assessments.semester })
      .from(s.assessments)
      .where(and(eq(s.assessments.classId, acc.classId), eq(s.assessments.subjectCode, acc.subject.code)))
  ).map((r) => r.n);
  const sem = semester && semester >= 1 && semester <= 6 ? semester : (current ?? Math.max(1, ...used));
  const list = [...new Set([...used, ...(current ? [current] : []), sem])].sort((a, b) => b - a);
  const rows = await db
    .select()
    .from(s.assessments)
    .where(and(eq(s.assessments.classId, acc.classId), eq(s.assessments.subjectCode, acc.subject.code), eq(s.assessments.semester, sem)))
    .orderBy(asc(s.assessments.date), asc(s.assessments.createdAt));
  const assessments = await toAssessments(db, userId, rows, acc.classCode, acc.subject);
  const students = await studentsOf(db, acc.classId);
  const values = rows.length ? await db.select().from(s.assessmentGrades).where(inArray(s.assessmentGrades.assessmentId, rows.map((r) => r.id))) : [];
  return {
    classCode: acc.classCode,
    subject: acc.subject,
    semester: sem,
    semesterLabel: semesterLabel(acc.classCode, sem),
    semesters: list.map((n) => ({ n, label: semesterLabel(acc.classCode, n) })),
    assessments,
    students: students.map((st) => {
      const vals = rows.map((r) => values.find((v) => v.assessmentId === r.id && v.userId === st.id)?.value ?? null);
      const g = subjectGrade(rows.flatMap((r, i) => (vals[i] === null ? [] : [{ value: vals[i]!, weight: r.weight }])));
      return { id: st.id, name: `${st.first} ${st.last}`, initials: initials(st.first, st.last), values: vals, raw: g?.raw ?? null, grade: g?.grade ?? null };
    }),
    editable: acc.edit,
  };
}

async function load(db: Db, id: string) {
  const r = (await db.select({ a: s.assessments, code: s.classes.code }).from(s.assessments).innerJoin(s.classes, eq(s.classes.id, s.assessments.classId)).where(eq(s.assessments.id, id)).limit(1))[0];
  if (!r) throw new DomainError("not_found", "Diese Probe gibt es nicht.");
  return r;
}

async function own(db: Db, userId: string, id: string) {
  const r = await load(db, id);
  if (r.a.ownerId !== userId) throw new DomainError("forbidden", "Nur wer die Probe erfasst hat, kann sie ändern.");
  return r;
}

/** Semester zur Probe aus Klasse und Datum. */
function semesterFor(classCode: string, date: string) {
  const n = bmSemester(classCode, date, config.secondSemesterStart);
  if (!n) throw new DomainError("invalid", "Das Datum liegt ausserhalb der sechs Semester dieser Klasse.", "date");
  return n;
}

export async function createAssessment(db: Db, userId: string, input: AssessmentInput, now: Now): Promise<Assessment> {
  const acc = await access(db, userId, input.classCode, input.subject);
  if (!acc.edit) throw new DomainError("forbidden", "Dieses Fach in dieser Klasse ist dir nicht zugeteilt.");
  const id = `asm-${randomId(8)}`;
  await db.insert(s.assessments).values({ id, classId: acc.classId, subjectCode: acc.subject.code, semester: semesterFor(acc.classCode, input.date), title: input.title.trim(), date: input.date, weight: input.weight, ownerId: userId, createdAt: now.stamp, updatedAt: now.stamp });
  return (await getAssessment(db, userId, id, now)).assessment;
}

export async function updateAssessment(db: Db, userId: string, id: string, input: Omit<AssessmentInput, "classCode" | "subject">, now: Now): Promise<Assessment> {
  const r = await own(db, userId, id);
  await db.update(s.assessments).set({ title: input.title.trim(), date: input.date, weight: input.weight, semester: semesterFor(r.code, input.date), updatedAt: now.stamp }).where(eq(s.assessments.id, id));
  return (await getAssessment(db, userId, id, now)).assessment;
}

export async function deleteAssessment(db: Db, userId: string, id: string): Promise<void> {
  await own(db, userId, id);
  await db.delete(s.assessments).where(eq(s.assessments.id, id));
}

export async function getAssessment(db: Db, userId: string, id: string, _now: Now): Promise<AssessmentSheet> {
  const r = await load(db, id);
  const acc = await access(db, userId, r.code, r.a.subjectCode);
  const [assessment] = await toAssessments(db, userId, [r.a], acc.classCode, acc.subject);
  const students = await studentsOf(db, acc.classId);
  const values = await db.select().from(s.assessmentGrades).where(eq(s.assessmentGrades.assessmentId, id));
  return {
    assessment: assessment!,
    students: students.map((st) => ({ id: st.id, name: `${st.first} ${st.last}`, initials: initials(st.first, st.last), value: values.find((v) => v.userId === st.id)?.value ?? null })),
    editable: assessment!.mine,
  };
}

/** Noten speichern; leer = keine Note (z. B. gefehlt). Neu Benotete erhalten eine Benachrichtigung. */
export async function saveAssessmentGrades(db: Db, userId: string, id: string, input: AssessmentGradesInput, now: Now): Promise<AssessmentSheet> {
  const r = await own(db, userId, id);
  const students = await studentsOf(db, r.a.classId);
  for (const g of input.grades) if (!students.some((st) => st.id === g.userId)) throw new DomainError("invalid", "Diese Person ist nicht in der Klasse.", "grades");
  const before = await db.select().from(s.assessmentGrades).where(eq(s.assessmentGrades.assessmentId, id));
  const newly: string[] = [];
  for (const g of input.grades) {
    const old = before.find((b) => b.userId === g.userId);
    if (g.value === null) {
      if (old) await db.delete(s.assessmentGrades).where(and(eq(s.assessmentGrades.assessmentId, id), eq(s.assessmentGrades.userId, g.userId)));
      continue;
    }
    const value = Math.round(g.value * 100) / 100;
    if (old?.value === value) continue;
    await db
      .insert(s.assessmentGrades)
      .values({ assessmentId: id, userId: g.userId, value, enteredAt: now.stamp })
      .onConflictDoUpdate({ target: [s.assessmentGrades.assessmentId, s.assessmentGrades.userId], set: { value, enteredAt: now.stamp } });
    if (!old) newly.push(g.userId);
  }
  await db.update(s.assessments).set({ updatedAt: now.stamp }).where(eq(s.assessments.id, id));

  if (newly.length) {
    const subject = await subjectOf(db, r.a.subjectCode);
    const on = await db.select({ id: s.settings.userId, on: s.settings.nGrades }).from(s.settings).where(inArray(s.settings.userId, newly));
    const rows = newly
      .filter((u) => on.find((x) => x.id === u)?.on !== false)
      .map((u) => ({ id: `nt-${randomId(10)}`, userId: u, kind: "info", icon: "chart", title: `Neue Note in ${subject.name}`, body: r.a.title, href: `/noten/${subject.code}?semester=${r.a.semester}`, createdAt: now.stamp }));
    await insertNotifications(db, rows);
  }
  return getAssessment(db, userId, id, now);
}

/** Fächer, für die die Lehrperson in einer Klasse ein Notenbuch hat (zugeteilt; als Klassenlehrperson alle mit Proben). */
export async function gradebookSubjects(db: Db, userId: string, classCode: string): Promise<{ subject: Subject; edit: boolean; count: number }[]> {
  const cls = (await db.select().from(s.classes).where(sql`lower(${s.classes.code}) = ${classCode.toLowerCase()}`).limit(1))[0];
  if (!cls) return [];
  const assigned = [...new Set((await teacherScope(db, userId)).filter((a) => a.classId === cls.id).map((a) => bmCode(a.subject)))].filter((c) => c !== "IN");
  const counts = await db.select({ code: s.assessments.subjectCode, n: sql<number>`count(*)` }).from(s.assessments).where(eq(s.assessments.classId, cls.id)).groupBy(s.assessments.subjectCode);
  const codes = cls.classTeacherId === userId ? [...new Set([...assigned, ...counts.map((c) => c.code)])] : assigned;
  const out = [];
  for (const c of codes) out.push({ subject: await subjectOf(db, c), edit: assigned.includes(c), count: Number(counts.find((x) => x.code === c)?.n ?? 0) });
  return out.sort((a, b) => a.subject.name.localeCompare(b.subject.name, "de"));
}
