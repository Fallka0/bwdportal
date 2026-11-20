/**
 * Baut alle Beispieldaten aus handoff/data/fixtures.json und config/portal.json.
 * Stichtag: Montag, 26.10.2026, 10:20, Klasse IM24b. Alle Personen sind erfunden.
 *
 * Ergänzungen, die die Fixtures offen lassen (ebenfalls erfunden, passend zu den Screenshots):
 * - Prüfungen der übrigen Fächer so, dass die Schnitte genau den Werten im Design entsprechen.
 * - Stundenplan der Wochen 41 bis 51 nach dem Muster der Woche 44. Raumänderung und Ausfall nur am 26.10.
 * - SOL-Blöcke 1 bis 3 mit allen Freitagen als SOL-Tage.
 * - Ein zweites Demo-Konto (Mia Steiner) ohne Noten und Absenzen, um Leerzustände zu zeigen.
 * - Eine Demo-Lehrperson (Regula Keller): Mathematik in der Demo-Klasse, Klassenlehrperson.
 */
import { addDays, config, toMin, weekday } from "@bwd/shared";
import fixtures from "../../../../handoff/data/fixtures.json";

export type Row = Record<string, string | number | boolean | null>;
export type SeedData = Record<string, Row[]>;

export const CLASS_ID = "c-im24b";
export const DEMO_USERS = {
  selin: "u-selin",
  mia: "u-mia",
  teacher: "u-keller",
} as const;

const TEACHERS: Record<string, string> = {
  KEL: "R. Keller",
  MOR: "J. Moret",
  MAE: "C. Mäder",
  DUP: "A. Dupont",
  BRU: "T. Brunner",
  SCH: "B. Schneider",
  WEB: "L. Weber",
  GRA: "S. Graf",
  ZUR: "M. Zürcher",
};
const TEACHER_BY_NAME = Object.fromEntries(Object.entries(TEACHERS).map(([k, v]) => [v, k]));
const TEACHER_BY_LAST = Object.fromEntries(Object.entries(TEACHERS).map(([k, v]) => [v.split(" ")[1], k]));

const slug = (t: string) =>
  t
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/é/g, "e")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const kb = (s: string) => Math.round(parseFloat(s) * 1024);

/** "Do 22.10." oder "Di 20.10.2026" → ISO-Datum im Schuljahr 2026/27 */
function parseCh(s: string): string {
  const m = /(\d{1,2})\.(\d{1,2})\.(\d{4})?/.exec(s);
  if (!m) throw new Error(`Datum nicht lesbar: ${s}`);
  const month = Number(m[2]);
  const year = m[3] ? Number(m[3]) : month >= 8 ? 2026 : 2027;
  return `${year}-${String(month).padStart(2, "0")}-${m[1]!.padStart(2, "0")}`;
}

/** "Freitag, 16. Oktober" → ISO-Datum */
function parseLong(s: string): string {
  const months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const m = /(\d{1,2})\. (\p{L}+)/u.exec(s);
  if (!m) throw new Error(`Datum nicht lesbar: ${s}`);
  const month = months.indexOf(m[2]!) + 1;
  return parseCh(`${m[1]}.${month}.`);
}

const period = (n: number) => config.periods.find((p) => p.n === n)!;

