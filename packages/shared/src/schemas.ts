/**
 * Datenformen für Web, App und API (/api/v1). Antworten werden mit diesen Schemas geprüft.
 * Datum "YYYY-MM-DD", Uhrzeit "HH:MM", Zeitpunkt "YYYY-MM-DDTHH:MM" (Wandzeit Europe/Zurich).
 */
import { z } from "zod";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const time = z.string().regex(/^\d{2}:\d{2}$/);
const stamp = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);

export const Theme = z.enum(["system", "light", "dark"]);

export const Settings = z.object({
  theme: Theme,
  nTimetable: z.boolean(),
  nGrades: z.boolean(),
  nNews: z.boolean(),
  nAbsences: z.boolean(),
  nEmail: z.boolean(),
});
export type Settings = z.infer<typeof Settings>;
export const SettingsPatch = Settings.partial();

export const Me = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  name: z.string(),
  initials: z.string(),
  email: z.string(),
  classCode: z.string(),
  program: z.string().nullable(),
  classTeacher: z.string().nullable(),
  settings: Settings,
  counts: z.object({ unreadNotifications: z.number(), contingentAvailable: z.number(), contingentSize: z.number(), unreadNews: z.number() }),
});
export type Me = z.infer<typeof Me>;

export const Subject = z.object({ code: z.string(), name: z.string(), short: z.string() });
export type Subject = z.infer<typeof Subject>;

export const LessonState = z.enum(["normal", "room_changed", "cancelled", "sol"]);
export type LessonState = z.infer<typeof LessonState>;

export const Lesson = z.object({
  id: z.string(),
  date,
  start: time,
  end: time,
  subject: Subject.nullable(),
  teacher: z.object({ code: z.string(), name: z.string() }).nullable(),
  room: z.string().nullable(),
  state: LessonState,
  originalRoom: z.string().nullable(),
});
export type Lesson = z.infer<typeof Lesson>;

export const TimetableSourceInfo = z.object({
  name: z.string(),
  lastRunAt: stamp.nullable(),
  ok: z.boolean(),
  /** true, wenn der letzte Import fehlschlug oder zu alt ist: Banner zeigen */
  stale: z.boolean(),
});

export const Timetable = z.object({ from: date, to: date, lessons: z.array(Lesson), source: TimetableSourceInfo });
export type Timetable = z.infer<typeof Timetable>;

export const SubjectAverage = z.object({
  code: z.string(),
  name: z.string(),
  short: z.string(),
  teacher: z.string().nullable(),
  examCount: z.number(),
  average: z.number().nullable(),
});
export type SubjectAverage = z.infer<typeof SubjectAverage>;

export const RecentGrade = z.object({ examId: z.string(), subjectCode: z.string(), subjectName: z.string(), title: z.string(), date, value: z.number() });
export type RecentGrade = z.infer<typeof RecentGrade>;

export const GradesOverview = z.object({
  semester: z.number(),
  average: z.number().nullable(),
  examCount: z.number(),
  insufficient: z.number(),
  subjects: z.array(SubjectAverage),
});
export type GradesOverview = z.infer<typeof GradesOverview>;

export const Exam = z.object({ id: z.string(), title: z.string(), date, weight: z.number(), classAverage: z.number().nullable(), value: z.number().nullable() });
export type Exam = z.infer<typeof Exam>;

export const SubjectGrades = z.object({
  subject: Subject,
  teacher: z.string().nullable(),
  exams: z.array(Exam),
  average: z.number().nullable(),
  classAverage: z.number().nullable(),
});
export type SubjectGrades = z.infer<typeof SubjectGrades>;

/** Zustand einer gefehlten Lektion: dispensiert, aufs Kontingent oder unentschuldigt (über dem Kontingent). */
export const AbsenceLessonState = z.enum(["dispensed", "contingent", "unexcused"]);
export type AbsenceLessonState = z.infer<typeof AbsenceLessonState>;

export const Absence = z.object({
  id: z.string(),
  date,
  /** schlechtester Zustand der Lektionen */
  status: AbsenceLessonState,
  lessons: z.array(
    z.object({
      period: z.number(),
      subjectCode: z.string().nullable(),
      subjectName: z.string().nullable(),
      teacher: z.string().nullable(),
      state: AbsenceLessonState,
      /** Kontingentslektionen: 0 dispensiert, 1, 2 ohne Abmeldung */
      weight: z.number(),
      notified: z.boolean(),
    }),
  ),
  subjectsLabel: z.string(),
});
export type Absence = z.infer<typeof Absence>;

