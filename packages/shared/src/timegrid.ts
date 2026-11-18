/**
 * Zeitraster: eine Rechnung für alle Stundenpläne (Übersicht, Stundenplan Tag und Woche, SOL-Kalender).
 * Minuten zu Pixel, Stundenlinien, Mittag, Jetzt-Linie, vergangene Blöcke. Web und App zeichnen nur.
 */
import { config } from "./config";
import type { Lesson, SolPlanEntry, SolPresence } from "./schemas";
import { tokens } from "./tokens";
import { fromMin, toMin } from "./time";

export type BlockKind = "lesson" | "changed" | "cancelled" | "sol" | "plan" | "presence";

export type GridBlock = {
  id: string;
  start: string;
  end: string;
  kind: BlockKind;
  /** Fach oder Name, fett */
  title: string;
  /** Kürzere Variante des Titels (App-Woche, Lehrpersonen-Kürzel) */
  titleShort?: string;
  /** Raum, Kürzel oder Hinweis neben dem Titel */
  sub?: string;
  subShort?: string;
  /** Zweite Zeile im SOL-Plan (Titel des Auftrags) */
  detail?: string;
  /** Spur innerhalb einer Spalte (Lehrpersonen) */
  lane?: number;
  /** Beschriftung für Screenreader */
  label: string;
};

export type GridColumn = {
  key: string;
  /** Datum der Spalte; steuert "vergangen" und die Jetzt-Linie */
  date?: string;
  header?: string;
  headerNum?: string;
  /** Relative Breite (SOL: Mein Plan 1, Lehrpersonen 1.6) */
  weight?: number;
  lanes?: number;
  blocks: GridBlock[];
};

export type GridInput = {
  start?: string;
  end: string;
  columns: GridColumn[];
  lunch?: { from: string; to: string } | null;
  now?: { date: string; time: string } | null;
  pxPerMinute?: number;
};

export type PlacedBlock = GridBlock & {
  top: number;
  height: number;
  past: boolean;
  /** Kurzer Block (unter 50 Minuten): Titel und Zusatz auf einer Zeile */
  compact: boolean;
  /** Mittlerer Block (unter 70 Minuten): ohne Zeitangabe */
  medium: boolean;
  timeLabel: string;
};

export type GridLayout = {
  height: number;
  hours: { label: string; top: number }[];
  lunch: { top: number; height: number } | null;
  now: { top: number; label: string; column: number } | null;
  columns: (Omit<GridColumn, "blocks"> & { blocks: PlacedBlock[]; today: boolean })[];
};

const GAP = 2;

export function gridY(time: string, start: string = tokens.timeGrid.start, ppm: number = tokens.timeGrid.pxPerMinute): number {
  return Math.round((toMin(time) - toMin(start)) * ppm);
}

export function layoutGrid(input: GridInput): GridLayout {
  const start: string = input.start ?? tokens.timeGrid.start;
  const ppm = input.pxPerMinute ?? tokens.timeGrid.pxPerMinute;
  const y = (t: string) => gridY(t, start, ppm);
  const hours: GridLayout["hours"] = [];
  for (let m = toMin(start); m <= toMin(input.end); m += 60) hours.push({ label: fromMin(m), top: y(fromMin(m)) });
  const now = input.now ?? null;
  const nowMin = now ? toMin(now.time) : -1;
  const todayIdx = now ? input.columns.findIndex((c) => c.date === now.date) : -1;
  const columns = input.columns.map((c) => {
    const today = !!now && c.date === now.date;
    return {
      ...c,
      today,
      blocks: c.blocks.map((b) => {
        const dur = toMin(b.end) - toMin(b.start);
        return {
          ...b,
          top: y(b.start),
          height: Math.max(y(b.end) - y(b.start) - GAP, 12),
          past: !!now && !!c.date && (c.date < now.date || (today && toMin(b.end) <= nowMin)),
          compact: dur < 50,
          medium: dur < 70,
          timeLabel: `${b.start} bis ${b.end}`,
        };
      }),
    };
  });
  const inRange = now && nowMin >= toMin(start) && nowMin <= toMin(input.end);
  return {
    height: y(input.end) + 4,
    hours,
    lunch: input.lunch ? { top: y(input.lunch.from), height: y(input.lunch.to) - y(input.lunch.from) } : null,
    now: todayIdx >= 0 && inRange ? { top: y(now!.time), label: now!.time, column: todayIdx } : null,
    columns,
  };
}

