import { describe, expect, it } from "vitest";
import type { Lesson } from "../src/schemas";
import { gridY, homeGridEnd, layoutGrid, lessonBlocks, solColumns } from "../src/timegrid";

const L = (id: string, start: string, end: string, extra: Partial<Lesson> = {}): Lesson => ({
  id,
  date: "2026-10-26",
  start,
  end,
  subject: { code: "MA", name: "Mathematik", short: "Mathe" },
  teacher: { code: "KEL", name: "R. Keller" },
  room: "A 304",
  state: "normal",
  originalRoom: null,
  ...extra,
});

describe("Massstab", () => {
  it("1.1 px pro Minute ab 08:00, Stunde = 66 px", () => {
    expect(gridY("08:00")).toBe(0);
    expect(gridY("09:00")).toBe(66);
    expect(gridY("10:20")).toBe(154);
    expect(gridY("17:00")).toBe(594);
  });
});

describe("layoutGrid", () => {
  const cols = [{ key: "mo", date: "2026-10-26", blocks: lessonBlocks([L("a", "08:00", "08:45"), L("b", "09:55", "10:40"), L("c", "10:45", "11:30")]) }];

  it("setzt Stunden, Mittag und Höhe", () => {
    const g = layoutGrid({ end: "15:00", columns: cols, lunch: { from: "12:20", to: "13:15" } });
    expect(g.hours.map((h) => h.label)).toEqual(["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"]);
    expect(g.lunch).toEqual({ top: 286, height: 61 });
    expect(g.height).toBe(gridY("15:00") + 4);
  });

  it("Blöcke: Position, Abstand 2 px, vergangen bis jetzt", () => {
    const g = layoutGrid({ end: "17:00", columns: cols, now: { date: "2026-10-26", time: "10:20" } });
    const [a, b, c] = g.columns[0]!.blocks;
    expect(a).toMatchObject({ top: 0, height: 48, past: true, compact: true });
    expect(b).toMatchObject({ past: false }); // läuft gerade
    expect(c).toMatchObject({ past: false });
    expect(g.now).toEqual({ top: 154, label: "10:20", column: 0 });
  });

  it("Jetzt-Linie nur am heutigen Tag und nur im sichtbaren Bereich", () => {
    expect(layoutGrid({ end: "17:00", columns: cols, now: { date: "2026-10-27", time: "10:20" } }).now).toBeNull();
    expect(layoutGrid({ end: "17:00", columns: cols, now: { date: "2026-10-26", time: "18:30" } }).now).toBeNull();
    expect(layoutGrid({ end: "17:00", columns: cols, now: { date: "2026-10-26", time: "07:30" } }).now).toBeNull();
  });

  it("frühere Tage sind ganz vergangen, spätere nicht", () => {
    const g = layoutGrid({ end: "17:00", columns: [{ key: "x", date: "2026-10-23", blocks: lessonBlocks([L("a", "15:05", "15:50")]) }], now: { date: "2026-10-26", time: "08:00" } });
    expect(g.columns[0]!.blocks[0]!.past).toBe(true);
  });
});

describe("lessonBlocks", () => {
  it("Raumänderung, Ausfall, SOL-Tag wie im Design", () => {
    const b = lessonBlocks([
      L("w", "10:45", "11:30", { subject: { code: "WR", name: "Wirtschaft und Recht", short: "W&R" }, room: "B 015", originalRoom: "A 207", state: "room_changed", teacher: { code: "BRU", name: "T. Brunner" } }),
      L("d", "13:15", "14:00", { subject: { code: "DE", name: "Deutsch", short: "Deutsch" }, state: "cancelled" }),
      L("s", "08:00", "12:00", { subject: { code: "SOL", name: "SOL", short: "SOL" }, room: "Lernzone", state: "sol", teacher: null }),
      L("m", "08:00", "08:45"),
    ]);
    expect(b[0]).toMatchObject({ kind: "changed", title: "Wirtschaft und Recht", titleShort: "W&R", sub: "B 015 statt A 207" });
    expect(b[1]).toMatchObject({ kind: "cancelled", sub: "Entfällt" });
    expect(b[2]).toMatchObject({ kind: "sol", title: "SOL-Tag", sub: "Lernzone" });
    expect(b[3]).toMatchObject({ kind: "lesson", sub: "A 304 · KEL", subShort: "A 304" });
  });
});

describe("solColumns", () => {
  it("Mein Plan und Lehrpersonen mit vier Spuren", () => {
    const c = solColumns(
      "2026-10-30",
      [{ id: "p", taskId: "t", subjectCode: "MA", subjectShort: "Mathe", code: "3.02", title: "Lineare Optimierung I", start: "08:00", end: "08:45", note: null }],
      [{ id: "x", teacherCode: "KEL", teacherName: "R. Keller", subjectCode: "MA", subjectShort: "Mathe", subjectName: "Mathematik", start: "08:00", end: "09:40", room: null, lane: 0 }],
    );
    expect(c[0]!.blocks[0]).toMatchObject({ kind: "plan", title: "Mathe 3.02", detail: "Lineare Optimierung I" });
    expect(c[1]).toMatchObject({ lanes: 4, weight: 1.6 });
    expect(c[1]!.blocks[0]).toMatchObject({ kind: "presence", title: "Keller", titleShort: "KEL", sub: "Mathe" });
  });
});

describe("homeGridEnd", () => {
  it("endet frühestens um 15:00 wie im Design", () => {
    expect(homeGridEnd([])).toBe("15:00");
    expect(homeGridEnd([L("a", "08:00", "09:40")])).toBe("15:00");
  });
  it("zeigt späte Lektionen bis zur nächsten vollen Stunde, höchstens bis timeGridEnd", () => {
    expect(homeGridEnd([L("a", "08:00", "09:40"), L("b", "15:00", "16:35")])).toBe("17:00");
    expect(homeGridEnd([L("b", "15:00", "16:00")])).toBe("16:00");
    expect(homeGridEnd([L("c", "18:00", "19:30")])).toBe("18:00");
  });
});
