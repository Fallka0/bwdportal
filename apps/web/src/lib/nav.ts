import type { IconName } from "@bwd/shared/icons";

export type NavItem = { href: string; label: string; icon: IconName; count?: "notifications" };

export const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "Schule",
    items: [
      { href: "/", label: "Übersicht", icon: "home" },
      { href: "/stundenplan", label: "Stundenplan", icon: "cal" },
      { href: "/noten", label: "Noten", icon: "chart" },
      { href: "/pruefungen", label: "Prüfungen", icon: "note" },
      { href: "/sol", label: "SOL", icon: "book" },
      { href: "/absenzen", label: "Absenzen", icon: "clock" },
    ],
  },
  {
    group: "Infos",
    items: [
      { href: "/mitteilungen", label: "Mitteilungen", icon: "megaphone" },
      { href: "/dokumente", label: "Dokumente", icon: "folder" },
      { href: "/links", label: "Links", icon: "grid4" },
      { href: "/benachrichtigungen", label: "Benachrichtigungen", icon: "bell", count: "notifications" },
    ],
  },
];

/** Lehrpersonen: ohne Noten, SOL und Absenzen der Lernenden. */
export const TEACHER_NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "Schule",
    items: [
      { href: "/", label: "Übersicht", icon: "home" },
      { href: "/stundenplan", label: "Stundenplan", icon: "cal" },
      { href: "/praesenz", label: "Präsenz", icon: "check" },
      { href: "/klassen", label: "Klassen", icon: "users" },
      { href: "/pruefungen", label: "Prüfungen", icon: "note" },
    ],
  },
  NAV[1]!,
];

export const TEACHER_TABS: NavItem[] = [
  { href: "/", label: "Übersicht", icon: "home" },
  { href: "/stundenplan", label: "Stundenplan", icon: "cal" },
  { href: "/praesenz", label: "Präsenz", icon: "check" },
  { href: "/mehr", label: "Mehr", icon: "grid4" },
];

/** Nur für Lernende; Lehrpersonen werden zur Übersicht geleitet. */
export const STUDENT_ONLY = ["/noten", "/sol", "/absenzen"];

/** Zeile unter dem Namen: Klasse oder "Lehrperson". */
export const roleLine = (me: { role: "student" | "teacher"; classCode: string }) => (me.role === "teacher" ? "Lehrperson" : me.classCode);

export const TABS: NavItem[] = [
  { href: "/", label: "Übersicht", icon: "home" },
  { href: "/stundenplan", label: "Stundenplan", icon: "cal" },
  { href: "/noten", label: "Noten", icon: "chart" },
  { href: "/mehr", label: "Mehr", icon: "grid4" },
];

/** Bereiche, die in der App unter "Mehr" liegen. */
export const IN_MORE = ["/mehr", "/klassen", "/pruefungen", "/sol", "/absenzen", "/mitteilungen", "/dokumente", "/links", "/benachrichtigungen", "/profil", "/suche"];

export function isActive(href: string, path: string): boolean {
  if (href === "/") return path === "/";
  if (href === "/mehr") return IN_MORE.some((p) => path === p || path.startsWith(p + "/"));
  return path === href || path.startsWith(href + "/");
}

/** Zurück-Ziel in der mobilen Kopfzeile. Hauptseiten haben das Logo. */
export function backTarget(path: string): { href: string; label: string } | null {
  if (/^\/noten\/.+/.test(path)) return { href: "/noten", label: "Noten" };
  if (/^\/mitteilungen\/.+/.test(path)) return { href: "/mitteilungen", label: "Mitteilungen" };
  if (/^\/praesenz\/.+/.test(path)) return { href: "/praesenz", label: "Präsenz" };
  if (/^\/klassen\/.+/.test(path)) return { href: "/klassen", label: "Klassen" };
  if (["/", "/stundenplan", "/noten", "/praesenz", "/mehr"].includes(path)) return null;
  if (IN_MORE.some((p) => path === p)) return { href: "/mehr", label: "Mehr" };
  return { href: "/", label: "Übersicht" };
}