// Prüfungen je Fach. Titel, Datum, Note, Gewicht, Klassenschnitt.
// Mathematik und die neusten Noten kommen aus den Fixtures, der Rest ist ergänzt.
type Ex = [title: string, date: string, grade: number, weight: number, classAvg: number];
const EXTRA_EXAMS: Record<string, Ex[]> = {
  IN: [
    ["Python Grundlagen", "2026-08-25", 5.5, 1, 4.9],
    ["HTML und CSS", "2026-09-08", 6, 1, 5.1],
    ["Datenbanken und SQL", "2026-09-29", 5.5, 1, 4.8],
    ["Algorithmen", "2026-10-13", 5.5, 1, 4.7],
  ],
  EN: [
    ["Unit 2 Test", "2026-09-03", 5.5, 1, 4.9],
    ["Unit 3 Test", "2026-09-24", 5.25, 1, 4.8],
  ],
  DE: [
    ["Textanalyse", "2026-09-02", 5, 1, 4.6],
    ["Erörterung", "2026-09-23", 5.5, 1, 4.8],
    ["Grammatik", "2026-10-07", 5, 1, 4.7],
  ],
  GP: [
    ["Industrialisierung", "2026-09-15", 5, 1, 4.5],
    ["Politisches System der Schweiz", "2026-10-06", 5.25, 1, 4.6],
  ],
  FRW: [
    ["Bilanz und Erfolgsrechnung", "2026-09-01", 4.5, 1, 4.4],
    ["Doppelte Buchhaltung", "2026-09-22", 5.5, 1, 4.6],
    ["Warenkonten", "2026-10-13", 5, 1, 4.5],
  ],
  WR: [
    ["Rechtsgrundlagen", "2026-09-03", 4.5, 1, 4.3],
    ["Vertragsrecht", "2026-09-24", 5, 1, 4.6],
    ["Marktwirtschaft", "2026-10-08", 5, 1, 4.5],
  ],
  FR: [
    ["Compréhension écrite", "2026-09-10", 4, 1, 4.2],
    ["Vocabulaire", "2026-10-01", 4.5, 1, 4.4],
  ],
  NW: [["Chemische Grundlagen", "2026-09-17", 4, 1, 4.3]],
};

