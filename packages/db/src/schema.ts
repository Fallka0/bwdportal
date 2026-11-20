/**
 * D1-Schema (SQLite) nach handoff/data/schema.sql.
 * Zeiten sind Wandzeit in Europe/Zurich als Text: Datum YYYY-MM-DD, Uhrzeit HH:MM, Zeitpunkt YYYY-MM-DDTHH:MM.
 * Ergänzungen gegenüber dem Vorschlag sind kommentiert.
 */
import { sql } from "drizzle-orm";
import { check, index, integer, primaryKey, real, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

export const classes = sqliteTable("classes", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  program: text("program"),
  classTeacher: text("class_teacher"),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  classId: text("class_id").references(() => classes.id),
  role: text("role").notNull().default("student"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: text("expires_at").notNull(),
});

export const subjects = sqliteTable("subjects", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  short: text("short").notNull(),
});

export const teachers = sqliteTable("teachers", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
});

/** Ergänzung: welche Lehrperson ein Fach in einer Klasse unterrichtet (Noten, SOL). */
export const classSubjects = sqliteTable(
  "class_subjects",
  {
    classId: text("class_id")
      .notNull()
      .references(() => classes.id),
    subjectCode: text("subject_code")
      .notNull()
      .references(() => subjects.code),
    teacherCode: text("teacher_code").references(() => teachers.code),
  },
  (t) => [primaryKey({ columns: [t.classId, t.subjectCode] })],
);

export const periods = sqliteTable("periods", {
  n: integer("n").primaryKey(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
});

export const lessonStates = ["normal", "room_changed", "cancelled", "sol"] as const;

/** Stundenplan: Snapshot aus dem Import. source + external_id machen den Import wiederholbar (Upsert). */
export const lessons = sqliteTable(
  "lessons",
  {
    id: text("id").primaryKey(),
    classId: text("class_id")
      .notNull()
      .references(() => classes.id),
    date: text("date").notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    subjectCode: text("subject_code").references(() => subjects.code),
    teacherCode: text("teacher_code"),
    room: text("room"),
    state: text("state", { enum: lessonStates }).notNull().default("normal"),
    originalRoom: text("original_room"),
    source: text("source").notNull().default("mock"),
    externalId: text("external_id"),
  },
  (t) => [
    unique("lessons_source_external").on(t.source, t.externalId),
    index("lessons_class_date").on(t.classId, t.date),
    check("lessons_state_check", sql`${t.state} IN ('normal','room_changed','cancelled','sol')`),
  ],
);

export const importRuns = sqliteTable("import_runs", {
  id: text("id").primaryKey(),
  source: text("source").notNull(),
  startedAt: text("started_at").notNull(),
  finishedAt: text("finished_at"),
  ok: integer("ok", { mode: "boolean" }),
  lessons: integer("lessons"),
  error: text("error"),
});

export const exams = sqliteTable("exams", {
  id: text("id").primaryKey(),
  classId: text("class_id").notNull(),
  subjectCode: text("subject_code").notNull(),
  title: text("title").notNull(),
  date: text("date").notNull(),
  weight: real("weight").notNull().default(1),
  semester: integer("semester").notNull(),
  classAverage: real("class_average"),
});

export const grades = sqliteTable(
  "grades",
  {
    id: text("id").primaryKey(),
    examId: text("exam_id")
      .notNull()
      .references(() => exams.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    value: real("value").notNull(),
  },
  (t) => [unique("grades_exam_user").on(t.examId, t.userId), check("grades_value_check", sql`${t.value} BETWEEN 1 AND 6`)],
);

/**
 * Absenz, wie die Lehrperson sie erfasst (Absenzenreglement Art. 6a): Tag und Lektionen.
 * Ob eine Lektion dispensiert, aufs Kontingent oder unentschuldigt zählt, ergibt sich aus Abmeldungen und Gesuchen.
 */
export const absences = sqliteTable(
  "absences",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    date: text("date").notNull(),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  },
  (t) => [index("absences_user_date").on(t.userId, t.date)],
);

export const absenceLessons = sqliteTable(
  "absence_lessons",
  {
    absenceId: text("absence_id")
      .notNull()
      .references(() => absences.id, { onDelete: "cascade" }),
    period: integer("period").notNull(),
    subjectCode: text("subject_code"),
  },
  (t) => [primaryKey({ columns: [t.absenceId, t.period] })],
);

/** Abmeldung (Absenzendatenbank der Schule, Art. 2b): von Lektion bis Lektion, mit Bemerkung. */
export const absenceNotices = sqliteTable(
  "absence_notices",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    fromPeriod: integer("from_period").notNull(),
    toPeriod: integer("to_period").notNull(),
    note: text("note"),
    createdAt: text("created_at").notNull(),
  },
  (t) => [index("absence_notices_user_date").on(t.userId, t.date), check("absence_notices_periods_check", sql`${t.fromPeriod} <= ${t.toPeriod}`)],
);

