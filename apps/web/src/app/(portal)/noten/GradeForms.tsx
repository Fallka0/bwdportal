"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { BM_SUBJECTS, plural, type PortfolioEntry } from "@bwd/shared";
import { Button, Dialog, DialogActions, Icon, SelectField, TextField, useToast } from "@/components/ui";

type Semester = { n: number; label: string };

/** Auswahl des BM-Semesters; behält die Ansicht (Semester oder EFZ) nicht, EFZ hat keine Semester. */
export function SemesterSelect({ semesters, value }: { semesters: Semester[]; value: number }) {
  const router = useRouter();
  return (
    <label className="sel" style={{ minWidth: 220 }}>
      <span className="sr">Semester</span>
      <select className="inp" value={value} onChange={(e) => router.push(`/noten?semester=${e.target.value}`)}>
        {semesters.map((s) => (
          <option key={s.n} value={s.n}>
            {s.n}. Semester · {s.label}
          </option>
        ))}
      </select>
      <Icon name="chev-d" small />
    </label>
  );
}

/** "Neue Note" und "Importieren" öffnen die Dialoge über die Adresse (?neu=1, ?import=1). */
export function GradeActions({ semester, subject, module, wide }: { semester: number; subject?: string; module?: string | null; wide?: boolean }) {
  const path = usePathname();
  const q = new URLSearchParams({ semester: String(semester), neu: "1" });
  if (module) q.set("modul", module);
  const cls = wide ? "btn btn-ink btn-wide" : "btn btn-ink";
  return (
    <>
      <Link className={cls} href={`${path}?${q.toString()}`} scroll={false}>
        <Icon name="plus" small />
        Neue Note
      </Link>
      {!subject && (
        <Link className={wide ? "btn btn-line btn-wide" : "btn btn-line"} href={`/noten?semester=${semester}&import=1`} scroll={false}>
          <Icon name="upload" small />
          Notenportfolio importieren
        </Link>
      )}
    </>
  );
}

export function EditLink({ id, label }: { id: string; label: string }) {
  const path = usePathname();
  const sp = useSearchParams();
  const q = new URLSearchParams(sp.toString());
  q.set("bearbeiten", id);
  q.delete("neu");
  return (
    <Link className="btn btn-line btn-s" href={`${path}?${q.toString()}`} scroll={false} aria-label={label}>
      Bearbeiten
    </Link>
  );
}

function useClose() {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const base = () => {
    const q = new URLSearchParams(sp.toString());
    ["neu", "bearbeiten", "import"].forEach((k) => q.delete(k));
    const s = q.toString();
    return s ? `${path}?${s}` : path;
  };
  return {
    close: () => router.replace(base(), { scroll: false }),
    done: () => {
      router.replace(base(), { scroll: false });
      router.refresh();
    },
  };
}

