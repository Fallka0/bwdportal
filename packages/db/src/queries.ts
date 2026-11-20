/**
 * Abfragen für alle Screens. Web (Server Components) und API (/api/v1) benutzen dieselben Funktionen.
 * Rückgaben entsprechen den Schemas in @bwd/shared.
 */
import {
  absenceContingent,
  absenceSubjectsLabel,
  attachmentRequired,
  getNow,
  isLateDispensation,
  noticeEditable,
  periodEnd,
  periodStart,
  semesterOf,
  type AbsenceLessonState,
  BM_SUBJECTS,
  bmSemester,
  efzSummary,
  informatics,
  moduleGrade,
  neededGrade,
  semesterLabel,
  semesterSummary,
  subjectGrade,
  type EfzOverview,
  type Portfolio,
  type PortfolioEntry,
  type PortfolioEntryInput,
  type PortfolioImportResult,
  type PortfolioSemester,
  type PortfolioSubjectDetail,
  type PortfolioSubjectRow,
  type SubjectLimit,
  type AbsenceNotice,
  type AbsenceNoticeSubmit,
  type Dispensation,
  type DispensationSubmit,
  addDays,
  config,
  daysBetween,
  weekday,
  fmtGrade,
  initials,
  isNewDocument,
  nameFromSchoolEmail,
  nameMatchesAddress,
  round1,
  type Absence,
  type IcsEvent,
  type AbsencesOverview,
  type DemoAccount,
  type DocumentGroups,
  type DocumentItem,
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
  type SolFile,
  type SolFileKind,
  type SolStatus,
  type SolTasks,
  type Timetable,
  nextLesson,
} from "@bwd/shared";
import { and, asc, desc, eq, gte, inArray, isNull, lte, or, sql } from "drizzle-orm";
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

export async function getMe(db: Db, userId: string, now: Now = getNow()): Promise<Me | null> {
  const row = (await db.select({ u: s.users, c: s.classes }).from(s.users).leftJoin(s.classes, eq(s.users.classId, s.classes.id)).where(eq(s.users.id, userId)).limit(1))[0];
  if (!row) return null;
  const { u, c } = row;
  const [unread] = await db.select({ n: sql<number>`count(*)` }).from(s.notifications).where(and(eq(s.notifications.userId, userId), isNull(s.notifications.readAt)));
  const { contingent } = await getAbsences(db, userId, now);
  const unreadNews = (await getNews(db, userId)).filter((n) => n.unread).length;
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
    role: u.role === "teacher" ? "teacher" : "student",
    settings: await getSettings(db, userId),
    counts: { unreadNotifications: Number(unread?.n ?? 0), contingentAvailable: contingent.available, contingentSize: contingent.size, unreadNews },
  };
}

// ---------- Sessions ----------

export async function createSession(db: Db, userId: string, now: Now, days = 30): Promise<{ id: string; expiresAt: string }> {
  const id = randomId();
  const expiresAt = `${addDays(now.date, days)}T${now.time}`;
  await db.insert(s.sessions).values({ id, userId, expiresAt });
  await db.update(s.users).set({ lastLoginAt: now.stamp }).where(eq(s.users.id, userId));
  return { id, expiresAt };
}

