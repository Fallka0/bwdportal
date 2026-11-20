/**
 * Minimaler XLSX-Leser: entpackt die Datei und liefert pro Blatt die zuletzt berechneten Zellwerte
 * (Formeln werden nicht ausgewertet, Excel speichert ihr Ergebnis mit). Reicht für das Notenportfolio.
 */
import { strFromU8, unzipSync } from "fflate";

export type Cell = string | number | null;
export type Sheet = { get: (ref: string) => Cell; rows: number };
export type Workbook = { sheets: string[]; sheet: (name: string) => Sheet | null };

const decode = (s: string) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&");

/** Text aus <t>…</t> (auch mehrere Läufe <r><t>…</t></r>). */
const texts = (xml: string) => [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => decode(m[1]!)).join("");

export function readXlsx(data: Uint8Array): Workbook {
  const files = unzipSync(data, { filter: (f) => f.name.startsWith("xl/") && (f.name.endsWith(".xml") || f.name.endsWith(".rels")) });
  const text = (name: string) => (files[name] ? strFromU8(files[name]) : null);
  const shared = [...(text("xl/sharedStrings.xml") ?? "").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => texts(m[1]!));
  const rels = new Map([...(text("xl/_rels/workbook.xml.rels") ?? "").matchAll(/<Relationship\s[^>]*?Id="([^"]+)"[^>]*?Target="([^"]+)"/g)].map((m) => [m[1]!, m[2]!.replace(/^\/?xl\//, "")]));
  const sheets = new Map(
    [...(text("xl/workbook.xml") ?? "").matchAll(/<sheet\s[^>]*?name="([^"]+)"[^>]*?r:id="([^"]+)"/g)].map((m) => [decode(m[1]!), `xl/${rels.get(m[2]!) ?? ""}`]),
  );
  const cache = new Map<string, Sheet>();
  return {
    sheets: [...sheets.keys()],
    sheet(name) {
      const hit = cache.get(name);
      if (hit) return hit;
      const xml = text(sheets.get(name) ?? "");
      if (xml === null) return null;
      const cells = new Map<string, Cell>();
      let rows = 0;
      for (const m of xml.matchAll(/<c\s([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const attrs = m[1]!;
        const ref = /r="([A-Z]+\d+)"/.exec(attrs)?.[1];
        if (!ref) continue;
        rows = Math.max(rows, Number(/\d+/.exec(ref)![0]));
        const type = /t="([^"]+)"/.exec(attrs)?.[1];
        const body = m[2] ?? "";
        const v = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1];
        let value: Cell = null;
        if (type === "s" && v !== undefined) value = shared[Number(v)] ?? null;
        else if (type === "inlineStr") value = texts(body);
        else if (type === "str" && v !== undefined) value = decode(v);
        else if (type === "e") value = null;
        else if (type === "b") value = v === "1" ? 1 : 0;
        else if (v !== undefined) value = Number(v);
        cells.set(ref, value);
      }
      const sheet: Sheet = { get: (ref) => cells.get(ref) ?? null, rows };
      cache.set(name, sheet);
      return sheet;
    },
  };
}
