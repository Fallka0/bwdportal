"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { addDays, attachmentRequired, config, DISPENSATION_REASONS, plural, type AbsenceNotice, type Dispensation } from "@bwd/shared";
import { Button, Dialog, DialogActions, Icon, SelectField, TextArea, TextField, useToast } from "@/components/ui";

type DayLesson = { period: number; subjectName: string | null; subjectShort: string | null };
type Reason = (typeof DISPENSATION_REASONS)[number];
type Tab = "abmeldungen" | "dispensationen";

const MAX = 5 * 1024 * 1024;
const periodLabel = (n: number) => {
  const p = config.periods.find((x) => x.n === n);
  return p ? `L${n} · ${p.from} bis ${p.to}` : `L${n}`;
};

export function NewButton({ kind, wide }: { kind: "abmeldung" | "gesuch"; wide?: boolean }) {
  const tab: Tab = kind === "abmeldung" ? "abmeldungen" : "dispensationen";
  return (
    <Link className={wide ? "btn btn-ink btn-wide" : "btn btn-ink"} href={`/absenzen?tab=${tab}&neu=${kind}`} scroll={false}>
      <Icon name="plus" small />
      {kind === "abmeldung" ? "Neue Abmeldung" : "Neues Gesuch"}
    </Link>
  );
}

/** "Bearbeiten" in der Zeile; unter 600 px ist die ganze Zeile der Link. */
export function EditLink({ tab, id, label, row }: { tab: Tab; id: string; label: string; row?: boolean }) {
  const href = `/absenzen?tab=${tab}&bearbeiten=${encodeURIComponent(id)}`;
  if (row) return <Link className="ab-hit" href={href} scroll={false} aria-label={label} />;
  return (
    <Link className="btn btn-line btn-s" href={href} scroll={false} aria-label={label}>
      Bearbeiten
    </Link>
  );
}

/** Öffnet die Dialoge über ?neu=abmeldung, ?neu=gesuch oder ?bearbeiten=<id> (im jeweiligen Tab). */
export function NoticeForms({ today, tab, notices, dispensations }: { today: string; tab: string; notices: AbsenceNotice[]; dispensations: Dispensation[] }) {
  const sp = useSearchParams();
  const neu = sp.get("neu");
  const edit = sp.get("bearbeiten");
  if (neu === "abmeldung") return <NoticeForm key="new" today={today} />;
  if (neu === "gesuch") return <DispensationForm key="new" today={today} />;
  if (edit && tab === "abmeldungen") {
    const n = notices.find((x) => x.id === edit && x.editable);
    return n ? <NoticeForm key={n.id} today={today} notice={n} /> : null;
  }
  if (edit && tab === "dispensationen") {
    const d = dispensations.find((x) => x.id === edit && x.editable);
    return d ? <DispensationForm key={d.id} today={today} dispensation={d} /> : null;
  }
  return null;
}

function useClose(tab: Tab) {
  const router = useRouter();
  const path = usePathname();
  return {
    close: () => router.replace(`${path}?tab=${tab}`, { scroll: false }),
    done: () => {
      router.replace(`${path}?tab=${tab}`, { scroll: false });
      router.refresh();
    },
  };
}