/** Abmeldung (Absenzendatenbank): Datum, von Lektion bis Lektion, Bemerkung. */
export const AbsenceNotice = z.object({ id: z.string(), date, fromPeriod: z.number(), toPeriod: z.number(), from: z.string(), to: z.string(), note: z.string().nullable(), createdAt: stamp, editable: z.boolean() });
export type AbsenceNotice = z.infer<typeof AbsenceNotice>;

export const DispensationStatus = z.enum(["submitted", "approved", "rejected"]);
export type DispensationStatus = z.infer<typeof DispensationStatus>;

/** Gründe wie in der Absenzendatenbank der Schule. */
export const DISPENSATION_REASONS = [
  "Dispensation 1. Krankheitstag mit Arztzeugnis",
  "Dispensation ab 2. Krankheitstag",
  "Teilnahme an wichtigem Familienanlass",
  "Todesfall in der Familie",
  "Körperliche Behinderung (Sportunterricht); regelmässiger Therapiebesuch",
  "Aktive Teilnahme an kulturellem, religiösem, politischem und sportlichem Anlass",
  "Aufgebot durch Amts- und Dienststellen",
  "Prüfung für den Eintritt in andere Schule",
  "Spital- und Kuraufenthalt",
  "Berufskundliche Veranstaltung im Hinblick auf die Berufswahl; Vorstellungsgespräche",
  "Verspätung infolge ungünstiger Zugsverbindungen",
  "Sportdispensation",
] as const;

export const Dispensation = z.object({
  id: z.string(),
  date,
  reason: z.string(),
  note: z.string().nullable(),
  status: DispensationStatus,
  lessons: z.array(z.object({ period: z.number(), subjectCode: z.string().nullable(), subjectName: z.string().nullable() })),
  attachments: z.number(),
  createdAt: stamp,
  /** weniger als 5 Arbeitstage im Voraus (Art. 4d) */
  late: z.boolean(),
  /** änderbar, solange eingereicht */
  editable: z.boolean(),
});
export type Dispensation = z.infer<typeof Dispensation>;

export const AbsenceContingent = z.object({ semester: z.number(), size: z.number(), missed: z.number(), used: z.number(), available: z.number() });
export type AbsenceContingent = z.infer<typeof AbsenceContingent>;

/** Fachkontingent: höchstens doppelte Zahl der Wochenlektionen auf Kontingent (Art. 3d). */
export const SubjectLimit = z.object({ subjectCode: z.string(), subjectName: z.string(), used: z.number(), max: z.number() });
export type SubjectLimit = z.infer<typeof SubjectLimit>;

export const AbsencesOverview = z.object({
  contingent: AbsenceContingent,
  items: z.array(Absence),
  notices: z.array(AbsenceNotice),
  dispensations: z.array(Dispensation),
  subjects: z.array(SubjectLimit),
});
export type AbsencesOverview = z.infer<typeof AbsencesOverview>;

export const AbsenceNoticeSubmit = z
  .object({ date, fromPeriod: z.number().int().min(1).max(12), toPeriod: z.number().int().min(1).max(12), note: z.string().max(500).optional() })
  .refine((v) => v.fromPeriod <= v.toPeriod, { message: "Bis muss nach Von liegen.", path: ["toPeriod"] });
export type AbsenceNoticeSubmit = z.infer<typeof AbsenceNoticeSubmit>;

export const DispensationSubmit = z.object({
  date,
  reason: z.enum(DISPENSATION_REASONS),
  note: z.string().max(500).optional(),
  periods: z.array(z.number().int().min(1).max(12)).min(1, "Wähle mindestens eine Lektion."),
  /** neue Anhänge; beim Bearbeiten bleiben bisherige, solange `keepAttachments` gesetzt ist */
  attachmentKeys: z.array(z.string()).max(2, "Höchstens zwei Anhänge.").optional(),
  keepAttachments: z.boolean().optional(),
});
export type DispensationSubmit = z.infer<typeof DispensationSubmit>;

export const SolBlock = z.object({ id: z.string(), n: z.number(), starts: date.nullable(), ends: date.nullable() });

export const SolTask = z.object({
  id: z.string(),
  subjectCode: z.string(),
  code: z.string(),
  title: z.string(),
  minutes: z.number(),
  percent: z.number(),
  sharepointUrl: z.string().nullable(),
  hasFile: z.boolean(),
});
export type SolTask = z.infer<typeof SolTask>;