export const dispensationStatuses = ["submitted", "approved", "rejected"] as const;

/** Ergänzung (Absenzendatenbank der Schule): Dispensationsgesuch mit Grund, Lektionen und bis zu zwei Anhängen. */
export const dispensations = sqliteTable(
  "dispensations",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    reason: text("reason").notNull(),
    note: text("note"),
    status: text("status", { enum: dispensationStatuses }).notNull().default("submitted"),
    attachmentKey: text("attachment_key"),
    attachmentKey2: text("attachment_key2"),
    createdAt: text("created_at").notNull(),
  },
  (t) => [index("dispensations_user_date").on(t.userId, t.date), check("dispensations_status_check", sql`${t.status} IN ('submitted','approved','rejected')`)],
);

export const dispensationLessons = sqliteTable(
  "dispensation_lessons",
  {
    dispensationId: text("dispensation_id")
      .notNull()
      .references(() => dispensations.id, { onDelete: "cascade" }),
    period: integer("period").notNull(),
    subjectCode: text("subject_code"),
  },
  (t) => [primaryKey({ columns: [t.dispensationId, t.period] })],
);

export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(),
  grp: text("grp").notNull(),
  title: text("title").notNull(),
  fileType: text("file_type").notNull(),
  sizeBytes: integer("size_bytes"),
  note: text("note"),
  r2Key: text("r2_key"),
  updatedAt: text("updated_at"),
  /** Ergänzung: Reihenfolge innerhalb der Gruppe wie im Design. */
  sort: integer("sort").notNull().default(0),
});

export const links = sqliteTable("links", {
  id: text("id").primaryKey(),
  grp: text("grp").notNull(),
  title: text("title").notNull(),
  sub: text("sub"),
  url: text("url").notNull(),
  sort: integer("sort").notNull().default(0),
  /** Ergänzung: Kürzel auf der Kachel (z. B. "Ou") und ob sie dunkel ist. */
  badge: text("badge").notNull(),
  accent: integer("accent", { mode: "boolean" }).notNull().default(false),
});

export const news = sqliteTable("news", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  teaser: text("teaser"),
  bodyMd: text("body_md"),
  author: text("author"),
  publishedAt: text("published_at").notNull(),
  pinned: integer("pinned", { mode: "boolean" }).notNull().default(false),
  documentId: text("document_id"),
});

export const newsRead = sqliteTable(
  "news_read",
  {
    newsId: text("news_id").notNull(),
    userId: text("user_id").notNull(),
  },
  (t) => [primaryKey({ columns: [t.newsId, t.userId] })],
);

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  /** warn, ok, info: Farbe des Icons */
  kind: text("kind").notNull(),
  /** Ergänzung: Icon-Name aus den gemeinsamen Icons */
  icon: text("icon").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  href: text("href"),
  createdAt: text("created_at").notNull(),
  readAt: text("read_at"),
});

export const settings = sqliteTable("settings", {
  userId: text("user_id").primaryKey(),
  theme: text("theme").notNull().default("system"),
  nTimetable: integer("n_timetable", { mode: "boolean" }).notNull().default(true),
  nGrades: integer("n_grades", { mode: "boolean" }).notNull().default(true),
  nNews: integer("n_news", { mode: "boolean" }).notNull().default(true),
  nAbsences: integer("n_absences", { mode: "boolean" }).notNull().default(true),
  nEmail: integer("n_email", { mode: "boolean" }).notNull().default(false),
});

