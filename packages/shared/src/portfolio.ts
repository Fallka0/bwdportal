/**
 * Notenportfolio IMS (wie die Excel-Vorlage der Schule, Version 24.02.1): BM-Semester 1 bis 6 mit Fächern und
 * Informatikmodulen (gibb), dazu die EFZ-Übersicht (gibb 80 %, üK 20 %). Alle Formeln entsprechen der Vorlage.
 */
import { round1, weightedAverage } from "./grades";

/** Fächer der BM (IMS) in der Reihenfolge der Vorlage. IN = Informatik (gibb), aus den Modulen. */
export const BM_SUBJECTS = [
  { code: "D", name: "Deutsch" },
  { code: "F", name: "Französisch" },
  { code: "E", name: "Englisch" },
  { code: "FRW", name: "Finanz- und Rechnungswesen" },
  { code: "WR", name: "Wirtschaft und Recht" },
  { code: "MA", name: "Mathematik" },
  { code: "GP", name: "Geschichte und Politik" },
  { code: "TU", name: "Technik und Umwelt" },
  { code: "IN", name: "Informatik" },
] as const;
export type BmSubject = (typeof BM_SUBJECTS)[number]["code"];

export const subjectName = (code: string) => BM_SUBJECTS.find((s) => s.code === code)?.name ?? code;

/** Fachkürzel der Vorlage ("W+R") auf das Kürzel im Portal. */
export function normalizeSubject(raw: string): BmSubject | null {
  const c = raw.trim().toUpperCase().replace(/\s+/g, "");
  const map: Record<string, BmSubject> = { D: "D", F: "F", E: "E", FRW: "FRW", "W+R": "WR", WR: "WR", MA: "MA", M: "MA", GP: "GP", TU: "TU", IN: "IN" };
  return map[c] ?? null;
}

export type Entry = { value: number; weight: number };

/** Halbe Noten: MROUND(x, 0.5) wie in Excel (x.25 und x.75 nach oben). */
export function roundHalf(x: number): number {
  return Math.round(x * 2 + 1e-9) / 2;
}

export const round2 = (x: number) => Math.round(x * 100 + 1e-9) / 100;

/** Fach: ungerundeter gewichteter Schnitt und die Zeugnisnote auf 0.5. */
export function subjectGrade(entries: Entry[]): { raw: number; grade: number } | null {
  const raw = weightedAverage(entries.filter((e) => e.value >= 1 && e.weight > 0));
  return raw === null ? null : { raw, grade: roundHalf(raw) };
}

/** Informatikmodul: gewichteter Schnitt auf 0.1. */
export function moduleGrade(entries: Entry[]): number | null {
  const raw = weightedAverage(entries.filter((e) => e.value >= 1 && e.weight > 0));
  return raw === null ? null : round1(raw);
}

/** Informatik (gibb) im Semester: Schnitt der Modulnoten auf 0.01, Zeugnisnote auf 0.5. */
export function informatics(modules: (number | null)[]): { raw: number; grade: number } | null {
  const m = modules.filter((x): x is number => x !== null);
  if (!m.length) return null;
  const raw = round2(m.reduce((a, b) => a + b, 0) / m.length);
  return { raw, grade: roundHalf(raw) };
}

export type Status = "ok" | "risk" | "fail";

/**
 * Semester wie im Blatt "Noten_BM_Sem_n": BM-Schnitt aus den Zeugnisnoten der Fächer, Informatik doppelt
 * (mit dem Wert auf 0.01); ungenügende Noten und ihre Abweichung zu 4; Ampeln für BM, EFZ und Praktikum.
 */
export function semesterSummary(subjects: { code: string; grade: number | null }[], informaticsRaw: number | null) {
  const grades = subjects.filter((s) => s.code !== "IN" && s.grade !== null).map((s) => s.grade!);
  const all = informaticsRaw !== null ? [...grades, informaticsRaw, informaticsRaw] : grades;
  const bm = all.length ? round1(all.reduce((a, b) => a + b, 0) / all.length) : null;
  const below = [...grades, ...(informaticsRaw !== null ? [informaticsRaw] : [])].filter((g) => g < 4);
  const insufficient = below.length;
  const deviation = round2(below.reduce((s, g) => s + (4 - g), 0));
  const efz = informaticsRaw !== null ? round1(informaticsRaw) : null;
  const bmStatus: Status | null = bm === null ? null : bm < 4 || insufficient > 2 || deviation > 2 ? "fail" : bm < 4.3 ? "risk" : "ok";
  return { bm, efz, insufficient, deviation, bmStatus, efzStatus: efzStatus(efz), internship: internshipStatus(efz) };
}

