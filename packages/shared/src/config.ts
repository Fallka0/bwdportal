import raw from "../../../config/portal.json";

/** Konfiguration der Schule aus config/portal.json. Adressen nie im Code, immer von hier. */
export const config = raw as {
  portalUrl: string;
  school: { name: string; website: string; emailDomain: string; emailPattern: string };
  services: { webuntis: string; moodle: string; sharepointSol: string; mediothek: string; teams: string; outlook: string; onedrive: string; onenote: string };
  periods: { n: number; from: string; to: string }[];
  lunch: { from: string; to: string };
  absenceDeadlineDays: number;
  secondSemesterStart: string;
};
