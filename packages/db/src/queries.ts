/**
 * Abfragen für alle Screens. Web (Server Components) und API (/api/v1) benutzen dieselben Funktionen.
 * Rückgaben entsprechen den Schemas in @bwd/shared.
 */
import {
  absenceDueDate,
  absenceSubjectsLabel,
  addDays,
  config,
  daysBetween,
  fmtGrade,
  initials,
  isNewDocument,
  round1,
  weightedAverage,
  type Absence,
  type AbsencesOverview,
  type AbsenceSubmit,
  type DemoAccount,
  type DocumentGroups,
  type DocumentItem,
  type GradesOverview,
  type Home,
  type Lesson,
  type LinkItem,
  type Me,
  type NewsArticle,
  type NewsItem,
  type NotificationItem,
  type Now,
  type RecentGrade,
  type Settings,
  type SolCalendar,
  type SolPlanCreate,
  type SolPortfolio,
  type SolTasks,
  type SubjectGrades,
  type Timetable,
  nextLesson,
} from "@bwd/shared";
import { and, asc, desc, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import type { Db } from "./client";
import * as s from "./schema";

const bool = (v: unknown) => v === true || v === 1;

// ---------- Konto ----------

export async function demoAccounts(db: Db): Promise<DemoAccount[]> {
  const rows = await db.select({ u: s.users, c: s.classes }).from(s.users).leftJoin(s.classes, eq(s.users.classId, s.classes.id)).orderBy(asc(s.users.lastName));
  return rows.map(({ u, c }) => ({ id: u.id, name: `${u.firstName} ${u.lastName}`, email: u.email, classCode: c?.code ?? null, school: u.email.endsWith(`@${config.school.emailDomain}`) }));
}

export async function userById(db: Db, id: string) {
  return (await db.select().from(s.users).where(eq(s.users.id, id)).limit(1))[0] ?? null;
}

export async function getSettings(db: Db, userId: string): Promise<Settings> {
  const r = (await db.select().from(s.settings).where(eq(s.settings.userId, userId)).limit(1))[0];
  return {
    theme: (r?.theme as Settings["theme"]) ?? "system",
    nTimetable: r?.nTimetable ?? true,
    nGrades: r?.nGrades ?? true,
    nNews: r?.nNews ?? true,
    nAbsences: r?.nAbsences ?? true,
    nEmail: r?.nEmail ?? false,
  };
}

export async function updateSettings(db: Db, userId: string, patch: Partial<Settings>): Promise<Settings> {
  const current = await getSettings(db, userId);
  const next = { ...current, ...patch };
  await db
    .insert(s.settings)
    .values({ userId, ...next })
    .onConflictDoUpdate({ target: s.settings.userId, set: next });
  return next;
}

export async function getMe(db: Db, userId: string): Promise<Me | null> {
  const row = (await db.select({ u: s.users, c: s.classes }).from(s.users).leftJoin(s.classes, eq(s.users.classId, s.classes.id)).where(eq(s.users.id, userId)).limit(1))[0];
  if (!row) return null;
  const { u, c } = row;
  const [unread] = await db.select({ n: sql<number>`count(*)` }).from(s.notifications).where(and(eq(s.notifications.userId, userId), isNull(s.notifications.readAt)));
  const [open] = await db.select({ n: sql<number>`count(*)` }).from(s.absences).where(and(eq(s.absences.userId, userId), eq(s.absences.status, "open")));
  const [newsTotal] = await db.select({ n: sql<number>`count(*)` }).from(s.news);
  const [newsRead] = await db.select({ n: sql<number>`count(*)` }).from(s.newsRead).where(eq(s.newsRead.userId, userId));
  return {
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    name: `${u.firstName} ${u.lastName}`,
    initials: initials(u.firstName, u.lastName),
    email: u.email,
    classCode: c?.code ?? "",
    program: c?.program ?? null,
    classTeacher: c?.classTeacher ?? null,
    settings: await getSettings(db, userId),
    counts: { unreadNotifications: Number(unread?.n ?? 0), openAbsences: Number(open?.n ?? 0), unreadNews: Number(newsTotal?.n ?? 0) - Number(newsRead?.n ?? 0) },
  };
}

// ---------- Sessions ----------

export async function createSession(db: Db, userId: string, now: Now, days = 30): Promise<{ id: string; expiresAt: string }> {
  const id = randomId();
  const expiresAt = `${addDays(now.date, days)}T${now.time}`;
  await db.insert(s.sessions).values({ id, userId, expiresAt });
  return { id, expiresAt };
}

export async function sessionUser(db: Db, sessionId: string, now: Now): Promise<string | null> {
  const r = (await db.select().from(s.sessions).where(eq(s.sessions.id, sessionId)).limit(1))[0];
  if (!r) return null;
  if (r.expiresAt < now.stamp) {
    await db.delete(s.sessions).where(eq(s.sessions.id, sessionId));
    return null;
  }
  return r.userId;
}

export async function deleteSession(db: Db, sessionId: string) {
  await db.delete(s.sessions).where(eq(s.sessions.id, sessionId));
}

export function randomId(bytes = 24): string {
  const b = new Uint8Array(bytes);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

// ---------- Stundenplan ----------

async function classOf(db: Db, userId: string): Promise<string | null> {
  return (await db.select({ c: s.users.classId }).from(s.users).where(eq(s.users.id, userId)).limit(1))[0]?.c ?? null;
}

export async function lessonsBetween(db: Db, userId: string, from: string, to: string): Promise<Lesson[]> {
  const classId = await classOf(db, userId);
  if (!classId) return [];
  const rows = await db
    .select({ l: s.lessons, sub: s.subjects, t: s.teachers })
    .from(s.lessons)
    .leftJoin(s.subjects, eq(s.lessons.subjectCode, s.subjects.code))
    .leftJoin(s.teachers, eq(s.lessons.teacherCode, s.teachers.code))
    .where(and(eq(s.lessons.classId, classId), gte(s.lessons.date, from), lte(s.lessons.date, to)))
    .orderBy(asc(s.lessons.date), asc(s.lessons.startTime));
  return rows.map(({ l, sub, t }) => ({
    id: l.id,
    date: l.date,
    start: l.startTime,
    end: l.endTime,
    subject: sub ? { code: sub.code, name: sub.name, short: sub.short } : null,
    teacher: l.teacherCode ? { code: l.teacherCode, name: t?.name ?? l.teacherCode } : null,
    room: l.room,
    state: l.state,
    originalRoom: l.originalRoom,
  }));
}

/** Stand des Stundenplans: letzter Import. Älter als 24 Stunden oder fehlgeschlagen gilt als veraltet. */
export async function timetableSource(db: Db, now: Now): Promise<Timetable["source"]> {
  const r = (await db.select().from(s.importRuns).orderBy(desc(s.importRuns.startedAt)).limit(1))[0];
  if (!r) return { name: "mock", lastRunAt: null, ok: false, stale: true };
  const at = r.finishedAt ?? r.startedAt;
  const ok = bool(r.ok);
  const age = daysBetween(at.slice(0, 10), now.date);
  return { name: r.source, lastRunAt: at, ok, stale: !ok || age > 1 };
}

export async function getTimetable(db: Db, userId: string, from: string, to: string, now: Now): Promise<Timetable> {
  return { from, to, lessons: await lessonsBetween(db, userId, from, to), source: await timetableSource(db, now) };
}

// ---------- Noten ----------

type ExamRow = { exam: typeof s.exams.$inferSelect; value: number | null };

async function examsFor(db: Db, userId: string, semester?: number, subject?: string): Promise<ExamRow[]> {
  const classId = await classOf(db, userId);
  if (!classId) return [];
  const conds = [eq(s.exams.classId, classId)];
  if (semester) conds.push(eq(s.exams.semester, semester));
  if (subject) conds.push(eq(s.exams.subjectCode, subject));
  const rows = await db
    .select({ exam: s.exams, value: s.grades.value })
    .from(s.exams)
    .leftJoin(s.grades, and(eq(s.grades.examId, s.exams.id), eq(s.grades.userId, userId)))
    .where(and(...conds))
    .orderBy(desc(s.exams.date));
  return rows;
}

function avgOf(rows: ExamRow[]): number | null {
  const a = weightedAverage(rows.filter((r) => r.value !== null).map((r) => ({ value: r.value!, weight: r.exam.weight })));
  return a === null ? null : round1(a);
}

export async function getGrades(db: Db, userId: string, semester: number): Promise<GradesOverview> {
  const rows = (await examsFor(db, userId, semester)).filter((r) => r.value !== null);
  const subjectRows = await db
    .select({ sub: s.subjects, t: s.teachers })
    .from(s.classSubjects)
    .innerJoin(s.subjects, eq(s.classSubjects.subjectCode, s.subjects.code))
    .leftJoin(s.teachers, eq(s.classSubjects.teacherCode, s.teachers.code))
    .where(eq(s.classSubjects.classId, (await classOf(db, userId)) ?? ""));
  const subjects = subjectRows
    .map(({ sub, t }) => {
      const mine = rows.filter((r) => r.exam.subjectCode === sub.code);
      return { code: sub.code, name: sub.name, short: sub.code, teacher: t?.name ?? null, examCount: mine.length, average: avgOf(mine) };
    })
    .filter((x) => x.examCount > 0)
    .sort((a, b) => (b.average ?? 0) - (a.average ?? 0) || a.name.localeCompare(b.name));
  const avgs = subjects.map((x) => x.average!).filter((x) => x !== null);
  return {
    semester,
    average: avgs.length ? round1(avgs.reduce((a, b) => a + b, 0) / avgs.length) : null,
    examCount: rows.length,
    insufficient: subjects.filter((x) => x.average !== null && x.average < 4).length,
    subjects,
  };
}

export async function recentGrades(db: Db, userId: string, limit = 3): Promise<RecentGrade[]> {
  const rows = await db
    .select({ e: s.exams, g: s.grades, sub: s.subjects })
    .from(s.grades)
    .innerJoin(s.exams, eq(s.grades.examId, s.exams.id))
    .innerJoin(s.subjects, eq(s.exams.subjectCode, s.subjects.code))
    .where(eq(s.grades.userId, userId))
    .orderBy(desc(s.exams.date))
    .limit(limit);
  return rows.map(({ e, g, sub }) => ({ examId: e.id, subjectCode: sub.code, subjectName: sub.name, title: e.title, date: e.date, value: g.value }));
}

export async function getSubjectGrades(db: Db, userId: string, subjectCode: string, semester = 1): Promise<SubjectGrades | null> {
  const sub = (await db.select().from(s.subjects).where(eq(s.subjects.code, subjectCode)).limit(1))[0];
  if (!sub) return null;
  const classId = await classOf(db, userId);
  const t = (
    await db
      .select({ name: s.teachers.name })
      .from(s.classSubjects)
      .leftJoin(s.teachers, eq(s.classSubjects.teacherCode, s.teachers.code))
      .where(and(eq(s.classSubjects.classId, classId ?? ""), eq(s.classSubjects.subjectCode, subjectCode)))
      .limit(1)
  )[0];
  const rows = await examsFor(db, userId, semester, subjectCode);
  // Klassenschnitt des Fachs: Mittel der Klassenschnitte der Prüfungen, ungewichtet (wie im Design: 4.4, 4.7, 4.1 → 4.4).
  const classAvg = weightedAverage(rows.filter((r) => r.exam.classAverage !== null).map((r) => ({ value: r.exam.classAverage!, weight: 1 })));
  return {
    subject: { code: sub.code, name: sub.name, short: sub.short },
    teacher: t?.name ?? null,
    exams: rows.map((r) => ({ id: r.exam.id, title: r.exam.title, date: r.exam.date, weight: r.exam.weight, classAverage: r.exam.classAverage, value: r.value })),
    average: avgOf(rows),
    classAverage: classAvg === null ? null : round1(classAvg),
  };
}

export { fmtGrade };

// ---------- Absenzen ----------

export async function getAbsences(db: Db, userId: string): Promise<AbsencesOverview> {
  const rows = await db.select().from(s.absences).where(eq(s.absences.userId, userId)).orderBy(desc(s.absences.date));
  const ids = rows.map((r) => r.id);
  const les = ids.length
    ? await db
        .select({ al: s.absenceLessons, sub: s.subjects })
        .from(s.absenceLessons)
        .leftJoin(s.subjects, eq(s.absenceLessons.subjectCode, s.subjects.code))
        .where(inArray(s.absenceLessons.absenceId, ids))
        .orderBy(asc(s.absenceLessons.period))
    : [];
  const items: Absence[] = rows.map((r) => {
    const lessons = les.filter((x) => x.al.absenceId === r.id).map((x) => ({ period: x.al.period, subjectCode: x.al.subjectCode, subjectName: x.sub?.name ?? null }));
    return { id: r.id, date: r.date, status: r.status, reason: r.reason, dueDate: r.dueDate, lessons, subjectsLabel: absenceSubjectsLabel(lessons), hasAttachment: !!r.attachmentKey };
  });
  const count = (st: Absence["status"]) => items.filter((i) => i.status === st).length;
  return { counts: { open: count("open"), sent: count("sent"), excused: count("excused"), unexcused: count("unexcused") }, items };
}

/** Lektionen eines Tages für den Absenz-Dialog (Nummer und Fach). */
export async function lessonsForAbsence(db: Db, userId: string, date: string): Promise<{ period: number; subjectCode: string | null; subjectName: string | null; subjectShort: string | null }[]> {
  const lessons = (await lessonsBetween(db, userId, date, date)).filter((l) => l.state !== "cancelled");
  return lessons
    .map((l) => ({ period: config.periods.find((p) => p.from === l.start)?.n ?? 0, subjectCode: l.subject?.code ?? null, subjectName: l.subject?.name ?? null, subjectShort: l.subject?.short ?? null }))
    .filter((l) => l.period > 0);
}

export class DomainError extends Error {
  constructor(
    public code: string,
    message: string,
    public field?: string,
  ) {
    super(message);
  }
}

/** Absenz entschuldigen (bestehend) oder neu melden. Status danach: "sent" (In Prüfung). */
export async function submitAbsence(db: Db, userId: string, input: AbsenceSubmit, now: Now): Promise<Absence> {
  let id = input.absenceId;
  let date = input.date;
  if (id) {
    const r = (await db.select().from(s.absences).where(and(eq(s.absences.id, id), eq(s.absences.userId, userId))).limit(1))[0];
    if (!r) throw new DomainError("not_found", "Diese Absenz gibt es nicht.");
    if (r.status !== "open") throw new DomainError("not_open", "Diese Absenz ist schon entschuldigt oder in Prüfung.");
    date = r.date;
  }
  const dayLessons = await lessonsForAbsence(db, userId, date!);
  const valid = new Set(dayLessons.map((l) => l.period));
  for (const p of input.periods) if (!valid.has(p)) throw new DomainError("invalid_period", `An diesem Tag gibt es keine ${p}. Lektion.`, "periods");
  if (!id) {
    id = `a-${randomId(8)}`;
    await db.insert(s.absences).values({ id, userId, date: date!, status: "sent", reason: input.reason, note: input.note ?? null, dueDate: absenceDueDate(date!), attachmentKey: input.attachmentKey ?? null, createdAt: now.stamp });
  } else {
    await db.update(s.absences).set({ status: "sent", reason: input.reason, note: input.note ?? null, attachmentKey: input.attachmentKey ?? null }).where(eq(s.absences.id, id));
    await db.delete(s.absenceLessons).where(eq(s.absenceLessons.absenceId, id));
  }
  const bySubject = new Map(dayLessons.map((l) => [l.period, l.subjectCode]));
  await db.insert(s.absenceLessons).values(input.periods.map((p) => ({ absenceId: id!, period: p, subjectCode: bySubject.get(p) ?? null })));
  const all = await getAbsences(db, userId);
  return all.items.find((a) => a.id === id)!;
}

// ---------- Übersicht ----------

export async function getHome(db: Db, userId: string, now: Now): Promise<Home> {
  const lessons = await lessonsBetween(db, userId, now.date, now.date);
  const abs = await getAbsences(db, userId);
  return {
    today: now.date,
    now: now.time,
    next: nextLesson(lessons, now.date, now.time),
    lessons,
    openAbsences: abs.items.filter((a) => a.status === "open"),
    recentGrades: await recentGrades(db, userId, 3),
    news: (await getNews(db, userId)).slice(0, 2),
  };
}

// ---------- Mitteilungen ----------

export async function getNews(db: Db, userId: string): Promise<NewsItem[]> {
  const rows = await db.select({ n: s.news, r: s.newsRead.userId }).from(s.news).leftJoin(s.newsRead, and(eq(s.newsRead.newsId, s.news.id), eq(s.newsRead.userId, userId))).orderBy(desc(s.news.pinned), desc(s.news.publishedAt));
  return rows.map(({ n, r }) => ({ id: n.id, title: n.title, teaser: n.teaser, author: n.author, publishedAt: n.publishedAt, pinned: n.pinned, unread: !r }));
}

export async function getNewsArticle(db: Db, userId: string, id: string, now: Now, markRead = true): Promise<NewsArticle | null> {
  const n = (await db.select().from(s.news).where(eq(s.news.id, id)).limit(1))[0];
  if (!n) return null;
  const read = (await db.select().from(s.newsRead).where(and(eq(s.newsRead.newsId, id), eq(s.newsRead.userId, userId))).limit(1))[0];
  if (markRead && !read) await db.insert(s.newsRead).values({ newsId: id, userId }).onConflictDoNothing();
  const doc = n.documentId ? (await db.select().from(s.documents).where(eq(s.documents.id, n.documentId)).limit(1))[0] : undefined;
  return {
    id: n.id,
    title: n.title,
    teaser: n.teaser,
    author: n.author,
    publishedAt: n.publishedAt,
    pinned: n.pinned,
    unread: !read,
    bodyMd: n.bodyMd,
    document: doc ? toDocument(doc, now) : null,
  };
}

// ---------- Dokumente und Links ----------

function toDocument(d: typeof s.documents.$inferSelect, now: Now): DocumentItem {
  return { id: d.id, group: d.grp, title: d.title, fileType: d.fileType, sizeBytes: d.sizeBytes, note: d.note, updatedAt: d.updatedAt, isNew: isNewDocument(d.updatedAt, now.date) };
}

export const DOCUMENT_GROUPS = ["Prüfungspläne", "Formulare", "Reglemente", "Merkblätter"];

export async function getDocuments(db: Db, now: Now, q = "", group?: string): Promise<DocumentGroups> {
  const rows = await db.select().from(s.documents).orderBy(asc(s.documents.sort));
  const all = rows.map((d) => toDocument(d, now));
  const needle = q.trim().toLocaleLowerCase("de-CH");
  const names = [...DOCUMENT_GROUPS, ...new Set(all.map((d) => d.group).filter((g) => !DOCUMENT_GROUPS.includes(g)))];
  const groups = names.map((name) => {
    const inGroup = all.filter((d) => d.group === name);
    const items = inGroup.filter((d) => (!group || group === name) && (!needle || d.title.toLocaleLowerCase("de-CH").includes(needle) || (d.note ?? "").toLocaleLowerCase("de-CH").includes(needle)));
    return { name, total: inGroup.length, items };
  });
  return { groups, total: all.length };
}

export async function getDocument(db: Db, id: string) {
  return (await db.select().from(s.documents).where(eq(s.documents.id, id)).limit(1))[0] ?? null;
}

export async function getLinks(db: Db): Promise<LinkItem[]> {
  const rows = await db.select().from(s.links).orderBy(asc(s.links.sort));
  const order = ["Microsoft 365", "Lernen", "Schule"];
  return rows
    .map((l) => ({ id: l.id, group: l.grp, title: l.title, sub: l.sub, url: l.url, badge: l.badge, accent: l.accent }))
    .sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group));
}

