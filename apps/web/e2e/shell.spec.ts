import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("ohne Anmeldung geht es zum Login", async ({ page }) => {
  await page.goto("/noten");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Alles für die Schule an einem Ort.");
});

test("fremdes Konto zeigt den Fehler aus dem Design", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Mit Microsoft anmelden" }).click();
  await page.getByRole("button", { name: /Anderes Microsoft-Konto/ }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Dieses Konto gehört nicht zur bwd." })).toBeVisible();
});

test("Login als Selin Hofer, alle Bereiche erreichbar, Abmelden", async ({ page, isMobile }) => {
  await login(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Selin\./);

  const routes: [string, string][] = [
    ["/stundenplan", "Stundenplan"],
    ["/noten", "Noten"],
    ["/sol", "SOL"],
    ["/absenzen", "Absenzen"],
    ["/mitteilungen", "Mitteilungen"],
    ["/dokumente", "Dokumente"],
    ["/links", "Links"],
    ["/benachrichtigungen", "Benachrichtigungen"],
    ["/profil", "Profil"],
  ];
  for (const [path, h1] of routes) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(h1);
    await expect(page).toHaveTitle(`${h1} · bwd Portal`);
    // genau eine H1 pro Seite
    await expect(page.locator("h1")).toHaveCount(1);
  }

  if (isMobile) {
    await page.getByRole("navigation", { name: "Hauptnavigation" }).getByRole("link", { name: /Mehr/ }).click();
    await expect(page).toHaveURL("/mehr");
    await page.getByRole("link", { name: /Absenzen/ }).click();
    await expect(page.getByRole("link", { name: "Mehr" })).toBeVisible();
  } else {
    const nav = page.getByRole("navigation", { name: "Schule" });
    await nav.getByRole("link", { name: "Noten" }).click();
    await expect(page).toHaveURL("/noten");
    await expect(nav.getByRole("link", { name: "Noten" })).toHaveAttribute("aria-current", "page");
  }

  await page.goto("/gibt-es-nicht");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Diese Seite gibt es nicht.");

  await page.goto("/profil");
  await page.getByRole("button", { name: "Abmelden" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});
