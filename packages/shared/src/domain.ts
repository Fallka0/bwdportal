/** Fachliche Regeln, die Web, App und Datenbank gleich anwenden. */
import { config } from "./config";
import { addDays, daysBetween, toMin } from "./time";
import type { Lesson } from "./schemas";

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

/** Frist zum Entschuldigen. */
export function absenceDueDate(date: string): string {
  return addDays(date, config.absenceDeadlineDays);
}

/** Frist abgelaufen? */
export function isOverdue(dueDate: string | null, today: string): boolean {
  return !!dueDate && daysBetween(dueDate, today) > 0;
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
  for (let i = day.indexOf(first) + 1; i < day.length; i++) {
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