// ---------- Benachrichtigungen ----------

export async function getNotifications(db: Db, userId: string): Promise<NotificationItem[]> {
  const rows = await db.select().from(s.notifications).where(eq(s.notifications.userId, userId)).orderBy(desc(s.notifications.createdAt));
  return rows.map((n) => ({ id: n.id, kind: n.kind, icon: n.icon, title: n.title, body: n.body, href: n.href, createdAt: n.createdAt, unread: !n.readAt }));
}

export async function markNotificationsRead(db: Db, userId: string, now: Now, ids?: string[]) {
  const conds = [eq(s.notifications.userId, userId), isNull(s.notifications.readAt)];
  if (ids?.length) conds.push(inArray(s.notifications.id, ids));
  await db
    .update(s.notifications)
    .set({ readAt: now.stamp })
    .where(and(...conds));
}

// ---------- SOL ----------

async function blocksFor(db: Db, userId: string) {
  const classId = await classOf(db, userId);
  return db.select().from(s.solBlocks).where(eq(s.solBlocks.classId, classId ?? "")).orderBy(desc(s.solBlocks.n));
}

/** Aktueller Block: der, in dem heute liegt, sonst der neuste, der schon begonnen hat. */
function currentBlock<T extends { starts: string | null; ends: string | null }>(blocks: T[], today: string): T | null {
  return blocks.find((b) => (b.starts ?? "") <= today && today <= (b.ends ?? "")) ?? blocks.find((b) => (b.starts ?? "") <= today) ?? blocks[0] ?? null;
}

