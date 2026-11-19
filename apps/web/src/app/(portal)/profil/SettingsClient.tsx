"use client";

import { useState } from "react";
import type { Settings } from "@bwd/shared";
import { useTheme } from "@/components/ThemeProvider";
import { Segment, Switch } from "@/components/ui";
import type { ThemePref } from "@/lib/theme";

const ROWS: { key: keyof Omit<Settings, "theme">; title: string; sub?: string }[] = [
  { key: "nTimetable", title: "Stundenplanänderungen", sub: "Ausfälle und Raumänderungen" },
  { key: "nGrades", title: "Neue Noten" },
  { key: "nNews", title: "Mitteilungen" },
  { key: "nAbsences", title: "Absenzen", sub: "Erinnerung vor Ablauf der Frist" },
  { key: "nEmail", title: "Zusätzlich per E-Mail" },
];

async function patch(body: Partial<Settings>) {
  const r = await fetch("/api/v1/me/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
  return !!r?.ok;
}

export function NotificationSettings({ initial }: { initial: Settings }) {
  const [s, setS] = useState(initial);
  return (
    <div>
      {ROWS.map((r) => (
        <div key={r.key} className="st">
          <span>
            <b>{r.title}</b>
            {r.sub && <span className="s">{r.sub}</span>}
          </span>
          <Switch
            label={r.title}
            checked={s[r.key]}
            onChange={async (v) => {
              setS((x) => ({ ...x, [r.key]: v }));
              if (!(await patch({ [r.key]: v }))) setS((x) => ({ ...x, [r.key]: !v }));
            }}
          />
        </div>
      ))}
    </div>
  );
}

/** Design: System, Hell, Dunkel. Wirkt sofort und wird im Konto gespeichert. */
export function ThemeSetting() {
  const { pref, setPref } = useTheme();
  return (
    <div className="st">
      <span>
        <b>Design</b>
      </span>
      <Segment<ThemePref>
        label="Design"
        value={pref}
        onChange={(v) => {
          setPref(v);
          void patch({ theme: v });
        }}
        options={[
          { value: "system", label: "System" },
          { value: "light", label: "Hell" },
          { value: "dark", label: "Dunkel" },
        ]}
      />
    </div>
  );
}
