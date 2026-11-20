import { BM_SUBJECTS, plural, type PortfolioEntry } from "@bwd/shared";
import { ApiFailure } from "@bwd/shared/api";
import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";
import { View } from "react-native";
import { api, API_URL } from "@/lib/api";
import { storage } from "@/lib/storage";
import { sp } from "@/theme";
import { Button, SelectField, Sheet, T, TextField, useToast } from "@/ui";

const message = (e: unknown, fallback: string) => (e instanceof ApiFailure ? e.message : fallback);
const num = (v: string) => Number(v.replace(",", "."));

/** Neue Note oder Note bearbeiten (mit Löschen). Fach und Modul sind fest, wenn sie vorgegeben sind. */
export function GradeSheet({ semester, subject, module, entry, onClose, onDone }: { semester: number; subject?: string; module?: string | null; entry?: PortfolioEntry; onClose: () => void; onDone: () => Promise<void> }) {
  const toast = useToast();
  const [sem, setSem] = useState(String(semester));
  const [code, setCode] = useState<string>(subject ?? BM_SUBJECTS[0].code);
  const [mod, setMod] = useState(module ?? "");
  const [title, setTitle] = useState(entry?.title ?? "");
  const [value, setValue] = useState(entry ? String(entry.value) : "");
  const [weight, setWeight] = useState(entry ? String(entry.weight) : "1");
  const [date, setDate] = useState(entry?.date ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ask, setAsk] = useState(false);

  async function save() {
    setBusy(true);
    setError("");
    try {
      const body = { semester: Number(sem), subject: code, module: code === "IN" ? mod : null, title, value: num(value), weight: num(weight), date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null };
      if (entry) await api.updateGrade(entry.id, body);
      else await api.addGrade(body);
      toast.show(entry ? "Note geändert." : "Note gespeichert.");
      await onDone();
    } catch (e) {
      setError(message(e, "Speichern fehlgeschlagen. Versuche es nochmals."));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await api.deleteGrade(entry!.id);
      toast.show("Note gelöscht.");
      await onDone();
    } catch (e) {
      setError(message(e, "Löschen fehlgeschlagen. Versuche es nochmals."));
    } finally {
      setBusy(false);
    }
  }

  const subjects = [...BM_SUBJECTS, ...(subject && !BM_SUBJECTS.some((b) => b.code === subject) ? [{ code: subject, name: subject }] : [])];
  return (
    <Sheet
      open
      onClose={onClose}
      title={entry ? "Note bearbeiten" : "Neue Note"}
      actions={
        <>
          {entry ? (
            ask ? (
              <Button label="Note wirklich löschen" variant="line" icon="trash" busy={busy} onPress={remove} />
            ) : (
              <Button label="Löschen" variant="ghost" icon="trash" onPress={() => setAsk(true)} />
            )
          ) : (
            <Button label="Abbrechen" variant="ghost" onPress={onClose} />
          )}
          <Button label="Note speichern" icon="check" haptic busy={busy} disabled={!title.trim() || !value || (code === "IN" && mod.length !== 3)} onPress={save} />
        </>
      }
    >
      <SelectField label="Semester" value={sem} onChange={setSem} options={[1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: `${n}. Semester` }))} />
      {!subject && <SelectField label="Fach" value={code} onChange={setCode} options={subjects.map((b) => ({ value: b.code, label: b.name }))} />}
      {code === "IN" && !module && <TextField label="Modul" value={mod} keyboardType="number-pad" maxLength={3} placeholder="320" onChangeText={(t) => setMod(t.replace(/\D/g, ""))} />}
      <TextField label="Titel" value={title} maxLength={80} onChangeText={setTitle} />
      <View style={{ flexDirection: "row", gap: sp[5] }}>
        <View style={{ flex: 1 }}>
          <TextField label="Note" value={value} keyboardType="decimal-pad" onChangeText={setValue} />
        </View>
        <View style={{ flex: 1 }}>
          <TextField label="Gewicht" value={weight} keyboardType="decimal-pad" onChangeText={setWeight} />
        </View>
      </View>
      <TextField label="Datum (JJJJ-MM-TT)" value={date} maxLength={10} keyboardType="numbers-and-punctuation" placeholder="2026-11-20" onChangeText={setDate} />
      {!!error && (
        <T v="smallStrong" tone="err" accessibilityRole="alert">
          {error}
        </T>
      )}
    </Sheet>
  );
}

