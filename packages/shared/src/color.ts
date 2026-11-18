import { tokens, type ColorTokens, type ThemeName } from "./tokens";

function parse(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

const toHex = (n: number) => Math.round(n).toString(16).padStart(2, "0");

/** Mischt zwei Hex-Farben wie CSS `color-mix(in srgb, a p%, b)`. */
export function mix(a: string, b: string, p: number): string {
  const ca = parse(a);
  const cb = parse(b);
  return "#" + ca.map((v, i) => toHex(v * p + cb[i]! * (1 - p))).join("");
}

/** Hex mit Deckkraft als rgba(). */
export function alpha(hex: string, a: number): string {
  const [r, g, b] = parse(hex);
  return `rgba(${r},${g},${b},${a})`;
}

export type Palette = ColorTokens & {
  warnBg: string;
  errBg: string;
  okBg: string;
  nextChgBg: string;
  fieldBg: string;
  onBg: string;
  ttBg: string;
  ttFg: string;
  ttChanged: string;
};

/** Alle Farben eines Designs, inklusive der abgeleiteten Flächen (gleiche Formeln wie im Web-CSS). */
export function palette(theme: ThemeName): Palette {
  const c = tokens.color[theme];
  const tt = tokens.color.timetableBlock;
  return {
    ...c,
    warnBg: mix(c.warn, c.bg, 0.12),
    errBg: mix(c.err, c.bg, 0.1),
    okBg: mix(c.ok, c.bg, 0.1),
    nextChgBg: mix(c.live, c.btn, 0.18),
    fieldBg: theme === "dark" ? c.panel2 : c.raise,
    onBg: theme === "dark" ? c.panel2 : c.raise,
    ttBg: tt[theme].bg,
    ttFg: tt[theme].fg,
    ttChanged: tt.changedText[theme],
  };
}
