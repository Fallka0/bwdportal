import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test.beforeEach(async ({ page }) => login(page));

test("Mitteilung lesen markiert sie als gelesen, Anhang lädt", async ({ page }) => {
  await page.goto("/mitteilungen");
  await expect(page.locator(".nw.unread")).toHaveCount(2);
  await page.getByRole("link", { name: /Prüfungsplan 1. Semester ist online/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Prüfungsplan 1. Semester ist online");
  const pdf = await page.request.get(await page.getByRole("link", { name: /herunterladen/ }).getAttribute("href") ?? "");
  expect(pdf.headers()["content-type"]).toBe("application/pdf");
  await page.goto("/mitteilungen");
  await expect(page.locator(".nw.unread")).toHaveCount(1);
});

test("Dokumente: Suche, Filter, leer, zurücksetzen", async ({ page }) => {
  await page.goto("/dokumente");
  await expect(page.locator(".dl")).toHaveCount(10);
  await page.getByRole("navigation", { name: "Kategorie" }).getByRole("link", { name: /Formulare/ }).click();
  await expect(page.locator(".dl")).toHaveCount(3);
  await page.goto("/dokumente");
  await page.getByLabel("Dokumente suchen").fill("reglement");
  await expect(page.locator(".dl")).toHaveCount(2);
  await page.getByLabel("Dokumente suchen").fill("Zeugnis xy");
  await expect(page.getByText("Kein Dokument für «Zeugnis xy».")).toBeVisible();
  await page.getByRole("link", { name: "Suche zurücksetzen" }).click();
  await expect(page.locator(".dl")).toHaveCount(10);
});

test("Benachrichtigungen: eine öffnen, dann alle als gelesen", async ({ page }) => {
  await page.goto("/benachrichtigungen");
  await expect(page.locator(".nt.unread")).toHaveCount(3);
  await page.getByRole("button", { name: /Neue Note in Englisch/ }).click();
  await expect(page).toHaveURL("/noten/EN");
  await page.goto("/benachrichtigungen");
  await expect(page.locator(".nt.unread")).toHaveCount(2);
  await page.getByRole("button", { name: "Alle als gelesen markieren" }).click();
  await expect(page.locator(".nt.unread")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Alle als gelesen markieren" })).toHaveCount(0);
});

test("Profil: Schalter und Design werden gespeichert", async ({ page }) => {
  await page.goto("/profil");
  const mail = page.getByRole("switch", { name: "Zusätzlich per E-Mail" });
  await expect(mail).toHaveAttribute("aria-checked", "false");
  const saved = page.waitForResponse((r) => r.url().endsWith("/api/v1/me/settings") && r.request().method() === "PATCH");
  await mail.click();
  await saved;
  await page.getByRole("group", { name: "Design" }).getByRole("button", { name: "Dunkel" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.getByRole("switch", { name: "Zusätzlich per E-Mail" })).toHaveAttribute("aria-checked", "true");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("Suche findet Fach und Dokument", async ({ page }) => {
  await page.goto("/suche?q=prüfungsplan");
  await expect(page.getByRole("heading", { name: "Dokumente" })).toBeVisible();
  await expect(page.getByText("Prüfungsplan BM-Abschluss 2027")).toBeVisible();
  await page.goto("/suche?q=mathe");
  await page.getByRole("link", { name: /Mathematik/ }).click();
  await expect(page).toHaveURL("/noten/MA");
});

test("Hilfe und Datenschutz ohne Anmeldung", async ({ browser }) => {
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await p.goto("/hilfe");
  await expect(p.getByRole("heading", { level: 1 })).toHaveText("Hilfe bei der Anmeldung");
  await p.goto("/datenschutz");
  await expect(p.getByRole("heading", { level: 1 })).toHaveText("Datenschutz");
  await ctx.close();
});