export async function sessionUser(db: Db, sessionId: string, now: Now): Promise<string | null> {
  const r = (
    await db
      .select({ userId: s.sessions.userId, expiresAt: s.sessions.expiresAt, seen: s.users.lastLoginAt })
      .from(s.sessions)
      .innerJoin(s.users, eq(s.users.id, s.sessions.userId))
      .where(eq(s.sessions.id, sessionId))
      .limit(1)
  )[0];
  if (!r) return null;
  if (r.expiresAt < now.stamp) {
    await db.delete(s.sessions).where(eq(s.sessions.id, sessionId));
    return null;
  }
  // Zuletzt aktiv (users.last_login_at): höchstens einmal pro 10 Minuten schreiben ("2026-11-20T08:1")
  if (!r.seen || r.seen.slice(0, 15) < now.stamp.slice(0, 15)) await db.update(s.users).set({ lastLoginAt: now.stamp }).where(eq(s.users.id, r.userId));
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

/**
 * Stand des Stundenplans: Ist der letzte Import fehlgeschlagen oder der letzte erfolgreiche älter als einen Tag,
 * gilt der Plan als veraltet (Banner). lastRunAt ist immer der letzte erfolgreiche Stand.
 */
export async function timetableSource(db: Db, now: Now): Promise<Timetable["source"]> {
  // Bei gleicher Minute entscheidet die Reihenfolge des Einfügens (rowid).
  const latest = (await db.select().from(s.importRuns).orderBy(desc(s.importRuns.startedAt), desc(sql`rowid`)).limit(1))[0];
  const lastOk = (await db.select().from(s.importRuns).where(eq(s.importRuns.ok, true)).orderBy(desc(s.importRuns.startedAt), desc(sql`rowid`)).limit(1))[0];
  if (!latest) return { name: "mock", lastRunAt: null, ok: false, stale: true };
  const ok = bool(latest.ok);
  const at = lastOk ? (lastOk.finishedAt ?? lastOk.startedAt) : null;
  const age = at ? daysBetween(at.slice(0, 10), now.date) : Infinity;
  // Veralten kann nur eine Quelle, die laufend abgleicht. Beispieldaten und Daten aus einer Datei bleiben gültig.
  const syncs = latest.source === "webuntis" || latest.source === "ical";
  return { name: latest.source, lastRunAt: at, ok, stale: !ok || (syncs && age > 1) };
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


// ---------- Notenportfolio (eigene Noten wie in der Excel-Vorlage der Schule) ----------

/** Reihenfolge der Vorlage; DE, FR, EN (Stundenplan-Kürzel) zählen wie D, F, E. */
/** Häufigstes Gewicht der Proben (für die Wunschnote der nächsten Probe). */
const commonWeight = (list: { weight: number }[]) => {
  const ws = list.map((x) => x.weight).filter((w) => w > 0);
  if (!ws.length) return 1;
  const count = (w: number) => ws.filter((x) => x === w).length;
  return [...ws].sort((a, b) => count(b) - count(a))[0]!;
};

const orderOf = (code: string) => {
  const alias: Record<string, string> = { DE: "D", FR: "F", EN: "E", M: "MA" };
  const i = BM_SUBJECTS.findIndex((x) => x.code === (alias[code] ?? code));
  return i === -1 ? 99 : i;
};

async function subjectNames(db: Db): Promise<Map<string, string>> {
  const rows = await db.select({ code: s.subjects.code, name: s.subjects.name }).from(s.subjects);
  const m = new Map(rows.map((r) => [r.code, r.name]));
  // Kürzel der Vorlage gehen vor (D = Deutsch, auch wenn der Stundenplan D anders nennt)
  for (const b of BM_SUBJECTS) m.set(b.code, b.name);
  return m;
}

async function classCodeOf(db: Db, userId: string): Promise<string> {
  const r = (await db.select({ code: s.classes.code }).from(s.users).leftJoin(s.classes, eq(s.users.classId, s.classes.id)).where(eq(s.users.id, userId)).limit(1))[0];
  return r?.code ?? "";
}

async function efzNames(db: Db, userId: string): Promise<Map<string, string>> {
  const rows = await db.select({ module: s.myEfz.module, name: s.myEfz.name }).from(s.myEfz).where(eq(s.myEfz.userId, userId));
  return new Map(rows.map((r) => [r.module, r.name]));
}

/** Ein Semester wie das Blatt "Noten_BM_Sem_n": Fächer, Informatikmodule, BM- und EFZ-Schnitt, Ampeln. */
export async function getPortfolioSemester(db: Db, userId: string, now: Now, n?: number): Promise<PortfolioSemester> {
  const code = await classCodeOf(db, userId);
  const current = bmSemester(code, now.date, config.secondSemesterStart);
  const all = await db.select().from(s.myGrades).where(eq(s.myGrades.userId, userId));
  const counts = new Map<number, number>();
  for (const r of all) counts.set(r.semester, (counts.get(r.semester) ?? 0) + 1);
  const sem = n && n >= 1 && n <= 6 ? n : (current ?? Math.max(1, ...counts.keys()));
  const list = [...new Set([...counts.keys(), ...(current ? [current] : [])])].sort((a, b) => b - a);
  const rows = all.filter((r) => r.semester === sem);
  const names = await subjectNames(db);
  const modNames = await efzNames(db, userId);
  const bySubject = new Map<string, typeof rows>();
  for (const r of rows) {
    const k = r.subject === "IN" ? `IN#${r.module ?? ""}` : r.subject;
    bySubject.set(k, [...(bySubject.get(k) ?? []), r]);
  }
  const subjects: PortfolioSubjectRow[] = [];
  const modules: PortfolioSubjectRow[] = [];
  for (const [k, list] of bySubject) {
    const first = list[0]!;
    if (first.subject === "IN") {
      const grade = moduleGrade(list);
      modules.push({ code: "IN", name: `Modul ${first.module}`, module: first.module, moduleName: first.moduleName ?? modNames.get(first.module ?? "") ?? null, raw: grade, grade, count: list.length });
    } else {
      const g = subjectGrade(list);
      const need = g && g.grade < 4 ? neededGrade(list, 4, commonWeight(list)) : null;
      subjects.push({ code: k, name: names.get(k) ?? k, module: null, moduleName: null, raw: g?.raw ?? null, grade: g?.grade ?? null, count: list.length, needFor4: need?.kind === "need" ? need.value : null });
    }
  }
  subjects.sort((a, b) => orderOf(a.code) - orderOf(b.code) || a.name.localeCompare(b.name, "de"));
  modules.sort((a, b) => (a.module ?? "").localeCompare(b.module ?? ""));
  const inf = informatics(modules.map((m) => m.grade));
  return {
    n: sem,
    label: semesterLabel(code, sem),
    semesters: list.map((x) => ({ n: x, label: semesterLabel(code, x), count: counts.get(x) ?? 0 })),
    current,
    count: rows.length,
    subjects,
    modules,
    informatics: inf,
    summary: semesterSummary(
      subjects.map((x) => ({ code: x.code, grade: x.grade })),
      inf?.raw ?? null,
    ),
  };
}

/** Proben eines Fachs (oder Informatikmoduls) in einem Semester, neuste zuerst. */
export async function getPortfolioSubject(db: Db, userId: string, now: Now, subject: string, n?: number, module?: string | null): Promise<PortfolioSubjectDetail | null> {
  const code = await classCodeOf(db, userId);
  const sem = n && n >= 1 && n <= 6 ? n : (bmSemester(code, now.date, config.secondSemesterStart) ?? 1);
  const conds = [eq(s.myGrades.userId, userId), eq(s.myGrades.semester, sem), eq(s.myGrades.subject, subject)];
  if (subject === "IN" && module) conds.push(eq(s.myGrades.module, module));
  const rows = await db
    .select()
    .from(s.myGrades)
    .where(and(...conds))
    .orderBy(desc(sql`coalesce(${s.myGrades.date}, ${s.myGrades.enteredAt})`), desc(s.myGrades.sort));
  const names = await subjectNames(db);
  if (!rows.length && !names.has(subject)) return null;
  const teacher = (
    await db
      .select({ name: s.teachers.name })
      .from(s.classSubjects)
      .leftJoin(s.teachers, eq(s.classSubjects.teacherCode, s.teachers.code))
      .where(and(eq(s.classSubjects.classId, (await classOf(db, userId)) ?? ""), eq(s.classSubjects.subjectCode, subject)))
      .limit(1)
  )[0];
  const g = subject === "IN" ? (() => { const m = moduleGrade(rows); return m === null ? null : { raw: m, grade: m }; })() : subjectGrade(rows);
  // Klassenschnitt (Beispieldaten): Mittel der Klassenschnitte der Proben, ungewichtet
  const ca = rows.filter((r) => r.classAverage !== null).map((r) => r.classAverage!);
  return {
    semester: sem,
    label: semesterLabel(code, sem),
    code: subject,
    name: subject === "IN" && module ? `Modul ${module}` : (names.get(subject) ?? subject),
    module: module ?? null,
    moduleName: rows[0]?.moduleName ?? (module ? ((await efzNames(db, userId)).get(module) ?? null) : null),
    teacher: teacher?.name ?? null,
    raw: g?.raw ?? null,
    grade: g?.grade ?? null,
    classAverage: ca.length ? round1(ca.reduce((a, b) => a + b, 0) / ca.length) : null,
    entries: rows.map((r) => ({ id: r.id, title: r.title, value: r.value, weight: r.weight, date: r.date, enteredAt: r.enteredAt, classAverage: r.classAverage })),
  };
}

/** Neuste Noten für die Übersicht: nach Datum der Probe, sonst nach Erfassung. */
export async function recentGrades(db: Db, userId: string, limit = 3): Promise<RecentGrade[]> {
  const rows = await db
    .select()
    .from(s.myGrades)
    .where(eq(s.myGrades.userId, userId))
    .orderBy(desc(sql`coalesce(${s.myGrades.date}, ${s.myGrades.enteredAt})`), desc(s.myGrades.sort))
    .limit(limit);
  const names = await subjectNames(db);
  return rows.map((r) => ({
    examId: r.id,
    subjectCode: r.subject,
    subjectName: r.subject === "IN" ? `Informatik Modul ${r.module}` : (names.get(r.subject) ?? r.subject),
    title: r.title,
    date: r.date ?? r.enteredAt,
    value: r.value,
    semester: r.semester,
    module: r.module,
  }));
}

/** EFZ-Übersicht (Blatt "Noten_EFZ"). */
export async function getEfz(db: Db, userId: string): Promise<EfzOverview> {
  const rows = await db.select().from(s.myEfz).where(eq(s.myEfz.userId, userId)).orderBy(asc(s.myEfz.year), asc(s.myEfz.place), asc(s.myEfz.module));
  const sum = efzSummary(rows.map((r) => ({ place: r.place, value: r.value })));
  return { modules: rows.map((r) => ({ id: r.id, year: r.year, place: r.place, module: r.module, name: r.name, value: r.value })), ...sum };
}

/** In Gruppen einfügen: D1 erlaubt höchstens 100 Parameter pro Anweisung. */
async function insertChunked<T extends Record<string, unknown>>(db: Db, table: Parameters<Db["insert"]>[0], rows: T[], perRow: number) {
  const size = Math.max(1, Math.floor(99 / perRow));
  for (let i = 0; i < rows.length; i += size) await db.insert(table).values(rows.slice(i, i + size) as never);
}

const normName = (v: string) => v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "");

/**
 * Notenportfolio übernehmen: ersetzt alle eigenen Noten und die EFZ-Übersicht. Proben ohne Datum gelten als heute
 * erfasst. `nameMatches` sagt, ob Vor- und Nachname in der Datei zum Konto passen (Hinweis, kein Abbruch).
 */
export async function importPortfolio(db: Db, userId: string, p: Portfolio, now: Now): Promise<PortfolioImportResult> {
  const user = await userById(db, userId);
  const modNames = new Map(p.efz.map((e) => [e.module, e.name]));
  const grades = p.semesters.flatMap((sem) =>
    sem.subjects.flatMap((sub) =>
      sub.entries.map((e, i) => ({
        id: `mg-${randomId(8)}`,
        userId,
        semester: sem.n,
        subject: sub.subject,
        module: sub.module,
        moduleName: sub.module ? (modNames.get(sub.module) ?? null) : null,
        title: e.title.slice(0, 80),
        value: e.value,
        weight: e.weight,
        date: null,
        enteredAt: now.date,
        classAverage: null,
        sort: i,
      })),
    ),
  );
  const efz = p.efz.map((e) => ({ id: `me-${randomId(8)}`, userId, year: e.year, place: e.place, module: e.module, name: e.name.slice(0, 120), value: e.value }));
  await db.delete(s.myGrades).where(eq(s.myGrades.userId, userId));
  await db.delete(s.myEfz).where(eq(s.myEfz.userId, userId));
  await insertChunked(db, s.myGrades, grades, 13);
  await insertChunked(db, s.myEfz, efz, 7);
  const nameMatches = !!user && normName(`${user.firstName}${user.lastName}`) === normName(`${p.firstName}${p.lastName}`);
  return { entries: grades.length, semesters: new Set(grades.map((g) => g.semester)).size, efz: efz.length, nameMatches };
}

async function ownGrade(db: Db, userId: string, id: string) {
  const r = (await db.select().from(s.myGrades).where(and(eq(s.myGrades.id, id), eq(s.myGrades.userId, userId))).limit(1))[0];
  if (!r) throw new DomainError("not_found", "Diese Note gibt es nicht.");
  return r;
}

/** Probe erfassen. Ohne Datum zählt der Tag der Erfassung. */
export async function addPortfolioEntry(db: Db, userId: string, input: PortfolioEntryInput, now: Now): Promise<PortfolioEntry> {
  const module = input.subject === "IN" ? (input.module ?? null) : null;
  const moduleName = module ? ((await efzNames(db, userId)).get(module) ?? null) : null;
  const id = `mg-${randomId(8)}`;
  const [last] = await db.select({ n: sql<number>`coalesce(max(${s.myGrades.sort}), -1)` }).from(s.myGrades).where(and(eq(s.myGrades.userId, userId), eq(s.myGrades.semester, input.semester), eq(s.myGrades.subject, input.subject)));
  await db.insert(s.myGrades).values({ id, userId, semester: input.semester, subject: input.subject, module, moduleName, title: input.title, value: input.value, weight: input.weight, date: input.date ?? null, enteredAt: now.date, classAverage: null, sort: Number(last?.n ?? -1) + 1 });
  const r = await ownGrade(db, userId, id);
  return { id: r.id, title: r.title, value: r.value, weight: r.weight, date: r.date, enteredAt: r.enteredAt, classAverage: r.classAverage };
}

export async function updatePortfolioEntry(db: Db, userId: string, id: string, input: PortfolioEntryInput): Promise<PortfolioEntry> {
  await ownGrade(db, userId, id);
  const module = input.subject === "IN" ? (input.module ?? null) : null;
  await db.update(s.myGrades).set({ semester: input.semester, subject: input.subject, module, title: input.title, value: input.value, weight: input.weight, date: input.date ?? null }).where(eq(s.myGrades.id, id));
  const r = await ownGrade(db, userId, id);
  return { id: r.id, title: r.title, value: r.value, weight: r.weight, date: r.date, enteredAt: r.enteredAt, classAverage: r.classAverage };
}

export async function deletePortfolioEntry(db: Db, userId: string, id: string): Promise<void> {
  await ownGrade(db, userId, id);
  await db.delete(s.myGrades).where(eq(s.myGrades.id, id));
}

/** Note eines EFZ-Moduls setzen oder leeren. */
export async function setEfzValue(db: Db, userId: string, id: string, value: number | null): Promise<void> {
  const r = (await db.select().from(s.myEfz).where(and(eq(s.myEfz.id, id), eq(s.myEfz.userId, userId))).limit(1))[0];
  if (!r) throw new DomainError("not_found", "Dieses Modul gibt es nicht.");
  await db.update(s.myEfz).set({ value }).where(eq(s.myEfz.id, id));
}

export { fmtGrade };

// ---------- Absenzen ----------

/**
 * Cockpit der Absenzendatenbank: Absenzen (von Lehrpersonen erfasst), Abmeldungen, Dispensationsgesuche,
 * Kontingent und Fachkontingente. Der Zustand jeder Lektion folgt dem Absenzenreglement (siehe absenceContingent).
 */
export async function getAbsences(db: Db, userId: string, now: Now = getNow()): Promise<AbsencesOverview> {
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
  // Lehrperson pro Fach der Klasse (Spalte wie in der Absenzendatenbank)
  const teacherRows = await db
    .select({ sub: s.classSubjects.subjectCode, name: s.teachers.name })
    .from(s.classSubjects)
    .leftJoin(s.teachers, eq(s.classSubjects.teacherCode, s.teachers.code))
    .where(eq(s.classSubjects.classId, (await classOf(db, userId)) ?? ""));
  const teacherOf = new Map(teacherRows.map((r) => [r.sub, r.name]));
  const notices = await absenceNotices(db, userId, now);
  const dispensations = await dispensationsOf(db, userId);
  const missed = rows.flatMap((r) => les.filter((x) => x.al.absenceId === r.id).map((x) => ({ date: r.date, period: x.al.period })));
  const dispensed = dispensations.filter((d) => d.status === "approved").flatMap((d) => d.lessons.map((l) => ({ date: d.date, period: l.period })));
  const counted = absenceContingent(missed, notices, dispensed, now.date);
  const rank: Record<AbsenceLessonState, number> = { dispensed: 0, contingent: 1, unexcused: 2 };
  const items: Absence[] = rows.map((r) => {
    const lessons = les
      .filter((x) => x.al.absenceId === r.id)
      .map((x) => {
        const c = counted.lesson({ date: r.date, period: x.al.period });
        return { period: x.al.period, subjectCode: x.al.subjectCode, subjectName: x.sub?.name ?? null, teacher: x.al.subjectCode ? (teacherOf.get(x.al.subjectCode) ?? null) : null, state: c.state, weight: c.weight, notified: c.notified };
      });
    const status = lessons.reduce<AbsenceLessonState>((w, l) => (rank[l.state] > rank[w] ? l.state : w), "dispensed");
    return { id: r.id, date: r.date, status, lessons, subjectsLabel: absenceSubjectsLabel(lessons) };
  });
  return { contingent: counted.contingent, items, notices, dispensations, subjects: await subjectLimits(db, userId, items, now) };
}

/**
 * Fachkontingent (Art. 3d): pro Fach und Semester höchstens die doppelte Zahl der Wochenlektionen auf Kontingent.
 * Wochenlektionen: die Woche mit den meisten Lektionen des Fachs in den letzten vier Wochen.
 */
async function subjectLimits(db: Db, userId: string, items: Absence[], now: Now): Promise<SubjectLimit[]> {
  const sem = semesterOf(now.date);
  const from = addDays(now.date, -28 - weekdayMon(now.date));
  const lessons = (await lessonsBetween(db, userId, from, addDays(from, 34))).filter((l) => l.state !== "cancelled" && l.state !== "sol" && l.subject);
  const perWeek = new Map<string, Map<number, number>>();
  const names = new Map<string, string>();
  for (const l of lessons) {
    const sub = l.subject!;
    const code = sub.code;
    names.set(code, sub.name);
    const w = Math.floor(daysBetween(from, l.date) / 7);
    const m = perWeek.get(code) ?? new Map<number, number>();
    m.set(w, (m.get(w) ?? 0) + 1);
    perWeek.set(code, m);
  }
  const used = new Map<string, number>();
  for (const a of items) {
    if (a.date < sem.from || a.date > sem.to) continue;
    for (const l of a.lessons) {
      if (!l.subjectCode || l.state === "dispensed") continue;
      if (l.subjectName) names.set(l.subjectCode, l.subjectName);
      used.set(l.subjectCode, (used.get(l.subjectCode) ?? 0) + 1);
    }
  }
  return [...names.keys()]
    .map((code) => ({ subjectCode: code, subjectName: names.get(code)!, used: used.get(code) ?? 0, max: 2 * Math.max(0, ...(perWeek.get(code)?.values() ?? [])) }))
    .filter((x) => x.max > 0 || x.used > 0)
    .sort((a, b) => a.subjectName.localeCompare(b.subjectName, "de"));
}

/** Wochentag mit Montag = 0. */
const weekdayMon = (date: string) => (weekday(date) + 6) % 7;

const periodTime = (n: number, end: "from" | "to") => (end === "from" ? periodStart(n) : periodEnd(n));

async function absenceNotices(db: Db, userId: string, now: Now): Promise<AbsenceNotice[]> {
  const rows = await db.select().from(s.absenceNotices).where(eq(s.absenceNotices.userId, userId)).orderBy(desc(s.absenceNotices.date), desc(s.absenceNotices.createdAt));
  return rows.map((r) => ({ id: r.id, date: r.date, fromPeriod: r.fromPeriod, toPeriod: r.toPeriod, from: periodTime(r.fromPeriod, "from"), to: periodTime(r.toPeriod, "to"), note: r.note, createdAt: r.createdAt, editable: noticeEditable(r, now) }));
}

async function dispensationsOf(db: Db, userId: string): Promise<Dispensation[]> {
  const rows = await db.select().from(s.dispensations).where(eq(s.dispensations.userId, userId)).orderBy(desc(s.dispensations.date), desc(s.dispensations.createdAt));
  const ids = rows.map((r) => r.id);
  const les = ids.length
    ? await db
        .select({ dl: s.dispensationLessons, sub: s.subjects })
        .from(s.dispensationLessons)
        .leftJoin(s.subjects, eq(s.dispensationLessons.subjectCode, s.subjects.code))
        .where(inArray(s.dispensationLessons.dispensationId, ids))
        .orderBy(asc(s.dispensationLessons.period))
    : [];
  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    reason: r.reason,
    note: r.note,
    status: r.status,
    lessons: les.filter((x) => x.dl.dispensationId === r.id).map((x) => ({ period: x.dl.period, subjectCode: x.dl.subjectCode, subjectName: x.sub?.name ?? null })),
    attachments: [r.attachmentKey, r.attachmentKey2].filter(Boolean).length,
    createdAt: r.createdAt,
    late: isLateDispensation(r.reason, r.date, r.createdAt),
    editable: r.status === "submitted",
  }));
}