async function send(url: string, method: string, body?: unknown): Promise<string | null> {
  try {
    const res = await fetch(url, { method, headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
    if (res.ok) return null;
    const b = (await res.json().catch(() => null)) as { error?: { message: string } } | null;
    return b?.error?.message ?? "Senden fehlgeschlagen. Versuche es nochmals.";
  } catch {
    return "Keine Verbindung. Versuche es nochmals.";
  }
}

/** Löschen mit Bestätigung im selben Dialog. */
function DeleteAction({ what, url, onDone, onError }: { what: string; url: string; onDone: () => void; onError: (m: string) => void }) {
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!ask)
    return (
      <Button variant="ghost" icon="trash" onClick={() => setAsk(true)}>
        Löschen
      </Button>
    );
  return (
    <Button
      variant="line"
      icon="trash"
      busy={busy}
      onClick={async () => {
        setBusy(true);
        const err = await send(url, "DELETE");
        setBusy(false);
        if (err) return onError(err);
        onDone();
      }}
    >
      {`${what} wirklich löschen`}
    </Button>
  );
}

/** Abmeldung: Datum, von Lektion bis Lektion, Bemerkung (wie im Cockpit der Absenzendatenbank). */
function NoticeForm({ today, notice }: { today: string; notice?: AbsenceNotice }) {
  const { close, done } = useClose("abmeldungen");
  const toast = useToast();
  const [date, setDate] = useState(notice?.date ?? today);
  const [from, setFrom] = useState(notice?.fromPeriod ?? 1);
  const [to, setTo] = useState(notice?.toPeriod ?? config.periods.at(-1)!.n);
  const [note, setNote] = useState(notice?.note ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setError("");
    const body = { date, fromPeriod: from, toPeriod: to, note: note || undefined };
    const err = notice ? await send(`/api/v1/absences/notices/${encodeURIComponent(notice.id)}`, "PATCH", body) : await send("/api/v1/absences/notices", "POST", body);
    setBusy(false);
    if (err) return setError(err);
    toast.show(notice ? "Abmeldung geändert." : "Abmeldung gespeichert.");
    done();
  }

  return (
    <Dialog open onClose={close} title={notice ? "Abmeldung bearbeiten" : "Abmeldung eintragen"}>
      <TextField label="Datum" type="date" value={date} min={notice ? today : addDays(today, -14)} required onChange={(e) => setDate(e.target.value)} />
      <SelectField
        label="Von"
        value={from}
        onChange={(e) => {
          const v = Number(e.target.value);
          setFrom(v);
          if (to < v) setTo(v);
        }}
      >
        {config.periods.map((p) => (
          <option key={p.n} value={p.n}>
            {periodLabel(p.n)}
          </option>
        ))}
      </SelectField>
      <SelectField label="Bis" value={to} onChange={(e) => setTo(Number(e.target.value))}>
        {config.periods
          .filter((p) => p.n >= from)
          .map((p) => (
            <option key={p.n} value={p.n}>
              {periodLabel(p.n)}
            </option>
          ))}
      </SelectField>
      <TextArea label="Bemerkung" value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} />
      {error && (
        <p className="f-e" role="alert">
          {error}
        </p>
      )}
      <DialogActions>
        {notice ? (
          <DeleteAction
            what="Abmeldung"
            url={`/api/v1/absences/notices/${encodeURIComponent(notice.id)}`}
            onError={setError}
            onDone={() => {
              toast.show("Abmeldung gelöscht.");
              done();
            }}
          />
        ) : (
          <Button variant="ghost" onClick={close}>
            Abbrechen
          </Button>
        )}
        <Button icon="check" busy={busy} disabled={!date} onClick={save}>
          Abmeldung speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** Dispensationsgesuch: Datum, Grund, Bemerkung, bis zu zwei Anhänge, Lektionen (Stundenplan oder Sonderstundenplan). */
function DispensationForm({ today, dispensation: dis }: { today: string; dispensation?: Dispensation }) {
  const { close, done } = useClose("dispensationen");
  const toast = useToast();
  const [date, setDate] = useState(dis?.date ?? today);
  const [reason, setReason] = useState<Reason>((dis?.reason as Reason) ?? DISPENSATION_REASONS[0]);
  const [note, setNote] = useState(dis?.note ?? "");
  const [kept, setKept] = useState(dis?.attachments ?? 0);
  const [files, setFiles] = useState<(File | null)[]>([null, null]);
  const [fileError, setFileError] = useState("");
  // Lektionen pro Datum; solange das gewählte Datum fehlt, gilt "lädt"
  const [loaded, setLoaded] = useState<{ date: string; lessons: DayLesson[] } | null>(null);
  const dayLessons = loaded?.date === date ? loaded.lessons : null;
  const [special, setSpecial] = useState(false);
  const [periods, setPeriods] = useState<number[]>(dis?.lessons.map((l) => l.period) ?? []);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    let gone = false;
    fetch(`/api/v1/absences/lessons?date=${date}`)
      .then((r) => (r.ok ? (r.json() as Promise<{ lessons: DayLesson[] }>) : { lessons: [] }))
      .then((b) => !gone && setLoaded({ date, lessons: b.lessons }))
      .catch(() => !gone && setLoaded({ date, lessons: [] }));
    return () => {
      gone = true;
    };
  }, [date]);

  // Ohne Unterricht an dem Tag, mit Sonderstundenplan oder bei gespeicherten Lektionen ausserhalb des Stundenplans: alle Lektionen
  const outside = dayLessons !== null && periods.some((p) => !dayLessons.some((l) => l.period === p));
  const all = special || outside || (dayLessons !== null && dayLessons.length === 0);
  const choices: DayLesson[] = all ? config.periods.map((p) => dayLessons?.find((l) => l.period === p.n) ?? { period: p.n, subjectName: null, subjectShort: null }) : (dayLessons ?? []);
  const toggle = (p: number) => setPeriods((x) => (x.includes(p) ? x.filter((y) => y !== p) : [...x, p].sort((a, b) => a - b)));
  const slots = 2 - kept;
  const picked = files.slice(0, slots).filter((f): f is File => !!f);

  async function save() {
    if (!periods.length) return;
    if (attachmentRequired(reason) && kept + picked.length === 0) return setFileError("Hänge eine Bestätigung an.");
    setBusy(true);
    setError("");
    try {
      const attachmentKeys: string[] = [];
      for (const f of picked) {
        const fd = new FormData();
        fd.append("file", f);
        const up = await fetch("/api/v1/absences/attachment", { method: "POST", body: fd });
        const b = (await up.json().catch(() => null)) as { key?: string; error?: { message: string } } | null;
        if (!up.ok || !b?.key) return setFileError(b?.error?.message ?? "Hochladen fehlgeschlagen.");
        attachmentKeys.push(b.key);
      }
      const body = { date, reason, note: note || undefined, periods, attachmentKeys, keepAttachments: kept > 0 };
      const err = dis ? await send(`/api/v1/absences/dispensations/${encodeURIComponent(dis.id)}`, "PATCH", body) : await send("/api/v1/absences/dispensations", "POST", body);
      if (err) return setError(err);
      toast.show(dis ? "Gesuch geändert." : "Gesuch eingereicht.");
      done();
    } catch {
      setError("Keine Verbindung. Versuche es nochmals.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onClose={close} title={dis ? "Dispensationsgesuch bearbeiten" : "Dispensationsgesuch einreichen"}>
      <TextField
        label="Datum"
        type="date"
        value={date}
        required
        onChange={(e) => {
          setDate(e.target.value);
          setPeriods([]);
        }}
      />
      <SelectField label="Grund" value={reason} onChange={(e) => setReason(e.target.value as Reason)}>
        {DISPENSATION_REASONS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </SelectField>
      <TextArea label="Bemerkung" value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} />

      {kept > 0 && (
        <div className="upl">
          <Icon name="clip" />
          <span>
            <b>{plural(kept, "Anhang", "Anhänge")} gespeichert</b>
          </span>
          <button type="button" className="ib x" aria-label="Gespeicherte Anhänge entfernen" onClick={() => setKept(0)}>
            <Icon name="x" small />
          </button>
        </div>
      )}
      {Array.from({ length: slots }, (_, i) => (
        <label key={i} className="upl">
          <Icon name="clip" />
          <span>
            <b>{files[i] ? files[i]!.name : `Anhang ${kept + i + 1} hochladen`}</b>
          </span>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFileError("");
              if (f && f.size > MAX) {
                setFileError("Die Datei ist grösser als 5 MB.");
                e.target.value = "";
                return;
              }
              setFiles((x) => x.map((y, j) => (j === i ? f : y)));
            }}
          />
          {files[i] && (
            <button type="button" className="ib x" aria-label={`Anhang ${kept + i + 1} entfernen`} onClick={(e) => (e.preventDefault(), setFiles((x) => x.map((y, j) => (j === i ? null : y))))}>
              <Icon name="x" small />
            </button>
          )}
        </label>
      ))}
      {fileError && (
        <p className="f-e" role="alert">
          {fileError}
        </p>
      )}

      <fieldset className="f">
        <legend className="f-l">Zu dispensierende Lektionen</legend>
        {dayLessons === null ? (
          <p className="s">Lektionen werden geladen.</p>
        ) : (
          <div className="lessons">
            {choices.map((l) => (
              <button key={l.period} type="button" aria-pressed={periods.includes(l.period)} onClick={() => toggle(l.period)}>
                <b>L{l.period}</b>
                <span>{l.subjectShort ?? config.periods.find((p) => p.n === l.period)?.from ?? ""}</span>
              </button>
            ))}
          </div>
        )}
        {dayLessons !== null && dayLessons.length > 0 && !outside && (
          <div>
            <Button variant="ghost" small aria-pressed={special} onClick={() => setSpecial((x) => !x)}>
              Sonderstundenplan
            </Button>
          </div>
        )}
      </fieldset>

      {error && (
        <p className="f-e" role="alert">
          {error}
        </p>
      )}
      <DialogActions>
        {dis ? (
          <DeleteAction
            what="Gesuch"
            url={`/api/v1/absences/dispensations/${encodeURIComponent(dis.id)}`}
            onError={setError}
            onDone={() => {
              toast.show("Gesuch gelöscht.");
              done();
            }}
          />
        ) : (
          <Button variant="ghost" onClick={close}>
            Abbrechen
          </Button>
        )}
        <Button icon="send" busy={busy} disabled={!periods.length} onClick={save}>
          {dis ? "Gesuch speichern" : periods.length ? `${plural(periods.length, "Lektion", "Lektionen")} beantragen` : "Gesuch einreichen"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
