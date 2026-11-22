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
  /** student oder teacher (admin.planary.ch) */
  role: z.enum(["student", "teacher"]).default("student"),
  /** Lehrperson: Klassen und Fächer aus admin.planary.ch */
  teaches: z.array(z.object({ classCode: z.string(), subject: z.string(), subjectName: z.string() })).default([]),
  /** Lehrperson: Klassen, in denen sie Klassenlehrperson ist */
  classTeacherOf: z.array(z.string()).default([]),
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
  /** Nur im Stundenplan einer Lehrperson: die Klasse der Lektion */
  classCode: z.string().nullable().optional(),
  /** Prüfung in dieser Lektion (Titel), aus dem Prüfungskalender */
  test: z.string().nullable().optional(),
});
export type Lesson = z.infer<typeof Lesson>;

/** Prüfungskalender: Prüfung einer Klasse (Lehrperson) oder eigene Prüfung (nur für mich). */
export const TestItem = z.object({
  id: z.string(),
  date,
  subject: Subject,
  title: z.string(),
  description: z.string().nullable(),
  /** Klasse; leer bei eigenen Prüfungen von Lernenden */
  classCode: z.string().nullable(),
  /** Name der Lehrperson, die sie erfasst hat; leer bei eigenen */
  author: z.string().nullable(),
  /** Ich habe sie erfasst und darf sie bearbeiten */
  mine: z.boolean(),
});
export type TestItem = z.infer<typeof TestItem>;

export const TestInput = z.object({
  date,
  subject: z.string().trim().min(1, "Fach fehlt.").max(8),
  title: z.string().trim().min(1, "Titel fehlt.").max(80),
  description: z.string().trim().max(1000).nullable().optional(),
  /** Nur Lehrpersonen: Klasse, für die die Prüfung gilt */
  classCode: z.string().trim().max(12).nullable().optional(),
});
export type TestInput = z.infer<typeof TestInput>;

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

export const RecentGrade = z.object({ examId: z.string(), subjectCode: z.string(), subjectName: z.string(), title: z.string(), date, value: z.number(), semester: z.number().optional(), module: z.string().nullable().optional() });
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

/** Stand eines Auftrags: offen, angefangen, erledigt. */
export const SolStatus = z.enum(["open", "started", "done"]);
export type SolStatus = z.infer<typeof SolStatus>;
export const SOL_STATUS_LABEL: Record<SolStatus, string> = { open: "Offen", started: "Angefangen", done: "Erledigt" };

export const SolFileKind = z.enum(["task", "material", "solution"]);
export type SolFileKind = z.infer<typeof SolFileKind>;
/** Datei eines Auftrags: `href` liefert das Original (Endung `ext`), `pdfHref` die PDF-Fassung von Word und PowerPoint. */
export const SolFile = z.object({ id: z.string(), kind: SolFileKind, name: z.string(), ext: z.string(), bytes: z.number(), href: z.string(), pdfHref: z.string().nullable() });
export type SolFile = z.infer<typeof SolFile>;

export const SolTask = z.object({
  id: z.string(),
  subjectCode: z.string(),
  code: z.string(),
  title: z.string(),
  minutes: z.number(),
  status: SolStatus,
  sharepointUrl: z.string().nullable(),
  /** Dateien: der Auftrag, Unterlagen, Lösungen. */
  files: z.array(SolFile),
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
  /** Prüfungen der nächsten zwei Wochen */
  tests: z.array(TestItem).default([]),
});
export type Home = z.infer<typeof Home>;

// ---------- Präsenz (Lehrpersonen) ----------

/** Eine Kontrolle: eine Lektion oder eine Doppellektion desselben Fachs in derselben Klasse. */
export const AttendanceSlot = z.object({
  /** ID der ersten Lektion; Adresse der Erfassung */
  id: z.string(),
  date,
  start: time,
  end: time,
  periods: z.array(z.number()),
  classCode: z.string(),
  subject: Subject,
  room: z.string().nullable(),
  /** Erfasst: wann und wie viele fehlten; null = noch offen */
  checked: z.object({ at: z.string(), absent: z.number() }).nullable(),
});
export type AttendanceSlot = z.infer<typeof AttendanceSlot>;

export const AttendanceStudent = z.object({
  id: z.string(),
  name: z.string(),
  initials: z.string(),
  absent: z.boolean(),
  /** Abmeldung für diese Lektion vorhanden */
  notice: z.boolean(),
  /** Bewilligtes Gesuch für diese Lektion */
  dispensed: z.boolean(),
});
export type AttendanceStudent = z.infer<typeof AttendanceStudent>;

