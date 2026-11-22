/**
 * SOL für Lehrpersonen: Aufträge ihrer Fächer in den Blöcken einer Klasse anlegen, ändern, löschen, Dateien
 * ablegen und den Stand der Lernenden sehen. Die Klassenlehrperson sieht alle Fächer der Klasse, ändert aber nur
 * zugeteilte. Dateien liegen in R2 unter sol/<Klasse>/; die Schlüssel gibt die Funktion zum Löschen zurück.
 */
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { type Now, type SolFileKind, type SolOverview, type SolTaskInput, type Subject } from "@bwd/shared";
import type { Db } from "./client";
import { DomainError, randomId, teacherScope } from "./queries";
import * as s from "./schema";

type Ctx = { classId: string; classCode: string; subjects: string[]; classTeacher: boolean };

async function ctx(db: Db, userId: string, classCode: string): Promise<Ctx> {
  const u = (await db.select({ role: s.users.role }).from(s.users).where(eq(s.users.id, userId)).limit(1))[0];
  if (u?.role !== "teacher") throw new DomainError("forbidden", "Nur für Lehrpersonen.");
  const c = (await db.select().from(s.classes).where(sql`lower(${s.classes.code}) = ${classCode.toLowerCase()}`).limit(1))[0];
  if (!c) throw new DomainError("not_found", "Diese Klasse gibt es nicht.");
  const subjects = [...new Set((await teacherScope(db, userId)).filter((a) => a.classId === c.id).map((a) => a.subject))];
  const classTeacher = c.classTeacherId === userId;
  if (!subjects.length && !classTeacher) throw new DomainError("not_found", "Diese Klasse ist dir nicht zugeteilt.");
  return { classId: c.id, classCode: c.code, subjects, classTeacher };
}

const currentBlock = <T extends { starts: string | null; ends: string | null }>(blocks: T[], today: string) =>
  blocks.find((b) => (b.starts ?? "") <= today && today <= (b.ends ?? "")) ?? blocks.find((b) => (b.starts ?? "") <= today) ?? blocks[0] ?? null;

const fileHref = (id: string) => `/api/v1/files/sol-file/${encodeURIComponent(id)}`;

export async function getSolOverview(db: Db, userId: string, classCode: string, now: Now, blockN?: number): Promise<SolOverview> {
  const c = await ctx(db, userId, classCode);
  const blocks = await db.select().from(s.solBlocks).where(eq(s.solBlocks.classId, c.classId)).orderBy(desc(s.solBlocks.n));
  const block = blockN ? (blocks.find((b) => b.n === blockN) ?? null) : currentBlock(blocks, now.date);
  const students = await db
    .select({ id: s.users.id, first: s.users.firstName, last: s.users.lastName })
    .from(s.users)
    .where(and(eq(s.users.classId, c.classId), eq(s.users.role, "student")))
    .orderBy(asc(s.users.lastName), asc(s.users.firstName));
  const all = block ? await db.select({ t: s.solTasks, sub: s.subjects }).from(s.solTasks).leftJoin(s.subjects, eq(s.subjects.code, s.solTasks.subjectCode)).where(eq(s.solTasks.blockId, block.id)).orderBy(asc(s.solTasks.code)) : [];
  // Klassenlehrperson: alle Fächer; sonst nur zugeteilte (auch ohne Aufträge, damit sie anlegen kann)
  const codes = c.classTeacher ? [...new Set([...c.subjects, ...all.map((x) => x.t.subjectCode)])] : c.subjects;
  const tasks = all.filter((x) => codes.includes(x.t.subjectCode));
  const ids = tasks.map((x) => x.t.id);
  const progress = ids.length && students.length ? await db.select().from(s.solProgress).where(and(inArray(s.solProgress.taskId, ids), inArray(s.solProgress.userId, students.map((x) => x.id)))) : [];
  const files = ids.length ? await db.select().from(s.solTaskFiles).where(inArray(s.solTaskFiles.taskId, ids)).orderBy(asc(s.solTaskFiles.sort), asc(s.solTaskFiles.name)) : [];
  const subjectRows = codes.length ? await db.select().from(s.subjects).where(inArray(s.subjects.code, codes)) : [];
  const status: SolOverview["status"] = {};
  for (const p of progress) (status[p.taskId] ??= {})[p.userId] = p.status;
  const groups = codes
    .map((code) => {
      const sub = subjectRows.find((x) => x.code === code);
      const subject: Subject = sub ? { code: sub.code, name: sub.name, short: sub.short } : { code, name: code, short: code };
      return {
        subject,
        editable: c.subjects.includes(code),
        tasks: tasks
          .filter((x) => x.t.subjectCode === code)
          .map(({ t }) => {
            const st = Object.values(status[t.id] ?? {});
            const done = st.filter((v) => v === "done").length;
            const started = st.filter((v) => v === "started").length;
            return {
              id: t.id,
              code: t.code,
              title: t.title,
              minutes: t.minutes,
              sharepointUrl: t.sharepointUrl,
              files: files.filter((f) => f.taskId === t.id).map((f) => ({ id: f.id, kind: f.kind, name: f.name, ext: f.ext, bytes: f.bytes, href: fileHref(f.id), pdfHref: f.pdfKey ? `${fileHref(f.id)}?format=pdf` : null })),
              counts: { done, started, open: students.length - done - started },
            };
          }),
      };
    })
    .sort((a, b) => a.subject.name.localeCompare(b.subject.name, "de"));
  return {
    classCode: c.classCode,
    blocks: blocks.map((b) => ({ id: b.id, n: b.n, starts: b.starts, ends: b.ends })),
    block: block ? { id: block.id, n: block.n, starts: block.starts, ends: block.ends } : null,
    groups,
    students: students.map((x) => ({ id: x.id, name: `${x.first} ${x.last}` })),
    status,
  };
}

