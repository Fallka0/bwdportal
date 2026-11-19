import { describe, expect, it } from "vitest";
import { isoWeekMonday, solSql, type SolInput } from "../src/sol";

const input: SolInput = {
  classId: "c-test",
  solWeekday: 5,
  blocks: [{ n: 4, weeks: ["2026-W47", "2026-W49"] }],
  tasks: [{ block: 4, subject: "M", code: "4.01", title: "Quadratische Funktionen", minutes: 75 }],
  presence: [{ date: "2026-12-04", teacher: "xyz", subject: "M", from: "10:50", to: "12:30", room: "123", lane: 1 }],
  classSubjects: [{ subject: "M", teacher: "xyz" }],
};

describe("SOL-Import", () => {
  it("Montag einer Kalenderwoche", () => {
    expect(isoWeekMonday("2026-W47")).toBe("2026-11-16");
    expect(isoWeekMonday("2027-W02")).toBe("2027-01-11");
    expect(isoWeekMonday("2026-W53")).toBe("2026-12-28");
  });

  it("Block von Montag der ersten bis Freitag der letzten Woche, SOL-Tag am Wochentag", () => {
    const sql = solSql(input).join("\n");
    expect(sql).toContain("('b-test-4', 'c-test', 4, '2026-11-16', '2026-12-04')");
    expect(sql).toContain("('sd-test-2026-11-20', 'b-test-4', '2026-11-20')");
    expect(sql).toContain("('sd-test-2026-12-04', 'b-test-4', '2026-12-04')");
    expect(sql).not.toContain("2026-11-27");
    expect(sql).toContain("'t-test-m-4.01', 'b-test-4', 'M', '4.01', 'Quadratische Funktionen', 75, NULL, NULL");
  });

  it("Präsenz nur an einem SOL-Tag, Auftrag nur in einem bekannten Block", () => {
    expect(() => solSql({ ...input, presence: [{ ...input.presence[0]!, date: "2026-11-27" }] })).toThrow(/kein SOL-Tag/);
    expect(() => solSql({ ...input, tasks: [{ ...input.tasks[0]!, block: 9 }] })).toThrow(/Block 9 fehlt/);
  });
});
