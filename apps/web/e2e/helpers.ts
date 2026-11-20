import { expect, type Page } from "@playwright/test";

/** Mock-Login als Demo-Konto. */
export async function login(page: Page, name = "Selin Hofer") {
  await resetDemo(page);
  await page.goto("/login");
  await page.getByRole("button", { name: "Demo-Konto wählen" }).click();
  await page.getByRole("dialog", { name: "Demo-Konto wählen" }).getByRole("button", { name: new RegExp(name) }).click();
  // Nach dem Login rendert der Server die Übersicht; ein kalter Start kann einige Sekunden dauern.
  await expect(page).toHaveURL("/", { timeout: 15_000 });
}

/** Setzt die Demo-Daten zurück, damit Tests sich nicht beeinflussen. */
export async function resetDemo(page: Page) {
  const r = await page.request.post("/api/v1/dev/reset");
  expect(r.ok()).toBeTruthy();
}
