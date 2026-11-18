// Screenshot einer Seite für den Vergleich mit handoff/design/screens.
// node scripts/shot.mjs <url> <datei.png> [breite] [höhe] [ganzeSeite 1|0] [theme light|dark] [cookie name=wert]
import { chromium } from "@playwright/test";

const [url, out, w = "1440", h = "900", full = "1", theme, cookie] = process.argv.slice(2);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, colorScheme: theme === "dark" ? "dark" : "light" });
if (cookie) {
  const [name, ...v] = cookie.split("=");
  await ctx.addCookies([{ name, value: v.join("="), url }]);
}
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(300);
await page.screenshot({ path: out, fullPage: full === "1" });
console.log("Konsolenfehler:", errors.length ? errors : "keine");
await browser.close();
