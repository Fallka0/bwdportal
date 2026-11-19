/*
 * Service Worker des bwd Portals.
 * Speichert nur statische Dateien (Skripte, Schriften, Icons) und die Offline-Seite.
 * Seiten und API-Antworten werden bewusst NICHT gespeichert: sie enthalten persönliche Daten.
 * Ohne Verbindung zeigt eine Navigation die Offline-Seite.
 */
const VERSION = "v2";
const STATIC = `bwd-static-${VERSION}`;
const OFFLINE = "/offline.html";
const PRECACHE = ["/icon.svg", "/icons/icon-192.png", "/fonts/unbounded-latin-wght.woff2", "/fonts/manrope-latin-wght.woff2"];

/**
 * Die Offline-Seite kann vom Hosting umgeleitet werden (/offline.html → /offline).
 * Browser lehnen umgeleitete Antworten für Navigationen ab, darum eine frische Kopie ohne Umleitung speichern.
 */
async function cacheOfflinePage(cache) {
  const res = await fetch(OFFLINE, { cache: "reload" });
  if (!res.ok) throw new Error("Offline-Seite nicht erreichbar");
  const body = await res.blob();
  await cache.put(OFFLINE, new Response(body, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } }));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC)
      .then((c) => Promise.all([c.addAll(PRECACHE), cacheOfflinePage(c)]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("bwd-") && k !== STATIC).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Seiten: immer vom Netz, ohne Verbindung die Offline-Seite.
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(async () => (await caches.match(OFFLINE)) ?? Response.error()));
    return;
  }

  // Unveränderliche Build-Dateien und Schriften: aus dem Speicher, sonst holen und merken.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/fonts/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.open(STATIC).then(async (c) => {
        const hit = await c.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) c.put(req, res.clone());
        return res;
      }),
    );
  }
  // Alles andere (API, Dateien mit Daten) geht unverändert ans Netz.
});
