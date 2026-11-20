/**
 * SOL-Dateien den Aufträgen einer Klasse zuordnen. Die Ordner der Schule sind nicht einheitlich benannt,
 * darum in zwei Schritten: `suggest` schlägt aus Ordnern und Dateinamen eine Zuordnung vor (JSON zum Prüfen),
 * der Import liest nur die geprüfte Zuordnung.
 */

export type SolFileKind = "task" | "material" | "solution";
export type TaskRef = { block: number; subject: string; code: string; title: string };
/** Eine Zeile der Zuordnung. `task` ist "<Fach> <Nummer>" oder null (nicht zugeordnet, wird nicht importiert). */
export type MapEntry = { file: string; task: string | null; kind: SolFileKind; name: string };

/** Endung in Kleinbuchstaben ("docx"). */
export const extOf = (file: string) => (/\.([a-z0-9]+)$/i.exec(file)?.[1] ?? "").toLowerCase();

/** Systemdateien und Sperrdateien von Office gehören nicht dazu. */
const ignored = (name: string) => name.startsWith("~$") || name.startsWith(".") || /^(thumbs\.db|desktop\.ini)$/i.test(name) || !extOf(name);

const lit = (v: string | number | null) => (v === null ? "NULL" : typeof v === "number" ? String(v) : `'${v.replace(/'/g, "''")}'`);
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9.]+/g, "-");

/** Fach aus dem Ordnernamen der Schule ("02_Math", "06_Finanz- und Rechnungswesen"). */
const FOLDER_SUBJECTS: [RegExp, string][] = [
  [/math/i, "M"],
  [/franz/i, "F"],
  [/engl/i, "E"],
  [/deutsch/i, "D"],
  [/finanz|rechnungswesen/i, "FRW"],
  [/wirtschaft|recht/i, "WR"],
];

export function subjectOf(path: string): string | null {
  for (const seg of path.normalize("NFC").split("/")) {
    if (!/^\d{2}[_ ]/.test(seg)) continue;
    for (const [re, s] of FOLDER_SUBJECTS) if (re.test(seg)) return s;
  }
  return null;
}

export function blockOf(path: string): number | null {
  for (const seg of path.split("/").slice(0, -1)) {
    const m = /^Block\s?(\d)\b/i.exec(seg);
    if (m) return Number(m[1]);
  }
  return null;
}

/** "3.01" und "3.1" sind derselbe Auftrag; "2.1-2.3" bleibt, wie es ist. */
export const normCode = (c: string) =>
  c
    .split("-")
    .map((p) =>
      p
        .split(".")
        .map((n) => String(Number(n)))
        .join("."),
    )
    .join("-");

/** Auftragsnummer im Dateinamen: nach SOL, Lernbaustein oder LK ("D_SOL_3.01_…", "F-SOL_2.1-2.3_…", "SOL_Lernbaustein 6.1_…"). */
export function codeInName(name: string): string | null {
  const m = /(?:SOL|Lernbaustein|LK)\s*[_ -]?\s*(\d+(?:\.\d+)?(?:-\d+\.\d+)?)(?=[_ .()-]|$)/i.exec(name.normalize("NFC"));
  return m ? normCode(m[1]!) : null;
}

/** Lösungen: "Lösung", "Lösungsvorschlag", "solutions", "_sol", "_Sol" (das Präfix "SOL_" zählt nicht). */
export function isSolution(name: string) {
  const base = name.normalize("NFC").replace(/\.[a-z0-9]+$/i, "");
  return /l(ö|oe?)sung|solution|corrig[ée]/i.test(base) || /[_ ](sol|Sol)(?=$|[_ .()])/.test(base);
}

const MATERIAL = /arbeitsblatt|dossier|bewertungsraster|fiche|m[ée]mo|tabelle|exercice|vocabulaire dfp [a-z]\b|lettre|traduction|examinateur|à remplir|formelsammlung|stichwortliste|hilfsmittel|skript|prüfung|aufgabe|test de|plaquette|activit[ée]/i;

