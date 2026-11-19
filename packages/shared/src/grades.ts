/** Noten: Schnitt rechnen, runden und formatieren. Schweizer Skala 1 bis 6, genügend ab 4. */

export const SUFFICIENT = 4;

/** Rundet auf eine Dezimale, halbe Werte nach oben (4.25 → 4.3). */
export function round1(x: number): number {
  return Math.round(x * 10 + 1e-9) / 10;
}

/** Gewichteter Schnitt. Leere Liste: null. */
export function weightedAverage(items: { value: number; weight: number }[]): number | null {
  const w = items.reduce((s, i) => s + i.weight, 0);
  if (w === 0) return null;
  return items.reduce((s, i) => s + i.value * i.weight, 0) / w;
}

/** Note mit einer Dezimale und Punkt, wie im Design ("5.5", "4.0"). */
export function fmtGrade(x: number): string {
  return round1(x).toFixed(1);
}

export function isInsufficient(x: number): boolean {
  return round1(x) < SUFFICIENT;
}

/** Breite des Balkens in Prozent: 1 = 0 %, 6 = 100 %. */
export function gradeBar(x: number): number {
  return Math.round(((x - 1) / 5) * 100);
}

export function fmtWeight(w: number): string {
  return w === 1 ? "Gewicht 1" : w === 0.5 ? "Gewicht ½" : `Gewicht ${w}`;
}
