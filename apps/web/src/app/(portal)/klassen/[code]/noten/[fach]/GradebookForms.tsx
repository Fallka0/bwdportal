"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Dialog, DialogActions, Icon, TextField, useToast } from "@/components/ui";

export function SemesterPick({ semesters, value, base }: { semesters: { n: number; label: string }[]; value: number; base: string }) {
  const router = useRouter();
  return (
    <label className="sel" style={{ minWidth: 220 }}>
      <span className="sr">Semester</span>
      <select className="inp" value={value} onChange={(e) => router.push(`${base}?semester=${e.target.value}`)}>
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

const num = (v: string) => Number(v.replace(",", "."));

export async function send(url: string, method: string, body?: unknown): Promise<{ error: string } | { data: unknown }> {
  try {
    const res = await fetch(url, { method, headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
    const b = (await res.json().catch(() => null)) as ({ error?: { message: string } } & Record<string, unknown>) | null;
    if (res.ok) return { data: b };
    return { error: b?.error?.message ?? "Speichern fehlgeschlagen. Versuche es nochmals." };
  } catch {
    return { error: "Keine Verbindung. Versuche es nochmals." };
  }
}

/** Probe anlegen oder ändern: Titel, Datum, Gewicht. Neu angelegt geht es direkt zum Erfassen der Noten. */
export function AssessmentDialog({
  initial,
  onClose,
  save,
  remove,
}: {
  initial?: { title: string; date: string; weight: number };
  onClose: () => void;
  save: (body: { title: string; date: string; weight: number }) => Promise<string | null>;
  remove?: () => Promise<string | null>;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [weight, setWeight] = useState(initial ? String(initial.weight).replace(".", ",") : "1");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ask, setAsk] = useState(false);
  async function run(fn: () => Promise<string | null>) {
    setBusy(true);
    setError("");
    const err = await fn();
    setBusy(false);
    if (err) setError(err);
  }
  return (
    <Dialog open onClose={onClose} title={initial ? "Probe bearbeiten" : "Neue Probe"}>
      <TextField label="Titel" value={title} maxLength={80} required onChange={(e) => setTitle(e.target.value)} />
      <div className="row2">
        <TextField label="Datum" type="date" value={date} required onChange={(e) => setDate(e.target.value)} />
        <TextField label="Gewicht" value={weight} inputMode="decimal" required onChange={(e) => setWeight(e.target.value)} />
      </div>
      {error && (
        <p className="f-e" role="alert">
          {error}
        </p>
      )}
      <DialogActions>
        {remove ? (
          ask ? (
            <Button variant="line" icon="trash" busy={busy} onClick={() => run(remove)}>
              Probe und Noten löschen
            </Button>
          ) : (
            <Button variant="ghost" icon="trash" onClick={() => setAsk(true)}>
              Löschen
            </Button>
          )
        ) : (
          <Button variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
        )}
        <Button icon="check" busy={busy} disabled={!title.trim() || !date || !weight} onClick={() => run(() => save({ title, date, weight: num(weight) }))}>
          {initial ? "Speichern" : "Probe anlegen"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function NewAssessment({ classCode, subject, base }: { classCode: string; subject: string; base: string }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button icon="plus" onClick={() => setOpen(true)}>
        Neue Probe
      </Button>
      {open && (
        <AssessmentDialog
          onClose={() => setOpen(false)}
          save={async (body) => {
            const r = await send("/api/v1/assessments", "POST", { ...body, classCode, subject });
            if ("error" in r) return r.error;
            toast.show("Probe angelegt.");
            router.push(`${base}/${encodeURIComponent((r.data as { id: string }).id)}`);
            return null;
          }}
        />
      )}
    </>
  );
}
