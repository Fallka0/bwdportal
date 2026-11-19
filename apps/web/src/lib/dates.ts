import { addDays, weekday } from "@bwd/shared";

/** Schultag: Wochenende springt auf den nächsten (vorwärts) oder letzten (rückwärts) Wochentag. */
export function schoolDay(date: string, dir: 1 | -1 = 1): string {
  let d = date;
  while (weekday(d) === 0 || weekday(d) === 6) d = addDays(d, dir);
  return d;
}

export function isDate(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
}
