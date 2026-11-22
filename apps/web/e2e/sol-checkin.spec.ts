import { expect, test } from "@playwright/test";
import { login, resetDemo } from "./helpers";

test("Check-in: Lehrperson sieht, dass heute kein SOL-Tag ist", async ({ page }) => {
  await login(page, "Regula Keller");
  await page.goto("/klassen/IM24b/sol");
  await page.getByRole("link", { name: "Check-in" }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Check-in IM24b");
  await expect(page.locator("main")).toContainText("Heute ist kein SOL-Tag. Nächster SOL-Tag: Freitag, 30. Oktober.");
});

test("Check-in: Scan ohne Anmeldung führt nach dem Login zurück zum Code", async ({ page }) => {
  await resetDemo(page);
  await page.goto("/api/v1/sol/scan?c=abc123");
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole("button", { name: "Demo-Konto wählen" }).click();
  await page.getByRole("dialog", { name: "Demo-Konto wählen" }).getByRole("button", { name: /Selin Hofer/ }).click();
  await expect(page).toHaveURL(/\/sol\/checkin\?c=abc123$/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Check-in");
  await expect(page.locator("main")).toContainText("abgelaufen");
  // Das Ziel gilt nur einmal: die Übersicht bleibt danach die Übersicht
  await page.goto("/");
  await expect(page).toHaveURL("/");
  // Angemeldet geht der Scan direkt zur Bestätigung
  await page.goto("/api/v1/sol/scan?c=abc123");
  await expect(page).toHaveURL(/\/sol\/checkin\?c=abc123$/);
});