async function send(url: string, method: string, body?: unknown): Promise<string | null> {
  try {
    const res = await fetch(url, { method, headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
    if (res.ok) return null;
    const b = (await res.json().catch(() => null)) as { error?: { message: string } } | null;
    return b?.error?.message ?? "Speichern fehlgeschlagen. Versuche es nochmals.";
  } catch {
    return "Keine Verbindung. Versuche es nochmals.";
  }
}

/** Öffnet "Neue Note", "Note bearbeiten" oder "Notenportfolio importieren" je nach Adresse. */
export function GradeDialogs({ semester, subject, module, entries }: { semester: number; subject?: string; module?: string | null; entries?: PortfolioEntry[] }) {
  const sp = useSearchParams();
  if (sp.get("import") === "1") return <ImportDialog />;
  if (sp.get("neu") === "1") return <GradeDialog key="new" semester={semester} subject={subject} module={sp.get("modul") ?? module ?? null} />;
  const edit = sp.get("bearbeiten");
  const entry = edit ? entries?.find((e) => e.id === edit) : undefined;
  if (entry) return <GradeDialog key={entry.id} semester={semester} subject={subject} module={module ?? null} entry={entry} />;
  return null;
}

function GradeDialog({ semester, subject, module, entry }: { semester: number; subject?: string; module: string | null; entry?: PortfolioEntry }) {
  const { close, done } = useClose();
  const toast = useToast();
  const [sem, setSem] = useState(semester);
  const [code, setCode] = useState(subject ?? BM_SUBJECTS[0].code);
  const [mod, setMod] = useState(module ?? "");
  const [title, setTitle] = useState(entry?.title ?? "");
  const [value, setValue] = useState(entry ? String(entry.value) : "");
  const [weight, setWeight] = useState(entry ? String(entry.weight) : "1");
  const [date, setDate] = useState(entry?.date ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ask, setAsk] = useState(false);
  const num = (v: string) => Number(v.replace(",", "."));

  async function save() {
    setBusy(true);
    setError("");
    const body = { semester: sem, subject: code, module: code === "IN" ? mod : null, title, value: num(value), weight: num(weight), date: date || null };
    const err = entry ? await send(`/api/v1/grades/entries/${encodeURIComponent(entry.id)}`, "PATCH", body) : await send("/api/v1/grades/entries", "POST", body);
    setBusy(false);
    if (err) return setError(err);
    toast.show(entry ? "Note geändert." : "Note gespeichert.");
    done();
  }

  async function remove() {
    setBusy(true);
    const err = await send(`/api/v1/grades/entries/${encodeURIComponent(entry!.id)}`, "DELETE");
    setBusy(false);
    if (err) return setError(err);
    toast.show("Note gelöscht.");
    done();
  }

  return (
    <Dialog open onClose={close} title={entry ? "Note bearbeiten" : "Neue Note"}>
      <SelectField label="Semester" value={sem} onChange={(e) => setSem(Number(e.target.value))}>
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <option key={n} value={n}>
            {n}. Semester
          </option>
        ))}
      </SelectField>
      <SelectField label="Fach" value={code} onChange={(e) => setCode(e.target.value)} disabled={!!subject}>
        {[...BM_SUBJECTS, ...(subject && !BM_SUBJECTS.some((b) => b.code === subject) ? [{ code: subject, name: subject }] : [])].map((b) => (
          <option key={b.code} value={b.code}>
            {b.name}
          </option>
        ))}
      </SelectField>
      {code === "IN" && <TextField label="Modul" value={mod} inputMode="numeric" maxLength={3} placeholder="320" onChange={(e) => setMod(e.target.value.replace(/\D/g, ""))} />}
      <TextField label="Titel" value={title} maxLength={80} required onChange={(e) => setTitle(e.target.value)} />
      <div className="row2">
        <TextField label="Note" value={value} inputMode="decimal" required onChange={(e) => setValue(e.target.value)} />
        <TextField label="Gewicht" value={weight} inputMode="decimal" required onChange={(e) => setWeight(e.target.value)} />
      </div>
      <TextField label="Datum" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      {error && (
        <p className="f-e" role="alert">
          {error}
        </p>
      )}
      <DialogActions>
        {entry ? (
          ask ? (
            <Button variant="line" icon="trash" busy={busy} onClick={remove}>
              Note wirklich löschen
            </Button>
          ) : (
            <Button variant="ghost" icon="trash" onClick={() => setAsk(true)}>
              Löschen
            </Button>
          )
        ) : (
          <Button variant="ghost" onClick={close}>
            Abbrechen
          </Button>
        )}
        <Button icon="check" busy={busy} disabled={!title.trim() || !value || (code === "IN" && mod.length !== 3)} onClick={save}>
          Note speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** Notenportfolio (Excel-Vorlage der Schule) hochladen. Ersetzt alle Noten. */
function ImportDialog() {
  const { close, done } = useClose();
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function upload() {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/v1/grades/import", { method: "POST", body: fd });
      const b = (await res.json().catch(() => null)) as { entries?: number; semesters?: number; nameMatches?: boolean; error?: { message: string } } | null;
      if (!res.ok || !b || b.entries === undefined) return setError(b?.error?.message ?? "Import fehlgeschlagen. Versuche es nochmals.");
      toast.show(`${plural(b.entries, "Note", "Noten")} aus ${plural(b.semesters ?? 0, "Semester", "Semestern")} übernommen.${b.nameMatches ? "" : " Der Name in der Datei passt nicht zu deinem Konto."}`);
      done();
    } catch {
      setError("Keine Verbindung. Versuche es nochmals.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onClose={close} title="Notenportfolio importieren">
      <label className="upl">
        <Icon name="clip" />
        <span>
          <b>{file ? file.name : "Notenportfolio (.xlsx) wählen"}</b>
        </span>
        <input
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(e) => {
            setError("");
            setFile(e.target.files?.[0] ?? null);
          }}
        />
      </label>
      <p>Ersetzt alle Noten und die EFZ-Übersicht im Portal.</p>
      {error && (
        <p className="f-e" role="alert">
          {error}
        </p>
      )}
      <DialogActions>
        <Button variant="ghost" onClick={close}>
          Abbrechen
        </Button>
        <Button icon="upload" busy={busy} disabled={!file} onClick={upload}>
          Importieren
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** Note eines EFZ-Moduls direkt in der Tabelle; speichert beim Verlassen des Feldes. */
export function EfzValue({ id, label, value }: { id: string; label: string; value: number | null }) {
  const router = useRouter();
  const toast = useToast();
  const [v, setV] = useState(value === null ? "" : String(value));
  async function save() {
    const next = v.trim() === "" ? null : Number(v.replace(",", "."));
    if (next === value || (next !== null && (Number.isNaN(next) || next < 1 || next > 6))) {
      if (next !== value) toast.show("Noten gehen von 1 bis 6.");
      setV(value === null ? "" : String(value));
      return;
    }
    const err = await send(`/api/v1/grades/efz/${encodeURIComponent(id)}`, "PATCH", { value: next });
    if (err) {
      toast.show(err);
      setV(value === null ? "" : String(value));
      return;
    }
    router.refresh();
  }
  return <input className="inp efz-v" aria-label={`Note ${label}`} inputMode="decimal" value={v} placeholder="–" onChange={(e) => setV(e.target.value)} onBlur={save} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} />;
}
