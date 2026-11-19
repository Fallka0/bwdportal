// Liest die SVG-Symbole aus dem Prototyp (handoff/prototype/reference-template.html)
// und schreibt sie als Daten nach packages/shared/src/icons.gen.ts.
// Web zeichnet sie als <svg>, die App mit react-native-svg. Aufruf: pnpm icons
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const html = readFileSync(resolve(root, "handoff/prototype/reference-template.html"), "utf8");
const attrs = (s) => Object.fromEntries([...s.matchAll(/([a-z-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
const num = (v) => Number(v);
const icons = {};
for (const m of html.matchAll(/<symbol id="i-([a-z0-9-]+)" viewBox="0 0 24 24">(.*?)<\/symbol>/g)) {
  const [, name, body] = m;
  const shapes = [];
  for (const el of body.matchAll(/<(path|circle|rect)\s([^>]*?)\/>/g)) {
    const a = attrs(el[2]);
    if (el[1] === "path") shapes.push({ t: "path", d: a.d, ...(a.fill ? { fill: true } : {}) });
    if (el[1] === "circle") shapes.push({ t: "circle", cx: num(a.cx), cy: num(a.cy), r: num(a.r), ...(a.fill ? { fill: true } : {}) });
    if (el[1] === "rect") shapes.push({ t: "rect", x: num(a.x), y: num(a.y), width: num(a.width), height: num(a.height), rx: num(a.rx ?? 0) });
  }
  icons[name] = shapes;
}
const out = `// GENERIERT aus handoff/prototype/reference-template.html mit \`pnpm icons\`. Nicht von Hand ändern.
export const iconData = ${JSON.stringify(icons, null, 1)} as const;
`;
writeFileSync(resolve(root, "packages/shared/src/icons.gen.ts"), out);
console.log(Object.keys(icons).length, "Icons:", Object.keys(icons).join(" "));
