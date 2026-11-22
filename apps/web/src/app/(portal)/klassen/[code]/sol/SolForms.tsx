"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SolFileKind, SolTeacherTask } from "@bwd/shared";
import { Button, Dialog, DialogActions, Icon, SelectField, TextField, useToast } from "@/components/ui";

async function errorOf(res: Response) {
  const b = (await res.json().catch(() => null)) as { error?: { message: string } } | null;
  return b?.error?.message ?? "Das hat nicht geklappt. Versuche es nochmals.";
}

async function call(url: string, method: string, body?: unknown): Promise<string | null> {
  try {
    const res = await fetch(url, { method, headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
    return res.ok ? null : await errorOf(res);
  } catch {
    return "Keine Verbindung. Versuche es nochmals.";
  }
}

export function BlockPick({ blocks, value, base }: { blocks: number[]; value: number; base: string }) {
  const router = useRouter();
  return (
    <label className="sel" style={{ minWidth: 160 }}>
      <span className="sr">Block</span>
      <select className="inp" value={value} onChange={(e) => router.push(`${base}?block=${e.target.value}`)}>
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

type TaskFields = { code: string; title: string; minutes: number; sharepointUrl: string | null };

function TaskDialog({ title, initial, onClose, save, remove }: { title: string; initial?: TaskFields; onClose: () => void; save: (v: TaskFields) => Promise<string | null>; remove?: () => Promise<string | null> }) {
  const [code, setCode] = useState(initial?.code ?? "");
  const [name, setName] = useState(initial?.title ?? "");
  const [minutes, setMinutes] = useState(String(initial?.minutes ?? 45));
  const [url, setUrl] = useState(initial?.sharepointUrl ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ask, setAsk] = useState(false);
  async function run(fn: () => Promise<string | null>) {
    setBusy(true);
    setError("");
    const e = await fn();
    setBusy(false);
    if (e) setError(e);
  }
  return (
    <Dialog open onClose={onClose} title={title}>
      <div className="row2">
        <TextField label="Kürzel" value={code} maxLength={12} placeholder="M5" required onChange={(e) => setCode(e.target.value)} />
        <TextField label="Minuten" value={minutes} inputMode="numeric" required onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ""))} />
      </div>
      <TextField label="Titel" value={name} maxLength={120} required onChange={(e) => setName(e.target.value)} />
      <TextField label="Link zum SOL-Ordner" type="url" value={url} maxLength={500} placeholder="https://" onChange={(e) => setUrl(e.target.value)} />
      {error && (
        <p className="f-e" role="alert">
          {error}
        </p>
      )}
      <DialogActions>
        {remove ? (
          ask ? (
            <Button variant="line" icon="trash" busy={busy} onClick={() => run(remove)}>
              Auftrag und Dateien löschen
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
        <Button icon="check" busy={busy} disabled={!code.trim() || !name.trim() || !minutes} onClick={() => run(() => save({ code, title: name, minutes: Number(minutes), sharepointUrl: url.trim() || null }))}>
          Speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function NewTask({ classCode, block, subject }: { classCode: string; block: number; subject: string }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="line" small icon="plus" onClick={() => setOpen(true)}>
        Neuer Auftrag
      </Button>
      {open && (
        <TaskDialog
          title="Neuer Auftrag"
          onClose={() => setOpen(false)}
          save={async (v) => {
            const e = await call("/api/v1/sol/teacher/tasks", "POST", { ...v, classCode, block, subject });
            if (e) return e;
            setOpen(false);
            toast.show("Auftrag angelegt.");
            router.refresh();
            return null;
          }}
        />
      )}
    </>
  );
}

const KINDS: [SolFileKind, string][] = [
  ["task", "Auftrag"],
  ["material", "Unterlagen"],
  ["solution", "Lösung"],
];

/** Bearbeiten und Datei hochladen für einen Auftrag. */
export function TaskActions({ task }: { task: SolTeacherTask }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState<"edit" | "file" | null>(null);
  const [kind, setKind] = useState<SolFileKind>("task");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const url = `/api/v1/sol/teacher/tasks/${encodeURIComponent(task.id)}`;
  return (
    <span className="kr-act">
      <button className="ib" type="button" aria-label={`Datei zu ${task.code} hochladen`} onClick={() => setOpen("file")}>
        <Icon name="upload" small />
      </button>
      <button className="ib" type="button" aria-label={`${task.code} bearbeiten`} onClick={() => setOpen("edit")}>
        <Icon name="edit" small />
      </button>
      {open === "edit" && (
        <TaskDialog
          title="Auftrag bearbeiten"
          initial={task}
          onClose={() => setOpen(null)}
          save={async (v) => {
            const e = await call(url, "PATCH", v);
            if (e) return e;
            setOpen(null);
            toast.show("Auftrag geändert.");
            router.refresh();
            return null;
          }}
          remove={async () => {
            const e = await call(url, "DELETE");
            if (e) return e;
            setOpen(null);
            toast.show("Auftrag gelöscht.");
            router.refresh();
            return null;
          }}
        />
      )}
      {open === "file" && (
        <Dialog open onClose={() => setOpen(null)} title={`Datei zu ${task.code}`}>
          <SelectField label="Art" value={kind} onChange={(e) => setKind(e.target.value as SolFileKind)}>
            {KINDS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </SelectField>
          <TextField label="Datei" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          {error && (
            <p className="f-e" role="alert">
              {error}
            </p>
          )}
          <DialogActions>
            <Button variant="ghost" onClick={() => setOpen(null)}>
              Abbrechen
            </Button>
            <Button
              icon="upload"
              busy={busy}
              disabled={!file}
              onClick={async () => {
                setBusy(true);
                setError("");
                const fd = new FormData();
                fd.append("file", file!);
                fd.append("kind", kind);
                try {
                  const res = await fetch(`${url}/files`, { method: "POST", body: fd });
                  if (!res.ok) return setError(await errorOf(res));
                  setOpen(null);
                  setFile(null);
                  toast.show("Datei hochgeladen.");
                  router.refresh();
                } catch {
                  setError("Keine Verbindung. Versuche es nochmals.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Hochladen
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </span>
  );
}

export function DeleteTaskFile({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const toast = useToast();
  const [ask, setAsk] = useState(false);
  return ask ? (
    <button
      className="btn btn-line btn-s"
      type="button"
      onClick={async () => {
        const e = await call(`/api/v1/sol/teacher/files/${encodeURIComponent(id)}`, "DELETE");
        if (e) return toast.show(e);
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
