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
  /** Anzeigename (Beispieldaten, Import); mit Konto gilt classTeacherId */
  classTeacher: text("class_teacher"),
  /** Klassenlehrperson mit Konto (Rolle teacher), gesetzt in admin.planary.ch */
  classTeacherId: text("class_teacher_id"),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  classId: text("class_id").references(() => classes.id),
  /** student oder teacher; Lehrpersonen werden in admin.planary.ch bestimmt */
  role: text("role").notNull().default("student"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  /** Zuletzt angemeldet oder aktiv (Wanduhrzeit, auf 10 Minuten genau) */
  lastLoginAt: text("last_login_at"),
});

export const roles = ["student", "teacher"] as const;
export type Role = (typeof roles)[number];

/** Was eine Lehrperson unterrichtet: Klasse und Fach. Sie sieht nur diese Fächer dieser Klassen. */
export const teacherAssignments = sqliteTable(
  "teacher_assignments",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    classId: text("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    subjectCode: text("subject_code").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.classId, t.subjectCode] }), index("teacher_assignments_class").on(t.classId)],
);

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

/**
 * Prüfungskalender: Prüfungen einer Lehrperson für eine Klasse (class_id gesetzt, Fach zugewiesen) oder
 * eigene Prüfungen von Lernenden (class_id leer, nur für sie sichtbar). Bearbeiten darf nur, wer sie erfasst hat.
 */
export const tests = sqliteTable(
  "tests",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    classId: text("class_id").references(() => classes.id, { onDelete: "cascade" }),
    subjectCode: text("subject_code").notNull(),
    date: text("date").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [index("tests_class_date").on(t.classId, t.date), index("tests_owner").on(t.ownerId)],
);

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
/**
 * Eigene Noten wie im Notenportfolio IMS: pro BM-Semester (1 bis 6) Fach, Informatikmodul (IN), Probe, Note, Gewicht.
 * Kommt aus dem Excel-Import oder wird im Portal erfasst. Datum der Probe, wenn bekannt; sonst zählt `enteredAt`.
 */
export const myGrades = sqliteTable(
  "my_grades",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    semester: integer("semester").notNull(),
    subject: text("subject").notNull(),
    module: text("module"),
    moduleName: text("module_name"),
    title: text("title").notNull(),
    value: real("value").notNull(),
    weight: real("weight").notNull().default(1),
    date: text("date"),
    enteredAt: text("entered_at").notNull(),
    classAverage: real("class_average"),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [index("my_grades_user_semester").on(t.userId, t.semester), check("my_grades_value_check", sql`${t.value} BETWEEN 1 AND 6`), check("my_grades_semester_check", sql`${t.semester} BETWEEN 1 AND 6`)],
);

/**
 * Noten der Lehrpersonen: eine Probe pro Klasse und Fach (Kürzel der Vorlage, z. B. D für Deutsch) mit Gewicht und
 * BM-Semester; die Noten der Lernenden in assessment_grades. Sobald eine Lehrperson in einem Fach und Semester Noten
 * erfasst hat, zählen für die Lernenden nur noch diese (eigene Erfassungen bleiben sichtbar).
 */
export const assessments = sqliteTable(
  "assessments",
  {
    id: text("id").primaryKey(),
    classId: text("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    subjectCode: text("subject_code").notNull(),
    semester: integer("semester").notNull(),
    title: text("title").notNull(),
    date: text("date").notNull(),
    weight: real("weight").notNull().default(1),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [index("assessments_class_subject").on(t.classId, t.subjectCode, t.semester), check("assessments_semester_check", sql`${t.semester} BETWEEN 1 AND 6`)],
);

export const assessmentGrades = sqliteTable(
  "assessment_grades",
  {
    assessmentId: text("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    value: real("value").notNull(),
    enteredAt: text("entered_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.assessmentId, t.userId] }), index("assessment_grades_user").on(t.userId), check("assessment_grades_value_check", sql`${t.value} BETWEEN 1 AND 6`)],
);

/**
 * Klassenraum: Beiträge der Lehrpersonen an eine Klasse, für ein Fach oder (subject_code leer) die ganze Klasse,
 * und Dateien, an einen Beitrag gehängt oder einzeln abgelegt. Dateien liegen in R2 unter klassenraum/<Klasse>/.
 */
export const classPosts = sqliteTable(
  "class_posts",
  {
    id: text("id").primaryKey(),
    classId: text("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    subjectCode: text("subject_code"),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [index("class_posts_class_created").on(t.classId, t.createdAt)],
);

export const classFiles = sqliteTable(
  "class_files",
  {
    id: text("id").primaryKey(),
    classId: text("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    subjectCode: text("subject_code"),
    postId: text("post_id").references(() => classPosts.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    ext: text("ext").notNull(),
    mime: text("mime").notNull(),
    bytes: integer("bytes").notNull(),
    r2Key: text("r2_key").notNull(),
    uploadedBy: text("uploaded_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: text("created_at").notNull(),
  },
  (t) => [index("class_files_class").on(t.classId, t.createdAt), index("class_files_post").on(t.postId)],
);

/** EFZ-Übersicht: Informatikmodule (gibb) und überbetriebliche Kurse (üK) pro Ausbildungsjahr. */
export const myEfz = sqliteTable(
  "my_efz",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    place: text("place", { enum: ["gibb", "uek"] }).notNull(),
    module: text("module").notNull(),
    name: text("name").notNull(),
    value: real("value"),
  },
  (t) => [index("my_efz_user").on(t.userId), check("my_efz_place_check", sql`${t.place} IN ('gibb','uek')`)],
);

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
    /** Präsenz im Portal: Lehrperson, die die Lektion erfasst hat, und wann (leer bei Import und Beispieldaten) */
    recordedBy: text("recorded_by"),
    recordedAt: text("recorded_at"),
  },
  (t) => [primaryKey({ columns: [t.absenceId, t.period] })],
);

/**
 * Präsenz erfasst: eine Lektion (Klasse, Datum, Beginn, Fach) wurde kontrolliert. Fehlende Lernende stehen als
 * absence_lessons; diese Zeile zeigt nur, dass die Kontrolle stattfand. Natürlicher Schlüssel statt Lektions-ID,
 * damit ein neuer Import des Stundenplans die Erfassung nicht verliert.
 */
export const attendanceChecks = sqliteTable(
  "attendance_checks",
  {
    classId: text("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    startTime: text("start_time").notNull(),
    subjectCode: text("subject_code").notNull(),
    recordedBy: text("recorded_by").notNull(),
    recordedAt: text("recorded_at").notNull(),
    absent: integer("absent").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.classId, t.date, t.startTime, t.subjectCode] })],
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
  /** Nur für diese Klasse sichtbar; leer = für alle. Die erfundenen Beispieldaten gehören zur Demo-Klasse. */
  classId: text("class_id").references(() => classes.id),
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
  /** Nur für diese Klasse sichtbar; leer = für alle. Die erfundenen Beispieldaten gehören zur Demo-Klasse. */
  classId: text("class_id").references(() => classes.id),
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
