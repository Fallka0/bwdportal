"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ABSENCE_REASONS, absenceDueDate, fmtMedium, fmtShortLoose, fmtWeekdayShort, plural } from "@bwd/shared";
import { Button, Dialog, DialogActions, Icon, Segment, SelectField, StaticField, useToast } from "@/components/ui";

type DayLesson = { period: number; subjectCode: string | null; subjectName: string | null; subjectShort: string | null };
type OpenAbsence = { id: string; date: string; dueDate: string | null; periods: number[]; dayLessons: DayLesson[] };
type Day = { date: string; lessons: DayLesson[] };
type Initial = { kind: "excuse"; id: string } | { kind: "report" } | null;
type Reason = (typeof ABSENCE_REASONS)[number];

const MAX = 5 * 1024 * 1024;

/** Fachname auf dem Lektionen-Knopf: ausgeschrieben bis 12 Zeichen, sonst Kurzform (W&R, G&P). */
const lessonLabel = (l: DayLesson) => (l.subjectName && l.subjectName.length <= 12 ? l.subjectName : (l.subjectShort ?? l.subjectName ?? "SOL"));

export function ReportButton({ wide }: { wide?: boolean }) {
  return (
    <Link className={wide ? "btn btn-ink btn-wide" : "btn btn-ink"} href="/absenzen?melden=1" scroll={false}>
      <Icon name="plus" small />
      Absenz melden
    </Link>
  );
}

/** Knopf "Entschuldigen" (Web) oder, mit `row`, die ganze Zeile als Fläche (unter 600 px, wie in der App). */
export function ExcuseButton({ id, date, row }: { id: string; date: string; row?: boolean }) {
  const label = `Absenz vom ${fmtWeekdayShort(date)} entschuldigen`;
  if (row) return <Link className="ab-hit" href={`/absenzen?entschuldigen=${id}`} scroll={false} aria-label={label} />;
  return (
    <Link className="btn btn-line btn-s" href={`/absenzen?entschuldigen=${id}`} scroll={false} aria-label={label}>
      Entschuldigen
    </Link>
  );
}

/** Dialog "Absenz entschuldigen": Datum mit Frist, Lektionen wählen, Grund, Bestätigung anhängen, Absenden. */
export function AbsenceActions({ open, days, initial }: { open: OpenAbsence[]; days: Day[]; initial: Initial }) {
  const params = useSearchParams();
  const excuseId = params.get("entschuldigen") ?? (initial?.kind === "excuse" ? initial.id : null);
  const report = params.get("melden") === "1";
  const target = excuseId ? open.find((a) => a.id === excuseId) : undefined;
  const isOpen = !!target || report;
  // Schlüssel: bei neuem Ziel startet das Formular frisch
  const key = target ? `e-${target.id}` : report ? "r" : "none";
  return isOpen ? <AbsenceForm key={key} target={target} days={days} /> : null;
}

function AbsenceForm({ target, days }: { target?: OpenAbsence; days: Day[] }) {
  const router = useRouter();
  const path = usePathname();
  const toast = useToast();
  const [date, setDate] = useState(target?.date ?? days[0]?.date ?? "");
  const dayLessons = target ? target.dayLessons : (days.find((d) => d.date === date)?.lessons ?? []);
  const [periods, setPeriods] = useState<number[]>(target?.periods ?? []);
  const [reason, setReason] = useState<Reason>("Krankheit");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const close = () => router.replace(path, { scroll: false });
  const due = target?.dueDate ?? (date ? absenceDueDate(date) : null);
  const toggle = (p: number) => setPeriods((x) => (x.includes(p) ? x.filter((y) => y !== p) : [...x, p].sort((a, b) => a - b)));

  async function send() {
    if (!periods.length) return;
    setBusy(true);
    setError("");
    try {
      let attachmentKey: string | undefined;
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        const up = await fetch("/api/v1/absences/attachment", { method: "POST", body: fd });
        const body = (await up.json().catch(() => null)) as { key?: string; error?: { message: string } } | null;
        if (!up.ok || !body?.key) {
          setFileError(body?.error?.message ?? "Hochladen fehlgeschlagen.");
          return;
        }
        attachmentKey = body.key;
      }
      const res = await fetch("/api/v1/absences", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(target ? { absenceId: target.id, periods, reason, attachmentKey } : { date, periods, reason, attachmentKey }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: { message: string } } | null;
        setError(body?.error?.message ?? "Senden fehlgeschlagen. Versuche es nochmals.");
        return;
      }
      toast.show("Absenz gesendet. Deine Klassenlehrperson prüft sie.");
      router.replace(path, { scroll: false });
      router.refresh();
    } catch {
      setError("Keine Verbindung. Versuche es nochmals.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onClose={close} title="Absenz entschuldigen">
      {target ? (
        <StaticField label="Datum" icon="cal">
          <span style={{ whiteSpace: "nowrap" }}>{fmtMedium(target.date, true)}</span>
          <span style={{ flex: 1 }} />
          {due && <span className="s">Frist {fmtShortLoose(due)}</span>}
        </StaticField>
      ) : days.length ? (
        <SelectField
          label="Datum"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setPeriods([]);
          }}
        >
          {days.map((d) => (
            <option key={d.date} value={d.date}>
              {fmtMedium(d.date, true)} · Frist {fmtShortLoose(absenceDueDate(d.date))}
            </option>
          ))}
        </SelectField>
      ) : (
        <p className="s">In den letzten 14 Tagen gab es keinen Unterricht.</p>
      )}

      {dayLessons.length > 0 && (
        <fieldset className="f">
          <legend className="f-l">Lektionen</legend>
          <div className="lessons">
            {dayLessons.map((l) => (
              <button key={l.period} type="button" aria-pressed={periods.includes(l.period)} onClick={() => toggle(l.period)}>
                <b>{l.period}. Lektion</b>
                <span>{lessonLabel(l)}</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset className="f">
        <legend className="f-l">Grund</legend>
        <div style={{ justifySelf: "start" }}>
          <Segment label="Grund" value={reason} onChange={setReason} options={ABSENCE_REASONS.map((r) => ({ value: r, label: r }))} />
        </div>
      </fieldset>

      <div className="f">
        <label className="upl">
          <Icon name="clip" />
          <span>
            <b>{file ? file.name : "Bestätigung anhängen"}</b> {file ? "" : "· ab 3 Tagen ein Arztzeugnis"}
          </span>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            aria-describedby={fileError ? "upl-e" : undefined}
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFileError("");
              if (f && f.size > MAX) {
                setFileError("Die Datei ist grösser als 5 MB.");
                e.target.value = "";
                return;
              }
              setFile(f);
            }}
          />
          {file && (
            <button type="button" className="ib x" aria-label="Anhang entfernen" onClick={(e) => (e.preventDefault(), setFile(null))}>
              <Icon name="x" small />
            </button>
          )}
        </label>
        {fileError && (
          <span className="f-e" id="upl-e">
            {fileError}
          </span>
        )}
      </div>

      {error && (
        <p className="f-e" role="alert">
          {error}
        </p>
      )}

      <DialogActions>
        <Button variant="ghost" onClick={close}>
          Abbrechen
        </Button>
        <Button icon="send" busy={busy} disabled={!periods.length} onClick={send}>
          {plural(periods.length, "Lektion", "Lektionen")} entschuldigen
        </Button>
      </DialogActions>
    </Dialog>
  );
}
