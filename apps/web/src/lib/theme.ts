export type ThemePref = "system" | "light" | "dark";
export const THEME_COOKIE = "theme";

export function parseTheme(v: string | undefined): ThemePref {
  return v === "light" || v === "dark" ? v : "system";
}