/** Lesbarer Name aus dem Dateinamen: ohne Endung, Präfix "D_SOL_3.01_", Unterstriche. */
export function displayName(name: string) {
  return name
    .normalize("NFC")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/^[A-Za-z+]*[-_ ]?SOL[-_ ]*(\d+(\.\d+)?(-\d+\.\d+)?)?[-_ ]*/i, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Vorschlag: Fach aus dem Ordner, Auftrag über die Nummer im Namen, sonst der einzige Auftrag des Fachs im Block.
 * Pro Auftrag ist höchstens eine Datei "der Auftrag"; weitere werden Unterlagen.
 */
export function suggestMapping(paths: string[], tasks: TaskRef[]): MapEntry[] {
  const out: MapEntry[] = [];
  for (const file of [...paths].sort((a, b) => a.localeCompare(b, "de"))) {
    const name = file.split("/").pop()!;
    if (ignored(name)) continue;
    const subject = subjectOf(file);
    const block = blockOf(file);
    const mine = tasks.filter((t) => t.subject === subject);
    const code = codeInName(name);
    // Nummer im Namen zählt nur im eigenen Block (W+R nummeriert Block 4 mit 8.x, Block 8 hat eigene Dateien)
    let task = code ? mine.find((t) => normCode(t.code) === code && (block === null || t.block === block)) : undefined;
    if (!task && block !== null) {
      const inBlock = mine.filter((t) => t.block === block);
      if (inBlock.length === 1) task = inBlock[0];
    }
    // Auftrag ist nur ein Text (Word oder PDF); PowerPoint, Audio, Video und Bilder sind Unterlagen
    const kind: SolFileKind = isSolution(name) ? "solution" : MATERIAL.test(name.normalize("NFC")) || !["docx", "pdf"].includes(extOf(name)) ? "material" : "task";
    out.push({ file, task: task ? `${task.subject} ${task.code}` : null, kind, name: displayName(name) || name });
  }
  // Auftrag ohne Hauptdatei: die erste nummerierte Word-Datei (z. B. "FRW_SOL_3.05_Aufgaben aus alten BM-Prüfungen")
  for (const t of tasks) {
    const ref = `${t.subject} ${t.code}`;
    if (out.some((e) => e.task === ref && e.kind === "task")) continue;
    const cand = out.find((e) => e.task === ref && e.kind === "material" && extOf(e.file) === "docx" && codeInName(e.file.split("/").pop()!) !== null);
    if (cand) cand.kind = "task";
  }
  // Eine Hauptdatei pro Auftrag: bevorzugt ein "Lernbaustein", sonst die erste
  const byTask = new Map<string, MapEntry[]>();
  for (const e of out) if (e.task && e.kind === "task") byTask.set(e.task, [...(byTask.get(e.task) ?? []), e]);
  for (const [ref, list] of byTask) {
    const base = (e: MapEntry) => e.file.split("/").pop()!;
    const main =
      list.find((e) => /lernbaustein/i.test(base(e))) ??
      list.find((e) => /SOL/.test(base(e)) && codeInName(base(e)) !== null && extOf(e.file) === "docx") ??
      list.find((e) => extOf(e.file) === "docx") ??
      list[0]!;
    const t = tasks.find((x) => `${x.subject} ${x.code}` === ref);
    for (const e of list) if (e !== main) e.kind = "material";
    if (t) main.name = t.title;
  }
  return out;
}

export const taskId = (classId: string, subject: string, code: string) => `t-${slug(classId.replace(/^c-/, ""))}-${slug(subject)}-${slug(code)}`;

/** R2-Schlüssel pro Datei: sol/<klasse>/<fach>-<nummer>/<n>.<endung>, PDF-Fassung <n>.as.pdf */
export const solFileKey = (classId: string, ref: string, n: number, ext: string) => {
  const [subject, code] = ref.split(" ") as [string, string];
  return `sol/${slug(classId.replace(/^c-/, ""))}/${slug(subject)}-${slug(code)}/${n}.${ext}`;
};

/** Word und PowerPoint bekommen eine PDF-Fassung. */
export const convertible = (ext: string) => ext === "docx" || ext === "pptx";

export type Imported = MapEntry & { task: string; n: number; ext: string; bytes: number; pdf: boolean };

/** SQL: Dateien der betroffenen Aufträge ersetzen. */
export function solFilesSql(classId: string, files: Imported[]): string[] {
  const c = slug(classId.replace(/^c-/, ""));
  const tasks = [...new Set(files.map((f) => f.task))];
  const out = tasks.map((ref) => {
    const [subject, code] = ref.split(" ") as [string, string];
    return `DELETE FROM sol_task_files WHERE task_id = ${lit(taskId(classId, subject, code))};`;
  });
  for (const f of files) {
    const [subject, code] = f.task.split(" ") as [string, string];
    const id = `sf-${c}-${slug(subject)}-${slug(code)}-${f.n}`;
    out.push(
      `INSERT INTO sol_task_files (id, task_id, kind, name, ext, key, pdf_key, bytes, sort) SELECT ${[id, taskId(classId, subject, code), f.kind, f.name, f.ext, solFileKey(classId, f.task, f.n, f.ext), f.pdf ? solFileKey(classId, f.task, f.n, "as.pdf") : null, f.bytes, f.n].map(lit).join(", ")} WHERE EXISTS (SELECT 1 FROM sol_tasks WHERE id = ${lit(taskId(classId, subject, code))});`,
    );
  }
  return out;
}
