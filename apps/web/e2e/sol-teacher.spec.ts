import { expect, test } from "@playwright/test";
import { login } from "./helpers";

const pdf = Buffer.from("%PDF-1.4\n%%EOF\n");

test("SOL: Lehrperson legt einen Auftrag mit Lösung an, Lernende sehen ihn", async ({ page }) => {
  await login(page, "Regula Keller");
  await page.goto("/klassen/IM24b");
  await page.getByRole("link", { name: "SOL", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("SOL IM24b");

  const ma = page.getByRole("region", { name: "Mathematik" });
  await expect(ma.getByRole("table")).toContainText("Selin Hofer");
  await ma.getByRole("button", { name: "Neuer Auftrag" }).click();
  const dlg = page.getByRole("dialog", { name: "Neuer Auftrag" });
  await dlg.getByLabel("Kürzel").fill("M9");
  await dlg.getByLabel("Titel").fill("Wahrscheinlichkeit");
  await dlg.getByRole("button", { name: "Speichern" }).click();
  await expect(ma).toContainText("M9 · Wahrscheinlichkeit");
  await expect(ma).toContainText("0 erledigt · 0 angefangen · 2 offen");

  await ma.getByRole("button", { name: "Datei zu M9 hochladen" }).click();
  const up = page.getByRole("dialog", { name: "Datei zu M9" });
  await up.getByLabel("Art").selectOption({ label: "Lösung" });
  await up.getByLabel("Datei").setInputFiles({ name: "Lösungen M9.pdf", mimeType: "application/pdf", buffer: pdf });
  await up.getByRole("button", { name: "Hochladen" }).click();
  await expect(ma).toContainText("Lösungen M9");
  await expect(ma).toContainText("Lösung · PDF");

  // Andere Fächer: nur ansehen
  await expect(page.getByRole("region", { name: "Deutsch" }).getByRole("button", { name: "Neuer Auftrag" })).toHaveCount(0);

  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByRole("button", { name: "Demo-Konto wählen" }).click();
  await page.getByRole("dialog", { name: "Demo-Konto wählen" }).getByRole("button", { name: /Selin Hofer/ }).click();
  await expect(page).toHaveURL("/", { timeout: 15_000 });
  await page.goto("/sol");
  await expect(page.locator("main")).toContainText("Wahrscheinlichkeit");
  await page.goto("/klassen/IM24b/sol");
  await expect(page).toHaveURL("/");
});
