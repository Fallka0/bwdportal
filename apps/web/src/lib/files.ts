import "server-only";

/**
 * Dateien für Downloads. In der Demo liegen keine echten Dokumente in R2:
 * dann erzeugt der Server ein kleines PDF mit Titel, damit Öffnen und Herunterladen funktionieren.
 */

const enc = new TextEncoder();

/** PDF-Text: Umlaute in WinAnsi, Klammern und Backslash maskieren. */
function pdfText(s: string): string {
  const map: Record<string, string> = { ä: "\\344", ö: "\\366", ü: "\\374", Ä: "\\304", Ö: "\\326", Ü: "\\334", é: "\\351", è: "\\350", à: "\\340", ç: "\\347" };
  return s.replace(/[\\()]/g, (m) => `\\${m}`).replace(/[äöüÄÖÜéèàç]/g, (m) => map[m]!).replace(/[^\x20-\x7e\\0-9]/g, "?");
}

export function placeholderPdf(title: string, lines: string[] = []): Uint8Array<ArrayBuffer> {
  const content = [`BT /F1 20 Tf 56 760 Td (${pdfText(title)}) Tj ET`, ...lines.map((l, i) => `BT /F1 11 Tf 56 ${724 - i * 18} Td (${pdfText(l)}) Tj ET`)].join("\n");
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
  ];
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objs.forEach((o, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return enc.encode(out) as Uint8Array<ArrayBuffer>;
}

// ---------- ZIP (ohne Kompression) ----------

const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of data) c = CRC[(c ^ b) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Einfaches ZIP-Archiv (Methode "stored"). Reicht für einige PDFs pro Block. */
export function zip(files: { name: string; data: Uint8Array }[]): Uint8Array<ArrayBuffer> {
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const f of files) {
    const name = enc.encode(f.name);
    const crc = crc32(f.data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // UTF-8-Namen
    local.setUint32(14, crc, true);
    local.setUint32(18, f.data.length, true);
    local.setUint32(22, f.data.length, true);
    local.setUint16(26, name.length, true);
    parts.push(new Uint8Array(local.buffer), name, f.data);
    const cen = new DataView(new ArrayBuffer(46));
    cen.setUint32(0, 0x02014b50, true);
    cen.setUint16(4, 20, true);
    cen.setUint16(6, 20, true);
    cen.setUint16(8, 0x0800, true);
    cen.setUint32(16, crc, true);
    cen.setUint32(20, f.data.length, true);
    cen.setUint32(24, f.data.length, true);
    cen.setUint16(28, name.length, true);
    cen.setUint32(42, offset, true);
    central.push(new Uint8Array(cen.buffer), name);
    offset += 30 + name.length + f.data.length;
  }
  const cenSize = central.reduce((s, p) => s + p.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, cenSize, true);
  end.setUint32(16, offset, true);
  const all = [...parts, ...central, new Uint8Array(end.buffer)];
  const out = new Uint8Array(new ArrayBuffer(all.reduce((s, p) => s + p.length, 0)));
  let i = 0;
  for (const p of all) {
    out.set(p, i);
    i += p.length;
  }
  return out;
}

/** Datei aus R2 oder Platzhalter. */
export async function fileOrPlaceholder(bucket: R2Bucket, key: string | null, title: string, lines: string[]): Promise<{ body: BodyInit; type: string }> {
  if (key) {
    const obj = await bucket.get(key).catch(() => null);
    if (obj) return { body: obj.body as unknown as BodyInit, type: obj.httpMetadata?.contentType ?? "application/pdf" };
  }
  return { body: placeholderPdf(title, lines), type: "application/pdf" };
}

export function fileName(title: string, ext: string): string {
  const base = title.replace(/[^\p{L}\p{N} ._-]+/gu, " ").trim().replace(/\s+/g, " ");
  return `${base || "Datei"}.${ext}`;
}

export function downloadHeaders(name: string, type: string, inline: boolean) {
  const ascii = name.normalize("NFD").replace(/[^\x20-\x7e]/g, "");
  return {
    "content-type": type,
    "content-disposition": `${inline ? "inline" : "attachment"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`,
    "cache-control": "private, no-store",
    "x-content-type-options": "nosniff",
  };
}
