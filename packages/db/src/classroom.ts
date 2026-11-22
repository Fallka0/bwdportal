/**
 * Klassenraum. Lehrpersonen schreiben Beiträge an ihre Klassen (für ein zugeteiltes Fach; die Klassenlehrperson auch
 * an die ganze Klasse) und legen Dateien ab. Lernende lesen den Klassenraum ihrer Klasse. Bearbeiten darf, wer
 * verfasst hat; löschen zusätzlich die Klassenlehrperson. Die Dateien selbst liegen in R2, hier nur die Angaben.
 */
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { fmtLong, type ClassFile, type ClassPost, type ClassPostInput, type Classroom, type Now, type Subject } from "@bwd/shared";
import type { Db } from "./client";
import { DomainError, randomId, teacherScope } from "./queries";
import { insertNotifications } from "./push";
import * as s from "./schema";

type Ctx = { userId: string; teacher: boolean; classId: string; classCode: string; classTeacher: boolean; subjects: string[] };

/** Wer liest welchen Klassenraum: Lernende ihre Klasse, Lehrpersonen zugeteilte Klassen und die eigene als Klassenlehrperson. */
async function ctx(db: Db, userId: string, classCode: string | null): Promise<Ctx> {
  const u = (await db.select({ role: s.users.role, classId: s.users.classId }).from(s.users).where(eq(s.users.id, userId)).limit(1))[0];
  if (!u) throw new DomainError("not_found", "Konto nicht gefunden.");
  if (u.role !== "teacher") {
    if (!u.classId) throw new DomainError("not_found", "Du bist keiner Klasse zugeteilt.");
    const c = (await db.select().from(s.classes).where(eq(s.classes.id, u.classId)).limit(1))[0]!;
    if (classCode && classCode.toLowerCase() !== c.code.toLowerCase()) throw new DomainError("not_found", "Diesen Klassenraum gibt es nicht.");
    return { userId, teacher: false, classId: c.id, classCode: c.code, classTeacher: false, subjects: [] };
  }
  if (!classCode) throw new DomainError("invalid", "Klasse fehlt.");
  const c = (await db.select().from(s.classes).where(sql`lower(${s.classes.code}) = ${classCode.toLowerCase()}`).limit(1))[0];
  if (!c) throw new DomainError("not_found", "Diesen Klassenraum gibt es nicht.");
  const subjects = [...new Set((await teacherScope(db, userId)).filter((a) => a.classId === c.id).map((a) => a.subject))];
  const classTeacher = c.classTeacherId === userId;
  if (!subjects.length && !classTeacher) throw new DomainError("not_found", "Diese Klasse ist dir nicht zugeteilt.");
  return { userId, teacher: true, classId: c.id, classCode: c.code, classTeacher, subjects };
}

/** Darf für dieses Fach (null = ganze Klasse) schreiben und Dateien ablegen? */
function assertPost(c: Ctx, subject: string | null) {
  if (!c.teacher) throw new DomainError("forbidden", "Nur Lehrpersonen schreiben im Klassenraum.");
  if (subject === null ? !c.classTeacher : !c.subjects.includes(subject) && !c.classTeacher) {
    throw new DomainError("forbidden", subject === null ? "An die ganze Klasse schreibt die Klassenlehrperson." : "Dieses Fach ist dir in dieser Klasse nicht zugeteilt.", "subject");
  }
}

async function subjectMap(db: Db): Promise<Map<string, Subject>> {
  return new Map((await db.select().from(s.subjects)).map((x) => [x.code, { code: x.code, name: x.name, short: x.short }]));
}

const name = (f: string | null, l: string | null) => `${f ?? ""} ${l ?? ""}`.trim() || "Lehrperson";

async function filesOf(db: Db, c: Ctx, where: ReturnType<typeof and>): Promise<ClassFile[]> {
  const subs = await subjectMap(db);
  const rows = await db
    .select({ f: s.classFiles, first: s.users.firstName, last: s.users.lastName })
    .from(s.classFiles)
    .leftJoin(s.users, eq(s.users.id, s.classFiles.uploadedBy))
    .where(where)
    .orderBy(desc(s.classFiles.createdAt));
  return rows.map(({ f, first, last }) => ({
    id: f.id,
    name: f.name,
    ext: f.ext,
    bytes: f.bytes,
    subject: f.subjectCode ? (subs.get(f.subjectCode) ?? { code: f.subjectCode, name: f.subjectCode, short: f.subjectCode }) : null,
    postId: f.postId,
    uploadedBy: name(first, last),
    createdAt: f.createdAt,
    canDelete: f.uploadedBy === c.userId || c.classTeacher,
  }));
}