// ---------- Daten zu Blöcken ----------

/** Lektionen eines Tages als Blöcke. SOL-Tage werden zu "SOL-Tag, Lernzone". */
export function lessonBlocks(lessons: Lesson[]): GridBlock[] {
  return lessons.map((l) => {
    const name = l.subject?.name ?? "Lektion";
    const short = l.subject?.short ?? name;
    const room = l.room ?? "";
    const tcode = l.teacher?.code ?? "";
    const time = `${l.start} bis ${l.end}`;
    if (l.state === "sol") {
      return { id: l.id, start: l.start, end: l.end, kind: "sol", title: "SOL-Tag", sub: room || "Lernzone", label: `SOL-Tag, ${room || "Lernzone"}, ${time}` };
    }
    if (l.state === "cancelled") {
      return { id: l.id, start: l.start, end: l.end, kind: "cancelled", title: name, titleShort: short, sub: "Entfällt", subShort: "Entfällt", label: `${name}, entfällt, ${time}` };
    }
    if (l.state === "room_changed") {
      const chg = `${room} statt ${l.originalRoom ?? ""}`.trim();
      return { id: l.id, start: l.start, end: l.end, kind: "changed", title: name, titleShort: short, sub: chg, subShort: chg, label: `${name}, Raumänderung: ${chg}, ${time}` };
    }
    return {
      id: l.id,
      start: l.start,
      end: l.end,
      kind: "lesson",
      title: name,
      titleShort: short,
      sub: [room, tcode].filter(Boolean).join(" · "),
      subShort: room,
      label: `${name}, ${room}${l.teacher ? `, ${l.teacher.name}` : ""}, ${time}`,
    };
  });
}

/** Spalten für Tage (Woche oder ein Tag). */
export function dayColumns(dates: { date: string; header?: string; headerNum?: string }[], lessons: Lesson[]): GridColumn[] {
  return dates.map((d) => ({ key: d.date, date: d.date, header: d.header, headerNum: d.headerNum, blocks: lessonBlocks(lessons.filter((l) => l.date === d.date)) }));
}

/** SOL-Kalender: Spalte "Mein Plan" und Spalte "Lehrpersonen" mit vier Spuren. */
export function solColumns(date: string, plan: SolPlanEntry[], presence: SolPresence[]): GridColumn[] {
  const lanes = Math.max(4, ...presence.map((p) => p.lane + 1));
  return [
    {
      key: "plan",
      date,
      header: "Mein Plan",
      weight: 1,
      blocks: plan.map((p) => ({
        id: p.id,
        start: p.start,
        end: p.end,
        kind: "plan",
        title: `${p.subjectShort} ${p.code}`,
        detail: p.title,
        label: `${p.subjectShort} ${p.code}, ${p.title}, ${p.start} bis ${p.end}`,
      })),
    },
    {
      key: "teachers",
      date,
      header: "Lehrpersonen",
      weight: 1.6,
      lanes,
      blocks: presence.map((p) => {
        const last = p.teacherName.split(" ").slice(-1)[0] ?? p.teacherName;
        return {
          id: p.id,
          start: p.start,
          end: p.end,
          kind: "presence",
          title: last,
          titleShort: p.teacherCode,
          sub: p.subjectShort ?? "",
          subShort: p.subjectCode ?? "",
          lane: p.lane,
          label: `${p.teacherName}, ${p.subjectName ?? ""}, ${p.start} bis ${p.end}${p.room ? `, ${p.room}` : ""}`,
        };
      }),
    },
  ];
}

export const SCHOOL_LUNCH = config.lunch;
export const SOL_LUNCH = config.solLunch;
