import raw from "../../../config/portal.json";

/** Konfiguration der Schule aus config/portal.json. Adressen nie im Code, immer von hier. */
export const config = raw as {
  portalUrl: string;
  school: { name: string; website: string; emailDomain: string; emailPattern: string };
  services: { webuntis: string; moodle: string; sharepointSol: string; mediothek: string; teams: string; outlook: string; onedrive: string; onenote: string; absenzendatenbank?: string };
  periods: { n: number; from: string; to: string }[];
  lunch: { from: string; to: string };
  solLunch: { from: string; to: string };
  timeGridEnd: string;
  homeGridEnd: string;
  /** Kontingent: Lektionen, die pro Semester ohne Dispensation fehlen dürfen */
  absenceContingent: { lessons: number; per: "semester" };
  /** true, sobald die Schule Abmeldungen und Gesuche im Portal entgegennimmt; bis dahin Hinweis auf die Absenzendatenbank */
  absenceSystem: { connected: boolean };
  secondSemesterStart: string;
};
