"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { fileTypeLabel, fmtBytes, fromMin, SOL_STATUS_LABEL, toMin, type SolFile, type SolStatus } from "@bwd/shared";
import { Button, Dialog, DialogActions, Icon, Segment, SelectField, StaticField, TextArea, TextField, useToast } from "@/components/ui";

export function BlockSelect({ blocks, value, tab }: { blocks: number[]; value: number; tab: string }) {
  const router = useRouter();
  return (
    <label className="sel" style={{ minWidth: 140 }}>
      <span className="sr">Block</span>
      <select className="inp" value={value} onChange={(e) => router.push(`/sol?tab=${tab}&block=${e.target.value}`)}>
        {blocks.map((n) => (
          <option key={n} value={n}>
            Block {n}
          </option>
        ))}
      </select>
      <Icon name="chev-d" small />
    </label>
  );
}

/** Fortschritt eines Auftrags: sieht aus wie der Balken, lässt sich mit Maus, Touch und Pfeiltasten in 10er-Schritten setzen. */
/** Stand eines Auftrags: Offen, Angefangen, Erledigt. Speichert sofort, bei Fehler zurück. */
export function StatusControl({ id, title, value }: { id: string; title: string; value: SolStatus }) {
  const [v, setV] = useState(value);
  const router = useRouter();
  const toast = useToast();
  async function set(next: SolStatus) {
    if (next === v) return;
    const before = v;
    setV(next);
    const r = await fetch(`/api/v1/sol/tasks/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: next }) }).catch(() => null);
    if (!r?.ok) {
      setV(before);
      toast.show("Speichern fehlgeschlagen. Versuche es nochmals.");
      return;
    }
    router.refresh();
  }
  return (
    <span className="so-st">
      <Segment label={`Stand ${title}`} value={v} onChange={set} options={(["open", "started", "done"] as const).map((s) => ({ value: s, label: SOL_STATUS_LABEL[s] }))} />
    </span>
  );
}

/** Links einer Datei: "PDF" (Fassung oder Original) und das Original nach Typ ("Word", "Audio" …). */
export function FileLinks({ file: f, label, quick }: { file: SolFile; label: string; quick?: boolean }) {
  const cls = quick ? "fl q" : "fl";
  const type = fileTypeLabel(f.ext);
  const download = !/^(PDF|Audio|Video|Bild)$/.test(type);
  return (
    <>
      {f.pdfHref && (
        <a className={cls} href={f.pdfHref} target="_blank" rel="noopener" aria-label={`${label} als PDF öffnen`}>
          PDF
        </a>
      )}
      <a className={cls} href={f.href} {...(download ? { download: true } : { target: "_blank", rel: "noopener" })} aria-label={`${label} als ${type} ${download ? "herunterladen" : "öffnen"}`}>
        {type}
      </a>
    </>
  );
}

const GROUPS: [SolFile["kind"], string][] = [
  ["task", "Auftrag"],
  ["material", "Unterlagen"],
  ["solution", "Lösungen"],
];

/** Alle Dateien eines Auftrags: Auftrag, Unterlagen, Lösungen, je als PDF und Word. */
export function FilesButton({ title, files }: { title: string; files: SolFile[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="fl" onClick={() => setOpen(true)} aria-label={`Alle ${files.length} Dateien zu ${title}`}>
        {`${files.length} Dateien`}
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title={title}>
        {GROUPS.map(([kind, label]) => {
          const list = files.filter((f) => f.kind === kind);
          if (!list.length) return null;
          return (
            <section key={kind} className="sf" aria-label={label}>
              <h3 className="f-l">{label}</h3>
              {list.map((f) => (
                <div key={f.id} className="sf-r">
                  <span className="sf-n">{f.name}</span>
                  <span className="sf-s">{f.bytes ? fmtBytes(f.bytes) : ""}</span>
                  <FileLinks file={f} label={f.name} />
                </div>
              ))}
            </section>
          );
        })}
        <DialogActions>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Schliessen
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

type TaskOption = { id: string; label: string; short: string; minutes: number };

/** Formular "Einplanen": Auftrag, SOL-Tag, Von, Bis, Notiz. Prüft Zeiten am Feld. */
export function PlanForm({ dayId, dayLabel, dayShort, tasks, lastEnd, plan }: { dayId: string; dayLabel: string; dayShort: string; tasks: TaskOption[]; lastEnd: string; plan: { id: string; label: string }[] }) {
  const router = useRouter();
  const toast = useToast();
  const startDefault = fromMin(Math.min(Math.ceil((toMin(lastEnd) + 5) / 5) * 5, 16 * 60 + 30));
  const [taskId, setTaskId] = useState(tasks[0]?.id ?? "");
  const [from, setFrom] = useState(startDefault);
  const [to, setTo] = useState(fromMin(Math.min(toMin(startDefault) + 30, 17 * 60)));
  const [note, setNote] = useState("");
  const [errs, setErrs] = useState<{ from?: string; to?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const valid = (t: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errs = {};
    if (!valid(from)) next.from = "Zeit als HH:MM eingeben.";
    if (!valid(to)) next.to = "Zeit als HH:MM eingeben.";
    if (!next.from && !next.to) {
      if (toMin(from) < 8 * 60 || toMin(to) > 17 * 60) next.to = "Nur zwischen 08:00 und 17:00.";
      else if (toMin(to) <= toMin(from)) next.to = "Bis muss nach Von liegen.";
    }
    setErrs(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      const r = await fetch("/api/v1/sol/plan", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ solDayId: dayId, taskId, start: from, end: to, note: note || undefined }) });
      if (!r.ok) {
        const b = (await r.json().catch(() => null)) as { error?: { message: string; field?: string } } | null;
        setErrs(b?.error?.field === "start" ? { from: b.error.message } : { form: b?.error?.message ?? "Speichern fehlgeschlagen." });
        return;
      }
      const t = tasks.find((x) => x.id === taskId);
      toast.show(`${t?.label.split(" · ")[0] ?? "Auftrag"} eingeplant, ${dayShort} ${from}.`);
      setNote("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setRemoving(id);
    await fetch(`/api/v1/sol/plan?id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => null);
    setRemoving(null);
    router.refresh();
  }

  return (
    <section className="card form-card" aria-labelledby="pl-h">
      <h2 id="pl-h" className="box-t">
        Einplanen
      </h2>
      {tasks.length === 0 ? (
        <p className="s">Alle Aufträge dieses Blocks sind erledigt.</p>
      ) : (
        <form className="form-card" onSubmit={submit} noValidate>
          <SelectField label="Auftrag" value={taskId} onChange={(e) => setTaskId(e.target.value)}>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </SelectField>
          <StaticField label="SOL-Tag" icon="cal">
            {dayLabel}
          </StaticField>
          <div className="g2">
            <TextField label="Von" value={from} onChange={(e) => setFrom(e.target.value)} inputMode="numeric" placeholder="HH:MM" error={errs.from} />
            <TextField label="Bis" value={to} onChange={(e) => setTo(e.target.value)} inputMode="numeric" placeholder="HH:MM" error={errs.to} />
          </div>
          <TextArea label="Notiz" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />
          {errs.form && (
            <p className="f-e" role="alert">
              {errs.form}
            </p>
          )}
          <Button type="submit" wide busy={busy}>
            Einplanen
          </Button>
        </form>
      )}
      {plan.length > 0 && (
        <details className="plan-list">
          <summary className="s">Mein Plan bearbeiten</summary>
          <ul>
            {plan.map((p) => (
              <li key={p.id}>
                <span>{p.label}</span>
                <Button variant="ghost" small busy={removing === p.id} onClick={() => remove(p.id)}>
                  Entfernen
                </Button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

/** Portfolio: Check-in und Check-out für den nächsten SOL-Tag oder einen bestehenden Eintrag. */
export function PortfolioForm({ solDayId, title, checkIn, checkOut, cancelHref }: { solDayId: string; title: string; checkIn: string; checkOut: string; cancelHref?: string }) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const toast = useToast();
  const [ci, setCi] = useState(checkIn);
  const [co, setCo] = useState(checkOut);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!ci.trim() && !co.trim()) {
      setError("Schreib einen Check-in oder Check-out.");
      return;
    }
    setBusy(true);
    setError("");
    const r = await fetch("/api/v1/sol/portfolio", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ solDayId, checkIn: ci, checkOut: co }) }).catch(() => null);
    setBusy(false);
    if (!r?.ok) return setError("Speichern fehlgeschlagen. Versuche es nochmals.");
    toast.show("Portfolio gespeichert.");
    if (params.get("eintrag")) {
      const p = new URLSearchParams(params);
      p.delete("eintrag");
      router.replace(`${path}?${p.toString()}`, { scroll: false });
    }
    router.refresh();
  }
  return (
    <section className="card form-card" aria-labelledby="pf-h">
      <h2 id="pf-h" className="box-t">
        {title}
      </h2>
      <form className="form-card" onSubmit={save}>
        <TextArea label="Check-in" rows={5} value={ci} onChange={(e) => setCi(e.target.value)} placeholder="Was nimmst du dir heute vor?" maxLength={2000} />
        <TextArea label="Check-out" rows={5} value={co} onChange={(e) => setCo(e.target.value)} placeholder="Was hast du erreicht, was machst du nächstes Mal anders?" maxLength={2000} error={error || undefined} />
        <Button type="submit" wide busy={busy}>
          Speichern
        </Button>
        {cancelHref && (
          <Button variant="ghost" wide onClick={() => router.replace(cancelHref, { scroll: false })}>
            Abbrechen
          </Button>
        )}
      </form>
    </section>
  );
}
