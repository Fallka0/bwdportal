/**
 * Verwaltung für admin.planary.ch (über planary-org): Rollen, Zuteilungen der Lehrpersonen, Klassen.
 * Nur über die interne API erreichbar; die Rechte prüft planary-org (Rollen der Console), das Audit schreibt es auch.
 */
import { and, asc, eq, inArray, like, or, sql } from "drizzle-orm";
import { BM_SUBJECTS } from "@bwd/shared";
import type { Db } from "./client";
import { DomainError, ensureClass } from "./queries";
import * as s from "./schema";

export type AdminAssignment = { classCode: string; subject: string };
export type AdminPerson = {
  id: string;
  name: string;
  email: string;
  role: s.Role;
  classCode: string | null;
  lastLoginAt: string | null;
  assignments: AdminAssignment[];
  classTeacherOf: string[];
};
export type AdminClass = { id: string; code: string; program: string | null; classTeacher: { id: string; name: string } | null; students: number; teachers: number };

const isRole = (r: string): r is s.Role => (s.roles as readonly string[]).includes(r);

async function assignmentsOf(db: Db, userIds: string[]) {
  if (!userIds.length) return new Map<string, AdminAssignment[]>();
  const rows = await db
    .select({ userId: s.teacherAssignments.userId, classCode: s.classes.code, subject: s.teacherAssignments.subjectCode })
    .from(s.teacherAssignments)
    .innerJoin(s.classes, eq(s.teacherAssignments.classId, s.classes.id))
    .where(inArray(s.teacherAssignments.userId, userIds))
    .orderBy(asc(s.classes.code), asc(s.teacherAssignments.subjectCode));
  const m = new Map<string, AdminAssignment[]>();
  for (const r of rows) m.set(r.userId, [...(m.get(r.userId) ?? []), { classCode: r.classCode, subject: r.subject }]);
  return m;
}

/** Konten suchen: Name oder Adresse, nach Rolle und Klasse. Höchstens 200. */
export async function adminPeople(db: Db, f: { q?: string; role?: string; classCode?: string; id?: string } = {}): Promise<AdminPerson[]> {
  const conds = [];
  if (f.id) conds.push(eq(s.users.id, f.id));
  const q = f.q?.trim().toLowerCase();
  if (q) conds.push(or(like(sql`lower(${s.users.email})`, `%${q}%`), like(sql`lower(${s.users.firstName} || ' ' || ${s.users.lastName})`, `%${q}%`)));
  if (f.role && isRole(f.role)) conds.push(eq(s.users.role, f.role));
  if (f.classCode) conds.push(eq(s.classes.code, f.classCode));
  const rows = await db
    .select({ u: s.users, classCode: s.classes.code })
    .from(s.users)
    .leftJoin(s.classes, eq(s.users.classId, s.classes.id))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(asc(s.users.lastName), asc(s.users.firstName))
    .limit(200);
  const ids = rows.map((r) => r.u.id);
  const asg = await assignmentsOf(db, ids);
  const kl = ids.length ? await db.select({ id: s.classes.classTeacherId, code: s.classes.code }).from(s.classes).where(inArray(s.classes.classTeacherId, ids)) : [];
  return rows.map(({ u, classCode }) => ({
    id: u.id,
    name: `${u.firstName} ${u.lastName}`.trim(),
    email: u.email,
    role: isRole(u.role) ? u.role : "student",
    classCode: classCode ?? null,
    lastLoginAt: u.lastLoginAt,
    assignments: asg.get(u.id) ?? [],
    classTeacherOf: kl.filter((k) => k.id === u.id).map((k) => k.code),
  }));
}

export async function adminPerson(db: Db, id: string): Promise<AdminPerson> {
  const p = (await adminPeople(db, { id }))[0];
  if (!p) throw new DomainError("not_found", "Dieses Konto gibt es nicht.");
  return p;
}

/**
 * Rolle oder Klasse eines Kontos ändern. Lehrpersonen gehören keiner Klasse an; wer keine Lehrperson mehr ist,
 * verliert Zuteilungen und Klassenlehrperson-Funktion.
 */
export async function adminUpdatePerson(db: Db, id: string, patch: { role?: string; classCode?: string | null }): Promise<AdminPerson> {
  await adminPerson(db, id);
  if (patch.role !== undefined) {
    if (!isRole(patch.role)) throw new DomainError("invalid", "Rolle ist student oder teacher.", "role");
    await db.update(s.users).set({ role: patch.role, ...(patch.role === "teacher" ? { classId: null } : {}) }).where(eq(s.users.id, id));
    if (patch.role === "student") {
      await db.delete(s.teacherAssignments).where(eq(s.teacherAssignments.userId, id));
      await db.update(s.classes).set({ classTeacherId: null }).where(eq(s.classes.classTeacherId, id));
    }
  }
  if (patch.classCode !== undefined) {
    const me = await adminPerson(db, id);
    if (me.role === "teacher" && patch.classCode) throw new DomainError("invalid", "Lehrpersonen gehören keiner Klasse an; dafür gibt es Zuteilungen.", "classCode");
    const classId = patch.classCode ? await classIdOf(db, patch.classCode) : null;
    await db.update(s.users).set({ classId }).where(eq(s.users.id, id));
  }
  return adminPerson(db, id);
}

