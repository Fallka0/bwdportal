import { describe, expect, it } from "vitest";
import { fmtGrade, fmtWeight, gradeBar, isInsufficient, round1, weightedAverage } from "../src/grades";

describe("Notenschnitt", () => {
  it("rechnet gewichtet wie im Design (Mathematik 4.6)", () => {
    const avg = weightedAverage([
      { value: 4.5, weight: 1 },
      { value: 5, weight: 1 },
      { value: 4, weight: 0.5 },
    ]);
    expect(fmtGrade(avg!)).toBe("4.6");
  });

  it("rundet halbe Zehntel nach oben", () => {
    expect(round1(4.25)).toBe(4.3);
    expect(round1(3.75)).toBe(3.8);
    expect(round1(5.625)).toBe(5.6);
  });

  it("leere Liste gibt null", () => {
    expect(weightedAverage([])).toBeNull();
  });

  it("ungenügend unter 4.0, nach Rundung", () => {
    expect(isInsufficient(3.8)).toBe(true);
    expect(isInsufficient(3.96)).toBe(false);
    expect(isInsufficient(4)).toBe(false);
  });

  it("Balken und Gewicht", () => {
    expect(gradeBar(6)).toBe(100);
    expect(gradeBar(1)).toBe(0);
    expect(gradeBar(4)).toBe(60);
    expect(fmtWeight(0.5)).toBe("Gewicht ½");
  });
});

import { absenceSubjectsLabel, fmtPeriods, fmtSize, isNewDocument, notificationGroup } from "../src/domain";

describe("Fachregeln", () => {
  it("Lektionen beschriften", () => {
    expect(fmtPeriods([3])).toBe("3. Lektion");
    expect(fmtPeriods([4, 5])).toBe("4. und 5. Lektion");
    expect(fmtPeriods([1, 2, 3])).toBe("1., 2. und 3. Lektion");
  });

  it("Fächer einer Absenz oder Tageshälfte", () => {
    expect(absenceSubjectsLabel([{ period: 1, subjectName: "Französisch" }, { period: 2, subjectName: "Mathematik" }])).toBe("Französisch, Mathematik");
    expect(absenceSubjectsLabel([{ period: 1, subjectName: null }, { period: 4, subjectName: null }])).toBe("Vormittag");
    expect(absenceSubjectsLabel([{ period: 6, subjectName: null }])).toBe("Nachmittag");
  });

  it("Gruppen der Benachrichtigungen", () => {
    expect(notificationGroup("2026-10-26T09:45", "2026-10-26")).toBe("Heute");
    expect(notificationGroup("2026-10-25T18:02", "2026-10-26")).toBe("Gestern");
    expect(notificationGroup("2026-10-20T08:00", "2026-10-26")).toBe("Diese Woche");
    expect(notificationGroup("2026-10-01T08:00", "2026-10-26")).toBe("Früher");
  });

  it("Dokumente: neu und Grösse", () => {
    expect(isNewDocument("2026-10-20", "2026-10-26")).toBe(true);
    expect(isNewDocument("2026-09-01", "2026-10-26")).toBe(false);
    expect(fmtSize(245760)).toBe("240 KB");
  });
});

import { lessonRun } from "../src/domain";

describe("lessonRun", () => {
  it("findet die Doppellektion auch mit kopierten Objekten (JSON)", () => {
    const mk = (id: string, start: string) => ({ id, date: "2026-10-26", start, end: start, subject: { code: "WR", name: "W", short: "W" }, teacher: null, room: "B 015", state: "room_changed" as const, originalRoom: "A 207" });
    const lessons = [mk("a", "10:45"), mk("b", "11:35")];
    const copy = JSON.parse(JSON.stringify(lessons[0]));
    expect(lessonRun(lessons, copy).map((l) => l.id)).toEqual(["a", "b"]);
  });
});

import { parseBody } from "../src/domain";

describe("parseBody", () => {
  it("Absätze und Listen", () => {
    expect(parseBody("Eins.\n\nZwei\nzeilig.\n\n- a\n- b")).toEqual([
      { type: "p", text: "Eins." },
      { type: "p", text: "Zwei zeilig." },
      { type: "ul", items: ["a", "b"] },
    ]);
    expect(parseBody(null)).toEqual([]);
  });
});
