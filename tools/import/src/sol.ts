import { addDays, mondayOf } from "@bwd/shared";

/**
 * SOL-Daten einer Klasse aus einer JSON-Datei (Blöcke, Aufträge, Präsenzen der Lehrpersonen, Fach-Lehrperson).
 * Echte Daten liegen in tools/import/.local/, nicht im Repo.
 */
export type SolInput = {
  classId: string;
  /** Wochentag des SOL-Tags, 1 = Montag bis 5 = Freitag */
  solWeekday: number;
  blocks: { n: number; weeks: string[] }[];
  tasks: { block: number; subject: string; code: string; title: string; minutes: number }[];
  presence: { date: string; teacher: string; subject: string | null; from: string; to: string; room: string | null; lane: number }[];
  classSubjects: { subject: string; teacher: string }[];
};

const lit = (v: string | number | null) => (v === null ? "NULL" : typeof v === "number" ? String(v) : `'${v.replace(/'/g, "''")}'`);
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9.]+/g, "-");

/** Montag einer ISO-Kalenderwoche ("2026-W47"). */
export function isoWeekMonday(week: string): string {
  const m = /^(\d{4})-W(\d{2})$/.exec(week);
  if (!m) throw new Error(`Kalenderwoche ungültig: ${week}`);
  // Der 4. Januar liegt immer in KW 1.
  const jan4 = `${m[1]}-01-04`;
  return addDays(mondayOf(jan4), (Number(m[2]) - 1) * 7);
}

/**
 * SQL für den SOL-Import. Blöcke, SOL-Tage, Aufträge und Fach-Lehrpersonen per Upsert (Fortschritt und Plan
 * der Lernenden bleiben erhalten). Präsenzen der Klasse werden ersetzt.
 */
export function solSql(d: SolInput): string[] {
  const c = slug(d.classId.replace(/^c-/, ""));
  const out: string[] = [];
  const blockIds = new Map<number, string>();
  const dayIds = new Map<string, string>();
  for (const b of d.blocks) {
    if (!b.weeks.length) throw new Error(`Block ${b.n} ohne Wochen`);
    const mondays = b.weeks.map(isoWeekMonday).sort();
    const id = `b-${c}-${b.n}`;
    blockIds.set(b.n, id);
    out.push(`INSERT INTO sol_blocks (id, class_id, n, starts, ends) VALUES (${[id, d.classId, b.n, mondays[0]!, addDays(mondays.at(-1)!, 4)].map(lit).join(", ")}) ON CONFLICT(id) DO UPDATE SET n = excluded.n, starts = excluded.starts, ends = excluded.ends;`);
    for (const mo of mondays) {
      const date = addDays(mo, d.solWeekday - 1);
      const dayId = `sd-${c}-${date}`;
      dayIds.set(date, dayId);
      out.push(`INSERT INTO sol_days (id, block_id, date) VALUES (${[dayId, id, date].map(lit).join(", ")}) ON CONFLICT(id) DO UPDATE SET block_id = excluded.block_id, date = excluded.date;`);
    }
  }
  for (const t of d.tasks) {
    const blockId = blockIds.get(t.block);
    if (!blockId) throw new Error(`Auftrag ${t.subject} ${t.code}: Block ${t.block} fehlt`);
    const id = `t-${c}-${slug(t.subject)}-${slug(t.code)}`;
    out.push(`INSERT INTO sol_tasks (id, block_id, subject_code, code, title, minutes, sharepoint_url, r2_key) VALUES (${[id, blockId, t.subject, t.code, t.title, t.minutes, null, null].map(lit).join(", ")}) ON CONFLICT(id) DO UPDATE SET block_id = excluded.block_id, subject_code = excluded.subject_code, code = excluded.code, title = excluded.title, minutes = excluded.minutes;`);
  }
  out.push(`DELETE FROM sol_presence WHERE sol_day_id IN (SELECT sd.id FROM sol_days sd JOIN sol_blocks b ON b.id = sd.block_id WHERE b.class_id = ${lit(d.classId)});`);
  d.presence.forEach((p, i) => {
    const dayId = dayIds.get(p.date);
    if (!dayId) throw new Error(`Präsenz am ${p.date}: kein SOL-Tag`);
    out.push(`INSERT INTO sol_presence (id, sol_day_id, teacher_code, subject_code, start_time, end_time, room, lane) VALUES (${[`pr-${c}-${p.date}-${i}`, dayId, p.teacher, p.subject, p.from, p.to, p.room, p.lane].map(lit).join(", ")});`);
  });
  for (const cs of d.classSubjects) {
    out.push(`INSERT INTO teachers (code, name) VALUES (${lit(cs.teacher)}, ${lit(cs.teacher)}) ON CONFLICT(code) DO NOTHING;`);
    out.push(`INSERT INTO class_subjects (class_id, subject_code, teacher_code) VALUES (${[d.classId, cs.subject, cs.teacher].map(lit).join(", ")}) ON CONFLICT(class_id, subject_code) DO UPDATE SET teacher_code = excluded.teacher_code;`);
  }
  return out;
}