/** Lektionen eines Tages (Nummer und Fach) für Abmeldung und Gesuch. */
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

/** Abmeldung erfassen: Datum, von Lektion bis Lektion, Bemerkung. Höchstens 14 Tage zurück. */
export async function submitAbsenceNotice(db: Db, userId: string, input: AbsenceNoticeSubmit, now: Now): Promise<AbsenceNotice> {
  if (input.date < addDays(now.date, -14)) throw new DomainError("too_old", "Abmeldungen gehen höchstens 14 Tage zurück.", "date");
  const id = `an-${randomId(8)}`;
  await db.insert(s.absenceNotices).values({ id, userId, date: input.date, fromPeriod: input.fromPeriod, toPeriod: input.toPeriod, note: input.note?.trim() || null, createdAt: now.stamp });
  return (await absenceNotices(db, userId, now)).find((n) => n.id === id)!;
}

async function ownNotice(db: Db, userId: string, id: string, now: Now) {
  const r = (await db.select().from(s.absenceNotices).where(and(eq(s.absenceNotices.id, id), eq(s.absenceNotices.userId, userId))).limit(1))[0];
  if (!r) throw new DomainError("not_found", "Diese Abmeldung gibt es nicht.");
  if (!noticeEditable(r, now)) throw new DomainError("locked", "Die Abmeldung hat schon begonnen und lässt sich nicht mehr ändern.");
  return r;
}

