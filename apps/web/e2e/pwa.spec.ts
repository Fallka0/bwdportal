import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("Manifest mit Name, Icons und Start-URL", async ({ request }) => {
  const r = await request.get("/manifest.webmanifest");
  expect(r.ok()).toBeTruthy();
  const m = await r.json();
  expect(m).toMatchObject({ name: "bwd Portal", start_url: "/", display: "standalone", lang: "de-CH" });
  expect(m.icons.map((i: { sizes: string }) => i.sizes)).toContain("512x512");
});

test("Service Worker: offline erscheint die Offline-Seite, keine persönlichen Seiten im Speicher", async ({ page, context }) => {
  test.skip(!process.env.BASE_URL, "Service Worker nur im Produktivbuild");
  await login(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // Nach dem ersten Laden übernimmt der Worker; einmal neu laden, damit er die Seite steuert.
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.goto("/noten").catch(() => {});
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Keine Verbindung.");
  const cached = await page.evaluate(async () => {
    const keys = await caches.keys();
    const urls: string[] = [];
    for (const k of keys) for (const r of await (await caches.open(k)).keys()) urls.push(new URL(r.url).pathname);
    return urls;
  });
  expect(cached).toContain("/offline.html");
  expect(cached.some((u) => u === "/noten" || u.startsWith("/api/"))).toBe(false);
  await context.setOffline(false);
});

test("Kalender-Abo: Link im Profil liefert iCalendar", async ({ page }) => {
  await login(page);
  await page.goto("/profil");
  const href = await page.getByRole("link", { name: "Im Kalender öffnen" }).getAttribute("href");
  expect(href).toMatch(/^webcal:\/\/.+\/api\/v1\/calendar\/[0-9a-f]{48}\.ics$/);
  const r = await page.request.get(href!.replace(/^webcal:/, new URL(page.url()).protocol));
  expect(r.headers()["content-type"]).toContain("text/calendar");
  expect(await r.text()).toContain("BEGIN:VCALENDAR");
});