/** Auftrag laden und prüfen, ob die Lehrperson sein Fach in der Klasse bearbeiten darf. */
async function editableTask(db: Db, userId: string, taskId: string) {
  const r = (await db.select({ t: s.solTasks, b: s.solBlocks, code: s.classes.code }).from(s.solTasks).innerJoin(s.solBlocks, eq(s.solBlocks.id, s.solTasks.blockId)).innerJoin(s.classes, eq(s.classes.id, s.solBlocks.classId)).where(eq(s.solTasks.id, taskId)).limit(1))[0];
  if (!r) throw new DomainError("not_found", "Diesen Auftrag gibt es nicht.");
  const c = await ctx(db, userId, r.code);
  if (!c.subjects.includes(r.t.subjectCode)) throw new DomainError("forbidden", "Dieses Fach ist dir in dieser Klasse nicht zugeteilt.");
  return { ...r, ctx: c };
}

export async function createSolTask(db: Db, userId: string, input: SolTaskInput): Promise<{ id: string }> {
  const c = await ctx(db, userId, input.classCode);
  if (!c.subjects.includes(input.subject)) throw new DomainError("forbidden", "Dieses Fach ist dir in dieser Klasse nicht zugeteilt.", "subject");
  const block = (await db.select().from(s.solBlocks).where(and(eq(s.solBlocks.classId, c.classId), eq(s.solBlocks.n, input.block))).limit(1))[0];
  if (!block) throw new DomainError("invalid", "Diesen SOL-Block gibt es in der Klasse nicht.", "block");
  const dup = (await db.select({ id: s.solTasks.id }).from(s.solTasks).where(and(eq(s.solTasks.blockId, block.id), eq(s.solTasks.subjectCode, input.subject), sql`lower(${s.solTasks.code}) = ${input.code.toLowerCase()}`)).limit(1))[0];
  if (dup) throw new DomainError("invalid", "Dieses Kürzel gibt es im Block schon.", "code");
  const id = `t-${randomId(8)}`;
  await db.insert(s.solTasks).values({ id, blockId: block.id, subjectCode: input.subject, code: input.code.trim(), title: input.title.trim(), minutes: input.minutes, sharepointUrl: input.sharepointUrl || null, r2Key: null });
  return { id };
}

