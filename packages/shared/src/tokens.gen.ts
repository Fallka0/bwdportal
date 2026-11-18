// GENERIERT aus handoff/design/tokens.json mit `pnpm tokens`. Nicht von Hand ändern.
export const tokens = {
  "color": {
    "light": {
      "frame": "#0b0b0f",
      "bg": "#f5f5f7",
      "panel": "#ececf0",
      "panel2": "#e3e3e9",
      "raise": "#ffffff",
      "ink": "#0b0b0f",
      "text2": "#55555e",
      "text3": "#6b6b75",
      "rule": "#d4d4db",
      "ruleStrong": "#a9a9b3",
      "btn": "#1f1b3a",
      "btnHover": "#2d2852",
      "btnFg": "#f5f5f7",
      "focus": "#8b5cf6",
      "ok": "#1d6b45",
      "warn": "#8a4b00",
      "err": "#9b1c2e",
      "info": "#4f46b8",
      "live": "#f0a020",
      "now": "#e5484d",
      "scrim": "rgba(11,11,15,0.42)"
    },
    "dark": {
      "frame": "#0b0b0f",
      "bg": "#111115",
      "panel": "#1a1a1f",
      "panel2": "#232329",
      "raise": "#1c1c22",
      "ink": "#f1f1f4",
      "text2": "#a3a3ad",
      "text3": "#8e8e98",
      "rule": "#2a2a31",
      "ruleStrong": "#474750",
      "btn": "#f1f1f4",
      "btnHover": "#ffffff",
      "btnFg": "#0b0b0f",
      "focus": "#8b5cf6",
      "ok": "#8fd8ae",
      "warn": "#ffc45e",
      "err": "#f3a3b0",
      "info": "#a8a2f0",
      "live": "#ffb224",
      "now": "#e5484d",
      "scrim": "rgba(0,0,0,0.66)"
    },
    "sidebar": {
      "bg": "#0b0b0f",
      "active": "#18181d",
      "ink": "#f1f1f4",
      "text2": "#a3a3ad",
      "rule": "#24242a"
    },
    "timetableBlock": {
      "light": {
        "bg": "#1f1b3a",
        "fg": "#f5f5f7"
      },
      "dark": {
        "bg": "#e9e8f2",
        "fg": "#0b0b0f"
      },
      "changedText": {
        "light": "#f0a020",
        "dark": "#8a4b00"
      }
    }
  },
  "font": {
    "display": "Unbounded (300, 400)",
    "body": "Manrope (400, 500, 600, 700)",
    "displayTracking": "-0.045em",
    "numbers": "tabular-nums"
  },
  "fontSize": {
    "micro": 10,
    "xs": 11,
    "s": 12,
    "m": 13,
    "base": 14,
    "l": 15,
    "xl": 16,
    "h3": 18,
    "h2": 22,
    "kpi": 32,
    "h1Web": 38,
    "h1App": 26
  },
  "radius": {
    "xs": 4,
    "s": 6,
    "m": 10,
    "l": 14,
    "xl": 18,
    "xxl": 24,
    "pill": 999,
    "sheet": 28,
    "phone": 36
  },
  "space": [
    2,
    4,
    6,
    8,
    10,
    12,
    14,
    16,
    20,
    24,
    32,
    40
  ],
  "size": {
    "button": 44,
    "buttonSmall": 36,
    "iconButton": 40,
    "touchMin": 44,
    "icon": 18,
    "iconSmall": 15,
    "sidebar": 248,
    "sidebarRail": 72,
    "tabBar": 64
  },
  "motion": {
    "fast": "80ms",
    "base": "120ms",
    "ease": "cubic-bezier(.22,1,.36,1)",
    "rule": "Nur Farbe, Deckkraft und transform animieren. prefers-reduced-motion schaltet alles ab."
  },
  "breakpoints": {
    "app": "< 600 (Tab-Bar)",
    "rail": "600 bis 900 (Icon-Leiste)",
    "full": "> 900 (Sidebar 248)"
  },
  "timeGrid": {
    "pxPerMinute": 1.1,
    "start": "08:00",
    "hourRow": 66,
    "axisWidthWeb": 52,
    "axisWidthApp": 40
  }
} as const;
