import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PORT ?? 3100);

/** Wichtigste Wege im Web. Läuft gegen `next dev` mit lokalem D1 (pnpm db:reset vorher). */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: `http://localhost:${port}`, trace: "retain-on-failure", locale: "de-CH", timezoneId: "Europe/Zurich" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: { command: `pnpm dev --port ${port}`, port, reuseExistingServer: true, timeout: 180_000 },
});
