"use client";

import { useTheme } from "@/components/ThemeProvider";
import { Icon } from "@/components/ui";

/** Schnellschalter hell/dunkel in der Kopfzeile. Die Wahl wird auch im Profil gespeichert. */
export function ThemeToggle() {
  const { resolved, setPref } = useTheme();
  return (
    <button
      type="button"
      className="ib theme-t"
      aria-label="Design wechseln"
      title="Design wechseln"
      onClick={() => {
        const next = resolved() === "dark" ? "light" : "dark";
        setPref(next);
        fetch("/api/v1/me/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ theme: next }) }).catch(() => {});
      }}
    >
      <span className="theme-moon">
        <Icon name="moon" />
      </span>
      <span className="theme-sun">
        <Icon name="sun" />
      </span>
    </button>
  );
}
