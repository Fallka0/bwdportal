import "server-only";

/** Adresse des Abos. https zum Kopieren, webcal zum direkten Öffnen in der Kalender-App. */
export function calendarUrls(origin: string, token: string) {
  const https = `${origin}/api/v1/calendar/${token}.ics`;
  return { url: https, webcal: https.replace(/^https?:/, "webcal:") };
}