export const AttendanceSheet = z.object({ slot: AttendanceSlot, students: z.array(AttendanceStudent), editable: z.boolean() });
export type AttendanceSheet = z.infer<typeof AttendanceSheet>;

export const AttendanceInput = z.object({ absent: z.array(z.string()).max(200) });
export type AttendanceInput = z.infer<typeof AttendanceInput>;

/** Klasse aus Sicht einer Lehrperson; Absenzen nur für die Klassenlehrperson. */
export const ClassStudent = z.object({
  id: z.string(),
  name: z.string(),
  initials: z.string(),
  email: z.string(),
  absences: z
    .object({ missed: z.number(), unexcused: z.number(), contingentAvailable: z.number(), contingentSize: z.number(), lastDate: date.nullable() })
    .nullable(),
});
export type ClassStudent = z.infer<typeof ClassStudent>;

export const ClassView = z.object({
  code: z.string(),
  program: z.string().nullable(),
  classTeacher: z.boolean(),
  subjects: z.array(Subject),
  students: z.array(ClassStudent),
});
export type ClassView = z.infer<typeof ClassView>;

export const TeacherClass = z.object({
  code: z.string(),
  program: z.string().nullable(),
  subjects: z.array(Subject),
  students: z.number(),
  classTeacher: z.boolean(),
});
export type TeacherClass = z.infer<typeof TeacherClass>;

export const TeacherHome = z.object({
  today: date,
  now: time,
  next: Lesson.nullable(),
  lessons: z.array(Lesson),
  classes: z.array(TeacherClass),
  news: z.array(NewsItem),
  tests: z.array(TestItem).default([]),
  /** Präsenz der heutigen Lektionen */
  attendance: z.array(AttendanceSlot).default([]),
});
export type TeacherHome = z.infer<typeof TeacherHome>;

export const DemoAccount = z.object({ id: z.string(), name: z.string(), email: z.string(), classCode: z.string().nullable(), school: z.boolean(), role: z.enum(["student", "teacher"]).default("student") });
export type DemoAccount = z.infer<typeof DemoAccount>;

export const ApiError = z.object({ error: z.object({ code: z.string(), message: z.string(), field: z.string().optional() }) });
export type ApiError = z.infer<typeof ApiError>;

// ---------- Notenportfolio (eigene Noten, BM-Semester 1 bis 6, EFZ) ----------

export const PortfolioStatus = z.enum(["ok", "risk", "fail"]);

export const PortfolioEntry = z.object({
  id: z.string(),
  title: z.string(),
  value: z.number(),
  weight: z.number(),
  date: date.nullable(),
  enteredAt: date,
  classAverage: z.number().nullable(),
  /** own: selbst erfasst oder importiert; teacher: von der Lehrperson */
  source: z.enum(["own", "teacher"]).default("own"),
  /** false: eigene Erfassung in einem Fach, in dem die Lehrperson Noten erfasst hat */
  counts: z.boolean().default(true),
  /** Lehrperson bei source teacher */
  teacher: z.string().nullable().optional(),
});
export type PortfolioEntry = z.infer<typeof PortfolioEntry>;

/** Fach oder Informatikmodul im Semester: Schnitt ungerundet, Zeugnisnote (Fach auf 0.5, Modul auf 0.1). */
export const PortfolioSubjectRow = z.object({
  code: z.string(),
  name: z.string(),
  module: z.string().nullable(),
  moduleName: z.string().nullable(),
  raw: z.number().nullable(),
  grade: z.number().nullable(),
  count: z.number(),
  /** Unter 4: nötige Note der nächsten Probe (übliches Gewicht des Fachs) für eine 4; null, wenn nicht nötig oder unerreichbar */
  needFor4: z.number().nullable().optional(),
});
export type PortfolioSubjectRow = z.infer<typeof PortfolioSubjectRow>;

export const PortfolioSemester = z.object({
  n: z.number(),
  label: z.string(),
  /** Semester mit Noten und das laufende, für die Auswahl */
  semesters: z.array(z.object({ n: z.number(), label: z.string(), count: z.number() })),
  current: z.number().nullable(),
  count: z.number(),
  subjects: z.array(PortfolioSubjectRow),
  modules: z.array(PortfolioSubjectRow),
  informatics: z.object({ raw: z.number(), grade: z.number() }).nullable(),
  summary: z.object({
    bm: z.number().nullable(),
    efz: z.number().nullable(),
    insufficient: z.number(),
    deviation: z.number(),
    bmStatus: PortfolioStatus.nullable(),
    efzStatus: PortfolioStatus.nullable(),
    internship: PortfolioStatus.nullable(),
  }),
});
export type PortfolioSemester = z.infer<typeof PortfolioSemester>;

