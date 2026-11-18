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
