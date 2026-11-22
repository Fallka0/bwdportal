"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { fmtGrade, type AssessmentSheet } from "@bwd/shared";
import { Button, Card, useToast } from "@/components/ui";
import { AssessmentDialog, send } from "../GradebookForms";

const parse = (v: string): number | null | "bad" => {
  const t = v.trim().replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 1 && n <= 6 ? n : "bad";
};

/** Noten einer Probe: ein Feld pro Person, leer = keine Note. */
export function GradeEntry({ sheet, book }: { sheet: AssessmentSheet; book: string }) {
  const router = useRouter();
  const toast = useToast();
  const a = sheet.assessment;
  const [vals, setVals] = useState<Record<string, string>>(() => Object.fromEntries(sheet.students.map((s) => [s.id, s.value === null ? "" : String(s.value).replace(".", ",")])));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [edit, setEdit] = useState(false);
  const parsed = sheet.students.map((s) => ({ id: s.id, v: parse(vals[s.id] ?? "") }));
  const nums = parsed.map((p) => p.v).filter((v): v is number => typeof v === "number");
  const bad = parsed.some((p) => p.v === "bad");

  async function save() {
    setBusy(true);
    setError("");
    const r = await send(`/api/v1/assessments/${encodeURIComponent(a.id)}/grades`, "PUT", { grades: parsed.map((p) => ({ userId: p.id, value: p.v })) });
    setBusy(false);
    if ("error" in r) return setError(r.error);
    toast.show("Noten gespeichert.");
    router.push(book);
    router.refresh();
  }

  return (
    <>
      <Card aria-labelledby="ge-h">
        <div className="row-h">
          <h2 id="ge-h" className="box-t">
            {nums.length} von {sheet.students.length} benotet{nums.length >= 3 ? ` · Schnitt ${fmtGrade(Math.round((nums.reduce((x, y) => x + y, 0) / nums.length) * 10) / 10)}` : ""}
          </h2>
          {sheet.editable && (
            <Button variant="line" small onClick={() => setEdit(true)}>
              Probe bearbeiten
            </Button>
          )}
        </div>
        <ul className="pres">
          {sheet.students.map((s, i) => (
            <li key={s.id}>
              <span className="av" aria-hidden="true">
                {s.initials}
              </span>
              <label className="pres-n" htmlFor={`g-${s.id}`}>
                <b>{s.name}</b>
              </label>
              <input
                id={`g-${s.id}`}
                className={parsed[i]!.v === "bad" ? "inp ge-in bad" : "inp ge-in"}
                inputMode="decimal"
                autoComplete="off"
                placeholder="–"
                value={vals[s.id] ?? ""}
                disabled={!sheet.editable}
                aria-invalid={parsed[i]!.v === "bad" || undefined}
                onChange={(e) => setVals((v) => ({ ...v, [s.id]: e.target.value }))}
              />
            </li>
          ))}
        </ul>
        {bad && (
          <p className="f-e" role="alert">
            Noten gehen von 1 bis 6.
          </p>
        )}
        {error && (
          <p className="f-e" role="alert">
            {error}
          </p>
        )}
        {sheet.editable && (
          <div className="pres-a">
            <Button icon="check" busy={busy} disabled={bad} onClick={save}>
              Noten speichern
            </Button>
          </div>
        )}
      </Card>
      {edit && (
        <AssessmentDialog
          initial={{ title: a.title, date: a.date, weight: a.weight }}
          onClose={() => setEdit(false)}
          save={async (body) => {
            const r = await send(`/api/v1/assessments/${encodeURIComponent(a.id)}`, "PATCH", body);
            if ("error" in r) return r.error;
            setEdit(false);
            toast.show("Probe geändert.");
            router.refresh();
            return null;
          }}
          remove={async () => {
            const r = await send(`/api/v1/assessments/${encodeURIComponent(a.id)}`, "DELETE");
            if ("error" in r) return r.error;
            toast.show("Probe gelöscht.");
            router.push(book);
            router.refresh();
            return null;
          }}
        />
      )}
    </>
  );
}