/** Abmeldung ändern, solange ihre erste Lektion nicht begonnen hat. Das Erfassungsdatum bleibt. */
export async function updateAbsenceNotice(db: Db, userId: string, id: string, input: AbsenceNoticeSubmit, now: Now): Promise<AbsenceNotice> {
  await ownNotice(db, userId, id, now);
  if (input.date < now.date) throw new DomainError("too_old", "Das Datum liegt in der Vergangenheit.", "date");
  await db.update(s.absenceNotices).set({ date: input.date, fromPeriod: input.fromPeriod, toPeriod: input.toPeriod, note: input.note?.trim() || null }).where(eq(s.absenceNotices.id, id));
  return (await absenceNotices(db, userId, now)).find((n) => n.id === id)!;
}

export async function deleteAbsenceNotice(db: Db, userId: string, id: string, now: Now): Promise<void> {
  await ownNotice(db, userId, id, now);
  await db.delete(s.absenceNotices).where(eq(s.absenceNotices.id, id));
}

async function dispensationValues(db: Db, userId: string, input: DispensationSubmit, now: Now, existing?: (string | null)[]) {
  if (input.date < semesterOf(now.date).from) throw new DomainError("too_old", "Gesuche gehen nur für das laufende Semester.", "date");
  const keys = [...(input.keepAttachments ? (existing ?? []).filter((k): k is string => !!k) : []), ...(input.attachmentKeys ?? [])];
  if (keys.length > 2) throw new DomainError("too_many", "Höchstens zwei Anhänge.", "attachmentKeys");
  if (attachmentRequired(input.reason) && keys.length === 0) throw new DomainError("attachment_required", "Hänge eine Bestätigung an.", "attachmentKeys");
  const dayLessons = await lessonsForAbsence(db, userId, input.date);
  const bySubject = new Map(dayLessons.map((l) => [l.period, l.subjectCode]));
  return { keys, lessons: [...new Set(input.periods)].map((p) => ({ period: p, subjectCode: bySubject.get(p) ?? null })) };
}

