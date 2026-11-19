// Erzeugt aus handoff/design/tokens.json:
//   packages/shared/src/tokens.gen.ts  (Theme für React Native und Rechnungen)
//   apps/web/src/styles/tokens.gen.css (CSS-Variablen fürs Web)
// Aufruf: pnpm tokens. Die Dateien nie von Hand ändern.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const src = JSON.parse(readFileSync(resolve(root, "handoff/design/tokens.json"), "utf8"));

const kebab = (s) => s.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
const header = "// GENERIERT aus handoff/design/tokens.json mit `pnpm tokens`. Nicht von Hand ändern.\n";

// ---- TS ----
const { _info, fontSizeRule, ...data } = src;
void _info;
void fontSizeRule;
const tsPath = resolve(root, "packages/shared/src/tokens.gen.ts");
writeFileSync(tsPath, `${header}export const tokens = ${JSON.stringify(data, null, 2)} as const;\n`);

// ---- CSS ----
const colorVars = (obj) => Object.entries(obj).map(([k, v]) => `  --${kebab(k)}: ${v};`).join("\n");
const c = src.color;
const lines = [];
lines.push(`/* GENERIERT aus handoff/design/tokens.json mit \`pnpm tokens\`. Nicht von Hand ändern. */`);
lines.push(":root {");
lines.push(colorVars(c.light));
lines.push(Object.entries(c.sidebar).map(([k, v]) => `  --sb-${kebab(k)}: ${v};`).join("\n"));
lines.push(`  --tt-bg: ${c.timetableBlock.light.bg};\n  --tt-fg: ${c.timetableBlock.light.fg};\n  --tt-changed: ${c.timetableBlock.changedText.light};`);
lines.push(Object.entries(src.fontSize).map(([k, v]) => `  --fs-${kebab(k)}: ${v}px;`).join("\n"));
lines.push(Object.entries(src.radius).map(([k, v]) => `  --r-${kebab(k)}: ${v}px;`).join("\n"));
lines.push(src.space.map((v, i) => `  --sp-${i}: ${v}px;`).join("\n"));
lines.push(Object.entries(src.size).map(([k, v]) => `  --size-${kebab(k)}: ${v}px;`).join("\n"));
lines.push(`  --motion-fast: ${src.motion.fast};\n  --motion-base: ${src.motion.base};\n  --ease: ${src.motion.ease};`);
lines.push(`  --display-tracking: ${src.font.displayTracking};`);
lines.push(`  --tg-px-per-min: ${src.timeGrid.pxPerMinute};\n  --tg-hour: ${src.timeGrid.hourRow}px;\n  --tg-axis: ${src.timeGrid.axisWidthWeb}px;`);
lines.push("  --field-bg: var(--raise);\n  --on-bg: var(--raise);\n  color-scheme: light;");
lines.push("}");
const dark = `${colorVars(c.dark)}\n  --tt-bg: ${c.timetableBlock.dark.bg};\n  --tt-fg: ${c.timetableBlock.dark.fg};\n  --tt-changed: ${c.timetableBlock.changedText.dark};\n  --field-bg: var(--panel2);\n  --on-bg: var(--panel2);\n  color-scheme: dark;`;
lines.push(`:root[data-theme="dark"],\n[data-theme="dark"] {\n${dark}\n}`);
lines.push(`[data-theme="light"] {\n${colorVars(c.light)}\n  --tt-bg: ${c.timetableBlock.light.bg};\n  --tt-fg: ${c.timetableBlock.light.fg};\n  --tt-changed: ${c.timetableBlock.changedText.light};\n  --field-bg: var(--raise);\n  --on-bg: var(--raise);\n  color-scheme: light;\n}`);
lines.push(`@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {\n${dark.replace(/^/gm, "  ")}\n  }\n}`);
const cssPath = resolve(root, "apps/web/src/styles/tokens.gen.css");
mkdirSync(dirname(cssPath), { recursive: true });
writeFileSync(cssPath, lines.join("\n") + "\n");
console.log("tokens geschrieben:", tsPath, cssPath);
