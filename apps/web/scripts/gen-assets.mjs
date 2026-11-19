// Erzeugt Favicon, App-Icons und das Open-Graph-Bild aus HTML (Schriften und Farben aus dem Projekt).
// Aufruf: node apps/web/scripts/gen-assets.mjs
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const tokens = JSON.parse(readFileSync(resolve(root, "handoff/design/tokens.json"), "utf8"));
const c = tokens.color.light;
const sb = tokens.color.sidebar;
const font = (f) => `data:font/woff2;base64,${readFileSync(resolve(root, "apps/web/src/fonts", f)).toString("base64")}`;
const css = `
@font-face { font-family: U; src: url(${font("unbounded-latin-wght.woff2")}) format("woff2"); font-weight: 200 900; }
@font-face { font-family: M; src: url(${font("manrope-latin-wght.woff2")}) format("woff2"); font-weight: 200 800; }
* { margin: 0; box-sizing: border-box; }
body { width: 100vw; height: 100vh; overflow: hidden; }
.mark { display: grid; place-items: center; font-family: U; font-weight: 600; letter-spacing: -0.06em; }
`;

const mark = (size, { bg, fg, radius, pad = 0, text = 0.33 }) => `
<div style="width:${size}px;height:${size}px;display:grid;place-items:center;background:${pad ? "transparent" : bg}">
  <div class="mark" style="width:${size - pad * 2}px;height:${size - pad * 2}px;border-radius:${radius}px;background:${bg};color:${fg};font-size:${Math.round((size - pad * 2) * text)}px">bwd</div>
</div>`;

const og = `
<div style="width:1200px;height:630px;background:${sb.bg};color:${sb.ink};padding:72px;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden;font-family:M">
  <div style="display:flex;align-items:center;gap:20px;font-family:U;font-size:34px;letter-spacing:-0.045em">
    <div class="mark" style="width:60px;height:60px;border-radius:14px;background:${sb.ink};color:${sb.bg};font-size:20px">bwd</div>Portal
  </div>
  <div style="position:absolute;right:80px;top:70px;display:grid;grid-template-columns:repeat(3,120px);gap:16px;transform:rotate(-8deg)">
    ${[1, 0, 0, 0, 1, 0].map((a) => `<div style="height:120px;border-radius:28px;background:${a ? sb.ink : sb.active}"></div>`).join("")}
  </div>
  <div style="font-family:U;font-weight:300;font-size:72px;line-height:1.02;letter-spacing:-0.05em;max-width:12ch">Alles für die Schule an einem Ort.</div>
</div>`;

const jobs = [
  { out: "apps/web/src/app/apple-icon.png", size: 180, html: mark(180, { bg: c.btn, fg: c.btnFg, radius: 0 }) },
  { out: "apps/web/src/app/opengraph-image.png", w: 1200, h: 630, html: og },
  { out: "apps/web/public/icons/icon-192.png", size: 192, html: mark(192, { bg: c.btn, fg: c.btnFg, radius: 0 }) },
  { out: "apps/web/public/icons/icon-512.png", size: 512, html: mark(512, { bg: c.btn, fg: c.btnFg, radius: 0 }) },
  // Maskable: Inhalt in der sicheren Zone (80 %), Rand in der Hintergrundfarbe
  { out: "apps/web/public/icons/icon-maskable-512.png", size: 512, html: `<div style="width:512px;height:512px;background:${c.btn};display:grid;place-items:center">${mark(360, { bg: c.btn, fg: c.btnFg, radius: 0 })}</div>` },
  { out: "apps/mobile/assets/images/icon.png", size: 1024, html: mark(1024, { bg: c.btn, fg: c.btnFg, radius: 0 }) },
  { out: "apps/mobile/assets/images/android-icon-foreground.png", size: 432, html: mark(432, { bg: "transparent", fg: c.btnFg, radius: 0, text: 0.2 }), transparent: true },
  { out: "apps/mobile/assets/images/android-icon-background.png", size: 432, html: `<div style="width:432px;height:432px;background:${c.btn}"></div>` },
  { out: "apps/mobile/assets/images/android-icon-monochrome.png", size: 432, html: mark(432, { bg: "transparent", fg: "#000", radius: 0, text: 0.2 }), transparent: true },
  { out: "apps/mobile/assets/images/splash-icon.png", size: 400, html: mark(400, { bg: c.btn, fg: c.btnFg, radius: 88 }), transparent: true },
  { out: "apps/mobile/assets/images/favicon.png", size: 48, html: mark(48, { bg: c.btn, fg: c.btnFg, radius: 10 }), transparent: true },
];

