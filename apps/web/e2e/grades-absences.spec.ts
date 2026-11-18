import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test.beforeEach(async ({ page }) => login(page));

test("Note ansehen: von der Übersicht zur Mathematik-Note", async ({ page }) => {
  await page.getByRole("link", { name: /Mathematik.*Funktionen/ }).click();
  await expect(page).toHaveURL("/noten/MA");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mathematik");
  await expect(page.getByText("Funktionen")).toBeVisible();
  await expect(page.getByText("Klasse 4.4").first()).toBeVisible();

  await page.goto("/noten");
  await expect(page.getByText("4.9")).toBeVisible();
  await page.getByRole("link", { name: /Naturwissenschaften/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Naturwissenschaften");

  await page.goto("/noten?semester=2");
  await expect(page.getByText("Noch keine Noten im 2. Semester.")).toBeVisible();
  await page.getByRole("link", { name: "1. Semester ansehen" }).click();
  await expect(page).toHaveURL("/noten");
});

test("Absenz entschuldigen mit Bestätigung: Status In Prüfung, Toast", async ({ page }) => {
  await page.getByRole("link", { name: "Entschuldigen" }).first().click();
  await expect(page).toHaveURL(/entschuldigen=a-1/);
  const dlg = page.getByRole("dialog", { name: "Absenz entschuldigen" });
  await expect(dlg).toBeVisible();
  await expect(dlg.getByText("Do, 22. Oktober 2026")).toBeVisible();
  await expect(dlg.getByRole("button", { name: /1\. Lektion/ })).toHaveAttribute("aria-pressed", "true");
  await dlg.getByRole("button", { name: "Arzt", exact: true }).click();
  await dlg.locator('input[type="file"]').setInputFiles("e2e/files/arztzeugnis.pdf");
  await expect(dlg.getByText("arztzeugnis.pdf")).toBeVisible();
  await dlg.getByRole("button", { name: "2 Lektionen entschuldigen" }).click();

  await expect(page.getByRole("status").filter({ hasText: "Absenz gesendet. Deine Klassenlehrperson prüft sie." })).toBeVisible();
  await expect(dlg).toBeHidden();
  await expect(page.getByText("In Prüfung").filter({ visible: true })).toHaveCount(1);
  await expect(page.getByRole("link", { name: /^Absenz vom .* entschuldigen$/ })).toHaveCount(1);
});

test("Absenz melden: Lektionen wählen ist Pflicht", async ({ page }) => {
  await page.goto("/absenzen");
  await page.getByRole("link", { name: "Absenz melden" }).first().click();
  const dlg = page.getByRole("dialog", { name: "Absenz entschuldigen" });
  await expect(dlg.getByRole("button", { name: "0 Lektionen entschuldigen" })).toBeDisabled();
  await dlg.getByRole("button", { name: /3\. Lektion/ }).click();
  await dlg.getByRole("button", { name: "1 Lektion entschuldigen" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Absenz gesendet" })).toBeVisible();
  await expect(page.getByText("1 Lektion · Englisch").filter({ visible: true })).toHaveCount(2);
});
