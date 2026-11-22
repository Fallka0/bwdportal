import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("Noten: Lehrperson legt eine Probe an und benotet, bei der Lernenden zählt nur ihre Note", async ({ page }) => {
  await login(page, "Regula Keller");
  await page.goto("/klassen/IM24b");
  await page.getByRole("region", { name: "Noten" }).getByRole("link", { name: /Mathematik/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mathematik IM24b");
  await expect(page.locator("main")).toContainText("Noch keine Proben im 5. Semester.");

  await page.getByRole("button", { name: "Neue Probe" }).first().click();
  const dlg = page.getByRole("dialog", { name: "Neue Probe" });
  await dlg.getByLabel("Titel").fill("Vektoren");
  await dlg.getByLabel("Datum").fill("2026-10-20");
  await dlg.getByRole("button", { name: "Probe anlegen" }).click();

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Vektoren");
  await page.getByLabel("Selin Hofer").fill("6");
  await page.getByLabel("Mia Steiner").fill("7");
  await expect(page.getByRole("alert").filter({ hasText: "Noten gehen von 1 bis 6." })).toBeVisible();
  await page.getByLabel("Mia Steiner").fill("4,5");
  await page.getByRole("button", { name: "Noten speichern" }).click();

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mathematik IM24b");
  const book = page.getByRole("table");
  await expect(book.getByRole("row", { name: /Selin Hofer/ })).toContainText("6");
  await expect(book.getByRole("row", { name: /Mia Steiner/ })).toContainText("4.5");

  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByRole("button", { name: "Demo-Konto wählen" }).click();
  await page.getByRole("dialog", { name: "Demo-Konto wählen" }).getByRole("button", { name: /Selin Hofer/ }).click();
  await expect(page).toHaveURL("/", { timeout: 15_000 });
  await page.goto("/noten/MA?semester=5");
  const main = page.locator("main");
  await expect(main).toContainText("Vektoren");
  await expect(main).toContainText("Regula Keller");
  await expect(main).toContainText("Eigene Erfassung, zählt nicht");
  await expect(page.getByRole("link", { name: "Vektoren bearbeiten" })).toHaveCount(0);
});