export async function updateSolTask(db: Db, userId: string, taskId: string, input: Pick<SolTaskInput, "code" | "title" | "minutes" | "sharepointUrl">): Promise<void> {
  await editableTask(db, userId, taskId);
  await db.update(s.solTasks).set({ code: input.code.trim(), title: input.title.trim(), minutes: input.minutes, sharepointUrl: input.sharepointUrl || null }).where(eq(s.solTasks.id, taskId));
}

/** Auftrag mit Stand, Plan-Einträgen und Dateien löschen. Gibt die R2-Schlüssel der Dateien zurück. */
export async function deleteSolTask(db: Db, userId: string, taskId: string): Promise<string[]> {
  await editableTask(db, userId, taskId);
  const files = await db.select().from(s.solTaskFiles).where(eq(s.solTaskFiles.taskId, taskId));
  await db.delete(s.solPlan).where(eq(s.solPlan.taskId, taskId));
  await db.delete(s.solProgress).where(eq(s.solProgress.taskId, taskId));
  await db.delete(s.solTaskFiles).where(eq(s.solTaskFiles.taskId, taskId));
  await db.delete(s.solTasks).where(eq(s.solTasks.id, taskId));
  return files.flatMap((f) => [f.key, ...(f.pdfKey ? [f.pdfKey] : [])]);
}

/** Vor dem Hochladen: Klasse des Auftrags (für den R2-Pfad), wenn bearbeitbar. */
export async function solUploadTarget(db: Db, userId: string, taskId: string): Promise<string> {
  return (await editableTask(db, userId, taskId)).b.classId;
}

export async function addSolTaskFile(db: Db, userId: string, taskId: string, f: { kind: SolFileKind; name: string; ext: string; key: string; bytes: number }): Promise<{ id: string }> {
  await editableTask(db, userId, taskId);
  const [last] = await db.select({ n: sql<number>`coalesce(max(${s.solTaskFiles.sort}), -1)` }).from(s.solTaskFiles).where(eq(s.solTaskFiles.taskId, taskId));
  const id = `sf-${randomId(8)}`;
  await db.insert(s.solTaskFiles).values({ id, taskId, kind: f.kind, name: f.name.slice(0, 160), ext: f.ext, key: f.key, pdfKey: null, bytes: f.bytes, sort: Number(last?.n ?? -1) + 1 });
  return { id };
}

export async function deleteSolTaskFile(db: Db, userId: string, fileId: string): Promise<string[]> {
  const f = (await db.select().from(s.solTaskFiles).where(eq(s.solTaskFiles.id, fileId)).limit(1))[0];
  if (!f) throw new DomainError("not_found", "Diese Datei gibt es nicht.");
  await editableTask(db, userId, f.taskId);
  await db.delete(s.solTaskFiles).where(eq(s.solTaskFiles.id, fileId));
  return [f.key, ...(f.pdfKey ? [f.pdfKey] : [])];
}

/**
 * Darf die Person den Auftrag lesen? Lernende der Klasse des Blocks, Lehrpersonen mit einem Fach in der Klasse
 * und die Klassenlehrperson. Sonst null, damit die Route 404 antwortet und nichts über fremde Klassen verrät.
 */
export async function readableSolTask(db: Db, userId: string, taskId: string) {
  const row = (
    await db
      .select({ task: s.solTasks, classId: s.solBlocks.classId, classTeacherId: s.classes.classTeacherId })
      .from(s.solTasks)
      .innerJoin(s.solBlocks, eq(s.solBlocks.id, s.solTasks.blockId))
      .innerJoin(s.classes, eq(s.classes.id, s.solBlocks.classId))
      .where(eq(s.solTasks.id, taskId))
      .limit(1)
  )[0];
  if (!row) return null;
  const u = (await db.select({ role: s.users.role, classId: s.users.classId }).from(s.users).where(eq(s.users.id, userId)).limit(1))[0];
  if (!u) return null;
  if (u.role === "teacher") {
    if (row.classTeacherId === userId) return row.task;
    return (await teacherScope(db, userId)).some((a) => a.classId === row.classId) ? row.task : null;
  }
  return u.classId === row.classId ? row.task : null;
}
