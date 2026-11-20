/** Fachliche Regeln, die Web, App und Datenbank gleich anwenden. */
import { config } from "./config";
import { addDays, daysBetween, toMin } from "./time";
import type { AbsenceLessonState, Lesson } from "./schemas";

/** Beschriftung der Fächer einer Absenz: "Französisch, Mathematik" oder "Vormittag". */
export function absenceSubjectsLabel(lessons: { period: number; subjectName: string | null }[]): string {
  const names = [...new Set(lessons.map((l) => l.subjectName).filter((n): n is string => !!n))];
  if (names.length) return names.join(", ");
  const lunchStart = toMin(config.lunch.from);
  const starts = lessons.map((l) => toMin(config.periods.find((p) => p.n === l.period)?.from ?? "00:00"));
  if (starts.every((s) => s < lunchStart)) return "Vormittag";
  if (starts.every((s) => s >= lunchStart)) return "Nachmittag";
  return "Ganzer Tag";
}

/** Semester, in dem ein Datum liegt: 1. ab August, 2. ab secondSemesterStart (bis Ende Juli). */
export function semesterOf(date: string): { n: 1 | 2; from: string; to: string } {
  const start2 = config.secondSemesterStart;
  const y = Number(date.slice(0, 4));
  // Schuljahr beginnt am 1. August
  const yearStart = date.slice(5) >= "08-01" ? `${y}-08-01` : `${y - 1}-08-01`;
  const yearEnd = `${Number(yearStart.slice(0, 4)) + 1}-07-31`;
  // secondSemesterStart gilt für sein Schuljahr; andere Jahre: gleicher Tag im Februar
  const s2 = `${yearEnd.slice(0, 4)}${start2.slice(4)}`;
  return date < s2 ? { n: 1, from: yearStart, to: addDays(s2, -1) } : { n: 2, from: s2, to: yearEnd };
}

/** Beginn einer Lektion als "HH:MM" (leer, wenn unbekannt). */
export const periodStart = (n: number) => config.periods.find((p) => p.n === n)?.from ?? "";
/** Ende einer Lektion als "HH:MM" (leer, wenn unbekannt). */
export const periodEnd = (n: number) => config.periods.find((p) => p.n === n)?.to ?? "";

/** Wie eine gefehlte Lektion zählt (Absenzenreglement Art. 3, 5, 8). */
export type MissedLesson = { date: string; period: number };
export type CountedLesson = MissedLesson & { state: AbsenceLessonState; weight: 0 | 1 | 2; notified: boolean };
export type Notice = { date: string; fromPeriod: number; toPeriod: number; createdAt: string };

const key = (x: MissedLesson) => `${x.date}#${x.period}`;

/** Abgemeldet: eine Abmeldung deckt die Lektion und wurde vor ihrem Beginn erfasst (Art. 2b). */
export function isNotified(l: MissedLesson, notices: Notice[]): boolean {
  const start = `${l.date}T${periodStart(l.period)}`;
  return notices.some((n) => n.date === l.date && n.fromPeriod <= l.period && l.period <= n.toPeriod && n.createdAt.slice(0, 16) <= start);
}

/**
 * Lektionen eines Semesters zählen, chronologisch:
 * durch ein bewilligtes Gesuch gedeckt: dispensiert (0); sonst aufs Kontingent, ohne Abmeldung doppelt (Art. 5c);
 * was das Kontingent übersteigt, gilt als unentschuldigt (Art. 8a).
 */
function countSemester(missed: MissedLesson[], notices: Notice[], dispensed: Set<string>, size: number) {
  let used = 0;
  const lessons: CountedLesson[] = [...missed]
    .sort((a, b) => a.date.localeCompare(b.date) || a.period - b.period)
    .map((l) => {
      const notified = isNotified(l, notices);
      if (dispensed.has(key(l))) return { ...l, state: "dispensed", weight: 0, notified };
      const weight = notified ? 1 : 2;
      const state: AbsenceLessonState = used < size ? "contingent" : "unexcused";
      used += weight;
      return { ...l, state, weight, notified };
    });
  return { lessons, used };
}

/**
 * Kontingent im Semester von `today` (Art. 3a: IMS 20 Lektionen). Das Kontingent wird um die Überschreitung
 * im Vorsemester gekürzt (Art. 8b). Rückgabe: Zahlen fürs Cockpit und der Zustand jeder Lektion (alle Semester).
 */
export function absenceContingent(missed: MissedLesson[], notices: Notice[], dispensed: MissedLesson[], today: string) {
  const covered = new Set(dispensed.map(key));
  const base = config.absenceContingent.lessons;
  const sem = semesterOf(today);
  const prev = semesterOf(addDays(sem.from, -1));
  const inRange = (r: { from: string; to: string }) => (x: MissedLesson) => x.date >= r.from && x.date <= r.to;
  // Vorvorsemester und früher: ohne Kürzung gerechnet
  const before = countSemester(missed.filter((x) => x.date < prev.from), notices, covered, base);
  const p = countSemester(missed.filter(inRange(prev)), notices, covered, base);
  const size = Math.max(0, base - Math.max(0, p.used - base));
  const cur = countSemester(missed.filter(inRange(sem)), notices, covered, size);
  const later = countSemester(missed.filter((x) => x.date > sem.to), notices, covered, base);
  const state = new Map([...before.lessons, ...p.lessons, ...cur.lessons, ...later.lessons].map((l) => [key(l), l]));
  return {
    contingent: { semester: sem.n, size, missed: cur.lessons.length, used: cur.used, available: Math.max(0, size - cur.used) },
    lesson: (l: MissedLesson) => state.get(key(l))!,
  };
}

