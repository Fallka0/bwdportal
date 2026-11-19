import { Text as RNText, type TextProps, type TextStyle } from "react-native";
import { font, fs, tracking, useTheme } from "@/theme";

type Variant = "body" | "label" | "strong" | "small" | "smallStrong" | "micro" | "title" | "h1" | "h2" | "kpi" | "box";
type Tone = "ink" | "text2" | "warn" | "err" | "ok" | "info" | "btnFg" | "live";

const styles: Record<Variant, TextStyle> = {
  body: { fontFamily: font.body, fontSize: fs.base, lineHeight: 21 },
  label: { fontFamily: font.body600, fontSize: fs.m },
  strong: { fontFamily: font.body600, fontSize: fs.base, lineHeight: 20 },
  small: { fontFamily: font.body, fontSize: fs.s, lineHeight: 17 },
  smallStrong: { fontFamily: font.body700, fontSize: fs.s },
  micro: { fontFamily: font.body700, fontSize: fs.micro },
  box: { fontFamily: font.body700, fontSize: fs.l },
  title: { fontFamily: font.display400, fontSize: fs.h3, letterSpacing: tracking(fs.h3) * 0.66 },
  h1: { fontFamily: font.display, fontSize: fs.h1App, lineHeight: fs.h1App * 1.1, letterSpacing: tracking(fs.h1App) },
  h2: { fontFamily: font.display, fontSize: fs.h2, lineHeight: fs.h2 * 1.15, letterSpacing: tracking(fs.h2) },
  kpi: { fontFamily: font.display, fontSize: 28, letterSpacing: tracking(28) },
};

export type TProps = TextProps & { v?: Variant; tone?: Tone; numeric?: boolean };

/** Text mit Variante aus dem Design. Schriftgrössen nur aus den Tokens. */
export function T({ v = "body", tone, numeric, style, ...rest }: TProps) {
  const { c } = useTheme();
  const color = tone ? c[tone] : v === "small" ? c.text2 : c.ink;
  return (
    <RNText
      accessibilityRole={v === "h1" ? "header" : undefined}
      style={[styles[v], { color }, numeric && { fontVariant: ["tabular-nums"] }, style]}
      maxFontSizeMultiplier={1.6}
      {...rest}
    />
  );
}