export async function getSolTasks(db: Db, userId: string, now: Now, blockN?: number): Promise<SolTasks> {
  const blocks = await blocksFor(db, userId);
  const block = blockN ? (blocks.find((b) => b.n === blockN) ?? null) : currentBlock(blocks, now.date);
  const tasks = block
    ? await db
        .select({ t: s.solTasks, p: s.solProgress.percent, sub: s.subjects })
        .from(s.solTasks)
        .innerJoin(s.subjects, eq(s.solTasks.subjectCode, s.subjects.code))
        .leftJoin(s.solProgress, and(eq(s.solProgress.taskId, s.solTasks.id), eq(s.solProgress.userId, userId)))
        .where(eq(s.solTasks.blockId, block.id))
        .orderBy(asc(s.solTasks.code))
    : [];
  const teachers = await db
    .select({ sub: s.classSubjects.subjectCode, name: s.teachers.name })
    .from(s.classSubjects)
    .leftJoin(s.teachers, eq(s.classSubjects.teacherCode, s.teachers.code))
    .where(eq(s.classSubjects.classId, (await classOf(db, userId)) ?? ""));
  const order: string[] = [];
  for (const { t } of tasks) if (!order.includes(t.subjectCode)) order.push(t.subjectCode);
  // Reihenfolge wie im Design: Fächer nach erstem Auftrag in der Seed-Reihenfolge
  const subjectOrder = ["MA", "EN", "DE", "FRW", "WR", "FR"];
  order.sort((a, b) => (subjectOrder.indexOf(a) + 1 || 99) - (subjectOrder.indexOf(b) + 1 || 99));
  const groups = order.map((code) => {
    const mine = tasks.filter((x) => x.t.subjectCode === code);
    const sub = mine[0]!.sub;
    return {
      subject: { code: sub.code, name: sub.name, short: sub.short },
      teacher: teachers.find((t) => t.sub === code)?.name ?? null,
      tasks: mine.map(({ t, p }) => ({ id: t.id, subjectCode: t.subjectCode, code: t.code, title: t.title, minutes: t.minutes, percent: p ?? 0, sharepointUrl: t.sharepointUrl, hasFile: !!t.r2Key })),
    };
  });
  return { blocks: blocks.map((b) => ({ id: b.id, n: b.n, starts: b.starts, ends: b.ends })), block: block ? { id: block.id, n: block.n, starts: block.starts, ends: block.ends } : null, groups };
}