async function classIdOf(db: Db, code: string): Promise<string> {
  const r = (await db.select({ id: s.classes.id }).from(s.classes).where(eq(s.classes.code, code)).limit(1))[0];
  if (!r) throw new DomainError("not_found", `Die Klasse ${code} gibt es nicht.`, "classCode");
  return r.id;
}

/** Zuteilungen einer Lehrperson ersetzen (Klasse und Fach). */
export async function adminSetAssignments(db: Db, id: string, list: AdminAssignment[]): Promise<AdminPerson> {
  const p = await adminPerson(db, id);
  if (p.role !== "teacher") throw new DomainError("invalid", "Nur Lehrpersonen haben Zuteilungen.", "assignments");
  const subjects = new Set((await adminSubjects(db)).map((x) => x.code));
  const rows: { userId: string; classId: string; subjectCode: string }[] = [];
  for (const a of list) {
    if (!subjects.has(a.subject)) throw new DomainError("invalid", `Das Fach ${a.subject} gibt es nicht.`, "assignments");
    const classId = await classIdOf(db, a.classCode);
    if (!rows.some((r) => r.classId === classId && r.subjectCode === a.subject)) rows.push({ userId: id, classId, subjectCode: a.subject });
  }
  await db.delete(s.teacherAssignments).where(eq(s.teacherAssignments.userId, id));
  for (let i = 0; i < rows.length; i += 30) await db.insert(s.teacherAssignments).values(rows.slice(i, i + 30));
  return adminPerson(db, id);
}

export async function adminClasses(db: Db): Promise<AdminClass[]> {
  const rows = await db.select().from(s.classes).orderBy(asc(s.classes.code));
  const students = await db.select({ classId: s.users.classId, n: sql<number>`count(*)` }).from(s.users).groupBy(s.users.classId);
  const teachers = await db.select({ classId: s.teacherAssignments.classId, n: sql<number>`count(distinct ${s.teacherAssignments.userId})` }).from(s.teacherAssignments).groupBy(s.teacherAssignments.classId);
  const ktIds = rows.map((r) => r.classTeacherId).filter((x): x is string => !!x);
  const kts = ktIds.length ? await db.select({ id: s.users.id, f: s.users.firstName, l: s.users.lastName }).from(s.users).where(inArray(s.users.id, ktIds)) : [];
  return rows.map((r) => {
    const kt = kts.find((k) => k.id === r.classTeacherId);
    return {
      id: r.id,
      code: r.code,
      program: r.program,
      classTeacher: kt ? { id: kt.id, name: `${kt.f} ${kt.l}`.trim() } : null,
      students: Number(students.find((x) => x.classId === r.id)?.n ?? 0),
      teachers: Number(teachers.find((x) => x.classId === r.id)?.n ?? 0),
    };
  });
}

/** Klasse anlegen: Kürzel wie IM25a (Buchstaben und Ziffern). */
export async function adminCreateClass(db: Db, input: { code: string; program?: string | null }): Promise<AdminClass> {
  const code = input.code.trim();
  if (!/^[A-Za-z]{1,6}\d{2}[a-z]?$/.test(code)) throw new DomainError("invalid", "Kürzel wie IM25a.", "code");
  if ((await db.select({ id: s.classes.id }).from(s.classes).where(eq(s.classes.code, code)).limit(1))[0]) throw new DomainError("exists", `Die Klasse ${code} gibt es schon.`, "code");
  const id = await ensureClass(db, code);
  if (input.program) await db.update(s.classes).set({ program: input.program.trim().slice(0, 120) }).where(eq(s.classes.id, id));
  return (await adminClasses(db)).find((c) => c.id === id)!;
}

/** Lehrgang oder Klassenlehrperson (muss Lehrperson sein) ändern. */
export async function adminUpdateClass(db: Db, code: string, patch: { program?: string | null; classTeacherId?: string | null }): Promise<AdminClass> {
  const id = await classIdOf(db, code);
  if (patch.classTeacherId) {
    const p = await adminPerson(db, patch.classTeacherId);
    if (p.role !== "teacher") throw new DomainError("invalid", "Klassenlehrperson muss eine Lehrperson sein.", "classTeacherId");
  }
  await db
    .update(s.classes)
    .set({
      ...(patch.program !== undefined ? { program: patch.program?.trim().slice(0, 120) || null } : {}),
      ...(patch.classTeacherId !== undefined ? { classTeacherId: patch.classTeacherId } : {}),
    })
    .where(eq(s.classes.id, id));
  return (await adminClasses(db)).find((c) => c.id === id)!;
}

/**
 * Fächer für Zuteilungen: die Kürzel aus dem Stundenplan (darüber findet das Portal die Lektionen der Lehrperson),
 * ergänzt um Fächer der BM-Vorlage, die im Stundenplan fehlen. Pro Name ein Eintrag.
 */
export async function adminSubjects(db: Db): Promise<{ code: string; name: string }[]> {
  const rows = await db.select({ code: s.subjects.code, name: s.subjects.name }).from(s.subjects);
  const byName = new Map<string, string>();
  for (const r of rows) if (r.code !== "SOL" && !byName.has(r.name)) byName.set(r.name, r.code);
  for (const b of BM_SUBJECTS) if (!byName.has(b.name)) byName.set(b.name, b.code);
  return [...byName].map(([name, code]) => ({ code, name })).sort((a, b) => a.name.localeCompare(b.name, "de"));
}
