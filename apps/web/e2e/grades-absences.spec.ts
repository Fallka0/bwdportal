import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test.beforeEach(async ({ page }) => login(page));

test("Note ansehen: von der Übersicht zur Mathematik-Note", async ({ page }) => {
  await page.getByRole("link", { name: /Mathematik.*Funktionen/ }).click();
  await expect(page).toHaveURL(/\/noten\/MA\?semester=5/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mathematik");
  await expect(page.getByText("Funktionen")).toBeVisible();
  await expect(page.getByText("Klasse 4.4").first()).toBeVisible();

  await page.goto("/noten");
  await expect(page.getByText("BM-Schnitt")).toBeVisible();
  await expect(page.getByText("BM auf Kurs")).toBeVisible();
  await page.getByRole("link", { name: /Naturwissenschaften/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Naturwissenschaften");

  await page.goto("/noten?semester=6");
  await expect(page.getByText("Noch keine Noten im 6. Semester.")).toBeVisible();
});

test("Note erfassen, bearbeiten und löschen", async ({ page }) => {
  await page.goto("/noten/MA?semester=5");
  await page.getByRole("link", { name: "Neue Note" }).first().click();
  let dlg = page.getByRole("dialog", { name: "Neue Note" });
  await dlg.getByLabel("Titel").fill("Kurzcheck Vektoren");
  await dlg.getByLabel("Note").fill("5,5");
  await dlg.getByLabel("Gewicht").fill("0.5");
  await dlg.getByRole("button", { name: "Note speichern" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Note gespeichert." })).toBeVisible();
  await expect(page.getByText("Kurzcheck Vektoren")).toBeVisible();

  await page.getByRole("link", { name: "Kurzcheck Vektoren bearbeiten" }).click();
  dlg = page.getByRole("dialog", { name: "Note bearbeiten" });
  await dlg.getByLabel("Note").fill("6");
  await dlg.getByRole("button", { name: "Note speichern" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Note geändert." })).toBeVisible();

  await page.getByRole("link", { name: "Kurzcheck Vektoren bearbeiten" }).click();
  dlg = page.getByRole("dialog", { name: "Note bearbeiten" });
  await dlg.getByRole("button", { name: "Löschen" }).click();
  await dlg.getByRole("button", { name: "Note wirklich löschen" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Note gelöscht." })).toBeVisible();
  await expect(page.getByText("Kurzcheck Vektoren")).toHaveCount(0);
});

test("EFZ-Ansicht ohne Module zeigt den leeren Zustand", async ({ page }) => {
  await page.goto("/noten?ansicht=efz");
  await expect(page.getByText("Noch keine EFZ-Module.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Notenportfolio importieren" }).first()).toBeVisible();
});

test("Absenzen: Kontingent, Zustand pro Lektion, Filter nach Fach mit Fachkontingent", async ({ page }) => {
  await page.goto("/absenzen");
  await expect(page.getByText("Verfügbares Kontingent von 20")).toBeVisible();
  await expect(page.getByText("ohne Abmeldung doppelt").first()).toBeVisible();
  await expect(page.getByText("Dispensiert").filter({ visible: true })).toHaveCount(1);
  await page.getByRole("link", { name: "Sport" }).click();
  await expect(page.getByText("Sport auf Kontingent")).toBeVisible();
  await expect(page.getByText("Höchstens im Semester")).toBeVisible();
});

test("Abmeldung eintragen, bearbeiten und löschen", async ({ page }) => {
  await page.goto("/absenzen?tab=abmeldungen");
  // Solange die Schule das Portal nicht anbindet: Hinweis auf die Absenzendatenbank
  await expect(page.getByText("Nur im Portal gespeichert.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Absenzendatenbank öffnen" })).toHaveAttribute("href", "https://absenzen.bwdbern.ch/lernende_anzeigen");
  await page.getByRole("link", { name: "Neue Abmeldung" }).first().click();
  let dlg = page.getByRole("dialog", { name: "Abmeldung eintragen" });
  await dlg.getByLabel("Von").selectOption("9");
  await dlg.getByLabel("Bis").selectOption("10");
  await dlg.getByLabel("Bemerkung").fill("Zahnarzt");
  await dlg.getByRole("button", { name: "Abmeldung speichern" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Abmeldung gespeichert." })).toBeVisible();
  await expect(page.getByText("15:15 bis 16:55")).toBeVisible();

  await page.getByRole("link", { name: /^Abmeldung vom .* bearbeiten$/ }).filter({ visible: true }).first().click();
  dlg = page.getByRole("dialog", { name: "Abmeldung bearbeiten" });
  await dlg.getByLabel("Bis").selectOption("11");
  await dlg.getByRole("button", { name: "Abmeldung speichern" }).click();
  await expect(page.getByText("15:15 bis 17:45")).toBeVisible();

  await page.getByRole("link", { name: /^Abmeldung vom .* bearbeiten$/ }).filter({ visible: true }).first().click();
  dlg = page.getByRole("dialog", { name: "Abmeldung bearbeiten" });
  await dlg.getByRole("button", { name: "Löschen" }).click();
  await dlg.getByRole("button", { name: "Abmeldung wirklich löschen" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Abmeldung gelöscht." })).toBeVisible();
  await expect(page.getByText("15:15 bis 17:45")).toHaveCount(0);
});

test("Dispensationsgesuch: Bestätigung Pflicht, einreichen, Status Eingereicht", async ({ page }) => {
  await page.goto("/absenzen?tab=dispensationen");
  await expect(page.getByText("Bewilligt").filter({ visible: true })).toHaveCount(1);
  await page.getByRole("link", { name: "Neues Gesuch" }).first().click();
  const dlg = page.getByRole("dialog", { name: "Dispensationsgesuch einreichen" });
  await dlg.getByLabel("Grund").selectOption("Todesfall in der Familie");
  await dlg.getByRole("button", { name: /^L1(?!\d)/ }).click();
  await dlg.getByRole("button", { name: "1 Lektion beantragen" }).click();
  await expect(dlg.getByText("Hänge eine Bestätigung an.")).toBeVisible();
  await dlg.getByLabel("Grund").selectOption("Dispensation ab 2. Krankheitstag");
  await dlg.getByRole("button", { name: "1 Lektion beantragen" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Gesuch eingereicht." })).toBeVisible();
  await expect(page.getByText("Dispensation ab 2. Krankheitstag")).toBeVisible();
  await expect(page.getByText("Eingereicht").filter({ visible: true })).toHaveCount(2);
});