export async function setSolProgress(db: Db, userId: string, taskId: string, percent: number) {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  await db.insert(s.solProgress).values({ taskId, userId, percent: p }).onConflictDoUpdate({ target: [s.solProgress.taskId, s.solProgress.userId], set: { percent: p } });
}

export async function solDays(db: Db, userId: string) {
  const blocks = await blocksFor(db, userId);
  if (!blocks.length) return [];
  const rows = await db
    .select()
    .from(s.solDays)
    .where(
      inArray(
        s.solDays.blockId,
        blocks.map((b) => b.id),
      ),
    )
    .orderBy(asc(s.solDays.date));
  return rows.map((d) => ({ id: d.id, date: d.date, blockN: blocks.find((b) => b.id === d.blockId)!.n }));
}

/** SOL-Kalender: heute, wenn heute SOL-Tag ist, sonst der nächste SOL-Tag. */
export async function getSolCalendar(db: Db, userId: string, now: Now, dayId?: string): Promise<SolCalendar> {
  const days = await solDays(db, userId);
  const day = (dayId ? days.find((d) => d.id === dayId) : days.find((d) => d.date >= now.date)) ?? days[days.length - 1] ?? null;
  if (!day) return { days, day: null, plan: [], presence: [] };
  const plan = await db
    .select({ p: s.solPlan, t: s.solTasks, sub: s.subjects })
    .from(s.solPlan)
    .innerJoin(s.solTasks, eq(s.solPlan.taskId, s.solTasks.id))
    .innerJoin(s.subjects, eq(s.solTasks.subjectCode, s.subjects.code))
    .where(and(eq(s.solPlan.userId, userId), eq(s.solPlan.solDayId, day.id)))
    .orderBy(asc(s.solPlan.startTime));
  const presence = await db
    .select({ p: s.solPresence, t: s.teachers, sub: s.subjects })
    .from(s.solPresence)
    .leftJoin(s.teachers, eq(s.solPresence.teacherCode, s.teachers.code))
    .leftJoin(s.subjects, eq(s.solPresence.subjectCode, s.subjects.code))
    .where(eq(s.solPresence.solDayId, day.id))
    .orderBy(asc(s.solPresence.lane), asc(s.solPresence.startTime));
  return {
    days,
    day,
    plan: plan.map(({ p, t, sub }) => ({ id: p.id, taskId: t.id, subjectCode: sub.code, subjectShort: sub.short, code: t.code, title: t.title, start: p.startTime, end: p.endTime, note: p.note })),
    presence: presence.map(({ p, t, sub }) => ({
      id: p.id,
      teacherCode: p.teacherCode,
      teacherName: t?.name ?? p.teacherCode,
      subjectCode: p.subjectCode,
      subjectShort: sub?.short ?? null,
      subjectName: sub?.name ?? null,
      start: p.startTime,
      end: p.endTime,
      room: p.room,
      lane: p.lane,
    })),
  };
}

