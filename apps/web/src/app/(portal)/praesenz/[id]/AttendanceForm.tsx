"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AttendanceSheet } from "@bwd/shared";
import { Button, Card, useToast } from "@/components/ui";

/** Klassenliste: pro Person anwesend oder abwesend. Abgemeldete und Dispensierte sind beim ersten Erfassen abwesend. */
export function AttendanceForm({ sheet }: { sheet: AttendanceSheet }) {
  const router = useRouter();
  const toast = useToast();
  const first = !sheet.slot.checked;
  const [absent, setAbsent] = useState(() => new Set(sheet.students.filter((s) => s.absent || (first && (s.notice || s.dispensed))).map((s) => s.id)));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (id: string, on: boolean) =>
    setAbsent((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  async function save() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/v1/attendance/${encodeURIComponent(sheet.slot.id)}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ absent: [...absent] }),
      });
      if (!res.ok) {
        const b = (await res.json().catch(() => null)) as { error?: { message: string } } | null;
        setError(b?.error?.message ?? "Speichern fehlgeschlagen. Versuche es nochmals.");
        return;
      }
      toast.show(absent.size === 0 ? "Präsenz gespeichert: alle da." : `Präsenz gespeichert: ${absent.size === 1 ? "1 fehlt" : `${absent.size} fehlen`}.`);
      router.push("/praesenz");
      router.refresh();
    } catch {
      setError("Keine Verbindung. Versuche es nochmals.");
    } finally {
      setBusy(false);
    }
  }

  if (!sheet.students.length) return <p className="empty-s">Keine Lernenden in dieser Klasse.</p>;

  return (
    <Card aria-labelledby="pr-h">
      <div className="row-h">
        <h2 id="pr-h" className="box-t">
          {sheet.students.length - absent.size} von {sheet.students.length} anwesend
        </h2>
        {sheet.editable && absent.size > 0 && (
          <Button variant="line" small onClick={() => setAbsent(new Set())}>
            Alle anwesend
          </Button>
        )}
      </div>
      <ul className="pres">
        {sheet.students.map((s) => {
          const off = absent.has(s.id);
          return (
            <li key={s.id} className={off ? "off" : undefined}>
              <span className="av" aria-hidden="true">
                {s.initials}
              </span>
              <span className="pres-n">
                <b>{s.name}</b>
                {(s.notice || s.dispensed) && <span className="s">{s.dispensed ? "Dispensiert" : "Abgemeldet"}</span>}
              </span>
              <span className="seg" role="group" aria-label={s.name}>
                <button type="button" aria-pressed={!off} disabled={!sheet.editable} onClick={() => set(s.id, false)}>
                  Anwesend
                </button>
                <button type="button" aria-pressed={off} disabled={!sheet.editable} onClick={() => set(s.id, true)}>
                  Abwesend
                </button>
              </span>
            </li>
          );
        })}
      </ul>
      {error && (
        <p className="f-e" role="alert">
          {error}
        </p>
      )}
      {sheet.editable ? (
        <div className="pres-a">
          <Button icon="check" busy={busy} onClick={save}>
            Präsenz speichern
          </Button>
        </div>
      ) : (
        <p className="empty-s">Erfassen ab dem Tag der Lektion.</p>
      )}
    </Card>
  );
}