/**
 * Dispensationsgesuch einreichen (Art. 4): Grund, Lektionen aus dem Stundenplan des Tages (mit Sonderstundenplan
 * alle 1 bis 12), Bestätigung als Anhang. Weniger als 5 Arbeitstage im Voraus gilt als verspätet.
 */
export async function submitDispensation(db: Db, userId: string, input: DispensationSubmit, now: Now): Promise<Dispensation> {
  const v = await dispensationValues(db, userId, input, now);
  const id = `di-${randomId(8)}`;
  await db.insert(s.dispensations).values({ id, userId, date: input.date, reason: input.reason, note: input.note?.trim() || null, status: "submitted", attachmentKey: v.keys[0] ?? null, attachmentKey2: v.keys[1] ?? null, createdAt: now.stamp });
  await db.insert(s.dispensationLessons).values(v.lessons.map((l) => ({ dispensationId: id, ...l })));
  return (await dispensationsOf(db, userId)).find((d) => d.id === id)!;
}

async function ownDispensation(db: Db, userId: string, id: string) {
  const r = (await db.select().from(s.dispensations).where(and(eq(s.dispensations.id, id), eq(s.dispensations.userId, userId))).limit(1))[0];
  if (!r) throw new DomainError("not_found", "Dieses Gesuch gibt es nicht.");
  if (r.status !== "submitted") throw new DomainError("locked", "Über dieses Gesuch wurde schon entschieden.");
  return r;
}

