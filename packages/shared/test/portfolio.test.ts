import { describe, expect, it } from "vitest";
import { bmSemester, efzSummary, informatics, moduleGrade, normalizeSubject, roundHalf, semesterLabel, semesterSummary, subjectGrade } from "../src/portfolio";

describe("Notenportfolio wie die Excel-Vorlage", () => {
  it("Fachnote: gewichtet, auf 0.5 (MROUND)", () => {
    // Deutsch Semester 1 der Vorlage: Excel rechnet 5.1128 → 5 (die sechste Note ohne Gewicht zählt nicht)
    const d = subjectGrade([
      { value: 5.1, weight: 30.77 },
      { value: 4.6, weight: 7.69 },
      { value: 5.2, weight: 30.77 },
      { value: 4.7, weight: 30.77 },
      { value: 5.4, weight: 50 },
      { value: 5, weight: 0 },
    ]);
    expect(d?.raw).toBeCloseTo(5.1128, 4);
    expect(d?.grade).toBe(5);
    expect(roundHalf(4.75)).toBe(5);
    expect(roundHalf(4.74)).toBe(4.5);
    expect(subjectGrade([])).toBeNull();
  });

  it("Informatik: Module auf 0.1, Schnitt auf 0.01", () => {
    expect(moduleGrade([{ value: 5.7, weight: 60 }, { value: 5.6, weight: 40 }])).toBe(5.7);
    // Semester 3: Module 5.3, 5.9, 5.7, 5.7 → 5.65
    expect(informatics([5.3, 5.9, 5.7, 5.7])).toEqual({ raw: 5.65, grade: 5.5 });
  });

  it("BM-Schnitt mit Informatik doppelt, Ampeln", () => {
    // Semester 3 der Vorlage: D 5, F 5.5, E 5.5, FRW 5, W+R 5.5, MA 5.5, GP 5.5, TU 5, IN 5.65 → BM 5.4, EFZ 5.7
    const s = semesterSummary(
      [
        { code: "D", grade: 5 },
        { code: "F", grade: 5.5 },
        { code: "E", grade: 5.5 },
        { code: "FRW", grade: 5 },
        { code: "WR", grade: 5.5 },
        { code: "MA", grade: 5.5 },
        { code: "GP", grade: 5.5 },
        { code: "TU", grade: 5 },
      ],
      5.65,
    );
    expect(s).toMatchObject({ bm: 5.4, efz: 5.7, insufficient: 0, bmStatus: "ok", efzStatus: "ok", internship: "ok" });
    const bad = semesterSummary(
      [
        { code: "D", grade: 3.5 },
        { code: "F", grade: 3.5 },
        { code: "E", grade: 3.5 },
        { code: "MA", grade: 6 },
      ],
      null,
    );
    expect(bad).toMatchObject({ insufficient: 3, deviation: 1.5, bmStatus: "fail" });
    // (4 + 4.2 + 4.2) / 3 = 4.13 → 4.1: gefährdet; genau 4.3 wäre auf Kurs
    expect(semesterSummary([{ code: "D", grade: 4 }], 4.2).bmStatus).toBe("risk");
    expect(semesterSummary([{ code: "D", grade: 4 }], 4.5).bmStatus).toBe("ok");
  });

  it("EFZ: gibb 80 %, üK 20 %, je auf 0.5", () => {
    const e = efzSummary([
      { place: "gibb", value: 5.5 },
      { place: "gibb", value: 5 },
      { place: "gibb", value: 6 },
      { place: "uek", value: 6 },
      { place: "uek", value: 4 },
    ]);
    expect(e).toMatchObject({ gibb: 5.5, uek: 5, total: 5.4, status: "ok" });
    expect(efzSummary([]).total).toBeNull();
  });

  it("BM-Semester aus Klasse und Datum, Kürzel der Vorlage", () => {
    expect(bmSemester("IM24a", "2026-11-20", "2027-02-08")).toBe(5);
    expect(bmSemester("IM24a", "2027-03-01", "2027-02-08")).toBe(6);
    expect(bmSemester("IM24a", "2024-09-01", "2025-02-10")).toBe(1);
    expect(bmSemester("IM24a", "2027-09-01", "2028-02-07")).toBeNull();
    expect(semesterLabel("IM24a", 5)).toBe("2026/27 Herbst");
    expect(normalizeSubject("W+R")).toBe("WR");
    expect(normalizeSubject("Modul 320")).toBeNull();
  });
});
