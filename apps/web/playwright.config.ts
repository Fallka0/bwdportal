import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PORT ?? 3100);
/** BASE_URL testet ein Deployment (z. B. https://bwdportal.planary.ch), sonst lokal. */
const baseURL = process.env.BASE_URL ?? `http://localhost:${port}`;

/** Wichtigste Wege im Web. Läuft gegen `next dev` mit lokalem D1 (pnpm db:reset vorher). */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  // Gegen ein Deployment (Netz) und in CI ein zweiter Versuch, lokal keiner.
  retries: process.env.CI || process.env.BASE_URL ? 1 : 0,
  use: { baseURL, trace: "retain-on-failure", locale: "de-CH", timezoneId: "Europe/Zurich" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: process.env.BASE_URL ? undefined : { command: `pnpm dev --port ${port}`, port, reuseExistingServer: true, timeout: 180_000 },
});
