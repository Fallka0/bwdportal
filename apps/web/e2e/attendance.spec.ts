import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("Präsenz: Lehrperson erfasst eine Doppellektion, die Lernende sieht die Absenz", async ({ page }) => {
  await login(page, "Regula Keller");
  const today = page.getByRole("region", { name: "Präsenz heute" });
  await expect(today).toContainText("Mathematik · IM24b");
  await expect(today).toContainText("Offen");
  await today.getByRole("link", { name: /Mathematik · IM24b/ }).click();

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mathematik IM24b");
  await expect(page.locator(".ph-sub")).toContainText("1. und 2. Lektion");
  await expect(page.getByRole("heading", { name: "2 von 2 anwesend" })).toBeVisible();
  await page.getByRole("group", { name: "Mia Steiner" }).getByRole("button", { name: "Abwesend" }).click();
  await expect(page.getByRole("heading", { name: "1 von 2 anwesend" })).toBeVisible();
  await page.getByRole("button", { name: "Präsenz speichern" }).click();

  await expect(page).toHaveURL("/praesenz");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Präsenz");
  await expect(page.locator("main")).toContainText("1 fehlt");

  // Klasse: Klassenlehrperson sieht die Absenzen
  await page.goto("/klassen/IM24b");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("IM24b");
  await expect(page.locator("main")).toContainText("Mia Steiner");
  await expect(page.locator("main")).toContainText("Lektionen gefehlt");

  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByRole("button", { name: "Demo-Konto wählen" }).click();
  await page.getByRole("dialog", { name: "Demo-Konto wählen" }).getByRole("button", { name: /Mia Steiner/ }).click();
  await expect(page).toHaveURL("/", { timeout: 15_000 });
  await page.goto("/benachrichtigungen");
  await expect(page.locator("main")).toContainText("Absenz erfasst: Mathematik");
  await page.goto("/absenzen");
  await expect(page.locator("main")).toContainText("Mathematik");
  // Präsenz und Klassen sind nur für Lehrpersonen
  await page.goto("/praesenz");
  await expect(page).toHaveURL("/");
  await page.goto("/klassen");
  await expect(page).toHaveURL("/");
});
