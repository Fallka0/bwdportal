/**
 * iCalendar (RFC 5545) für das Kalender-Abo. Zeiten als Wandzeit mit TZID Europe/Zurich,
 * dazu die Zeitzonen-Definition, damit Kalender Sommer- und Winterzeit richtig rechnen.
 */

export type IcsEvent = {
  uid: string;
  summary: string;
  /** "YYYY-MM-DD" für ganztägig, sonst mit Start- und Endzeit "HH:MM" */
  date: string;
  start?: string;
  end?: string;
  location?: string | null;
  description?: string | null;
  cancelled?: boolean;
};

/** Text maskieren: Backslash, Komma, Strichpunkt, Zeilenumbruch. */
export function icsEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Zeilen über 75 Bytes umbrechen (Fortsetzung beginnt mit Leerzeichen). */
export function icsFold(line: string): string {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const out: string[] = [];
  let cur = "";
  for (const ch of line) {
    const limit = out.length ? 74 : 75;
    if (enc.encode(cur + ch).length > limit) {
      out.push(cur);
      cur = ch;
    } else cur += ch;
  }
  out.push(cur);
  return out.map((l, i) => (i ? ` ${l}` : l)).join("\r\n");
}

const d8 = (date: string) => date.replace(/-/g, "");
const t6 = (time: string) => `${time.replace(":", "")}00`;

function nextDay(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const x = new Date(Date.UTC(y!, m! - 1, d! + 1));
  return x.toISOString().slice(0, 10);
}

const VTIMEZONE = [
  "BEGIN:VTIMEZONE",
  "TZID:Europe/Zurich",
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:+0100",
  "TZOFFSETTO:+0200",
  "TZNAME:CEST",
  "DTSTART:19700329T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:+0200",
  "TZOFFSETTO:+0100",
  "TZNAME:CET",
  "DTSTART:19701025T030000",
  "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
];

/** Ganzes Kalender-Dokument. `stamp` ist der Erstellzeitpunkt in UTC (YYYYMMDDTHHMMSSZ). */
export function buildIcs(o: { name: string; events: IcsEvent[]; stamp: string }): string {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//bwd Portal//Schulprojekt//DE", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${icsEscape(o.name)}`, "X-WR-TIMEZONE:Europe/Zurich", "REFRESH-INTERVAL;VALUE=DURATION:PT1H", "X-PUBLISHED-TTL:PT1H", ...VTIMEZONE];
  for (const e of o.events) {
    lines.push("BEGIN:VEVENT", `UID:${e.uid}`, `DTSTAMP:${o.stamp}`);
    if (e.start && e.end) {
      lines.push(`DTSTART;TZID=Europe/Zurich:${d8(e.date)}T${t6(e.start)}`, `DTEND;TZID=Europe/Zurich:${d8(e.date)}T${t6(e.end)}`);
    } else {
      lines.push(`DTSTART;VALUE=DATE:${d8(e.date)}`, `DTEND;VALUE=DATE:${d8(nextDay(e.date))}`, "TRANSP:TRANSPARENT");
    }
    lines.push(`SUMMARY:${icsEscape(e.summary)}`);
    if (e.location) lines.push(`LOCATION:${icsEscape(e.location)}`);
    if (e.description) lines.push(`DESCRIPTION:${icsEscape(e.description)}`);
    if (e.cancelled) lines.push("STATUS:CANCELLED");
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(icsFold).join("\r\n") + "\r\n";
}