/** Datum minus n Arbeitstage (Montag bis Freitag). */
export function subtractWorkdays(date: string, n: number): string {
  let d = date;
  while (n > 0) {
    d = addDays(d, -1);
    const wd = new Date(`${d}T12:00:00Z`).getUTCDay();
    if (wd !== 0 && wd !== 6) n--;
  }
  return d;
}

/** Krankheitsgründe werden nachträglich eingereicht (Art. 5b), alle anderen bis 5 Arbeitstage im Voraus (Art. 4b). */
export const SICK_REASONS = ["Dispensation 1. Krankheitstag mit Arztzeugnis", "Dispensation ab 2. Krankheitstag"] as const;

/** Gesuch verspätet eingereicht (Art. 4d)? */
export function isLateDispensation(reason: string, date: string, createdAt: string): boolean {
  if ((SICK_REASONS as readonly string[]).includes(reason)) return false;
  return createdAt.slice(0, 10) > subtractWorkdays(date, 5);
}

/** Anhang Pflicht (Art. 4b), ausser ab dem 2. Krankheitstag (Anpassungen 2025/26). */
export const attachmentRequired = (reason: string) => reason !== "Dispensation ab 2. Krankheitstag";

/** Abmeldung änderbar, solange ihre erste Lektion nicht begonnen hat. */
export function noticeEditable(n: { date: string; fromPeriod: number }, now: { date: string; time: string }): boolean {
  return n.date > now.date || (n.date === now.date && now.time < periodStart(n.fromPeriod));
}

/** Nächste Lektion am Tag, die noch nicht begonnen hat und nicht entfällt. */
export function nextLesson(lessons: Lesson[], date: string, time: string): Lesson | null {
  const now = toMin(time);
  return (
    lessons
      .filter((l) => l.date === date && l.state !== "cancelled" && l.state !== "sol" && toMin(l.start) > now)
      .sort((a, b) => a.start.localeCompare(b.start))[0] ?? null
  );
}

/** Lektionsnummern einer Lektion (z. B. Doppellektion 4 und 5) aus der Startzeit. */
export function periodOf(start: string): number | null {
  return config.periods.find((p) => p.from === start)?.n ?? null;
}

/** Aufeinanderfolgende Lektionen desselben Fachs im selben Raum ab einer Lektion. */
export function lessonRun(lessons: Lesson[], first: Lesson): Lesson[] {
  const day = lessons.filter((l) => l.date === first.date).sort((a, b) => a.start.localeCompare(b.start));
  const out = [first];
  // Nach ID suchen: in der App kommen `first` und `lessons` als getrennte JSON-Objekte an.
  for (let i = day.findIndex((l) => l.id === first.id) + 1; i < day.length; i++) {
    const l = day[i]!;
    if (l.subject?.code === first.subject?.code && l.room === first.room && l.state === first.state) out.push(l);
    else break;
  }
  return out;
}

export type NotificationGroup = "Heute" | "Gestern" | "Diese Woche" | "Früher";

export function notificationGroup(createdAt: string, today: string): NotificationGroup {
  const d = daysBetween(createdAt.slice(0, 10), today);
  if (d <= 0) return "Heute";
  if (d === 1) return "Gestern";
  if (d < 7) return "Diese Woche";
  return "Früher";
}

/** Dokument gilt 14 Tage nach dem Update als neu. */
export function isNewDocument(updatedAt: string | null, today: string): boolean {
  return !!updatedAt && daysBetween(updatedAt, today) <= 14 && daysBetween(updatedAt, today) >= 0;
}

/** Grösse in KB wie im Design ("240 KB"). */
export function fmtSize(bytes: number | null): string {
  if (bytes === null) return "";
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1).replace(".0", "")} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

export function initials(first: string, last: string): string {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

/** "1. Lektion", "4. und 5. Lektion", "1., 2. und 3. Lektion" */
export function fmtPeriods(periods: number[]): string {
  const p = periods.map((n) => `${n}.`);
  if (p.length === 0) return "";
  if (p.length === 1) return `${p[0]} Lektion`;
  return `${p.slice(0, -1).join(", ")} und ${p.at(-1)} Lektion`;
}

export type BodyBlock = { type: "p"; text: string } | { type: "ul"; items: string[] };

/** Einfacher Text der Mitteilungen: Absätze durch Leerzeile, Listen mit "- ". Kein HTML. */
export function parseBody(md: string | null): BodyBlock[] {
  if (!md) return [];
  return md
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const lines = chunk.split("\n");
      if (lines.every((l) => l.startsWith("- "))) return { type: "ul", items: lines.map((l) => l.slice(2).trim()) };
      return { type: "p", text: lines.join(" ") };
    });
}

/** Bezeichnung des Dateityps für Knöpfe: "Word", "PDF", "Audio" … */
export function fileTypeLabel(ext: string): string {
  const e = ext.toLowerCase();
  if (e === "docx" || e === "doc") return "Word";
  if (e === "pptx" || e === "ppt") return "PowerPoint";
  if (e === "xlsx" || e === "xls") return "Excel";
  if (e === "pdf") return "PDF";
  if (["mp3", "m4a", "wav"].includes(e)) return "Audio";
  if (["mp4", "mov", "m4v"].includes(e)) return "Video";
  if (["jpg", "jpeg", "png", "gif", "heic"].includes(e)) return "Bild";
  return e.toUpperCase();
}

/** Dateigrösse: "850 KB", "12 MB". */
export function fmtBytes(n: number): string {
  if (n >= 1_000_000) return `${Math.round(n / 1_000_000)} MB`;
  return `${Math.max(1, Math.round(n / 1000))} KB`;
}