// ---- SOL ----

export const solBlocks = sqliteTable("sol_blocks", {
  id: text("id").primaryKey(),
  classId: text("class_id").notNull(),
  n: integer("n").notNull(),
  starts: text("starts"),
  ends: text("ends"),
});

export const solDays = sqliteTable("sol_days", {
  id: text("id").primaryKey(),
  blockId: text("block_id")
    .notNull()
    .references(() => solBlocks.id),
  date: text("date").notNull(),
});

export const solTasks = sqliteTable("sol_tasks", {
  id: text("id").primaryKey(),
  blockId: text("block_id")
    .notNull()
    .references(() => solBlocks.id),
  subjectCode: text("subject_code").notNull(),
  code: text("code").notNull(),
  title: text("title").notNull(),
  minutes: integer("minutes").notNull(),
  sharepointUrl: text("sharepoint_url"),
  /** Platzhalter-PDF der Beispieldaten; echte Dateien stehen in sol_task_files */
  r2Key: text("r2_key"),
});

export const solFileKinds = ["task", "material", "solution"] as const;

/**
 * Dateien eines Auftrags aus dem SOL-Ordner: der Auftrag selbst, Unterlagen, Lösungen. Das Original (Word, PDF,
 * PowerPoint, Audio, Video, Bild) liegt unter `key`; Word und PowerPoint zusätzlich als PDF unter `pdfKey`.
 */
export const solTaskFiles = sqliteTable(
  "sol_task_files",
  {
    id: text("id").primaryKey(),
    taskId: text("task_id")
      .notNull()
      .references(() => solTasks.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: solFileKinds }).notNull(),
    name: text("name").notNull(),
    /** Endung des Originals: docx, pdf, pptx, mp3, mp4, jpg … */
    ext: text("ext").notNull(),
    key: text("key").notNull(),
    pdfKey: text("pdf_key"),
    bytes: integer("bytes").notNull().default(0),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [index("sol_task_files_task").on(t.taskId), check("sol_task_files_kind_check", sql`${t.kind} IN ('task','material','solution')`)],
);

/** Stand eines SOL-Auftrags pro Person: offen, angefangen, erledigt. */
export const solStatuses = ["open", "started", "done"] as const;

export const solProgress = sqliteTable(
  "sol_progress",
  {
    taskId: text("task_id").notNull(),
    userId: text("user_id").notNull(),
    status: text("status", { enum: solStatuses }).notNull().default("open"),
  },
  (t) => [primaryKey({ columns: [t.taskId, t.userId] }), check("sol_progress_status_check", sql`${t.status} IN ('open','started','done')`)],
);

export const solPlan = sqliteTable("sol_plan", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  solDayId: text("sol_day_id")
    .notNull()
    .references(() => solDays.id),
  taskId: text("task_id")
    .notNull()
    .references(() => solTasks.id),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  note: text("note"),
});

export const solPresence = sqliteTable("sol_presence", {
  id: text("id").primaryKey(),
  solDayId: text("sol_day_id")
    .notNull()
    .references(() => solDays.id),
  teacherCode: text("teacher_code").notNull(),
  subjectCode: text("subject_code"),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  room: text("room"),
  /** Ergänzung: Spur im Kalender (0 bis 3), wie im Design */
  lane: integer("lane").notNull().default(0),
});

export const solPortfolio = sqliteTable(
  "sol_portfolio",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    solDayId: text("sol_day_id")
      .notNull()
      .references(() => solDays.id),
    checkIn: text("check_in"),
    checkOut: text("check_out"),
    updatedAt: text("updated_at"),
  },
  (t) => [unique("sol_portfolio_user_day").on(t.userId, t.solDayId)],
);

/** Einmal-Code für die App nach dem Microsoft-Login (60 Sekunden gültig, nur einmal einlösbar). */
export const loginCodes = sqliteTable("login_codes", {
  code: text("code").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  expiresAt: text("expires_at").notNull(),
});

/** Geheimer Link fürs Kalender-Abo. Ein Token pro Person; neu erstellen macht den alten ungültig. */
export const calendarTokens = sqliteTable("calendar_tokens", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  createdAt: text("created_at").notNull(),
});
