/**
 * Notenportfolio IMS (Excel-Vorlage der Schule) einlesen: Basisdaten, Semesterblätter "Noten_BM_Sem_1" bis
 * "_6" (pro Fach Zeilen Titel, Note, Gewicht in den Spalten E bis P; Informatik als Module) und "Noten_EFZ".
 */
import { normalizeSubject, type BmSubject } from "./portfolio";
import { readXlsx, type Cell, type Sheet } from "./xlsx";

export type PortfolioFileEntry = { title: string; value: number; weight: number };
export type PortfolioSubject = { subject: BmSubject; module: string | null; entries: PortfolioFileEntry[] };
export type PortfolioEfz = { year: 1 | 2 | 3; place: "gibb" | "uek"; module: string; name: string; value: number | null };
export type Portfolio = {
  firstName: string;
  lastName: string;
  classCode: string;
  startYear: number | null;
  semesters: { n: number; subjects: PortfolioSubject[] }[];
  efz: PortfolioEfz[];
};

export class PortfolioError extends Error {}

const COLS = ["E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P"];
const str = (c: Cell) => (c === null ? "" : String(c).trim());
const num = (c: Cell) => (typeof c === "number" && Number.isFinite(c) ? c : typeof c === "string" && c.trim() !== "" && Number.isFinite(Number(c)) ? Number(c) : null);

function readSemester(ws: Sheet): PortfolioSubject[] {
  const out: PortfolioSubject[] = [];
  let inInformatics = false;
  for (let r = 1; r <= ws.rows; r++) {
    if (str(ws.get(`D${r}`)) !== "Titel") continue;
    const label = str(ws.get(`B${r}`));
    const a = str(ws.get(`A${r}`));
    if (/^IN\b/i.test(a)) inInformatics = true;
    const mod = /^Modul\s*(\d+)/i.exec(label)?.[1] ?? null;
    const subject = mod || (inInformatics && !label) ? "IN" : normalizeSubject(label);
    if (!subject || (subject === "IN" && !mod)) continue;
    if (str(ws.get(`D${r + 1}`)) !== "Note") continue;
    const entries: PortfolioFileEntry[] = [];
    COLS.forEach((col, i) => {
      const value = num(ws.get(`${col}${r + 1}`));
      // Kurzchecks in Mathematik stehen als 0, solange keine eingetragen sind
      if (value === null || value < 1 || value > 6) return;
      const title = str(ws.get(`${col}${r}`)) || `Probe ${i + 1}`;
      // Ohne Gewicht zählt eine Note in der Vorlage nicht: Gewicht 0 übernehmen
      entries.push({ title, value, weight: num(ws.get(`${col}${r + 2}`)) ?? 0 });
    });
    if (entries.length || mod) out.push({ subject, module: mod, entries });
  }
  return out;
}

function readEfz(ws: Sheet): PortfolioEfz[] {
  const out: PortfolioEfz[] = [];
  const years: [1 | 2 | 3, string, string][] = [
    [1, "C", "D"],
    [2, "G", "H"],
    [3, "K", "L"],
  ];
  for (let r = 15; r <= 33; r++) {
    const place = r <= 24 ? "gibb" : r >= 26 ? "uek" : null;
    if (!place) continue;
    for (const [year, nameCol, gradeCol] of years) {
      const name = str(ws.get(`${nameCol}${r}`));
      const module = /^(\d{3})\b/.exec(name)?.[1];
      if (!module) continue;
      const value = num(ws.get(`${gradeCol}${r}`));
      out.push({ year, place, module, name: name.replace(/^\d{3}\s*/, ""), value: value !== null && value >= 1 && value <= 6 ? value : null });
    }
  }
  return out;
}

/** Liest eine Notenportfolio-Datei. Wirft PortfolioError, wenn es nicht die Vorlage der Schule ist. */
export function readPortfolio(data: Uint8Array): Portfolio {
  let wb;
  try {
    wb = readXlsx(data);
  } catch {
    throw new PortfolioError("Die Datei lässt sich nicht lesen. Lade das Notenportfolio als .xlsx hoch.");
  }
  const base = wb.sheet("Basisdaten");
  const semesterSheets = [1, 2, 3, 4, 5, 6].map((n) => [n, wb.sheet(`Noten_BM_Sem_${n}`)] as const);
  if (!base || semesterSheets.every(([, s]) => !s)) throw new PortfolioError("Das ist kein Notenportfolio IMS (Blätter Basisdaten und Noten_BM_Sem_1 bis 6 fehlen).");
  const efz = wb.sheet("Noten_EFZ");
  return {
    firstName: str(base.get("C4")),
    lastName: str(base.get("C6")),
    classCode: str(base.get("C8")),
    startYear: num(base.get("C10")),
    semesters: semesterSheets.filter(([, s]) => s).map(([n, s]) => ({ n, subjects: readSemester(s!) })),
    efz: efz ? readEfz(efz) : [],
  };
}
