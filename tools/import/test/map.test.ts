import { describe, expect, it } from "vitest";
import { mapIcalEvent, mapUntisLesson, untisDate, untisTime } from "../src/map";
import { mockSource } from "../src/sources";
import { importSql } from "../src/sql";

const base = { id: 1, date: 20261026, startTime: 1045, endTime: 1130, su: [{ id: 1, name: "WR", longname: "Wirtschaft und Recht" }], te: [{ id: 2, name: "BRU", longname: "Brunner" }], ro: [{ id: 3, name: "B 015", longname: "B 015" }] };

describe("WebUntis-Abbildung", () => {
  it("Datum und Zeit", () => {
    expect(untisDate(20261026)).toBe("2026-10-26");
    expect(untisTime(800)).toBe("08:00");
    expect(untisTime(1545)).toBe("15:45");
  });

  it("normale Lektion", () => {
    expect(mapUntisLesson(base)).toMatchObject({ externalId: "1", date: "2026-10-26", start: "10:45", end: "11:30", room: "B 015", state: "normal", subject: { code: "WR", name: "Wirtschaft und Recht" } });
  });

  it("Raumänderung über orgname", () => {
    const l = mapUntisLesson({ ...base, ro: [{ id: 3, name: "B 015", longname: "B 015", orgname: "A 207", orgid: 9 }] });
    expect(l).toMatchObject({ state: "room_changed", room: "B 015", originalRoom: "A 207" });
  });

  it("Ausfall über code", () => {
    expect(mapUntisLesson({ ...base, code: "cancelled" }).state).toBe("cancelled");
  });

  it("SOL-Tag", () => {
    expect(mapUntisLesson({ ...base, su: [{ id: 4, name: "SOL", longname: "Selbstorganisiertes Lernen" }] }).state).toBe("sol");
  });
});

describe("iCal-Abbildung", () => {
  it("Zeit in Europe/Zurich, Ausfall über STATUS", () => {
    const l = mapIcalEvent({ uid: "x", summary: "MA Mathematik", location: "A 304", description: "KEL", start: new Date(Date.UTC(2026, 9, 26, 7, 0)), end: new Date(Date.UTC(2026, 9, 26, 7, 45)), status: "CANCELLED" });
    expect(l).toMatchObject({ date: "2026-10-26", start: "08:00", end: "08:45", room: "A 304", state: "cancelled", subject: { code: "MA" } });
  });
});

describe("Mock-Quelle und SQL", () => {
  it("liefert die Woche 44 wie der Seed", async () => {
    const l = await mockSource.fetchLessons({ from: "2026-10-26", to: "2026-10-30" });
    expect(l.filter((x) => x.date === "2026-10-26")).toHaveLength(7);
    expect(l.find((x) => x.state === "room_changed")?.originalRoom).toBe("A 207");
  });

  it("Upsert über source + external_id, Lauf in import_runs", () => {
    const sql = importSql({ classId: "c-im24b", source: "webuntis", range: { from: "2026-10-26", to: "2026-10-30" }, lessons: [mapUntisLesson(base)], runId: "r1", startedAt: "2026-10-26T07:58", finishedAt: "2026-10-26T07:58" });
    expect(sql.some((s) => s.includes("ON CONFLICT(source, external_id) DO UPDATE"))).toBe(true);
    expect(sql.at(-1)).toContain("INSERT INTO import_runs");
    expect(sql.join("\n")).toContain("'Wirtschaft und Recht'");
  });
});
