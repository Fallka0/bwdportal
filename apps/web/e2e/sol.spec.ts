import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test.beforeEach(async ({ page }) => login(page));

test("SOL hat genau drei Tabs", async ({ page }) => {
  await page.goto("/sol");
  await expect(page.getByRole("navigation", { name: "SOL" }).getByRole("link")).toHaveText(["Aufträge", "Kalender", "Portfolio"]);
});

test("Einplanen erscheint im Kalender und bleibt gespeichert", async ({ page }) => {
  await page.goto("/sol?tab=kalender");
  await expect(page.locator("#cal-h")).toHaveText("Freitag, 30. Oktober");
  const form = page.getByRole("region", { name: "Einplanen" });
  await expect(form.getByLabel("Auftrag")).toHaveValue("t-fr-3.01");
  await form.getByLabel("Bis").fill("16:20");
  await form.getByRole("button", { name: "Einplanen" }).click();
  await expect(form.getByText("Bis muss nach Von liegen.")).toBeVisible();
  await form.getByLabel("Bis").fill("17:00");
  await form.getByRole("button", { name: "Einplanen" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Französisch 3.01 eingeplant, Freitag 16:30." })).toBeVisible();
  await expect(page.getByRole("listitem", { name: /Franz 3.01, Compréhension orale, 16:30 bis 17:00/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("listitem", { name: /Franz 3.01, Compréhension orale, 16:30 bis 17:00/ })).toBeVisible();
});

test("Portfolio speichern", async ({ page }) => {
  await page.goto("/sol?tab=portfolio");
  const form = page.getByRole("region", { name: "Freitag, 30. Oktober" });
  await form.getByLabel("Check-in").fill("Mathe 3.02 und 3.03 am Morgen, danach Englisch Reading.");
  await form.getByRole("button", { name: "Speichern" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Portfolio gespeichert." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Freitag, 30. Oktober" }).first()).toBeVisible();
  await expect(page.getByText("Mathe 3.02 und 3.03 am Morgen, danach Englisch Reading.").first()).toBeVisible();
});

test("Stand setzen und Filter nach Fach", async ({ page }) => {
  await page.goto("/sol");
  const stand = page.getByRole("group", { name: "Stand Mathe 3.03 Lineare Optimierung II" });
  const saved = page.waitForResponse((r) => r.url().includes("/api/v1/sol/tasks/") && r.request().method() === "PATCH");
  await stand.getByRole("button", { name: "Erledigt" }).click();
  await saved;
  await page.reload();
  await expect(page.getByRole("group", { name: "Stand Mathe 3.03 Lineare Optimierung II" }).getByRole("button", { name: "Erledigt" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/von \d+ erledigt/).first()).toBeVisible();
  await page.getByRole("navigation", { name: "Fach" }).getByRole("link", { name: "Franz" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Französisch" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Mathematik" })).toHaveCount(0);
});

test("Downloads: Auftrag als PDF, Block als ZIP", async ({ page }) => {
  const pdf = await page.request.get("/api/v1/files/sol/t-ma-3.01");
  expect(pdf.headers()["content-type"]).toBe("application/pdf");
  expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");
  const z = await page.request.get("/api/v1/files/sol-block/3");
  expect(z.headers()["content-type"]).toBe("application/zip");
  expect((await z.body()).subarray(0, 2).toString()).toBe("PK");
});