export const PortfolioSubjectDetail = z.object({
  semester: z.number(),
  label: z.string(),
  code: z.string(),
  name: z.string(),
  module: z.string().nullable(),
  moduleName: z.string().nullable(),
  teacher: z.string().nullable(),
  raw: z.number().nullable(),
  grade: z.number().nullable(),
  classAverage: z.number().nullable(),
  entries: z.array(PortfolioEntry),
});
export type PortfolioSubjectDetail = z.infer<typeof PortfolioSubjectDetail>;

export const EfzModule = z.object({ id: z.string(), year: z.number(), place: z.enum(["gibb", "uek"]), module: z.string(), name: z.string(), value: z.number().nullable() });
export type EfzModule = z.infer<typeof EfzModule>;

export const EfzOverview = z.object({
  modules: z.array(EfzModule),
  gibb: z.number().nullable(),
  uek: z.number().nullable(),
  total: z.number().nullable(),
  status: PortfolioStatus.nullable(),
  internship: PortfolioStatus.nullable(),
});
export type EfzOverview = z.infer<typeof EfzOverview>;

const grade = z.number().min(1, "Noten gehen von 1 bis 6.").max(6, "Noten gehen von 1 bis 6.");

/** Probe erfassen oder ändern. Informatik braucht die Modulnummer. */
export const PortfolioEntryInput = z
  .object({
    semester: z.number().int().min(1).max(6),
    subject: z.string().min(1).max(8),
    module: z.string().regex(/^\d{3}$/, "Modulnummer mit drei Ziffern.").nullable().optional(),
    title: z.string().trim().min(1, "Titel fehlt.").max(80),
    value: grade,
    weight: z.number().min(0).max(1000),
    date: date.nullable().optional(),
  })
  .refine((v) => v.subject !== "IN" || !!v.module, { message: "Modulnummer fehlt.", path: ["module"] });
export type PortfolioEntryInput = z.infer<typeof PortfolioEntryInput>;

export const EfzValueInput = z.object({ value: grade.nullable() });

export const PortfolioImportResult = z.object({ entries: z.number(), semesters: z.number(), efz: z.number(), nameMatches: z.boolean() });
export type PortfolioImportResult = z.infer<typeof PortfolioImportResult>;

// ---------- Noten der Lehrpersonen ----------

const gradeValue = z.number().min(1, "Noten gehen von 1 bis 6.").max(6, "Noten gehen von 1 bis 6.");

/** Eine Probe der Lehrperson für eine Klasse und ein Fach. */
export const Assessment = z.object({
  id: z.string(),
  classCode: z.string(),
  subject: Subject,
  title: z.string(),
  date,
  weight: z.number(),
  semester: z.number(),
  /** Mittel der erfassten Noten, ab drei Noten */
  average: z.number().nullable(),
  graded: z.number(),
  mine: z.boolean(),
});
export type Assessment = z.infer<typeof Assessment>;

export const AssessmentInput = z.object({
  classCode: z.string().trim().min(1).max(12),
  subject: z.string().trim().min(1).max(8),
  title: z.string().trim().min(1, "Titel fehlt.").max(80),
  date,
  weight: z.number().gt(0, "Das Gewicht muss grösser als 0 sein.").max(100),
});
export type AssessmentInput = z.infer<typeof AssessmentInput>;

export const AssessmentGradesInput = z.object({
  grades: z.array(z.object({ userId: z.string(), value: gradeValue.nullable() })).max(200),
});
export type AssessmentGradesInput = z.infer<typeof AssessmentGradesInput>;

export const AssessmentSheet = z.object({
  assessment: Assessment,
  students: z.array(z.object({ id: z.string(), name: z.string(), initials: z.string(), value: z.number().nullable() })),
  editable: z.boolean(),
});
export type AssessmentSheet = z.infer<typeof AssessmentSheet>;

/** Notenbuch: Proben als Spalten, Lernende als Zeilen, Zeugnisnote pro Person. */
export const Gradebook = z.object({
  classCode: z.string(),
  subject: Subject,
  semester: z.number(),
  semesterLabel: z.string(),
  semesters: z.array(z.object({ n: z.number(), label: z.string() })),
  assessments: z.array(Assessment),
  students: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      initials: z.string(),
      values: z.array(z.number().nullable()),
      raw: z.number().nullable(),
      grade: z.number().nullable(),
    }),
  ),
  /** Darf Proben erfassen (Fach zugeteilt); die Klassenlehrperson sieht alle Fächer nur an */
  editable: z.boolean(),
});
export type Gradebook = z.infer<typeof Gradebook>;

// ---------- Klassenraum ----------