export function buildSeed(): SeedData {
  const f = fixtures;
  const svc = config.services;
  const d: SeedData = {};

  // ---- Stammdaten ----
  d.classes = [{ id: CLASS_ID, code: f.user.classCode, program: f.user.program, class_teacher: f.user.classTeacher, class_teacher_id: DEMO_USERS.teacher }];
  d.users = [
    { id: DEMO_USERS.selin, email: f.user.email, first_name: f.user.firstName, last_name: f.user.name.split(" ").slice(1).join(" "), class_id: CLASS_ID, role: "student", created_at: "2026-08-10T08:00" },
    { id: DEMO_USERS.mia, email: `mia.steiner@${config.school.emailDomain}`, first_name: "Mia", last_name: "Steiner", class_id: CLASS_ID, role: "student", created_at: "2026-08-10T08:00" },
    { id: DEMO_USERS.teacher, email: `regula.keller@${config.school.emailDomain}`, first_name: "Regula", last_name: "Keller", class_id: null, role: "teacher", created_at: "2026-08-01T08:00" },
  ];
  d.teacher_assignments = [{ user_id: DEMO_USERS.teacher, class_id: CLASS_ID, subject_code: "MA" }];
  // Prüfungskalender: eine Prüfung der Lehrperson, eine eigene von Selin
  d.tests = [
    { id: "ts-ma-1", owner_id: DEMO_USERS.teacher, class_id: CLASS_ID, subject_code: "MA", date: "2026-10-29", title: "Lineare Funktionen", description: "Kapitel 4 und 5, Taschenrechner erlaubt", created_at: "2026-10-19T16:00", updated_at: "2026-10-19T16:00" },
    { id: "ts-en-1", owner_id: DEMO_USERS.selin, class_id: null, subject_code: "EN", date: "2026-11-04", title: "Vocabulary Unit 6", description: null, created_at: "2026-10-22T19:00", updated_at: "2026-10-22T19:00" },
  ];
  d.settings = [
    { user_id: DEMO_USERS.selin, theme: "system", n_timetable: 1, n_grades: 1, n_news: 1, n_absences: 1, n_email: 0 },
    { user_id: DEMO_USERS.mia, theme: "system", n_timetable: 1, n_grades: 1, n_news: 1, n_absences: 1, n_email: 0 },
    { user_id: DEMO_USERS.teacher, theme: "system", n_timetable: 1, n_grades: 1, n_news: 1, n_absences: 1, n_email: 0 },
  ];
  d.subjects = f.subjects.map((s) => ({ code: s.code, name: s.name, short: s.short }));
  d.teachers = Object.entries(TEACHERS).map(([code, name]) => ({ code, name }));
  d.periods = config.periods.map((p) => ({ n: p.n, start_time: p.from, end_time: p.to }));

  const subjectTeacher: Record<string, string> = { SP: "ZUR" };
  for (const g of f.gradeSummary) subjectTeacher[g.subject] = TEACHER_BY_NAME[g.teacher]!;
  d.class_subjects = Object.entries(subjectTeacher).map(([s, t]) => ({ class_id: CLASS_ID, subject_code: s, teacher_code: t }));

  // ---- Stundenplan: Wochen 41 bis 51, Muster aus Woche 44 ----
  d.lessons = [];
  const demoMonday = f.week[0]!.date;
  for (let w = -3; w <= 7; w++) {
    for (const day of f.week) {
      const date = addDays(day.date, w * 7);
      if (day.solDay) {
        for (const [from, to] of [
          ["08:00", "12:00"],
          ["13:00", "16:00"],
        ] as const) {
          d.lessons.push({ id: `l-${date}-${from}`, class_id: CLASS_ID, date, start_time: from, end_time: to, subject_code: "SOL", teacher_code: null, room: "Lernzone", state: "sol", original_room: null, source: "mock", external_id: `mock-${date}-${from}` });
        }
        continue;
      }
      for (const l of day.lessons) {
        const p = period(l.period);
        const special = date === demoMonday;
        let state = l.state as string;
        let room = l.room;
        let originalRoom: string | null = null;
        if (state === "room_changed") {
          originalRoom = (l.note ?? "").replace("statt ", "");
          if (!special) {
            state = "normal";
            room = originalRoom;
            originalRoom = null;
          }
        }
        if (state === "cancelled" && !special) state = "normal";
        d.lessons.push({ id: `l-${date}-${l.period}`, class_id: CLASS_ID, date, start_time: p.from, end_time: p.to, subject_code: l.subject, teacher_code: l.teacher || null, room, state, original_room: originalRoom, source: "mock", external_id: `mock-${date}-${l.period}` });
      }
    }
  }
  d.import_runs = [{ id: "run-mock-1", source: "mock", started_at: "2026-10-26T07:58", finished_at: "2026-10-26T07:58", ok: 1, lessons: d.lessons.length, error: null }];

  // ---- Noten ----
  d.exams = [];
  d.grades = [];
  // Eigene Noten (Notenportfolio): Herbst 2026/27 ist für IM24b das 5. BM-Semester
  d.my_grades = [];
  const addExam = (subject: string, e: Ex, i: number) => {
    const id = `e-${subject.toLowerCase()}-${i + 1}`;
    d.exams!.push({ id, class_id: CLASS_ID, subject_code: subject, title: e[0], date: e[1], weight: e[3], semester: 1, class_average: e[4] });
    d.grades!.push({ id: `g-${id}`, exam_id: id, user_id: DEMO_USERS.selin, value: e[2] });
    // Informatik zählt in der Vorlage über Module: die Beispielproben gehören zu Modul 320
    const inf = subject === "IN";
    d.my_grades!.push({ id: `mg-${id}`, user_id: DEMO_USERS.selin, semester: 5, subject, module: inf ? "320" : null, module_name: inf ? "Objektorientiert programmieren" : null, title: e[0], value: e[2], weight: e[3], date: e[1], entered_at: e[1], class_average: e[4], sort: i });
  };
  const ma: Ex[] = f.examsMath.map((e) => [e.title, parseCh(e.date), e.grade, e.weight, e.classAverage]);
  ma.forEach((e, i) => addExam("MA", e, i));
  for (const [subject, list] of Object.entries(EXTRA_EXAMS)) {
    const all = [...list];
    const recent = f.recentGrades.find((r) => r.subject === subject);
    if (recent) all.push([recent.title, parseCh(recent.date), recent.grade, 1, subject === "NW" ? 3.9 : 5.0]);
    all.sort((a, b) => a[1].localeCompare(b[1])).forEach((e, i) => addExam(subject, e, i));
  }

  // ---- Absenzen ----
  d.absences = [];
  d.absence_lessons = [];
  const byName = Object.fromEntries(f.subjects.map((s) => [s.name, s.code]));
  f.absences.forEach((a, i) => {
    const date = parseCh(a.date);
    const id = `a-${i + 1}`;
    const n = parseInt(a.lessons, 10);
    d.absences!.push({ id, user_id: DEMO_USERS.selin, date, created_at: `${date}T18:00` });
    // Unterricht an diesem Wochentag laut Muster der Fixtures-Woche (Absenzen liegen vor Woche 41)
    const pattern = f.week.find((w) => weekday(w.date) === weekday(date));
    const candidates = (pattern?.lessons ?? []).map((l) => ({ period: l.period, subject: pattern?.solDay ? null : l.subject }));
    const codes = a.subjects
      .split(", ")
      .map((x) => byName[x])
      .filter((x): x is string => !!x);
    const picked: { period: number; subject: string | null }[] = [];
    if (codes.length) {
      // Fächer in der Reihenfolge der Fixtures, reihum, bis n Lektionen gewählt sind
      for (let k = 0; picked.length < n && k < n * codes.length; k++) {
        const code = codes[k % codes.length];
        const next = candidates.find((c) => c.subject === code && !picked.includes(c));
        if (next) picked.push(next);
      }
    } else {
      // "Vormittag": die ersten n Lektionen ohne Fach
      picked.push(...candidates.slice(0, n));
    }
    for (const p of picked) d.absence_lessons!.push({ absence_id: id, period: p.period, subject_code: p.subject });
  });

  // ---- Abmeldungen und Dispensationsgesuche (erfunden) ----
  // Jede Absenz ist am Vortag abgemeldet, ausser Sport am 29.09. (zählt doppelt, Art. 5c).
  // Die Absenz vom 9.10. ist durch ein bewilligtes Gesuch gedeckt und zählt nicht aufs Kontingent.
  const notes: Record<string, string> = { "a-1": "Arzttermin", "a-2": "Zahnarzt", "a-3": "Krank", "a-5": "Arzttermin" };
  d.absence_notices = [];
  for (const abs of d.absences!) {
    const id = abs.id as string;
    if (id === "a-4") continue;
    const ps = d.absence_lessons!.filter((l) => l.absence_id === id).map((l) => l.period as number);
    if (!ps.length) continue;
    d.absence_notices.push({ id: `an-${id.slice(2)}`, user_id: DEMO_USERS.selin, date: abs.date ?? null, from_period: Math.min(...ps), to_period: Math.max(...ps), note: notes[id] ?? null, created_at: `${addDays(abs.date as string, -1)}T19:30` });
  }
  d.dispensations = [
    { id: "di-1", user_id: DEMO_USERS.selin, date: "2026-10-09", reason: "Dispensation 1. Krankheitstag mit Arztzeugnis", note: "Grippe", status: "approved", attachment_key: null, attachment_key2: null, created_at: "2026-10-12T17:45" },
    { id: "di-2", user_id: DEMO_USERS.selin, date: "2026-11-05", reason: "Berufskundliche Veranstaltung im Hinblick auf die Berufswahl; Vorstellungsgespräche", note: "Informationstag Fachhochschule", status: "submitted", attachment_key: null, attachment_key2: null, created_at: "2026-10-25T20:05" },
  ];
  d.dispensation_lessons = [
    ...d.absence_lessons!.filter((l) => l.absence_id === "a-3").map((l) => ({ dispensation_id: "di-1", period: l.period ?? null, subject_code: l.subject_code ?? null })),
    { dispensation_id: "di-2", period: 1, subject_code: null },
    { dispensation_id: "di-2", period: 2, subject_code: null },
  ];

  // ---- Dokumente ----
  d.documents = [];
  f.documents.forEach((g) =>
    g.items.forEach((it, i) => {
      const s = slug(it.title);
      const updated = it.isNew ? "2026-10-20" : it.note && /\d{2}\.\d{2}\.\d{4}/.test(it.note) ? parseCh(it.note) : "2026-08-01";
      d.documents!.push({ id: `d-${s}`, grp: g.group, title: it.title, file_type: it.type, size_bytes: kb(it.size), note: it.note, r2_key: `dokumente/${s}.pdf`, updated_at: updated, sort: i, class_id: CLASS_ID });
    }),
  );

  // ---- Links (Adressen aus config/portal.json) ----
  const urlByTitle: Record<string, string> = {
    Outlook: svc.outlook,
    Teams: svc.teams,
    OneDrive: svc.onedrive,
    OneNote: svc.onenote,
    Moodle: svc.moodle,
    WebUntis: svc.webuntis,
    "bwdbern.ch": config.school.website,
    Mediothek: svc.mediothek,
  };
  d.links = [];
  f.links.forEach((g) =>
    g.items.forEach((l, i) => {
      d.links!.push({ id: `k-${slug(l.title)}`, grp: g.group, title: l.title, sub: l.sub, url: urlByTitle[l.title] ?? l.url, sort: i, badge: l.badge, accent: g.group === "Microsoft 365" ? 1 : 0 });
    }),
  );

  // ---- Mitteilungen ----
  const bodies: Record<string, string> = {
    pp: [
      "Der Prüfungsplan für das 1. Semester 2026/27 ist ab sofort verfügbar. Er enthält alle Prüfungen bis Ende Januar für alle Klassen.",
      "Bitte kontrolliere die Termine deiner Klasse. Wenn sich zwei Prüfungen am selben Tag überschneiden oder du an einem Termin fehlen musst, melde dich bis 6. November bei deiner Klassenlehrperson.",
      "- Nachprüfungen finden am Mittwochnachmittag statt.\n- Für Dispensationen gibt es ein Formular unter Dokumente.",
    ].join("\n\n"),
    ia: "Für alle, die nach der Lehre die BM 2 machen möchten. Der Informationsabend findet am 5. November um 18:30 in der Aula statt.\n\nEine Anmeldung ist nicht nötig.",
    me: "Die Mensa öffnet ab November neu um 07:15.\n\nAm Mittwochnachmittag bleibt sie geschlossen.",
    sp: "Wähle dein Angebot für den Herbstsporttag im Formular bis 30. Oktober.\n\nOhne Anmeldung wirst du einer Gruppe zugeteilt.",
  };
  d.news = f.news.map((n) => ({
    id: n.id,
    title: n.title,
    teaser: n.teaser,
    body_md: bodies[n.id] ?? n.teaser,
    author: n.author,
    published_at: `${parseCh(n.date)}T08:00`,
    pinned: n.pinned ? 1 : 0,
    document_id: n.id === "pp" ? "d-pruefungsplan-1-semester-2026-27" : null,
    // Erfunden: nur für die Demo-Klasse, echte Konten sehen sie nicht
    class_id: CLASS_ID,
  }));
  d.news_read = f.news.filter((n) => !n.unread).map((n) => ({ news_id: n.id, user_id: DEMO_USERS.selin }));

  // ---- Benachrichtigungen ----
  const notifDates: Record<string, string> = { Heute: "2026-10-26", Gestern: "2026-10-25" };
  const href: Record<string, string> = { swap: "/stundenplan?ansicht=tag", cancel: "/stundenplan?ansicht=tag", chart: "/noten/EN", clock: "/absenzen", megaphone: "/mitteilungen/pp" };
  d.notifications = [];
  f.notifications.forEach((g) =>
    g.items.forEach((n, i) => {
      const at = notifDates[g.group] ? `${notifDates[g.group]}T${n.time}` : `${parseCh(n.time)}T08:00`;
      d.notifications!.push({ id: `n-${d.notifications!.length + 1}`, user_id: DEMO_USERS.selin, kind: n.kind, icon: n.icon, title: n.title, body: n.text, href: href[n.icon] ?? null, created_at: at, read_at: n.unread ? null : at });
      void i;
    }),
  );

  // ---- SOL ----
  d.sol_blocks = [
    { id: "b-1", class_id: CLASS_ID, n: 1, starts: "2026-08-17", ends: "2026-09-11" },
    { id: "b-2", class_id: CLASS_ID, n: 2, starts: "2026-09-14", ends: "2026-10-16" },
    { id: "b-3", class_id: CLASS_ID, n: f.sol.block, starts: "2026-10-19", ends: "2026-11-27" },
  ];
  d.sol_days = [];
  for (const b of d.sol_blocks) {
    let day = String(b.starts);
    while (weekday(day) !== 5) day = addDays(day, 1);
    for (; day <= String(b.ends); day = addDays(day, 7)) d.sol_days.push({ id: `sd-${day}`, block_id: b.id as string, date: day });
  }
  d.sol_tasks = [];
  d.sol_progress = [];
  for (const g of f.sol.tasks) {
    for (const t of g.items) {
      const id = `t-${g.subject.toLowerCase()}-${t.code}`;
      const s = `${g.subject.toLowerCase()}-sol-${t.code.replace(".", "-")}`;
      d.sol_tasks.push({ id, block_id: "b-3", subject_code: g.subject, code: t.code, title: t.title, minutes: t.minutes, sharepoint_url: svc.sharepointSol + s, r2_key: `sol/auftraege/${s}.pdf` });
      d.sol_progress.push({ task_id: id, user_id: DEMO_USERS.selin, status: t.progress >= 100 ? "done" : t.progress > 0 ? "started" : "open" });
    }
  }
  const nextSol = "sd-2026-10-30";
  d.sol_plan = f.sol.plan.map((p, i) => ({ id: `sp-${i + 1}`, user_id: DEMO_USERS.selin, sol_day_id: nextSol, task_id: `t-${p.subject.toLowerCase()}-${p.code}`, start_time: p.from, end_time: p.to, note: null }));
  d.sol_presence = f.sol.teacherPresence.map((p, i) => ({ id: `pr-${i + 1}`, sol_day_id: nextSol, teacher_code: TEACHER_BY_LAST[p.teacher]!, subject_code: p.subject, start_time: p.from, end_time: p.to, room: null, lane: p.lane }));
  d.sol_portfolio = f.sol.portfolio.map((p) => {
    const date = parseLong(p.day);
    return { id: `pf-${date}`, user_id: DEMO_USERS.selin, sol_day_id: `sd-${date}`, check_in: p.checkIn, check_out: p.checkOut, updated_at: `${date}T16:30` };
  });

  // Plausibilität: Zeiten im Plan liegen am SOL-Tag
  for (const p of d.sol_plan) if (toMin(String(p.start_time)) >= toMin(String(p.end_time))) throw new Error(`Plan ${p.id}: Von nach Bis`);

  return d;
}

