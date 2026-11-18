"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { THEME_COOKIE, type ThemePref } from "@/lib/theme";

type Ctx = { pref: ThemePref; setPref: (p: ThemePref) => void; resolved: () => "light" | "dark" };
const ThemeCtx = createContext<Ctx | null>(null);

export function useTheme() {
  const c = useContext(ThemeCtx);
  if (!c) throw new Error("useTheme ausserhalb von ThemeProvider");
  return c;
}

/**
 * Die Wahl liegt im Cookie, der Server setzt data-theme schon im HTML. So blitzt beim Laden nichts auf.
 * "system" setzt kein Attribut, dann gilt prefers-color-scheme.
 */
export function ThemeProvider({ initial, children }: { initial: ThemePref; children: ReactNode }) {
  const [pref, setState] = useState<ThemePref>(initial);

  const setPref = useCallback((p: ThemePref) => {
    setState(p);
    const root = document.documentElement;
    if (p === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", p);
    document.cookie = `${THEME_COOKIE}=${p}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  const resolved = useCallback(() => {
    if (pref !== "system") return pref;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }, [pref]);

  return <ThemeCtx.Provider value={{ pref, setPref, resolved }}>{children}</ThemeCtx.Provider>;
}