/** EFZ: ab 4.3 auf Kurs, 4 bis 4.2 gefährdet, unter 4 nicht auf Kurs. */
export function efzStatus(x: number | null): Status | null {
  return x === null ? null : x < 4 ? "fail" : x < 4.3 ? "risk" : "ok";
}

/** Praktikum: ab 4.75 in Informatik auf Kurs. */
export function internshipStatus(x: number | null): Status | null {
  return x === null ? null : x < 4.75 ? "fail" : "ok";
}

/** EFZ-Übersicht (Blatt "Noten_EFZ"): gibb-Module und üK je auf 0.5, gesamt 80 % gibb und 20 % üK. */
export function efzSummary(modules: { place: "gibb" | "uek"; value: number | null }[]) {
  const avg = (xs: number[]) => (xs.length ? roundHalf(xs.reduce((a, b) => a + b, 0) / xs.length) : null);
  const gibb = avg(modules.filter((m) => m.place === "gibb" && m.value !== null).map((m) => m.value!));
  const uek = avg(modules.filter((m) => m.place === "uek" && m.value !== null).map((m) => m.value!));
  const total = gibb !== null && uek !== null ? round2(0.8 * gibb + 0.2 * uek) : (gibb ?? uek);
  return { gibb, uek, total, status: efzStatus(total), internship: internshipStatus(total) };
}

/** BM-Semester (1 bis 6) zu einem Datum: Klasse "IM24a" beginnt 2024, Herbst = ungerade Semester. */
export function bmSemester(classCode: string, date: string, secondSemesterStart: string): number | null {
  const m = /(\d{2})/.exec(classCode);
  if (!m) return null;
  const start = 2000 + Number(m[1]);
  const y = Number(date.slice(0, 4));
  const schoolYear = date.slice(5) >= "08-01" ? y : y - 1;
  const spring = date.slice(5) >= secondSemesterStart.slice(5) && date.slice(5) < "08-01";
  const n = (schoolYear - start) * 2 + (spring ? 2 : 1);
  return n >= 1 && n <= 6 ? n : null;
}

/** "2026/27 Herbst" zum BM-Semester. */
export function semesterLabel(classCode: string, n: number): string {
  const m = /(\d{2})/.exec(classCode);
  if (!m) return `${n}. Semester`;
  const y = 2000 + Number(m[1]) + Math.floor((n - 1) / 2);
  return `${y}/${String((y + 1) % 100).padStart(2, "0")} ${n % 2 ? "Herbst" : "Frühling"}`;
}

export const STATUS_LABEL: Record<"bm" | "efz" | "internship", Record<Status, string>> = {
  bm: { ok: "BM auf Kurs", risk: "BM gefährdet", fail: "BM nicht auf Kurs" },
  efz: { ok: "EFZ auf Kurs", risk: "EFZ gefährdet", fail: "EFZ nicht auf Kurs" },
  internship: { ok: "Praktikum auf Kurs", risk: "Praktikum gefährdet", fail: "Praktikum nicht auf Kurs" },
};

/**
 * Wunschnote: welche Note braucht die nächste Probe (Gewicht `weight`), damit die Zeugnisnote `target` erreicht?
 * Fach: Zeugnisnote auf 0.5, also reicht ein Schnitt ab target − 0.25; Informatikmodul: auf 0.1, ab target − 0.05.
 * Ergebnis auf 0.1 aufgerundet. "safe": schon mit einer 1 erreicht; "impossible": auch eine 6 reicht nicht.
 */
export function neededGrade(entries: Entry[], target: number, weight: number, kind: "subject" | "module" = "subject"): { kind: "safe" } | { kind: "impossible"; best: number } | { kind: "need"; value: number } {
  const counted = entries.filter((e) => e.value >= 1 && e.weight > 0);
  const w = Math.max(weight, 0.0001);
  const sum = counted.reduce((s, e) => s + e.value * e.weight, 0);
  const total = counted.reduce((s, e) => s + e.weight, 0);
  const threshold = target - (kind === "subject" ? 0.25 : 0.05);
  const x = (threshold * (total + w) - sum) / w;
  const reached = (v: number) => {
    const raw = (sum + v * w) / (total + w);
    return (kind === "subject" ? roundHalf(raw) : round1(raw)) >= target;
  };
  if (reached(1)) return { kind: "safe" };
  if (!reached(6)) {
    const raw = (sum + 6 * w) / (total + w);
    return { kind: "impossible", best: kind === "subject" ? roundHalf(raw) : round1(raw) };
  }
  // Auf 0.1 aufrunden und prüfen (Rundungsgrenzen genau treffen)
  let v = Math.max(1, Math.ceil(x * 10 - 1e-9) / 10);
  while (v > 1 && reached(round1(v - 0.1))) v = round1(v - 0.1);
  while (!reached(v) && v < 6) v = round1(v + 0.1);
  return { kind: "need", value: v };
}