export async function addSolPlan(db: Db, userId: string, input: SolPlanCreate) {
  const day = (await db.select().from(s.solDays).where(eq(s.solDays.id, input.solDayId)).limit(1))[0];
  if (!day) throw new DomainError("not_found", "Diesen SOL-Tag gibt es nicht.", "solDayId");
  const task = (await db.select().from(s.solTasks).where(eq(s.solTasks.id, input.taskId)).limit(1))[0];
  if (!task) throw new DomainError("not_found", "Diesen Auftrag gibt es nicht.", "taskId");
  const existing = await db.select().from(s.solPlan).where(and(eq(s.solPlan.userId, userId), eq(s.solPlan.solDayId, day.id)));
  if (existing.some((e) => input.start < e.endTime && e.startTime < input.end)) throw new DomainError("overlap", "In dieser Zeit ist schon ein Auftrag eingeplant.", "start");
  const id = `sp-${randomId(8)}`;
  await db.insert(s.solPlan).values({ id, userId, solDayId: day.id, taskId: task.id, startTime: input.start, endTime: input.end, note: input.note ?? null });
  return id;
}

export async function deleteSolPlan(db: Db, userId: string, id: string) {
  await db.delete(s.solPlan).where(and(eq(s.solPlan.id, id), eq(s.solPlan.userId, userId)));
}

