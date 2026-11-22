"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { fmtBytes, type Subject } from "@bwd/shared";
import { Button, Card, Dialog, DialogActions, Icon, SelectField, TextArea, TextField, useToast } from "@/components/ui";

type Option = { code: string | null; name: string };

async function errorOf(res: Response, fallback: string) {
  const b = (await res.json().catch(() => null)) as { error?: { message: string } } | null;
  return b?.error?.message ?? fallback;
}

async function upload(file: File, classCode: string, subject: string | null): Promise<{ id: string } | { error: string }> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("classCode", classCode);
  fd.append("subject", subject ?? "");
  try {
    const res = await fetch("/api/v1/classroom/files", { method: "POST", body: fd });
    if (!res.ok) return { error: `${file.name}: ${await errorOf(res, "Hochladen fehlgeschlagen.")}` };
    return (await res.json()) as { id: string };
  } catch {
    return { error: "Keine Verbindung. Versuche es nochmals." };
  }
}

const key = (o: Option) => o.code ?? "";

function ForSelect({ options, value, onChange }: { options: Option[]; value: string; onChange: (v: string) => void }) {
  return (
    <SelectField label="Für" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={key(o)} value={key(o)}>
          {o.name}
        </option>
      ))}
    </SelectField>
  );
}

/** Neuer Beitrag: Fach (oder ganze Klasse), Text, Dateien. Dateien werden zuerst hochgeladen, dann angehängt. */
export function Composer({ classCode, options }: { classCode: string; options: Option[] }) {
  const router = useRouter();
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [subject, setSubject] = useState(key(options[0]!));
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function send() {
    setBusy(true);
    setError("");
    const ids: string[] = [];
    for (const f of files) {
      const r = await upload(f, classCode, subject || null);
      if ("error" in r) {
        setBusy(false);
        return setError(r.error);
      }
      ids.push(r.id);
    }
    try {
      const res = await fetch("/api/v1/classroom/posts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ classCode, subject: subject || null, body, fileIds: ids }) });
      if (!res.ok) return setError(await errorOf(res, "Senden fehlgeschlagen. Versuche es nochmals."));
      setBody("");
      setFiles([]);
      toast.show("Beitrag gesendet.");
      router.refresh();
    } catch {
      setError("Keine Verbindung. Versuche es nochmals.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card aria-labelledby="kr-new-h" className="kr-new">
      <h2 id="kr-new-h" className="sr">
        Neuer Beitrag
      </h2>
      {options.length > 1 && <ForSelect options={options} value={subject} onChange={setSubject} />}
      <TextArea label="Beitrag" value={body} maxLength={5000} rows={4} disabled={busy} onChange={(e) => setBody(e.target.value)} />
      {files.length > 0 && (
        <ul className="kr-files">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="kr-file">
              <Icon name="clip" small />
              <span>
                <b>{f.name}</b>
                <span>{fmtBytes(f.size)}</span>
              </span>
              <button className="ib" type="button" aria-label={`${f.name} entfernen`} onClick={() => setFiles((x) => x.filter((_, j) => j !== i))}>
                <Icon name="x" small />
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p className="f-e" role="alert">
          {error}
        </p>
      )}
      <div className="kr-new-a">
        <input ref={input} type="file" multiple hidden onChange={(e) => setFiles((x) => [...x, ...Array.from(e.target.files ?? [])].slice(0, 10))} />
        <Button variant="line" icon="clip" onClick={() => input.current?.click()}>
          Datei anhängen
        </Button>
        <Button icon="send" busy={busy} disabled={!body.trim()} onClick={send}>
          Senden
        </Button>
      </div>
    </Card>
  );
}

/** Bearbeiten (nur verfasst) und Löschen (verfasst oder Klassenlehrperson). */
export function PostActions({ id, body, mine }: { id: string; body: string; mine: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState<"edit" | "delete" | null>(null);
  const [text, setText] = useState(body);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function run(method: "PATCH" | "DELETE") {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/v1/classroom/posts/${encodeURIComponent(id)}`, { method, headers: method === "PATCH" ? { "content-type": "application/json" } : undefined, body: method === "PATCH" ? JSON.stringify({ body: text }) : undefined });
      if (!res.ok) return setError(await errorOf(res, "Das hat nicht geklappt. Versuche es nochmals."));
      setOpen(null);
      toast.show(method === "PATCH" ? "Beitrag geändert." : "Beitrag gelöscht.");
      router.refresh();
    } catch {
      setError("Keine Verbindung. Versuche es nochmals.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <span className="kr-act">
      {mine && (
        <button className="ib" type="button" aria-label="Beitrag bearbeiten" onClick={() => setOpen("edit")}>
          <Icon name="edit" small />
        </button>
      )}
      <button className="ib" type="button" aria-label="Beitrag löschen" onClick={() => setOpen("delete")}>
        <Icon name="trash" small />
      </button>
      {open === "edit" && (
        <Dialog open onClose={() => setOpen(null)} title="Beitrag bearbeiten">
          <TextArea label="Beitrag" value={text} maxLength={5000} rows={6} onChange={(e) => setText(e.target.value)} />
          {error && (
            <p className="f-e" role="alert">
              {error}
            </p>
          )}
          <DialogActions>
            <Button variant="ghost" onClick={() => setOpen(null)}>
              Abbrechen
            </Button>
            <Button icon="check" busy={busy} disabled={!text.trim()} onClick={() => run("PATCH")}>
              Speichern
            </Button>
          </DialogActions>
        </Dialog>
      )}
      {open === "delete" && (
        <Dialog open onClose={() => setOpen(null)} title="Beitrag löschen?">
          <p>Der Beitrag und seine Dateien werden gelöscht.</p>
          {error && (
            <p className="f-e" role="alert">
              {error}
            </p>
          )}
          <DialogActions>
            <Button variant="ghost" onClick={() => setOpen(null)}>
              Abbrechen
            </Button>
            <Button variant="line" icon="trash" busy={busy} onClick={() => run("DELETE")}>
              Löschen
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </span>
  );
}

export function DeleteFile({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const toast = useToast();
  const [ask, setAsk] = useState(false);
  return ask ? (
    <button
      className="btn btn-line btn-s"
      type="button"
      onClick={async () => {
        const res = await fetch(`/api/v1/classroom/files/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => null);
        if (!res?.ok) return toast.show("Löschen fehlgeschlagen.");
        toast.show("Datei gelöscht.");
        router.refresh();
      }}
    >
      Löschen
    </button>
  ) : (
    <button className="ib" type="button" aria-label={`${name} löschen`} onClick={() => setAsk(true)}>
      <Icon name="trash" small />
    </button>
  );
}

/** Einzelne Datei ablegen (ohne Beitrag). */
export function UploadFile({ classCode, options }: { classCode: string; options: Option[] }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState(key(options[0]!));
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <>
      <Button variant="line" small icon="upload" onClick={() => setOpen(true)}>
        Hochladen
      </Button>
      {open && (
        <Dialog open onClose={() => setOpen(false)} title="Datei hochladen">
          {options.length > 1 && <ForSelect options={options} value={subject} onChange={setSubject} />}
          <TextField label="Datei" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          {error && (
            <p className="f-e" role="alert">
              {error}
            </p>
          )}
          <DialogActions>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button
              icon="upload"
              busy={busy}
              disabled={!file}
              onClick={async () => {
                setBusy(true);
                setError("");
                const r = await upload(file!, classCode, subject || null);
                setBusy(false);
                if ("error" in r) return setError(r.error);
                setOpen(false);
                setFile(null);
                toast.show("Datei hochgeladen.");
                router.refresh();
              }}
            >
              Hochladen
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}

export function SubjectFilter({ subjects, value }: { subjects: Subject[]; value: string | null }) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  return (
    <label className="sel">
      <span className="sr">Fach</span>
      <select
        className="inp"
        value={value ?? ""}
        onChange={(e) => {
          const q = new URLSearchParams(sp.toString());
          if (e.target.value) q.set("fach", e.target.value);
          else q.delete("fach");
          router.push(q.size ? `${path}?${q}` : path);
        }}
      >
        <option value="">Alle Fächer</option>
        {subjects.map((s) => (
          <option key={s.code} value={s.code}>
            {s.name}
          </option>
        ))}
      </select>
      <Icon name="chev-d" small />
    </label>
  );
}
