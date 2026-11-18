import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold } from "@expo-google-fonts/manrope";
import { Unbounded_300Light, Unbounded_400Regular, Unbounded_500Medium, Unbounded_600SemiBold } from "@expo-google-fonts/unbounded";

/** Schriften werden mit der App ausgeliefert (expo-font), nicht zur Laufzeit geladen. */
export const fontAssets = {
  Unbounded_300Light,
  Unbounded_400Regular,
  Unbounded_500Medium,
  Unbounded_600SemiBold,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
};

export const font = {
  display: "Unbounded_300Light",
  display400: "Unbounded_400Regular",
  display500: "Unbounded_500Medium",
  display600: "Unbounded_600SemiBold",
  body: "Manrope_400Regular",
  body500: "Manrope_500Medium",
  body600: "Manrope_600SemiBold",
  body700: "Manrope_700Bold",
} as const;

/** Laufweite -0.045em als Pixelwert für eine Schriftgrösse. */
export const tracking = (size: number) => size * -0.045;
