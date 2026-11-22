import { daysBetween, fmtDate, getNow, WEEKDAYS_SHORT, weekday, type TestItem } from "@bwd/shared";
import { ApiFailure } from "@bwd/shared/api";
import { useState } from "react";
import { View } from "react-native";
import { api } from "@/lib/api";
import { useMe } from "@/lib/me";
import { useApi } from "@/lib/useApi";
import { ErrorState, Screen } from "@/shell/Screen";
import { sp } from "@/theme";
import { Button, Card, Empty, Segment, SelectField, Sheet, SkBox, SkeletonArea, T, TextField, useToast } from "@/ui";

const rel = (date: string, today: string) => {
  const d = daysBetween(today, date);
  return d === 0 ? "Heute" : d === 1 ? "Morgen" : d > 1 && d < 14 ? `In ${d} Tagen` : "";
};

/** Prüfungen: Klasse und eigene; Lehrpersonen erfassen für ihre Klassen, Lernende eigene. */
export default function Tests() {
  const [view, setView] = useState<"next" | "past">("next");
  const t = useApi(() => api.tests({ past: view === "past" }), [view], { cache: `tests-${view}` });
  const [edit, setEdit] = useState<TestItem | "new" | null>(null);
  const today = getNow().date;
  return (
    <Screen title="Prüfungen" back={{ label: "Mehr", href: "/mehr" }} onRefresh={t.refresh} refreshing={t.refreshing}>
      <View style={{ gap: sp[5] }}>
        <Segment
          label="Ansicht"
          value={view}
          options={[
            { value: "next", label: "Bevorstehend" },
            { value: "past", label: "Vergangen" },
          ]}
          onChange={setView}
        />
        <Button label="Neue Prüfung" icon="plus" wide onPress={() => setEdit("new")} />
        {t.error && !t.data ? (
          <ErrorState message={t.error} onRetry={t.reload} />
        ) : !t.data ? (
          <SkeletonArea label="Prüfungen werden geladen">
            <SkBox h={200} />
          </SkeletonArea>
        ) : t.data.tests.length === 0 ? (
          <Empty icon="cal" title={view === "past" ? "Keine vergangenen Prüfungen." : "Keine Prüfungen geplant."} />
        ) : (
          <Card>
            <View style={{ gap: sp[6] }}>
              {t.data.tests.map((x) => (
                <View key={x.id} style={{ gap: sp[1] }}>
                  <T v="small">
                    {[`${WEEKDAYS_SHORT[weekday(x.date)]} ${fmtDate(x.date)}`, view === "next" ? rel(x.date, today) : ""].filter(Boolean).join(" · ")}
                  </T>
                  <T v="strong">
                    {x.subject.name} · {x.title}
                  </T>
                  <T v="small">{x.classCode ? [x.classCode, x.author].filter(Boolean).join(" · ") : "Eigene Prüfung"}</T>
                  {x.description ? <T>{x.description}</T> : null}
                  {x.mine && <Button label="Bearbeiten" variant="line" small onPress={() => setEdit(x)} style={{ alignSelf: "flex-start", marginTop: sp[2] }} />}
                </View>
              ))}
            </View>
          </Card>
        )}
      </View>
      {edit && <TestSheet test={edit === "new" ? undefined : edit} onClose={() => setEdit(null)} onDone={async () => (setEdit(null), await t.refresh())} />}
    </Screen>
  );
}

function TestSheet({ test, onClose, onDone }: { test?: TestItem; onClose: () => void; onDone: () => Promise<void> }) {
  const toast = useToast();
  const teacher = useMe().data?.role === "teacher";
  const o = useApi(() => api.testOptions(), []);
  const pairs = o.data?.classes.map((c) => ({ value: `${c.classCode}|${c.subject.code}`, label: `${c.subject.name} · ${c.classCode}` })) ?? [];
  const subjects = o.data?.subjects.map((s) => ({ value: s.code, label: s.name })) ?? [];
  const [pair, setPair] = useState(test?.classCode ? `${test.classCode}|${test.subject.code}` : "");
  const [subject, setSubject] = useState(test?.subject.code ?? "");
  const [date, setDate] = useState(test?.date ?? "");
  const [title, setTitle] = useState(test?.title ?? "");
  const [description, setDescription] = useState(test?.description ?? "");
  const [busy, setBusy] = useState(false);
  const [ask, setAsk] = useState(false);
  const [error, setError] = useState("");
  const chosenPair = pair || pairs[0]?.value || "";
  const chosenSubject = subject || subjects[0]?.value || "";

  async function run(fn: () => Promise<unknown>, done: string) {
    setBusy(true);
    setError("");
    try {
      await fn();
      toast.show(done);
      await onDone();
    } catch (e) {
      setError(e instanceof ApiFailure ? e.message : "Speichern fehlgeschlagen. Versuche es nochmals.");
    } finally {
      setBusy(false);
    }
  }
  const body = () => {
    const [classCode, s] = chosenPair.split("|");
    return { date, title, description: description || null, ...(teacher ? { classCode, subject: s! } : { subject: chosenSubject }) };
  };
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(date) && title.trim() && (teacher ? chosenPair : chosenSubject);
  return (
    <Sheet
      open
      onClose={onClose}
      title={test ? "Prüfung bearbeiten" : "Neue Prüfung"}
      actions={
        <>
          {test ? (
            ask ? (
              <Button label="Wirklich löschen" variant="line" icon="trash" busy={busy} onPress={() => run(() => api.deleteTest(test.id), "Prüfung gelöscht.")} />
            ) : (
              <Button label="Löschen" variant="ghost" icon="trash" onPress={() => setAsk(true)} />
            )
          ) : (
            <Button label="Abbrechen" variant="ghost" onPress={onClose} />
          )}
          <Button label="Speichern" icon="check" busy={busy} disabled={!valid} onPress={() => run(() => (test ? api.updateTest(test.id, body()) : api.createTest(body())), test ? "Prüfung geändert." : "Prüfung gespeichert.")} />
        </>
      }
    >
      {teacher ? pairs.length > 0 && <SelectField label="Klasse und Fach" value={chosenPair} options={pairs} onChange={setPair} /> : subjects.length > 0 && <SelectField label="Fach" value={chosenSubject} options={subjects} onChange={setSubject} />}
      <TextField label="Datum (JJJJ-MM-TT)" value={date} maxLength={10} keyboardType="numbers-and-punctuation" placeholder="2026-11-20" onChangeText={setDate} />
      <TextField label="Titel" value={title} maxLength={80} onChangeText={setTitle} />
      <TextField label="Beschreibung" value={description} maxLength={1000} multiline onChangeText={setDescription} />
      {!!error && (
        <T v="smallStrong" tone="err" accessibilityRole="alert">
          {error}
        </T>
      )}
    </Sheet>
  );
}
