import type { LessonInput, Range } from "./types";

const lit = (v: string | number | null) => (v === null ? "NULL" : typeof v === "number" ? String(v) : `'${v.replace(/'/g, "''")}'`);

/**
 * SQL für einen Import: Fächer und Lehrpersonen ergänzen, Lektionen der Klasse im Zeitraum ersetzen
 * (Upsert über source + external_id), Lauf in import_runs festhalten.
 */
export function importSql(o: { classId: string; source: string; range: Range; lessons: LessonInput[]; runId: string; startedAt: string; finishedAt: string }): string[] {
  const out: string[] = [];
  const subjects = new Map(o.lessons.filter((l) => l.subject).map((l) => [l.subject!.code, l.subject!]));
  for (const s of subjects.values()) out.push(`INSERT INTO subjects (code, name, short) VALUES (${lit(s.code)}, ${lit(s.name)}, ${lit(s.short)}) ON CONFLICT(code) DO NOTHING;`);
  const teachers = new Map(o.lessons.filter((l) => l.teacher).map((l) => [l.teacher!.code, l.teacher!]));
  for (const t of teachers.values()) out.push(`INSERT INTO teachers (code, name) VALUES (${lit(t.code)}, ${lit(t.name)}) ON CONFLICT(code) DO NOTHING;`);
  // Lektionen anderer Quellen im Zeitraum entfernen: der neue Stand ersetzt sie.
  out.push(`DELETE FROM lessons WHERE class_id = ${lit(o.classId)} AND date BETWEEN ${lit(o.range.from)} AND ${lit(o.range.to)} AND source <> ${lit(o.source)};`);
  const ids = o.lessons.map((l) => lit(l.externalId)).join(", ");
  out.push(`DELETE FROM lessons WHERE class_id = ${lit(o.classId)} AND date BETWEEN ${lit(o.range.from)} AND ${lit(o.range.to)} AND source = ${lit(o.source)}${ids ? ` AND external_id NOT IN (${ids})` : ""};`);
  for (const l of o.lessons) {
    const id = `l-${o.source}-${l.externalId}`;
    out.push(
      `INSERT INTO lessons (id, class_id, date, start_time, end_time, subject_code, teacher_code, room, state, original_room, source, external_id) VALUES (${[id, o.classId, l.date, l.start, l.end, l.subject?.code ?? null, l.teacher?.code ?? null, l.room, l.state, l.originalRoom, o.source, l.externalId].map(lit).join(", ")}) ON CONFLICT(source, external_id) DO UPDATE SET date = excluded.date, start_time = excluded.start_time, end_time = excluded.end_time, subject_code = excluded.subject_code, teacher_code = excluded.teacher_code, room = excluded.room, state = excluded.state, original_room = excluded.original_room;`,
    );
  }
  out.push(`INSERT INTO import_runs (id, source, started_at, finished_at, ok, lessons, error) VALUES (${lit(o.runId)}, ${lit(o.source)}, ${lit(o.startedAt)}, ${lit(o.finishedAt)}, 1, ${o.lessons.length}, NULL);`);
  return out;
}

/** Nur den fehlgeschlagenen Lauf festhalten. Der Stundenplan zeigt dann das Banner mit dem letzten Stand. */
export function failedRunSql(o: { source: string; runId: string; startedAt: string; error: string }): string[] {
  return [`INSERT INTO import_runs (id, source, started_at, finished_at, ok, lessons, error) VALUES (${lit(o.runId)}, ${lit(o.source)}, ${lit(o.startedAt)}, ${lit(o.startedAt)}, 0, 0, ${lit(o.error.slice(0, 300))});`];
}