/** Gesuch ändern, solange es eingereicht ist. Ersetzte Anhänge gibt die Antwort in `removedKeys` zurück. */
export async function updateDispensation(db: Db, userId: string, id: string, input: DispensationSubmit, now: Now): Promise<{ dispensation: Dispensation; removedKeys: string[] }> {
  const r = await ownDispensation(db, userId, id);
  const old = [r.attachmentKey, r.attachmentKey2];
  const v = await dispensationValues(db, userId, input, now, old);
  await db.update(s.dispensations).set({ date: input.date, reason: input.reason, note: input.note?.trim() || null, attachmentKey: v.keys[0] ?? null, attachmentKey2: v.keys[1] ?? null }).where(eq(s.dispensations.id, id));
  await db.delete(s.dispensationLessons).where(eq(s.dispensationLessons.dispensationId, id));
  await db.insert(s.dispensationLessons).values(v.lessons.map((l) => ({ dispensationId: id, ...l })));
  const removedKeys = old.filter((k): k is string => !!k && !v.keys.includes(k));
  return { dispensation: (await dispensationsOf(db, userId)).find((d) => d.id === id)!, removedKeys };
}

/** Gesuch zurückziehen, solange es eingereicht ist. Gibt die Anhänge zurück, damit sie gelöscht werden. */
export async function deleteDispensation(db: Db, userId: string, id: string): Promise<string[]> {
  const r = await ownDispensation(db, userId, id);
  await db.delete(s.dispensations).where(eq(s.dispensations.id, id));
  return [r.attachmentKey, r.attachmentKey2].filter((k): k is string => !!k);
}

// ---------- Übersicht ----------

export async function getHome(db: Db, userId: string, now: Now): Promise<Home> {
  const lessons = await lessonsBetween(db, userId, now.date, now.date);
  const abs = await getAbsences(db, userId, now);
  return {
    today: now.date,
    now: now.time,
    next: nextLesson(lessons, now.date, now.time),
    lessons,
    absences: { contingent: abs.contingent, recent: abs.items.slice(0, 2) },
    recentGrades: await recentGrades(db, userId, 3),
    news: (await getNews(db, userId)).slice(0, 2),
  };
}

// ---------- Mitteilungen ----------

/** Für alle oder für die eigene Klasse (Beispieldaten gehören zur Demo-Klasse). */
async function visibleFor(db: Db, userId: string) {
  const classId = await classOf(db, userId);
  return {
    news: classId ? or(isNull(s.news.classId), eq(s.news.classId, classId)) : isNull(s.news.classId),
    documents: classId ? or(isNull(s.documents.classId), eq(s.documents.classId, classId)) : isNull(s.documents.classId),
  };
}

export async function getNews(db: Db, userId: string): Promise<NewsItem[]> {
  const v = await visibleFor(db, userId);
  const rows = await db
    .select({ n: s.news, r: s.newsRead.userId })
    .from(s.news)
    .leftJoin(s.newsRead, and(eq(s.newsRead.newsId, s.news.id), eq(s.newsRead.userId, userId)))
    .where(v.news)
    .orderBy(desc(s.news.pinned), desc(s.news.publishedAt));
  return rows.map(({ n, r }) => ({ id: n.id, title: n.title, teaser: n.teaser, author: n.author, publishedAt: n.publishedAt, pinned: n.pinned, unread: !r }));
}

