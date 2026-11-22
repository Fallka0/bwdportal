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

test("App-API: Übersicht der Lehrperson und Prüfungen im Zeitraum", async ({ page }) => {
  await login(page, "Regula Keller");
  const home = await page.request.get("/api/v1/teacher/home");
  expect(home.status()).toBe(200);
  const h = (await home.json()) as { attendance: { periods: number[] }[]; classes: { code: string }[] };
  expect(h.attendance.map((x) => x.periods)).toEqual([[1, 2]]);
  expect(h.classes.map((x) => x.code)).toEqual(["IM24b"]);
  const tests = await page.request.get("/api/v1/tests?von=2026-10-01&bis=2026-10-31");
  expect(((await tests.json()) as { tests: { id: string }[] }).tests.map((x) => x.id)).toEqual(["ts-ma-1"]);
});

test("App-API: Lernende erhalten keine Übersicht der Lehrperson", async ({ page }) => {
  await login(page);
  expect((await page.request.get("/api/v1/teacher/home")).status()).toBe(403);
});

