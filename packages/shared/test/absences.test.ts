import { describe, expect, it } from "vitest";
import { absenceContingent, attachmentRequired, isLateDispensation, isNotified, noticeEditable, semesterOf, subtractWorkdays } from "../src/domain";

const notice = (date: string, fromPeriod: number, toPeriod: number, createdAt = `${date}T07:00`) => ({ date, fromPeriod, toPeriod, createdAt });

describe("Semester", () => {
  it("1. Semester ab August, 2. ab secondSemesterStart", () => {
    expect(semesterOf("2026-11-19")).toEqual({ n: 1, from: "2026-08-01", to: "2027-02-07" });
    expect(semesterOf("2027-02-08")).toEqual({ n: 2, from: "2027-02-08", to: "2027-07-31" });
    expect(semesterOf("2027-07-31").n).toBe(2);
    expect(semesterOf("2027-08-01")).toMatchObject({ n: 1, from: "2027-08-01" });
  });
});

describe("Abmeldung", () => {
  it("deckt die Lektion nur, wenn vor ihrem Beginn erfasst", () => {
    expect(isNotified({ date: "2026-11-06", period: 7 }, [notice("2026-11-06", 7, 9, "2026-11-06T12:14")])).toBe(true);
    expect(isNotified({ date: "2026-11-06", period: 7 }, [notice("2026-11-06", 7, 9, "2026-11-06T13:30")])).toBe(false);
    expect(isNotified({ date: "2026-11-06", period: 10 }, [notice("2026-11-06", 7, 9)])).toBe(false);
  });

  it("änderbar bis zum Beginn der ersten Lektion", () => {
    expect(noticeEditable({ date: "2026-11-06", fromPeriod: 1 }, { date: "2026-11-05", time: "20:00" })).toBe(true);
    expect(noticeEditable({ date: "2026-11-06", fromPeriod: 7 }, { date: "2026-11-06", time: "12:00" })).toBe(true);
    expect(noticeEditable({ date: "2026-11-06", fromPeriod: 1 }, { date: "2026-11-06", time: "08:00" })).toBe(false);
  });
});

describe("Kontingent", () => {
  const today = "2026-11-19";

  it("bewilligte Lektionen zählen nicht, ohne Abmeldung doppelt, anderes Semester nicht", () => {
    const missed = [
      { date: "2026-11-02", period: 1 },
      { date: "2026-11-02", period: 2 },
      { date: "2026-11-03", period: 1 },
      { date: "2026-07-01", period: 1 },
    ];
    const r = absenceContingent(missed, [notice("2026-11-02", 1, 2)], [{ date: "2026-11-02", period: 2 }], today);
    expect(r.contingent).toEqual({ semester: 1, size: 20, missed: 3, used: 3, available: 17 });
    expect(r.lesson({ date: "2026-11-02", period: 2 })).toMatchObject({ state: "dispensed", weight: 0 });
    expect(r.lesson({ date: "2026-11-03", period: 1 })).toMatchObject({ state: "contingent", weight: 2, notified: false });
  });

  it("über dem Kontingent unentschuldigt, verfügbar nie unter 0", () => {
    const many = Array.from({ length: 25 }, (_, i) => ({ date: `2026-11-${String(2 + Math.floor(i / 12)).padStart(2, "0")}`, period: (i % 12) + 1 }));
    const notices = ["2026-11-02", "2026-11-03", "2026-11-04"].map((d) => notice(d, 1, 12, "2026-11-01T12:00"));
    const r = absenceContingent(many, notices, [], today);
    expect(r.contingent).toMatchObject({ used: 25, available: 0 });
    expect(r.lesson({ date: "2026-11-03", period: 8 })).toMatchObject({ state: "contingent" });
    expect(r.lesson({ date: "2026-11-03", period: 9 })).toMatchObject({ state: "unexcused" });
  });

  it("Überschreitung im Vorsemester kürzt das Kontingent", () => {
    // 2. Semester 2026: 23 Lektionen mit Abmeldung, 3 zu viel
    const prev = Array.from({ length: 23 }, (_, i) => ({ date: `2026-03-${String(2 + Math.floor(i / 12)).padStart(2, "0")}`, period: (i % 12) + 1 }));
    const notices = ["2026-03-02", "2026-03-03"].map((d) => notice(d, 1, 12, "2026-03-01T12:00"));
    expect(absenceContingent(prev, notices, [], "2026-09-01").contingent).toMatchObject({ size: 17, used: 0, available: 17 });
  });
});

describe("Dispensationsgesuch", () => {
  it("5 Arbeitstage im Voraus, Krankheit nachträglich", () => {
    expect(subtractWorkdays("2026-11-20", 5)).toBe("2026-11-13");
    expect(isLateDispensation("Todesfall in der Familie", "2026-11-20", "2026-11-13T10:00")).toBe(false);
    expect(isLateDispensation("Todesfall in der Familie", "2026-11-20", "2026-11-14T10:00")).toBe(true);
    expect(isLateDispensation("Dispensation ab 2. Krankheitstag", "2026-11-02", "2026-11-05T10:00")).toBe(false);
  });

  it("Bestätigung Pflicht, ausser ab dem 2. Krankheitstag", () => {
    expect(attachmentRequired("Todesfall in der Familie")).toBe(true);
    expect(attachmentRequired("Dispensation 1. Krankheitstag mit Arztzeugnis")).toBe(true);
    expect(attachmentRequired("Dispensation ab 2. Krankheitstag")).toBe(false);
  });
});
