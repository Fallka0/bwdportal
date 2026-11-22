import { expect, test } from "@playwright/test";
import { login } from "./helpers";

const pdf = Buffer.from("%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n");

test("Klassenraum: Lehrperson schreibt mit Datei, Lernende lesen und laden herunter", async ({ page }) => {
  await login(page, "Regula Keller");
  await page.goto("/klassen/IM24b");
  await page.getByRole("link", { name: "Klassenraum" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Klassenraum IM24b");

  const box = page.getByRole("region", { name: "Neuer Beitrag" });
  await box.getByLabel("Für").selectOption({ label: "Mathematik" });
  await box.getByLabel("Beitrag").fill("Bitte bis Donnerstag lösen.\nSeite 12 bis 14.");
  await box.locator('input[type="file"]').setInputFiles({ name: "Aufgaben Kapitel 4.pdf", mimeType: "application/pdf", buffer: pdf });
  await expect(box).toContainText("Aufgaben Kapitel 4.pdf");
  await box.getByRole("button", { name: "Senden" }).click();
  const post = page.getByRole("region", { name: "Beitrag von Regula Keller" });
  await expect(post).toContainText("Bitte bis Donnerstag lösen.");
  await expect(post).toContainText("Mathematik");
  await expect(post.getByRole("link", { name: /Aufgaben Kapitel 4\.pdf/ })).toBeVisible();

  await page.getByRole("button", { name: "Hochladen" }).click();
  const dlg = page.getByRole("dialog", { name: "Datei hochladen" });
  await dlg.getByLabel("Datei").setInputFiles({ name: "Notenskala.pdf", mimeType: "application/pdf", buffer: pdf });
  await dlg.getByRole("button", { name: "Hochladen" }).click();
  await expect(page.getByRole("region", { name: "Dateien" })).toContainText("Notenskala.pdf");

  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByRole("button", { name: "Demo-Konto wählen" }).click();
  await page.getByRole("dialog", { name: "Demo-Konto wählen" }).getByRole("button", { name: /Mia Steiner/ }).click();
  await expect(page).toHaveURL("/", { timeout: 15_000 });
  await page.goto("/klassenraum");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Klassenraum");
  await expect(page.locator("main")).toContainText("Bitte bis Donnerstag lösen.");
  await expect(page.getByRole("region", { name: "Neuer Beitrag" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Beitrag löschen" })).toHaveCount(0);
  const href = await page.getByRole("link", { name: /Notenskala\.pdf/ }).getAttribute("href");
  const res = await page.request.get(href!);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-disposition"]).toContain("Notenskala.pdf");
  await page.goto("/benachrichtigungen");
  await expect(page.locator("main")).toContainText("Klassenraum: Mathematik");
});