/** Klassenraum mit Beiträgen (neuste zuerst) und Dateien; optional nur ein Fach. */
export async function getClassroom(db: Db, userId: string, classCode: string | null, subject?: string | null): Promise<Classroom> {
  const c = await ctx(db, userId, classCode);
  const subs = await subjectMap(db);
  const bySubject = subject ? eq(s.classPosts.subjectCode, subject) : undefined;
  const rows = await db
    .select({ p: s.classPosts, first: s.users.firstName, last: s.users.lastName })
    .from(s.classPosts)
    .leftJoin(s.users, eq(s.users.id, s.classPosts.authorId))
    .where(and(eq(s.classPosts.classId, c.classId), bySubject))
    .orderBy(desc(s.classPosts.createdAt))
    .limit(100);
  const files = await filesOf(db, c, and(eq(s.classFiles.classId, c.classId), subject ? eq(s.classFiles.subjectCode, subject) : undefined));
  const posts: ClassPost[] = rows.map(({ p, first, last }) => ({
    id: p.id,
    subject: p.subjectCode ? (subs.get(p.subjectCode) ?? { code: p.subjectCode, name: p.subjectCode, short: p.subjectCode }) : null,
    author: name(first, last),
    body: p.body,
    createdAt: p.createdAt,
    edited: p.updatedAt !== p.createdAt,
    files: files.filter((f) => f.postId === p.id),
    mine: p.authorId === userId,
    canDelete: p.authorId === userId || c.classTeacher,
  }));
  const used = await db
    .selectDistinct({ code: s.classPosts.subjectCode })
    .from(s.classPosts)
    .where(eq(s.classPosts.classId, c.classId));
  const usedFiles = await db.selectDistinct({ code: s.classFiles.subjectCode }).from(s.classFiles).where(eq(s.classFiles.classId, c.classId));
  const codes = [...new Set([...used, ...usedFiles].map((x) => x.code).filter((x): x is string => !!x))];
  const canPostFor = c.teacher
    ? [
        ...(c.classTeacher ? [{ code: null, name: "Ganze Klasse" }] : []),
        ...[...new Set([...c.subjects, ...(c.classTeacher ? codes : [])])].map((code) => ({ code, name: subs.get(code)?.name ?? code })),
      ]
    : [];
  return {
    classCode: c.classCode,
    subjects: codes.map((code) => subs.get(code) ?? { code, name: code, short: code }).sort((a, b) => a.name.localeCompare(b.name, "de")),
    canPostFor,
    posts,
    files: files.filter((f) => !f.postId),
  };
}

/** Vor dem Hochladen prüfen, ob die Person für Klasse und Fach Dateien ablegen darf. Gibt die Klassen-ID zurück. */
export async function classroomUploadTarget(db: Db, userId: string, classCode: string, subject: string | null): Promise<string> {
  const c = await ctx(db, userId, classCode);
  assertPost(c, subject);
  return c.classId;
}

export async function addClassFile(db: Db, userId: string, input: { classCode: string; subject: string | null; name: string; ext: string; mime: string; bytes: number; r2Key: string }, now: Now): Promise<ClassFile> {
  const c = await ctx(db, userId, input.classCode);
  assertPost(c, input.subject);
  const id = `cf-${randomId(10)}`;
  await db.insert(s.classFiles).values({ id, classId: c.classId, subjectCode: input.subject, postId: null, name: input.name.slice(0, 160), ext: input.ext, mime: input.mime, bytes: input.bytes, r2Key: input.r2Key, uploadedBy: userId, createdAt: now.stamp });
  return (await filesOf(db, c, eq(s.classFiles.id, id)))[0]!;
}

export async function createClassPost(db: Db, userId: string, input: ClassPostInput, now: Now): Promise<ClassPost> {
  const c = await ctx(db, userId, input.classCode);
  assertPost(c, input.subject);
  if (input.fileIds.length) {
    const files = await db.select().from(s.classFiles).where(inArray(s.classFiles.id, input.fileIds));
    if (files.length !== input.fileIds.length || files.some((f) => f.uploadedBy !== userId || f.classId !== c.classId || f.postId)) {
      throw new DomainError("invalid", "Eine Datei gehört nicht zu diesem Beitrag.", "fileIds");
    }
  }
  const id = `cp-${randomId(10)}`;
  await db.insert(s.classPosts).values({ id, classId: c.classId, subjectCode: input.subject, authorId: userId, body: input.body.trim(), createdAt: now.stamp, updatedAt: now.stamp });
  if (input.fileIds.length) await db.update(s.classFiles).set({ postId: id, subjectCode: input.subject }).where(inArray(s.classFiles.id, input.fileIds));
  await notify(db, c, input, now);
  return (await getClassroom(db, userId, c.classCode)).posts.find((p) => p.id === id)!;
}