export const SolTasks = z.object({
  blocks: z.array(SolBlock),
  block: SolBlock.nullable(),
  groups: z.array(z.object({ subject: Subject, teacher: z.string().nullable(), tasks: z.array(SolTask) })),
});
export type SolTasks = z.infer<typeof SolTasks>;

export const SolDay = z.object({ id: z.string(), date, blockN: z.number() });
export type SolDay = z.infer<typeof SolDay>;

export const SolPlanEntry = z.object({ id: z.string(), taskId: z.string(), subjectCode: z.string(), subjectShort: z.string(), code: z.string(), title: z.string(), start: time, end: time, note: z.string().nullable() });
export type SolPlanEntry = z.infer<typeof SolPlanEntry>;

export const SolPresence = z.object({ id: z.string(), teacherCode: z.string(), teacherName: z.string(), subjectCode: z.string().nullable(), subjectShort: z.string().nullable(), subjectName: z.string().nullable(), start: time, end: time, room: z.string().nullable(), lane: z.number() });
export type SolPresence = z.infer<typeof SolPresence>;

export const SolCalendar = z.object({
  days: z.array(SolDay),
  day: SolDay.nullable(),
  plan: z.array(SolPlanEntry),
  presence: z.array(SolPresence),
});
export type SolCalendar = z.infer<typeof SolCalendar>;

export const SolPlanCreate = z
  .object({ solDayId: z.string(), taskId: z.string(), start: time, end: time, note: z.string().max(300).optional() })
  .refine((v) => v.start < v.end, { message: "Bis muss nach Von liegen.", path: ["end"] });
export type SolPlanCreate = z.infer<typeof SolPlanCreate>;

export const SolPortfolioEntry = z.object({ id: z.string().nullable(), solDayId: z.string(), date, checkIn: z.string().nullable(), checkOut: z.string().nullable() });
export type SolPortfolioEntry = z.infer<typeof SolPortfolioEntry>;

export const SolPortfolio = z.object({ entries: z.array(SolPortfolioEntry), next: SolPortfolioEntry.nullable() });
export type SolPortfolio = z.infer<typeof SolPortfolio>;

export const SolPortfolioPut = z.object({ solDayId: z.string(), checkIn: z.string().max(2000), checkOut: z.string().max(2000) });

export const NewsItem = z.object({
  id: z.string(),
  title: z.string(),
  teaser: z.string().nullable(),
  author: z.string().nullable(),
  publishedAt: stamp,
  pinned: z.boolean(),
  unread: z.boolean(),
});
export type NewsItem = z.infer<typeof NewsItem>;

export const DocumentItem = z.object({
  id: z.string(),
  group: z.string(),
  title: z.string(),
  fileType: z.string(),
  sizeBytes: z.number().nullable(),
  note: z.string().nullable(),
  updatedAt: date.nullable(),
  isNew: z.boolean(),
});
export type DocumentItem = z.infer<typeof DocumentItem>;

export const NewsArticle = NewsItem.extend({ bodyMd: z.string().nullable(), document: DocumentItem.nullable() });
export type NewsArticle = z.infer<typeof NewsArticle>;

export const DocumentGroups = z.object({
  groups: z.array(z.object({ name: z.string(), total: z.number(), items: z.array(DocumentItem) })),
  total: z.number(),
});
export type DocumentGroups = z.infer<typeof DocumentGroups>;

export const LinkItem = z.object({ id: z.string(), group: z.string(), title: z.string(), sub: z.string().nullable(), url: z.string(), badge: z.string(), accent: z.boolean() });
export type LinkItem = z.infer<typeof LinkItem>;

export const NotificationItem = z.object({
  id: z.string(),
  kind: z.string(),
  icon: z.string(),
  title: z.string(),
  body: z.string().nullable(),
  href: z.string().nullable(),
  createdAt: stamp,
  unread: z.boolean(),
});
export type NotificationItem = z.infer<typeof NotificationItem>;

export const Home = z.object({
  today: date,
  now: time,
  next: Lesson.nullable(),
  lessons: z.array(Lesson),
  absences: z.object({ contingent: AbsenceContingent, recent: z.array(Absence) }),
  recentGrades: z.array(RecentGrade),
  news: z.array(NewsItem),
});
export type Home = z.infer<typeof Home>;

export const DemoAccount = z.object({ id: z.string(), name: z.string(), email: z.string(), classCode: z.string().nullable(), school: z.boolean() });
export type DemoAccount = z.infer<typeof DemoAccount>;

export const ApiError = z.object({ error: z.object({ code: z.string(), message: z.string(), field: z.string().optional() }) });
export type ApiError = z.infer<typeof ApiError>;
