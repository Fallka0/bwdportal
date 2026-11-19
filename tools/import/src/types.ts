/** Eine Lektion, wie sie aus einer Quelle kommt, bevor sie in D1 geschrieben wird. */
export type LessonInput = {
  externalId: string;
  date: string;
  start: string;
  end: string;
  subject: { code: string; name: string; short: string } | null;
  teacher: { code: string; name: string } | null;
  room: string | null;
  state: "normal" | "room_changed" | "cancelled" | "sol";
  originalRoom: string | null;
};

export type Range = { from: string; to: string };

/** Schnittstelle aus handoff/docs/WEBUNTIS.md. Umsetzungen: mock, webuntis, ical und file (JSON von Hand). */
export interface TimetableSource {
  name: "mock" | "webuntis" | "ical" | "file";
  fetchLessons(range: Range): Promise<LessonInput[]>;
}
