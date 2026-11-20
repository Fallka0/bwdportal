import { strToU8, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { PortfolioError, readPortfolio } from "../src/portfolio-import";

/** Kleine XLSX-Datei im Aufbau der Vorlage (erfundene Werte). Zellen: { "B11": "D", "E12": 5 } pro Blatt. */
function xlsx(sheets: Record<string, Record<string, string | number>>): Uint8Array {
  const strings: string[] = [];
  const idx = (s: string) => (strings.includes(s) ? strings.indexOf(s) : strings.push(s) - 1);
  const files: Record<string, Uint8Array> = {};
  const names = Object.keys(sheets);
  names.forEach((name, i) => {
    const byRow = new Map<number, string[]>();
    for (const [ref, v] of Object.entries(sheets[name]!)) {
      const r = Number(/\d+/.exec(ref)![0]);
      const cell = typeof v === "number" ? `<c r="${ref}"><v>${v}</v></c>` : `<c r="${ref}" t="s"><v>${idx(v)}</v></c>`;
      byRow.set(r, [...(byRow.get(r) ?? []), cell]);
    }
    const rows = [...byRow].sort((a, b) => a[0] - b[0]).map(([r, cs]) => `<row r="${r}">${cs.join("")}</row>`);
    files[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(`<worksheet><sheetData>${rows.join("")}</sheetData></worksheet>`);
  });
  files["xl/workbook.xml"] = strToU8(`<workbook><sheets>${names.map((n, i) => `<sheet name="${n}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets></workbook>`);
  files["xl/_rels/workbook.xml.rels"] = strToU8(`<Relationships>${names.map((_, i) => `<Relationship Id="rId${i + 1}" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}</Relationships>`);
  files["xl/sharedStrings.xml"] = strToU8(`<sst>${strings.map((s) => `<si><t>${s.replace(/&/g, "&amp;")}</t></si>`).join("")}</sst>`);
  return zipSync(files);
}

const base = { B4: "Vorname", C4: "Lea", B6: "Name", C6: "Muster", C8: "IM24A", C10: 2024 };
const sem = {
  B11: "D", D11: "Titel", E11: "Aufsatz", D12: "Note", E12: 5, F12: 4.5, D13: "Gewicht", E13: 100, F13: 50,
  B14: "W+R", D14: "Titel", D15: "Note", E15: 5.5, D16: "Gewicht",
  B17: "MA", D17: "Titel", P17: "Kurzchecks", D18: "Note", E18: 6, P18: 0, D19: "Gewicht", E19: 1, P19: 0,
  A20: "IN (gibb)", B20: "Modul 320", D20: "Titel", D21: "Note", E21: 5.3, D22: "Gewicht", E22: 100,
  B23: "Modul 293", D23: "Titel", D24: "Note", D25: "Gewicht",
};
const efz = { C15: "431 Aufträge im eigenen Berufsumfeld", D15: 5.5, C26: "187 ICT-Arbeitsplatz", D26: 6, G15: " ", C16: " " };

describe("Notenportfolio einlesen", () => {
  it("liest Basisdaten, Fächer, Module und EFZ", () => {
    const p = readPortfolio(xlsx({ Basisdaten: base, Noten_BM_Sem_1: sem, Noten_EFZ: efz }));
    expect(p).toMatchObject({ firstName: "Lea", lastName: "Muster", classCode: "IM24A", startYear: 2024 });
    const s = p.semesters[0]!.subjects;
    expect(s.map((x) => [x.subject, x.module, x.entries.length])).toEqual([
      ["D", null, 2],
      ["WR", null, 1],
      ["MA", null, 1],
      ["IN", "320", 1],
      ["IN", "293", 0],
    ]);
    expect(s[0]!.entries).toEqual([
      { title: "Aufsatz", value: 5, weight: 100 },
      { title: "Probe 2", value: 4.5, weight: 50 },
    ]);
    // Ohne Gewicht zählt die Note in der Vorlage nicht
    expect(s[1]!.entries[0]).toMatchObject({ value: 5.5, weight: 0 });
    expect(p.efz).toEqual([
      { year: 1, place: "gibb", module: "431", name: "Aufträge im eigenen Berufsumfeld", value: 5.5 },
      { year: 1, place: "uek", module: "187", name: "ICT-Arbeitsplatz", value: 6 },
    ]);
  });

  it("lehnt andere Dateien ab", () => {
    expect(() => readPortfolio(new Uint8Array([1, 2, 3]))).toThrow(PortfolioError);
    expect(() => readPortfolio(xlsx({ Tabelle1: { A1: "x" } }))).toThrow("kein Notenportfolio");
  });
});
