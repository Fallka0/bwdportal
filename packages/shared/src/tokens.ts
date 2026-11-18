import { tokens } from "./tokens.gen";

export { tokens };
export type ThemeName = "light" | "dark";
export type ColorTokens = { [K in keyof typeof tokens.color.light]: string };

export function colors(theme: ThemeName): ColorTokens {
  return tokens.color[theme];
}
