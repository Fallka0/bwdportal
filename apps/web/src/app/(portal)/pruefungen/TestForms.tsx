"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { Subject, TestItem } from "@bwd/shared";
import { Button, Dialog, DialogActions, SelectField, TextArea, TextField, useToast } from "@/components/ui";

type Options = { subjects: Subject[]; classes: { classCode: string; subject: Subject }[] };

export function EditTestLink({ id, label }: { id: string; label: string }) {
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
    ["neu", "bearbeiten"].forEach((k) => q.delete(k));
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

/** Öffnet "Neue Prüfung" (?neu=1) oder "Prüfung bearbeiten" (?bearbeiten=id, nur eigene). */
export function TestDialogs({ tests, options, teacher }: { tests: TestItem[]; options: Options; teacher: boolean }) {
  const sp = useSearchParams();
  if (sp.get("neu") === "1") return <TestDialog key="new" options={options} teacher={teacher} />;
  const id = sp.get("bearbeiten");
  const test = id ? tests.find((t) => t.id === id && t.mine) : undefined;
  return test ? <TestDialog key={test.id} options={options} teacher={teacher} test={test} /> : null;
}

function TestDialog({ options, teacher, test }: { options: Options; teacher: boolean; test?: TestItem }) {
  const { close, done } = useClose();
  const toast = useToast();
  const pairs = options.classes.map((c) => ({ key: `${c.classCode}|${c.subject.code}`, label: `${c.subject.name} · ${c.classCode}`, ...c }));
  const [pair, setPair] = useState(test?.classCode ? `${test.classCode}|${test.subject.code}` : (pairs[0]?.key ?? ""));
  const [subject, setSubject] = useState(test?.subject.code ?? options.subjects[0]?.code ?? "");
  const [date, setDate] = useState(test?.date ?? "");
  const [title, setTitle] = useState(test?.title ?? "");
  const [description, setDescription] = useState(test?.description ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ask, setAsk] = useState(false);
  // Eine bestehende Prüfung, deren Zuteilung entfernt wurde, bleibt wählbar, damit sie gelöscht werden kann
  const subjects = test && !test.classCode && !options.subjects.some((s) => s.code === test.subject.code) ? [test.subject, ...options.subjects] : options.subjects;

  async function save() {
    setBusy(true);
    setError("");
    const [classCode, pairSubject] = pair.split("|");
    const body = { date, title, description: description || null, ...(teacher ? { classCode, subject: pairSubject } : { subject }) };
    const err = test ? await send(`/api/v1/tests/${encodeURIComponent(test.id)}`, "PATCH", body) : await send("/api/v1/tests", "POST", body);
    setBusy(false);
    if (err) return setError(err);
    toast.show(test ? "Prüfung geändert." : "Prüfung gespeichert.");
    done();
  }

  async function remove() {
    setBusy(true);
    const err = await send(`/api/v1/tests/${encodeURIComponent(test!.id)}`, "DELETE");
    setBusy(false);
    if (err) return setError(err);
    toast.show("Prüfung gelöscht.");
    done();
  }

  return (
    <Dialog open onClose={close} title={test ? "Prüfung bearbeiten" : "Neue Prüfung"}>
      {teacher ? (
        <SelectField label="Klasse und Fach" value={pair} onChange={(e) => setPair(e.target.value)}>
          {pairs.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </SelectField>
      ) : (
        <SelectField label="Fach" value={subject} onChange={(e) => setSubject(e.target.value)}>
          {subjects.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name}
            </option>
          ))}
        </SelectField>
      )}
      <TextField label="Datum" type="date" value={date} required onChange={(e) => setDate(e.target.value)} />
      <TextField label="Titel" value={title} maxLength={80} required onChange={(e) => setTitle(e.target.value)} />
      <TextArea label="Beschreibung" value={description} maxLength={1000} rows={3} onChange={(e) => setDescription(e.target.value)} />
      {error && (
        <p className="f-e" role="alert">
          {error}
        </p>
      )}
      <DialogActions>
        {test ? (
          ask ? (
            <Button variant="line" icon="trash" busy={busy} onClick={remove}>
              Prüfung wirklich löschen
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
        <Button icon="check" busy={busy} disabled={!title.trim() || !date || (teacher ? !pair : !subject)} onClick={save}>
          Prüfung speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
}
