import { describe, expect, it } from "vitest";
import { mix, palette } from "../src/color";

describe("mix", () => {
  it("rechnet wie color-mix in srgb", () => {
    expect(mix("#ffffff", "#000000", 0.5)).toBe("#808080");
    expect(mix("#f0a020", "#f0a020", 0.3)).toBe("#f0a020");
    expect(mix("#ff0000", "#0000ff", 1)).toBe("#ff0000");
  });
});

describe("palette", () => {
  it("liefert abgeleitete Flächen für beide Designs", () => {
    for (const t of ["light", "dark"] as const) {
      const p = palette(t);
      expect(p.warnBg).toMatch(/^#[0-9a-f]{6}$/);
      expect(p.ttBg).toBeTruthy();
    }
    expect(palette("dark").fieldBg).toBe(palette("dark").panel2);
  });
});
