import { describe, expect, it } from "vitest";
import * as t from "../src/time";

describe("Zeitrechnung", () => {
  it("Minuten hin und zurück", () => {
    expect(t.toMin("10:20")).toBe(620);
    expect(t.fromMin(620)).toBe("10:20");
    expect(t.fromMin(t.toMin("08:05"))).toBe("08:05");
  });

  it("Wochentag, Montag der Woche, Kalenderwoche", () => {
    expect(t.weekday("2026-10-26")).toBe(1);
    expect(t.mondayOf("2026-10-30")).toBe("2026-10-26");
    expect(t.mondayOf("2026-11-01")).toBe("2026-10-26");
    expect(t.isoWeek("2026-10-26")).toBe(44);
    expect(t.isoWeek("2027-01-01")).toBe(53);
  });

  it("addiert Tage über Monatsgrenzen und Zeitumstellung (25.10.2026)", () => {
    expect(t.addDays("2026-10-22", 14)).toBe("2026-11-05");
    expect(t.addDays("2026-10-24", 2)).toBe("2026-10-26");
    expect(t.daysBetween("2026-10-22", "2026-11-05")).toBe(14);
  });

  it("DEMO_NOW hat Vorrang vor der echten Zeit", () => {
    expect(t.getNow("2026-10-26T10:20:00")).toEqual({ date: "2026-10-26", time: "10:20", stamp: "2026-10-26T10:20" });
  });

  it("echte Zeit gilt in Europe/Zurich", () => {
    // 2026-10-26 09:20 UTC = 10:20 in Zürich (Winterzeit, UTC+1)
    expect(t.getNow(undefined, new Date(Date.UTC(2026, 9, 26, 9, 20)))).toEqual({ date: "2026-10-26", time: "10:20", stamp: "2026-10-26T10:20" });
    // 2026-07-01 08:00 UTC = 10:00 (Sommerzeit, UTC+2)
    expect(t.getNow(null, new Date(Date.UTC(2026, 6, 1, 8, 0))).time).toBe("10:00");
  });
});

describe("Formatierung wie im Design", () => {
  it.each([
    [t.fmtLong("2026-10-26"), "Montag, 26. Oktober"],
    [t.fmtMedium("2026-10-26"), "Mo, 26. Oktober"],
    [t.fmtWeekdayShort("2026-10-22"), "Do 22.10."],
    [t.fmtShortLoose("2026-11-05"), "5.11."],
    [t.fmtDate("2026-10-20"), "20.10.2026"],
    [t.fmtWeekdayDate("2026-10-20"), "Di 20.10.2026"],
    [t.fmtLong("2026-10-20", true), "Dienstag, 20. Oktober 2026"],
    [t.fmtRange("2026-10-26", "2026-10-30"), "26. bis 30. Oktober"],
    [t.fmtRange("2026-11-02", "2026-11-06"), "2. bis 6. November"],
    [t.fmtUntil(25), "in 25 Minuten"],
    [t.greeting("10:20"), "Guten Morgen"],
    [t.plural(1, "Lektion", "Lektionen"), "1 Lektion"],
    [t.plural(2, "Lektion", "Lektionen"), "2 Lektionen"],
  ])("%s", (got, want) => expect(got).toBe(want));
});