export async function getNewsArticle(db: Db, userId: string, id: string, now: Now, markRead = true): Promise<NewsArticle | null> {
  const v = await visibleFor(db, userId);
  const n = (await db.select().from(s.news).where(and(eq(s.news.id, id), v.news)).limit(1))[0];
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

export async function getDocuments(db: Db, userId: string, now: Now, q = "", group?: string): Promise<DocumentGroups> {
  const v = await visibleFor(db, userId);
  const rows = await db.select().from(s.documents).where(v.documents).orderBy(asc(s.documents.sort));
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

export async function getDocument(db: Db, userId: string, id: string) {
  const v = await visibleFor(db, userId);
  return (await db.select().from(s.documents).where(and(eq(s.documents.id, id), v.documents)).limit(1))[0] ?? null;
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
        .select({ t: s.solTasks, p: s.solProgress.status, sub: s.subjects })
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
  const subjectOrder = ["MA", "M", "EN", "E", "DE", "D", "FRW", "WR", "FR", "F"];
  order.sort((a, b) => (subjectOrder.indexOf(a) + 1 || 99) - (subjectOrder.indexOf(b) + 1 || 99));
  const fileRows = tasks.length
    ? await db
        .select()
        .from(s.solTaskFiles)
        .where(inArray(s.solTaskFiles.taskId, tasks.map((x) => x.t.id)))
        .orderBy(asc(s.solTaskFiles.sort))
    : [];
  const kindOrder: Record<SolFileKind, number> = { task: 0, material: 1, solution: 2 };
  const filesOf = (t: typeof s.solTasks.$inferSelect): SolFile[] => {
    const mine = fileRows.filter((f) => f.taskId === t.id).sort((a, b) => kindOrder[a.kind] - kindOrder[b.kind] || a.sort - b.sort);
    if (mine.length) {
      return mine.map((f) => {
        const href = `/api/v1/files/sol-file/${encodeURIComponent(f.id)}`;
        return { id: f.id, kind: f.kind, name: f.name, ext: f.ext, bytes: f.bytes, href, pdfHref: f.pdfKey ? `${href}?format=pdf` : null };
      });
    }
    // Beispieldaten: ein Platzhalter-PDF pro Auftrag
    return t.r2Key ? [{ id: t.id, kind: "task", name: t.title, ext: "pdf", bytes: 0, href: `/api/v1/files/sol/${encodeURIComponent(t.id)}`, pdfHref: null }] : [];
  };
  const groups = order.map((code) => {
    const mine = tasks.filter((x) => x.t.subjectCode === code);
    const sub = mine[0]!.sub;
    return {
      subject: { code: sub.code, name: sub.name, short: sub.short },
      teacher: teachers.find((t) => t.sub === code)?.name ?? null,
      tasks: mine.map(({ t, p }) => ({ id: t.id, subjectCode: t.subjectCode, code: t.code, title: t.title, minutes: t.minutes, status: p ?? "open", sharepointUrl: t.sharepointUrl, files: filesOf(t) })),
    };
  });
  return { blocks: blocks.map((b) => ({ id: b.id, n: b.n, starts: b.starts, ends: b.ends })), block: block ? { id: block.id, n: block.n, starts: block.starts, ends: block.ends } : null, groups };
}

export async function setSolStatus(db: Db, userId: string, taskId: string, status: SolStatus) {
  await db.insert(s.solProgress).values({ taskId, userId, status }).onConflictDoUpdate({ target: [s.solProgress.taskId, s.solProgress.userId], set: { status } });
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

// ---------- Suche ----------

export type SearchResults = {
  subjects: { code: string; name: string; average: number | null }[];
  documents: DocumentItem[];
  links: LinkItem[];
  news: NewsItem[];
};

/** Suche über Fächer, Dokumente, Links und Mitteilungen (Gross-/Kleinschreibung egal). */
export async function search(db: Db, userId: string, now: Now, q: string): Promise<SearchResults> {
  const needle = q.trim().toLocaleLowerCase("de-CH");
  if (needle.length < 2) return { subjects: [], documents: [], links: [], news: [] };
  const has = (...v: (string | null | undefined)[]) => v.some((x) => (x ?? "").toLocaleLowerCase("de-CH").includes(needle));
  // Fächer mit Noten im laufenden Semester, mit Zeugnisnote
  const sem = await getPortfolioSemester(db, userId, now);
  const subjects = sem.subjects.filter((x) => has(x.name, x.code)).map((x) => ({ code: x.code, name: x.name, average: x.grade }));
  const docs = (await getDocuments(db, userId, now)).groups.flatMap((g) => g.items).filter((d) => has(d.title, d.note, d.group));
  const links = (await getLinks(db)).filter((l) => has(l.title, l.sub));
  const news = (await getNews(db, userId)).filter((n) => has(n.title, n.teaser));
  return { subjects, documents: docs, links, news };
}

// ---------- Microsoft-Login ----------

export async function userByEmail(db: Db, email: string) {
  return (await db.select().from(s.users).where(eq(s.users.email, email.toLowerCase())).limit(1))[0] ?? null;
}

/**
 * Konto zur E-Mail aus dem Microsoft-Token. Gibt es noch keins, wird es angelegt. Name aus den Claims.
 * Klasse: classCode (Standardklasse aus der Konfiguration), bis die Zuordnung aus dem Schulsystem kommt.
 * Ein bestehendes Konto ohne Klasse bekommt sie beim nächsten Login.
 */
/**
 * Konto zur E-Mail finden oder anlegen. Name: aus dem Verzeichnis der Schule (Microsoft, `trustedName`),
 * sonst bei Schuladressen aus der Adresse vorname.nachname, sonst vom Anbieter. Jede Anmeldung gleicht den Namen
 * an, damit niemand einen anderen Namen behält.
 */
export async function findOrCreateUser(
  db: Db,
  claims: { email: string; firstName: string; lastName: string; oid: string; trustedName?: boolean },
  now: Now,
  classCode?: string | null,
) {
  const classId = classCode ? await ensureClass(db, classCode) : null;
  const names = claims.trustedName
    ? { firstName: claims.firstName, lastName: claims.lastName }
    : (nameFromSchoolEmail(claims.email) ?? { firstName: claims.firstName || claims.email.split("@")[0]!, lastName: claims.lastName });
  const existing = await userByEmail(db, claims.email);
  if (existing) {
    const fix: Partial<typeof s.users.$inferInsert> = {};
    // Verzeichnisname gilt immer. Ein Name aus der Adresse ersetzt nur Namen, die nicht zur Adresse passen
    // (so bleibt "Müller" aus dem Verzeichnis, wenn dieselbe Person später über Planary kommt).
    const fromAddress = nameFromSchoolEmail(claims.email);
    const changed = existing.firstName !== names.firstName || existing.lastName !== names.lastName;
    if (changed && (claims.trustedName || (fromAddress && !nameMatchesAddress(existing, fromAddress)))) Object.assign(fix, names);
    if (!existing.classId && classId) fix.classId = classId;
    if (!Object.keys(fix).length) return existing;
    await db.update(s.users).set(fix).where(eq(s.users.id, existing.id));
    return (await userById(db, existing.id))!;
  }
  const id = `u-ms-${claims.oid}`;
  await db.insert(s.users).values({ id, email: claims.email.toLowerCase(), ...names, classId, role: "student", createdAt: now.stamp });
  await db.insert(s.settings).values({ userId: id }).onConflictDoNothing();
  return (await userById(db, id))!;
}

/** Klasse über ihr Kürzel finden oder anlegen (id c-<kürzel>). Liefert die id. */
export async function ensureClass(db: Db, code: string): Promise<string> {
  await db.insert(s.classes).values({ id: `c-${code.toLowerCase()}`, code }).onConflictDoNothing();
  return (await db.select({ id: s.classes.id }).from(s.classes).where(eq(s.classes.code, code)).limit(1))[0]!.id;
}

/** Einmal-Code für die App: zeigt auf eine Session, gilt 60 Sekunden. */
export async function createLoginCode(db: Db, sessionId: string, now: Now): Promise<string> {
  const code = randomId(24);
  const exp = new Date(Date.parse(`${now.stamp}:00Z`) + 60_000).toISOString().slice(0, 19);
  await db.insert(s.loginCodes).values({ code, sessionId, expiresAt: exp });
  return code;
}

/** Code einlösen: liefert die Session-ID und löscht den Code (nur einmal gültig). */
export async function consumeLoginCode(db: Db, code: string, now: Now): Promise<string | null> {
  const r = (await db.select().from(s.loginCodes).where(eq(s.loginCodes.code, code)).limit(1))[0];
  if (!r) return null;
  await db.delete(s.loginCodes).where(eq(s.loginCodes.code, code));
  return r.expiresAt >= `${now.stamp}:00` ? r.sessionId : null;
}

// ---------- Kalender-Abo ----------

/** Token fürs Kalender-Abo, wird beim ersten Mal angelegt. */
export async function calendarToken(db: Db, userId: string, now: Now): Promise<string> {
  const r = (await db.select().from(s.calendarTokens).where(eq(s.calendarTokens.userId, userId)).limit(1))[0];
  if (r) return r.token;
  const token = randomId(24);
  await db.insert(s.calendarTokens).values({ userId, token, createdAt: now.stamp });
  return token;
}

/** Neuer Link: der alte funktioniert danach nicht mehr. */
export async function resetCalendarToken(db: Db, userId: string, now: Now): Promise<string> {
  const token = randomId(24);
  await db
    .insert(s.calendarTokens)
    .values({ userId, token, createdAt: now.stamp })
    .onConflictDoUpdate({ target: s.calendarTokens.userId, set: { token, createdAt: now.stamp } });
  return token;
}

export async function userByCalendarToken(db: Db, token: string): Promise<string | null> {
  return (await db.select({ u: s.calendarTokens.userId }).from(s.calendarTokens).where(eq(s.calendarTokens.token, token)).limit(1))[0]?.u ?? null;
}

/**
 * Termine fürs Abo: Lektionen (eine Woche zurück bis acht Wochen voraus), Prüfungen, eigener SOL-Plan
 * und Fristen offener Absenzen. UIDs sind stabil, damit Kalender Änderungen statt Duplikate zeigen.
 */
export async function calendarEvents(db: Db, userId: string, now: Now): Promise<IcsEvent[]> {
  const from = addDays(now.date, -7);
  const to = addDays(now.date, 56);
  const events: IcsEvent[] = [];
  for (const l of await lessonsBetween(db, userId, from, to)) {
    if (l.state === "sol") {
      events.push({ uid: `${l.id}@bwd-portal`, summary: "SOL-Tag", date: l.date, start: l.start, end: l.end, location: l.room });
      continue;
    }
    const name = l.subject?.name ?? "Lektion";
    const room = l.state === "room_changed" ? `${l.room} (statt ${l.originalRoom})` : l.room;
    events.push({
      uid: `${l.id}@bwd-portal`,
      summary: l.state === "cancelled" ? `${name} (entfällt)` : name,
      date: l.date,
      start: l.start,
      end: l.end,
      location: room,
      description: l.teacher?.name ?? null,
      cancelled: l.state === "cancelled",
    });
  }
  for (const r of await examsFor(db, userId)) {
    const sub = (await db.select().from(s.subjects).where(eq(s.subjects.code, r.exam.subjectCode)).limit(1))[0];
    events.push({ uid: `${r.exam.id}@bwd-portal`, summary: `Prüfung ${sub?.name ?? r.exam.subjectCode}: ${r.exam.title}`, date: r.exam.date, description: r.value !== null ? `Note ${fmtGrade(r.value)}` : null });
  }
  const plan = await db
    .select({ p: s.solPlan, d: s.solDays, t: s.solTasks, sub: s.subjects })
    .from(s.solPlan)
    .innerJoin(s.solDays, eq(s.solPlan.solDayId, s.solDays.id))
    .innerJoin(s.solTasks, eq(s.solPlan.taskId, s.solTasks.id))
    .innerJoin(s.subjects, eq(s.solTasks.subjectCode, s.subjects.code))
    .where(eq(s.solPlan.userId, userId));
  for (const { p, d, t, sub } of plan) events.push({ uid: `${p.id}@bwd-portal`, summary: `SOL ${sub.short} ${t.code}: ${t.title}`, date: d.date, start: p.startTime, end: p.endTime, description: p.note });
  return events;
}
