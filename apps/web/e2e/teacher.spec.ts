import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("Lehrperson: eigene Übersicht, Stundenplan mit Klasse, keine Bereiche der Lernenden", async ({ page, isMobile }) => {
  await login(page, "Regula Keller");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Regula\./);
  await expect(page.locator(".hi p")).toContainText("Lehrperson");

  const classes = page.getByRole("region", { name: "Meine Klassen" });
  await expect(classes).toContainText("IM24b");
  await expect(classes).toContainText("Mathematik");
  await expect(classes).toContainText("Klassenlehrperson");

  // Navigation ohne Noten, SOL, Absenzen
  const nav = isMobile ? page.getByRole("navigation", { name: "Hauptnavigation" }) : page.getByRole("complementary", { name: "Navigation" });
  await expect(nav.getByRole("link", { name: "Stundenplan" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Noten" })).toHaveCount(0);

  // Stundenplan: nur Mathematik, mit Klasse
  await page.goto("/stundenplan?ansicht=woche&datum=2026-10-26");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Stundenplan");
  await expect(page.locator("main")).toContainText("IM24b");
  await expect(page.locator("main")).not.toContainText("Deutsch");

  // Bereiche der Lernenden leiten zur Übersicht
  for (const path of ["/noten", "/sol", "/absenzen"]) {
    await page.goto(path);
    await expect(page).toHaveURL("/");
  }

  await page.goto("/profil");
  await expect(page.locator("main")).toContainText("Mathematik IM24b");
});
