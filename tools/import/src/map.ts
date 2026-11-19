import type { LessonInput } from "./types";

/** WebUntis-Datum 20261026 → "2026-10-26" */
export function untisDate(n: number): string {
  const s = String(n);
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

/** WebUntis-Zeit 945 → "09:45" */
export function untisTime(n: number): string {
  const s = String(n).padStart(4, "0");
  return `${s.slice(0, 2)}:${s.slice(2)}`;
}

export function toUntisDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}

type Short = { id: number; name: string; longname: string; orgname?: string; orgid?: number };

/** Die Felder aus dem JSON-RPC von WebUntis, die der Import braucht (siehe Typ Lesson im Paket webuntis). */
export type UntisLesson = {
  id: number;
  date: number;
  startTime: number;
  endTime: number;
  su: Short[];
  te: Short[];
  ro: Short[];
  code?: "cancelled" | "irregular" | string;
  activityType?: string;
  lstext?: string;
};

/**
 * WebUntis-Lektion → LessonInput.
 * Entfällt: code "cancelled". Raumänderung: Raum mit orgname (ursprünglicher Raum). SOL: Fach heisst "SOL".
 */
export function mapUntisLesson(l: UntisLesson): LessonInput {
  const su = l.su[0];
  const te = l.te[0];
  const ro = l.ro[0];
  const isSol = !!su && /^sol$/i.test(su.name);
  let state: LessonInput["state"] = "normal";
  let originalRoom: string | null = null;
  if (l.code === "cancelled") state = "cancelled";
  else if (isSol) state = "sol";
  else if (ro?.orgname && ro.orgname !== ro.name) {
    state = "room_changed";
    originalRoom = ro.orgname;
  }
  return {
    externalId: String(l.id),
    date: untisDate(l.date),
    start: untisTime(l.startTime),
    end: untisTime(l.endTime),
    subject: su ? { code: su.name.toUpperCase(), name: su.longname || su.name, short: su.name } : null,
    teacher: te ? { code: te.name, name: te.longname || te.name } : null,
    room: ro?.name ?? null,
    state,
    originalRoom,
  };
}

/** iCal-Ereignis (aus dem Kalender-Abo) → LessonInput. Zeit in Europe/Zurich. */
export function mapIcalEvent(e: { uid: string; summary: string; location?: string; description?: string; start: Date; end: Date; status?: string }): LessonInput {
  const fmt = (d: Date) => {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Zurich", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(d).map((x) => [x.type, x.value]));
    return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
  };
  const s = fmt(e.start);
  const en = fmt(e.end);
  const name = e.summary.trim();
  const code = name.split(/\s+/)[0]!.toUpperCase();
  return {
    externalId: e.uid,
    date: s.date,
    start: s.time,
    end: en.time,
    subject: { code, name, short: name.split(/\s+/)[0]! },
    teacher: e.description ? { code: e.description.trim().split(/\s+/)[0]!, name: e.description.trim() } : null,
    room: e.location?.trim() || null,
    state: e.status === "CANCELLED" ? "cancelled" : /^sol\b/i.test(name) ? "sol" : "normal",
    originalRoom: null,
  };
}