export async function getSolPortfolio(db: Db, userId: string, now: Now): Promise<SolPortfolio> {
  const days = await solDays(db, userId);
  const rows = await db.select({ p: s.solPortfolio, d: s.solDays }).from(s.solPortfolio).innerJoin(s.solDays, eq(s.solPortfolio.solDayId, s.solDays.id)).where(eq(s.solPortfolio.userId, userId)).orderBy(desc(s.solDays.date));
  const entries = rows.map(({ p, d }) => ({ id: p.id, solDayId: d.id, date: d.date, checkIn: p.checkIn, checkOut: p.checkOut }));
  const nextDay = days.find((d) => d.date >= now.date) ?? null;
  const existing = nextDay ? entries.find((e) => e.solDayId === nextDay.id) : undefined;
  return {
    entries,
    next: nextDay ? (existing ?? { id: null, solDayId: nextDay.id, date: nextDay.date, checkIn: null, checkOut: null }) : null,
  };
}

export async function putSolPortfolio(db: Db, userId: string, solDayId: string, checkIn: string, checkOut: string, now: Now) {
  const day = (await db.select().from(s.solDays).where(eq(s.solDays.id, solDayId)).limit(1))[0];
  if (!day) throw new DomainError("not_found", "Diesen SOL-Tag gibt es nicht.", "solDayId");
  const values = { checkIn: checkIn.trim() || null, checkOut: checkOut.trim() || null, updatedAt: now.stamp };
  await db
    .insert(s.solPortfolio)
    .values({ id: `pf-${day.date}-${userId}`, userId, solDayId, ...values })
    .onConflictDoUpdate({ target: [s.solPortfolio.userId, s.solPortfolio.solDayId], set: values });
}
