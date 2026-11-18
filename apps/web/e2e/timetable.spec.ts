import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test.beforeEach(async ({ page }) => login(page));

test("Woche 44 mit Raumänderung, Ausfall, SOL-Tag und Jetzt-Linie", async ({ page }) => {
  await page.goto("/stundenplan");
  await expect(page.locator("#tt-title")).toHaveText("26. bis 30. Oktober");
  await expect(page.getByRole("listitem", { name: /Wirtschaft und Recht, Raumänderung: B 015 statt A 207, 10:45/ })).toBeVisible();
  await expect(page.getByRole("listitem", { name: /Deutsch, entfällt/ })).toBeVisible();
  await expect(page.getByRole("listitem", { name: /SOL-Tag, Lernzone, 08:00 bis 12:00/ })).toBeVisible();
  await expect(page.getByRole("note", { name: "Jetzt 10:20" })).toBeVisible();
});

test("Tag: heute, weiter zum Dienstag, zurück zu heute", async ({ page }) => {
  await page.goto("/stundenplan?ansicht=tag");
  await expect(page.locator("#tt-title")).toHaveText("Heute");
  await page.getByRole("link", { name: "Nächster Tag" }).click();
  await expect(page.locator("#tt-title")).toHaveText("Dienstag");
  await expect(page.getByRole("note", { name: /Jetzt/ })).toHaveCount(0);
  await page.getByRole("link", { name: "Zu heute" }).click();
  await expect(page.locator("#tt-title")).toHaveText("Heute");
});

test("Vorherige Woche ohne Sonderfälle", async ({ page }) => {
  await page.goto("/stundenplan");
  await page.getByRole("link", { name: "Vorherige Woche" }).click();
  await expect(page.locator("#tt-title")).toHaveText("19. bis 23. Oktober");
  await expect(page.getByRole("listitem", { name: /Raumänderung/ })).toHaveCount(0);
});