/** Notenportfolio (.xlsx) wählen und hochladen. Ersetzt alle Noten. */
export function ImportSheet({ onClose, onDone }: { onClose: () => void; onDone: () => Promise<void> }) {
  const toast = useToast();
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function pick() {
    setError("");
    const r = await DocumentPicker.getDocumentAsync({ type: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"], copyToCacheDirectory: true });
    if (!r.canceled) setFile(r.assets[0]!);
  }

  async function upload() {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      if (file.file) fd.append("file", file.file);
      else fd.append("file", { uri: file.uri, name: file.name, type: file.mimeType ?? "application/octet-stream" } as unknown as Blob);
      const token = await storage.get("session");
      const res = await fetch(`${API_URL}/api/v1/grades/import`, { method: "POST", body: fd, headers: token ? { authorization: `Bearer ${token}` } : {} });
      const b = (await res.json().catch(() => null)) as { entries?: number; semesters?: number; nameMatches?: boolean; error?: { message: string } } | null;
      if (!res.ok || !b || b.entries === undefined) return setError(b?.error?.message ?? "Import fehlgeschlagen. Versuche es nochmals.");
      toast.show(`${plural(b.entries, "Note", "Noten")} aus ${plural(b.semesters ?? 0, "Semester", "Semestern")} übernommen.${b.nameMatches ? "" : " Der Name in der Datei passt nicht zu deinem Konto."}`);
      await onDone();
    } catch {
      setError("Keine Verbindung. Versuche es nochmals.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title="Notenportfolio importieren"
      actions={
        <>
          <Button label="Abbrechen" variant="ghost" onPress={onClose} />
          <Button label="Importieren" icon="upload" busy={busy} disabled={!file} onPress={upload} />
        </>
      }
    >
      <Button label={file ? file.name : "Notenportfolio (.xlsx) wählen"} variant="line" icon="clip" wide onPress={pick} />
      <T v="small">Ersetzt alle Noten und die EFZ-Übersicht im Portal.</T>
      {!!error && (
        <T v="smallStrong" tone="err" accessibilityRole="alert">
          {error}
        </T>
      )}
    </Sheet>
  );
}

/** Note eines EFZ-Moduls setzen oder leeren. */
export function EfzSheet({ id, label, value, onClose, onDone }: { id: string; label: string; value: number | null; onClose: () => void; onDone: () => Promise<void> }) {
  const [v, setV] = useState(value === null ? "" : String(value));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function save() {
    const next = v.trim() === "" ? null : num(v);
    if (next !== null && (Number.isNaN(next) || next < 1 || next > 6)) return setError("Noten gehen von 1 bis 6.");
    setBusy(true);
    try {
      await api.setEfz(id, next);
      await onDone();
    } catch (e) {
      setError(message(e, "Speichern fehlgeschlagen. Versuche es nochmals."));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Sheet
      open
      onClose={onClose}
      title={label}
      actions={
        <>
          <Button label="Abbrechen" variant="ghost" onPress={onClose} />
          <Button label="Speichern" icon="check" busy={busy} onPress={save} />
        </>
      }
    >
      <TextField label="Note" value={v} keyboardType="decimal-pad" placeholder="leer = noch keine Note" onChangeText={setV} />
      {!!error && (
        <T v="smallStrong" tone="err" accessibilityRole="alert">
          {error}
        </T>
      )}
    </Sheet>
  );
}
