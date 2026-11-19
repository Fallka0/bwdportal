import { describe, expect, it } from "vitest";
import { buildIcs, icsEscape, icsFold } from "../src/ical";

describe("iCal", () => {
  it("maskiert Sonderzeichen", () => {
    expect(icsEscape("W&R; Raum B 015, statt A 207\nneu")).toBe("W&R\; Raum B 015\\, statt A 207\\nneu");
  });

  it("bricht lange Zeilen bei 75 Bytes um, auch mit Umlauten", () => {
    const long = "SUMMARY:" + "Prüfung Mathematik ".repeat(8);
    const folded = icsFold(long);
    for (const l of folded.split("\r\n")) expect(new TextEncoder().encode(l).length).toBeLessThanOrEqual(75);
    expect(folded.split("\r\n").map((l, i) => (i ? l.slice(1) : l)).join("")).toBe(long);
  });

  it("Lektion mit Zeitzone, Ausfall, ganztägige Prüfung", () => {
    const ics = buildIcs({
      name: "bwd Portal",
      stamp: "20261026T092000Z",
      events: [
        { uid: "l1@bwd", summary: "Deutsch", date: "2026-10-26", start: "13:15", end: "14:00", location: "A 101", cancelled: true },
        { uid: "e1@bwd", summary: "Prüfung Mathematik: Funktionen", date: "2026-10-20" },
      ],
    });
    expect(ics).toContain("BEGIN:VTIMEZONE\r\nTZID:Europe/Zurich");
    expect(ics).toContain("DTSTART;TZID=Europe/Zurich:20261026T131500\r\nDTEND;TZID=Europe/Zurich:20261026T140000");
    expect(ics).toContain("STATUS:CANCELLED");
    expect(ics).toContain("DTSTART;VALUE=DATE:20261020\r\nDTEND;VALUE=DATE:20261021");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics.split("BEGIN:VEVENT")).toHaveLength(3);
  });
});
