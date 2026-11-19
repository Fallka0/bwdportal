/**
 * Datum und Zeit. Alles ist Wandzeit in Europe/Zurich als Text:
 * Datum "YYYY-MM-DD", Uhrzeit "HH:MM", Zeitpunkt "YYYY-MM-DDTHH:MM".
 * Rechnungen über UTC-Tage, damit Sommerzeit keine Rolle spielt.
 */

export const TIME_ZONE = "Europe/Zurich";

export const WEEKDAYS = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"] as const;
export const WEEKDAYS_SHORT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"] as const;
export const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"] as const;
export const MONTHS_SHORT = ["Jan.", "Feb.", "März", "Apr.", "Mai", "Juni", "Juli", "Aug.", "Sep.", "Okt.", "Nov.", "Dez."] as const;

export type Now = { date: string; time: string; stamp: string };

const pad = (n: number) => String(n).padStart(2, "0");

/** "HH:MM" in Minuten seit Mitternacht. */
export function toMin(t: string): number {
  const [h, m] = t.split(":");
  return Number(h) * 60 + Number(m);
}

export function fromMin(m: number): string {
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

function parts(date: string): [number, number, number] {
  const [y, m, d] = date.split("-").map(Number);
  return [y!, m!, d!];
}

function utc(date: string): Date {
  const [y, m, d] = parts(date);
  return new Date(Date.UTC(y, m - 1, d));
}

function iso(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function addDays(date: string, n: number): string {
  const d = utc(date);
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
}

/** 0 = Sonntag … 6 = Samstag */
export function weekday(date: string): number {
  return utc(date).getUTCDay();
}

/** Montag der Woche, in der das Datum liegt. */
export function mondayOf(date: string): string {
  const wd = weekday(date);
  return addDays(date, wd === 0 ? -6 : 1 - wd);
}

/** ISO-Kalenderwoche. */
export function isoWeek(date: string): number {
  const d = utc(date);
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((utc(b).getTime() - utc(a).getTime()) / 86400000);
}

/**
 * Aktuelle Zeit. Mit DEMO_NOW (z. B. "2026-10-26T10:20") gilt dieser Zeitpunkt,
 * damit Jetzt-Linie und "Als Nächstes" wie im Design aussehen. Sonst echte Zeit in Europe/Zurich.
 */
export function getNow(demoNow?: string | null, real: Date = new Date()): Now {
  if (demoNow) {
    const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(demoNow);
    if (m) return { date: m[1]!, time: m[2]!, stamp: `${m[1]}T${m[2]}` };
  }
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const p = Object.fromEntries(f.formatToParts(real).map((x) => [x.type, x.value]));
  const date = `${p.year}-${p.month}-${p.day}`;
  const time = `${p.hour}:${p.minute}`;
  return { date, time, stamp: `${date}T${time}` };
}

// ---- Formatierung (Schweizer Schreibweise) ----

/** "Montag, 26. Oktober" */
export function fmtLong(date: string, withYear = false): string {
  const [y, m, d] = parts(date);
  return `${WEEKDAYS[weekday(date)]}, ${d}. ${MONTHS[m - 1]}${withYear ? ` ${y}` : ""}`;
}

/** "Mo, 26. Oktober" */
export function fmtMedium(date: string, withYear = false): string {
  const [y, m, d] = parts(date);
  return `${WEEKDAYS_SHORT[weekday(date)]}, ${d}. ${MONTHS[m - 1]}${withYear ? ` ${y}` : ""}`;
}

/** "26. Oktober" */
export function fmtDayMonth(date: string): string {
  const [, m, d] = parts(date);
  return `${d}. ${MONTHS[m - 1]}`;
}

/** "22.10." */
export function fmtShort(date: string): string {
  const [, m, d] = parts(date);
  return `${pad(d)}.${pad(m)}.`;
}

/** "5.11." ohne führende Nullen, für Fristen */
export function fmtShortLoose(date: string): string {
  const [, m, d] = parts(date);
  return `${d}.${m}.`;
}

/** "Do 22.10." */
export function fmtWeekdayShort(date: string): string {
  return `${WEEKDAYS_SHORT[weekday(date)]} ${fmtShort(date)}`;
}

/** "20.10.2026" */
export function fmtDate(date: string): string {
  const [y] = parts(date);
  return `${fmtShort(date)}${y}`;
}

/** "Di 20.10.2026" */
export function fmtWeekdayDate(date: string): string {
  return `${WEEKDAYS_SHORT[weekday(date)]} ${fmtDate(date)}`;
}

/** "26. bis 30. Oktober" oder "28. September bis 2. Oktober" */
export function fmtRange(from: string, to: string): string {
  const [, m1, d1] = parts(from);
  const [, m2, d2] = parts(to);
  return m1 === m2 ? `${d1}. bis ${d2}. ${MONTHS[m2 - 1]}` : `${d1}. ${MONTHS[m1 - 1]} bis ${d2}. ${MONTHS[m2 - 1]}`;
}

export function monthShort(date: string): string {
  return MONTHS_SHORT[parts(date)[1] - 1]!;
}

/** Begrüssung nach Tageszeit. */
export function greeting(time: string): string {
  const m = toMin(time);
  if (m < 11 * 60) return "Guten Morgen";
  if (m < 17 * 60) return "Guten Tag";
  return "Guten Abend";
}

/** "in 25 Minuten", "in 1 Stunde 5 Minuten", "jetzt" */
export function fmtUntil(minutes: number): string {
  if (minutes <= 0) return "jetzt";
  if (minutes < 60) return minutes === 1 ? "in 1 Minute" : `in ${minutes} Minuten`;
  const h = Math.floor(minutes / 60);
  const r = minutes % 60;
  const hs = h === 1 ? "1 Stunde" : `${h} Stunden`;
  return r ? `in ${hs} ${r} Min.` : `in ${hs}`;
}

export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}