mkdirSync(resolve(root, "apps/web/public/icons"), { recursive: true });
const browser = await chromium.launch();
for (const j of jobs) {
  const w = j.w ?? j.size;
  const h = j.h ?? j.size;
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.setContent(`<!doctype html><style>${css}</style>${j.html}`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: resolve(root, j.out), omitBackground: !!j.transparent });
  await page.close();
  console.log("geschrieben:", j.out);
}
await browser.close();

// Offline-Seite für den Service Worker: eigenständig (keine Skripte), Farben aus den Tokens, hell und dunkel.
const d = tokens.color.dark;
const offline = `<!doctype html>
<html lang="de-CH">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<title>Keine Verbindung · bwd Portal</title>
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<style>
@font-face { font-family: U; src: url(/fonts/unbounded-latin-wght.woff2) format("woff2"); font-weight: 200 900; font-display: swap; }
@font-face { font-family: M; src: url(/fonts/manrope-latin-wght.woff2) format("woff2"); font-weight: 200 800; font-display: swap; }
:root { --bg: ${c.bg}; --ink: ${c.ink}; --t2: ${c.text2}; --btn: ${c.btn}; --fg: ${c.btnFg}; --focus: ${c.focus}; --frame: ${c.frame}; }
@media (prefers-color-scheme: dark) { :root { --bg: ${d.bg}; --ink: ${d.ink}; --t2: ${d.text2}; --btn: ${d.btn}; --fg: ${d.btnFg}; } }
* { box-sizing: border-box; margin: 0; }
html { background: var(--frame); }
body { min-height: 100dvh; padding: ${tokens.space[6]}px; background: var(--frame); font: ${tokens.fontSize.base}px/1.5 M, system-ui, sans-serif; color: var(--ink); }
main { min-height: calc(100dvh - ${tokens.space[6] * 2}px); display: grid; align-content: center; justify-items: start; gap: ${tokens.space[6]}px; padding: ${tokens.space[11]}px; background: var(--bg); }
h1 { font: 300 ${tokens.fontSize.h1Web}px/1.05 U, sans-serif; letter-spacing: ${tokens.font.displayTracking}; text-wrap: balance; }
p { color: var(--t2); font-size: ${tokens.fontSize.xl}px; max-width: 44ch; }
button { height: ${tokens.size.button}px; padding: 0 ${tokens.space[8]}px; border: 0; border-radius: ${tokens.radius.pill}px; background: var(--btn); color: var(--fg); font: 600 ${tokens.fontSize.base}px/1 M, sans-serif; cursor: pointer; }
button:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
@media (max-width: 599px) { body { padding: 0; } main { min-height: 100dvh; padding: ${tokens.space[9]}px; } h1 { font-size: ${tokens.fontSize.h1App}px; } }
</style>
</head>
<body>
<main>
<h1>Keine Verbindung.</h1>
<p>Das Portal ist gerade nicht erreichbar.</p>
<button type="button" onclick="location.reload()">Erneut laden</button>
</main>
</body>
</html>
`;
writeFileSync(resolve(root, "apps/web/public/offline.html"), offline);
mkdirSync(resolve(root, "apps/web/public/fonts"), { recursive: true });
for (const f of ["unbounded-latin-wght.woff2", "manrope-latin-wght.woff2"]) copyFileSync(resolve(root, "apps/web/src/fonts", f), resolve(root, "apps/web/public/fonts", f));
console.log("geschrieben: apps/web/public/offline.html");

// Favicon als SVG (skaliert scharf); Schrift als Pfad wäre schöner, die Systemschrift reicht für 16 px.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${c.btn}"/><text x="32" y="40" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="700" font-size="22" letter-spacing="-1.5" fill="${c.btnFg}">bwd</text></svg>\n`;
writeFileSync(resolve(root, "apps/web/src/app/icon.svg"), svg);
console.log("geschrieben: apps/web/src/app/icon.svg");
