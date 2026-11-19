import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { login } from "./helpers";

const PAGES = ["/", "/stundenplan", "/stundenplan?ansicht=tag", "/noten", "/noten/MA", "/absenzen", "/sol", "/sol?tab=kalender", "/sol?tab=portfolio", "/mitteilungen", "/mitteilungen/pp", "/dokumente", "/links", "/benachrichtigungen", "/profil", "/mehr"];

for (const scheme of ["light", "dark"] as const) {
  test(`Barrierefreiheit (axe, WCAG 2.2 AA) im Design ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await login(page);
    const problems: string[] = [];
    for (const path of PAGES) {
      await page.goto(path);
      await expect(page.locator("h1")).toHaveCount(1);
      const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      for (const v of r.violations) problems.push(`${path}: ${v.id} (${v.nodes.length}) ${v.nodes[0]?.target.join(" ")}`);
    }
    expect(problems).toEqual([]);
  });
}

test("Login ist barrierefrei", async ({ page }) => {
  await page.goto("/login");
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(r.violations.map((v) => v.id)).toEqual([]);
});

test("Tastatur: Skip-Link und sichtbarer Fokus", async ({ page, isMobile }) => {
  test.skip(isMobile, "Tastatur nur am Desktop");
  await login(page);
  await expect(page.getByText(/Als Nächstes/)).toBeVisible();
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Zum Inhalt" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement!).outlineStyle);
  expect(outline).not.toBe("none");
});
