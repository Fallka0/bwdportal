import { buildSeed } from "@bwd/db";
import type { VEvent } from "node-ical";
import type { LessonInput, Range, TimetableSource } from "./types";
import { mapIcalEvent, mapUntisLesson, toUntisDate, type UntisLesson } from "./map";

/** Beispieldaten aus den Fixtures (gleich wie der Seed). Standard in der Demo. */
export const mockSource: TimetableSource = {
  name: "mock",
  async fetchLessons({ from, to }: Range) {
    const d = buildSeed();
    const subjects = new Map((d.subjects ?? []).map((s) => [String(s.code), s]));
    const teachers = new Map((d.teachers ?? []).map((t) => [String(t.code), t]));
    return (d.lessons ?? [])
      .filter((l) => String(l.date) >= from && String(l.date) <= to)
      .map((l): LessonInput => {
        const s = l.subject_code ? subjects.get(String(l.subject_code)) : undefined;
        const t = l.teacher_code ? teachers.get(String(l.teacher_code)) : undefined;
        return {
          externalId: String(l.external_id),
          date: String(l.date),
          start: String(l.start_time),
          end: String(l.end_time),
          subject: s ? { code: String(s.code), name: String(s.name), short: String(s.short) } : null,
          teacher: t ? { code: String(t.code), name: String(t.name) } : null,
          room: l.room === null ? null : String(l.room),
          state: l.state as LessonInput["state"],
          originalRoom: l.original_room === null ? null : String(l.original_room),
        };
      });
  },
};

function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} fehlt in tools/import/.env.local`);
  return v;
}

/**
 * WebUntis über die inoffizielle JSON-RPC-Schnittstelle (npm "webuntis", nicht von Untis, eigenes Risiko).
 * Anmeldung bevorzugt mit Secret oder QR-Daten, sonst Passwort. Läuft nur in Node, nicht auf Workers.
 */
export const webuntisSource: TimetableSource = {
  name: "webuntis",
  async fetchLessons({ from, to }: Range) {
    const { WebUntis, WebUntisQR, WebUntisSecretAuth } = await import("webuntis");
    const { authenticator } = await import("otplib");
    const identity = "bwd-portal-import";
    let untis;
    if (process.env.WEBUNTIS_QR) untis = new WebUntisQR(process.env.WEBUNTIS_QR, identity, authenticator, URL);
    else if (process.env.WEBUNTIS_SECRET) untis = new WebUntisSecretAuth(need("WEBUNTIS_SCHOOL"), need("WEBUNTIS_USER"), process.env.WEBUNTIS_SECRET, need("WEBUNTIS_SERVER"), identity, authenticator);
    else untis = new WebUntis(need("WEBUNTIS_SCHOOL"), need("WEBUNTIS_USER"), need("WEBUNTIS_PASSWORD"), need("WEBUNTIS_SERVER"));
    await untis.login();
    try {
      const lessons = (await untis.getOwnTimetableForRange(toUntisDate(from), toUntisDate(to))) as unknown as UntisLesson[];
      return lessons.map(mapUntisLesson);
    } finally {
      await untis.logout().catch(() => {});
    }
  },
};

/** Kalender-Abo (iCal) aus dem WebUntis-Profil, falls die Schule es freigibt. */
export const icalSource: TimetableSource = {
  name: "ical",
  async fetchLessons({ from, to }: Range) {
    const ical = await import("node-ical");
    const data = await ical.async.fromURL(need("ICAL_URL"));
    return Object.values(data)
      .filter((e): e is VEvent => (e as { type?: string }).type === "VEVENT")
      .map((e) => mapIcalEvent({ uid: String(e.uid), summary: String(e.summary ?? ""), location: e.location ? String(e.location) : undefined, description: e.description ? String(e.description) : undefined, start: new Date(e.start as unknown as Date), end: new Date(e.end as unknown as Date), status: e.status ? String(e.status) : undefined }))
      .filter((l) => l.date >= from && l.date <= to);
  },
};

/**
 * Lektionen aus einer JSON-Datei (Liste von LessonInput), z. B. von Hand aus WebUntis übertragen.
 * Pfad in TIMETABLE_FILE oder über --file. Echte Daten liegen ausserhalb des Repos oder in tools/import/.local/.
 */
export const fileSource: TimetableSource = {
  name: "file",
  async fetchLessons({ from, to }: Range) {
    const { readFileSync } = await import("node:fs");
    const lessons = JSON.parse(readFileSync(need("TIMETABLE_FILE"), "utf8")) as LessonInput[];
    if (!Array.isArray(lessons)) throw new Error("TIMETABLE_FILE: erwartet eine Liste von Lektionen");
    return lessons.filter((l) => l.date >= from && l.date <= to);
  },
};

export const SOURCES = { mock: mockSource, webuntis: webuntisSource, ical: icalSource, file: fileSource };
