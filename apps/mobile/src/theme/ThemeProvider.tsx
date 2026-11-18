import { palette, type Palette, type ThemeName } from "@bwd/shared";
import * as SecureStore from "expo-secure-store";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";

export type ThemePref = "system" | "light" | "dark";
const KEY = "theme";

type Ctx = { pref: ThemePref; setPref: (p: ThemePref) => void; scheme: ThemeName; c: Palette };
const ThemeCtx = createContext<Ctx | null>(null);

export function useTheme(): Ctx {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme ausserhalb von ThemeProvider");
  return ctx;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [pref, setState] = useState<ThemePref>("system");

  useEffect(() => {
    SecureStore.getItemAsync(KEY)
      .then((v) => {
        if (v === "light" || v === "dark" || v === "system") setState(v);
      })
      .catch(() => {});
  }, []);

  const setPref = useCallback((p: ThemePref) => {
    setState(p);
    SecureStore.setItemAsync(KEY, p).catch(() => {});
  }, []);

  const scheme: ThemeName = pref === "system" ? (system === "dark" ? "dark" : "light") : pref;
  const value = useMemo(() => ({ pref, setPref, scheme, c: palette(scheme) }), [pref, setPref, scheme]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

/** Erzwingt ein Design für einen Teilbaum (Testseite zeigt hell und dunkel nebeneinander). */
export function ThemeScope({ scheme, children }: { scheme: ThemeName; children: ReactNode }) {
  const parent = useTheme();
  const value = useMemo(() => ({ ...parent, scheme, c: palette(scheme) }), [parent, scheme]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}
