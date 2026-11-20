import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("Prüfungen: Lernende sehen Klassenprüfung, erfassen, ändern und löschen eine eigene", async ({ page }) => {
  await login(page);
  const card = page.getByRole("region", { name: "Prüfungen" });
  await expect(card).toContainText("Lineare Funktionen");

  await page.goto("/pruefungen");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Prüfungen");
  await expect(page).toHaveTitle("Prüfungen · bwd Portal");
  const main = page.locator("main");
  await expect(main).toContainText("Mathematik · Lineare Funktionen");
  await expect(main).toContainText("IM24b · Regula Keller");
  await expect(main).toContainText("Eigene Prüfung");
  // Klassenprüfung der Lehrperson: nicht bearbeitbar
  await expect(page.getByRole("link", { name: "Lineare Funktionen bearbeiten" })).toHaveCount(0);

  await page.goto("/pruefungen?neu=1");
  const dlg = page.getByRole("dialog", { name: "Neue Prüfung" });
  await dlg.getByLabel("Fach").selectOption({ label: "Französisch" });
  await dlg.getByLabel("Datum").fill("2026-11-12");
  await dlg.getByLabel("Titel").fill("Passé composé");
  await dlg.getByLabel("Beschreibung").fill("Unité 4");
  await dlg.getByRole("button", { name: "Prüfung speichern" }).click();
  await expect(dlg).toHaveCount(0);
  await expect(main).toContainText("Französisch · Passé composé");
  await expect(main).toContainText("Unité 4");

  await page.getByRole("link", { name: "Passé composé bearbeiten" }).click();
  const edit = page.getByRole("dialog", { name: "Prüfung bearbeiten" });
  await edit.getByLabel("Titel").fill("Passé composé und Imparfait");
  await edit.getByRole("button", { name: "Prüfung speichern" }).click();
  await expect(main).toContainText("Passé composé und Imparfait");

  await page.getByRole("link", { name: "Passé composé und Imparfait bearbeiten" }).click();
  await page.getByRole("button", { name: "Löschen" }).click();
  await page.getByRole("button", { name: "Prüfung wirklich löschen" }).click();
  await expect(main).not.toContainText("Imparfait");
});

test("Prüfungen: Lehrperson erfasst für ihre Klasse, Lernende sehen sie im Stundenplan", async ({ page }) => {
  await login(page, "Regula Keller");
  await page.goto("/pruefungen?neu=1");
  const dlg = page.getByRole("dialog", { name: "Neue Prüfung" });
  await expect(dlg.getByLabel("Klasse und Fach")).toHaveValue("IM24b|MA");
  await dlg.getByLabel("Datum").fill("2026-11-02");
  await dlg.getByLabel("Titel").fill("Geometrie");
  await dlg.getByRole("button", { name: "Prüfung speichern" }).click();
  await expect(page.locator("main")).toContainText("Mathematik · Geometrie");
  // Eigene Prüfungen der Lernenden sieht sie nicht
  await expect(page.locator("main")).not.toContainText("Vocabulary");

  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByRole("button", { name: "Demo-Konto wählen" }).click();
  await page.getByRole("dialog", { name: "Demo-Konto wählen" }).getByRole("button", { name: /Mia Steiner/ }).click();
  await expect(page).toHaveURL("/", { timeout: 15_000 });
  await page.goto("/pruefungen");
  await expect(page.locator("main")).toContainText("Mathematik · Geometrie");
  await page.goto("/benachrichtigungen");
  await expect(page.locator("main")).toContainText("Neue Prüfung in Mathematik");
  await page.goto("/stundenplan?ansicht=woche&datum=2026-11-02");
  await expect(page.locator("main")).toContainText("Prüfung");
});