export const ClassFile = z.object({
  id: z.string(),
  name: z.string(),
  ext: z.string(),
  bytes: z.number(),
  subject: Subject.nullable(),
  postId: z.string().nullable(),
  uploadedBy: z.string(),
  createdAt: z.string(),
  /** Darf löschen (hochgeladen oder Klassenlehrperson) */
  canDelete: z.boolean(),
});
export type ClassFile = z.infer<typeof ClassFile>;

export const ClassPost = z.object({
  id: z.string(),
  subject: Subject.nullable(),
  author: z.string(),
  body: z.string(),
  createdAt: z.string(),
  edited: z.boolean(),
  files: z.array(ClassFile),
  /** Darf bearbeiten (verfasst) */
  mine: z.boolean(),
  /** Darf löschen (verfasst oder Klassenlehrperson) */
  canDelete: z.boolean(),
});
export type ClassPost = z.infer<typeof ClassPost>;

export const Classroom = z.object({
  classCode: z.string(),
  /** Fächer mit Beiträgen oder Dateien, zum Filtern */
  subjects: z.array(Subject),
  /** Wofür ich schreiben darf; null = ganze Klasse (nur Klassenlehrperson). Leer: nur lesen */
  canPostFor: z.array(z.object({ code: z.string().nullable(), name: z.string() })),
  posts: z.array(ClassPost),
  files: z.array(ClassFile),
});
export type Classroom = z.infer<typeof Classroom>;

export const ClassPostInput = z.object({
  classCode: z.string().trim().min(1).max(12),
  subject: z.string().trim().max(8).nullable(),
  body: z.string().trim().min(1, "Der Beitrag ist leer.").max(5000, "Höchstens 5000 Zeichen."),
  fileIds: z.array(z.string()).max(10).default([]),
});
export type ClassPostInput = z.infer<typeof ClassPostInput>;

// ---------- SOL für Lehrpersonen ----------

export const SolTeacherTask = z.object({
  id: z.string(),
  code: z.string(),
  title: z.string(),
  minutes: z.number(),
  sharepointUrl: z.string().nullable(),
  files: z.array(SolFile),
  counts: z.object({ open: z.number(), started: z.number(), done: z.number() }),
});
export type SolTeacherTask = z.infer<typeof SolTeacherTask>;

/** SOL einer Klasse aus Sicht der Lehrperson: Aufträge pro Fach mit Stand pro Person. */
export const SolOverview = z.object({
  classCode: z.string(),
  blocks: z.array(SolBlock),
  block: SolBlock.nullable(),
  groups: z.array(z.object({ subject: Subject, editable: z.boolean(), tasks: z.array(SolTeacherTask) })),
  students: z.array(z.object({ id: z.string(), name: z.string() })),
  /** Stand pro Auftrag und Person (fehlt = offen) */
  status: z.record(z.string(), z.record(z.string(), SolStatus)),
});
export type SolOverview = z.infer<typeof SolOverview>;

export const SolTaskInput = z.object({
  classCode: z.string().trim().min(1).max(12),
  block: z.number().int().min(1).max(99),
  subject: z.string().trim().min(1).max(8),
  code: z.string().trim().min(1, "Kürzel fehlt.").max(12),
  title: z.string().trim().min(1, "Titel fehlt.").max(120),
  minutes: z.number().int().min(5).max(600),
  sharepointUrl: z.string().trim().url("Keine gültige Adresse.").max(500).nullable().optional(),
});
export type SolTaskInput = z.infer<typeof SolTaskInput>;

// ---------- SOL-Check-in (QR in der Lernzone) ----------

export const CheckinStudent = z.object({ id: z.string(), name: z.string(), checkIn: time.nullable(), checkOut: time.nullable() });

/** Für die Lehrperson: Code zum Anzeigen (null, wenn heute kein SOL-Tag ist) und wer schon da ist. */
export const CheckinBoard = z.object({
  classCode: z.string(),
  date,
  day: z.object({ id: z.string(), date }).nullable(),
  nextDay: date.nullable(),
  code: z.string().nullable(),
  /** Millisekunden seit 1970 */
  expiresAt: z.number().nullable(),
  students: z.array(CheckinStudent),
});
export type CheckinBoard = z.infer<typeof CheckinBoard>;

/** Für die Lernende nach dem Scannen: was der nächste Schritt ist. */
export const CheckinInfo = z.object({
  valid: z.boolean(),
  classCode: z.string().nullable(),
  date: date.nullable(),
  next: z.enum(["in", "out", "done"]).nullable(),
  checkIn: time.nullable(),
  checkOut: time.nullable(),
});
export type CheckinInfo = z.infer<typeof CheckinInfo>;