/** Reihenfolge fürs Einfügen (Fremdschlüssel) */
export const TABLE_ORDER = [
  "classes",
  "users",
  "teacher_assignments",
  "settings",
  "tests",
  "subjects",
  "teachers",
  "class_subjects",
  "periods",
  "lessons",
  "import_runs",
  "exams",
  "grades",
  "my_grades",
  "my_efz",
  "absences",
  "absence_lessons",
  "absence_notices",
  "dispensations",
  "dispensation_lessons",
  "documents",
  "links",
  "news",
  "news_read",
  "notifications",
  "sol_blocks",
  "sol_days",
  "sol_tasks",
  "sol_progress",
  "sol_plan",
  "sol_presence",
  "sol_portfolio",
] as const;

const lit = (v: Row[string]) => (v === null || v === undefined ? "NULL" : typeof v === "number" ? String(v) : typeof v === "boolean" ? (v ? "1" : "0") : `'${String(v).replace(/'/g, "''")}'`);

/** Einzelne SQL-Anweisungen zum Leeren und Füllen aller Tabellen (ohne Sessions). */
export function seedStatements(data: SeedData = buildSeed()): string[] {
  const out: string[] = [];
  for (const t of [...TABLE_ORDER].reverse()) out.push(`DELETE FROM ${t};`);
  for (const t of TABLE_ORDER) {
    for (const r of data[t] ?? []) {
      const cols = Object.keys(r);
      out.push(`INSERT INTO ${t} (${cols.join(", ")}) VALUES (${cols.map((c) => lit(r[c]!)).join(", ")});`);
    }
  }
  return out;
}

/** seed.sql für `wrangler d1 execute`: leert auch die Sessions. */
export function seedSql(data: SeedData = buildSeed()): string {
  return ["-- GENERIERT mit `pnpm db:seed-sql` aus handoff/data/fixtures.json und config/portal.json. Alle Daten erfunden.", "PRAGMA defer_foreign_keys = on;", "DELETE FROM sessions;", ...seedStatements(data)].join("\n") + "\n";
}