export async function updateClassPost(db: Db, userId: string, id: string, body: string, now: Now): Promise<void> {
  const p = (await db.select().from(s.classPosts).where(eq(s.classPosts.id, id)).limit(1))[0];
  if (!p) throw new DomainError("not_found", "Diesen Beitrag gibt es nicht.");
  if (p.authorId !== userId) throw new DomainError("forbidden", "Nur wer den Beitrag geschrieben hat, kann ihn ändern.");
  const text = body.trim();
  if (!text) throw new DomainError("invalid", "Der Beitrag ist leer.", "body");
  await db.update(s.classPosts).set({ body: text.slice(0, 5000), updatedAt: now.stamp }).where(eq(s.classPosts.id, id));
}

async function mayDelete(db: Db, userId: string, classId: string, owner: string) {
  if (owner === userId) return;
  const kt = (await db.select({ id: s.classes.id }).from(s.classes).where(and(eq(s.classes.id, classId), eq(s.classes.classTeacherId, userId))).limit(1))[0];
  if (!kt) throw new DomainError("forbidden", "Löschen darf, wer es erstellt hat, und die Klassenlehrperson.");
}

/** Beitrag mit seinen Dateien löschen. Gibt die R2-Schlüssel zurück, die der Aufrufer entfernt. */
export async function deleteClassPost(db: Db, userId: string, id: string): Promise<string[]> {
  const p = (await db.select().from(s.classPosts).where(eq(s.classPosts.id, id)).limit(1))[0];
  if (!p) throw new DomainError("not_found", "Diesen Beitrag gibt es nicht.");
  await mayDelete(db, userId, p.classId, p.authorId);
  const files = await db.select({ id: s.classFiles.id, key: s.classFiles.r2Key }).from(s.classFiles).where(eq(s.classFiles.postId, id));
  if (files.length) await db.delete(s.classFiles).where(inArray(s.classFiles.id, files.map((f) => f.id)));
  await db.delete(s.classPosts).where(eq(s.classPosts.id, id));
  return files.map((f) => f.key);
}

/** Datei löschen; gibt den R2-Schlüssel zurück. */
export async function deleteClassFile(db: Db, userId: string, id: string): Promise<string> {
  const f = (await db.select().from(s.classFiles).where(eq(s.classFiles.id, id)).limit(1))[0];
  if (!f) throw new DomainError("not_found", "Diese Datei gibt es nicht.");
  await mayDelete(db, userId, f.classId, f.uploadedBy);
  await db.delete(s.classFiles).where(eq(s.classFiles.id, id));
  return f.r2Key;
}

/** Datei zum Herunterladen, wenn die Person den Klassenraum lesen darf. */
export async function classFileForDownload(db: Db, userId: string, id: string): Promise<{ r2Key: string; name: string; ext: string; mime: string } | null> {
  const f = (await db.select({ f: s.classFiles, code: s.classes.code }).from(s.classFiles).innerJoin(s.classes, eq(s.classes.id, s.classFiles.classId)).where(eq(s.classFiles.id, id)).limit(1))[0];
  if (!f) return null;
  try {
    await ctx(db, userId, f.code);
  } catch {
    return null;
  }
  return { r2Key: f.f.r2Key, name: f.f.name, ext: f.f.ext, mime: f.f.mime };
}

/** Neue Beiträge an die Lernenden der Klasse (Einstellung Mitteilungen). */
async function notify(db: Db, c: Ctx, input: ClassPostInput, now: Now) {
  const subs = await subjectMap(db);
  const where = input.subject ? (subs.get(input.subject)?.name ?? input.subject) : `Klasse ${c.classCode}`;
  const students = await db
    .select({ id: s.users.id, on: s.settings.nNews })
    .from(s.users)
    .leftJoin(s.settings, eq(s.settings.userId, s.users.id))
    .where(and(eq(s.users.classId, c.classId), eq(s.users.role, "student")));
  const first = input.body.trim().split("\n")[0]!;
  const rows = students
    .filter((u) => u.on !== false)
    .map((u) => ({ id: `nt-${randomId(10)}`, userId: u.id, kind: "info", icon: "msg", title: `Klassenraum: ${where}`, body: first.length > 90 ? `${first.slice(0, 88)}…` : first, href: "/klassenraum", createdAt: now.stamp }));
  await insertNotifications(db, rows);
}

export const classroomDate = (stamp: string) => `${fmtLong(stamp.slice(0, 10))}, ${stamp.slice(11, 16)}`;
