import { fmtGrade, fmtShort, isInsufficient } from "@bwd/shared";
import { ApiFailure } from "@bwd/shared/api";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { ErrorState, Screen } from "@/shell/Screen";
import { sp } from "@/theme";
import { Button, Card, Empty, ListRow, Sheet, SkBox, SkeletonArea, T, TextField, useToast } from "@/ui";

/** Notenbuch: Proben (antippen = Noten erfassen) und Zeugnisnote pro Person. */
export default function GradebookScreen() {
  const { code, fach } = useLocalSearchParams<{ code: string; fach: string }>();
  const b = useApi(() => api.gradebook(code, fach), [code, fach]);
  const [add, setAdd] = useState(false);
  const d = b.data;
  return (
    <Screen title={d ? `${d.subject.name} ${d.classCode}` : "Noten"} back={{ label: code, href: `/klassen/${encodeURIComponent(code)}` }} onRefresh={b.refresh} refreshing={b.refreshing}>
      {b.error && !d ? (
        <ErrorState message={b.error} onRetry={b.reload} />
      ) : !d ? (
        <SkeletonArea label="Notenbuch wird geladen">
          <SkBox h={260} />
        </SkeletonArea>
      ) : (
        <View style={{ gap: sp[5] }}>
          <T tone="text2">
            {d.semester}. Semester · {d.semesterLabel}
          </T>
          {d.editable && <Button label="Neue Probe" icon="plus" wide onPress={() => setAdd(true)} />}
          {d.assessments.length === 0 ? (
            <Empty icon="chart" title={`Noch keine Proben im ${d.semester}. Semester.`} />
          ) : (
            <>
              <Card>
                <T v="box" style={{ marginBottom: sp[3] }}>
                  Proben
                </T>
                {d.assessments.map((a, i) => (
                  <ListRow
                    key={a.id}
                    first={i === 0}
                    title={a.title}
                    sub={[fmtShort(a.date), a.weight !== 1 ? `Gewicht ${String(a.weight).replace(".", ",")}` : null, `${a.graded} von ${d.students.length} benotet`, a.average !== null ? `Schnitt ${fmtGrade(a.average)}` : null].filter(Boolean).join(" · ")}
                    onPress={() => router.push(`/klassen/probe?id=${encodeURIComponent(a.id)}`)}
                  />
                ))}
              </Card>
              <Card>
                <T v="box" style={{ marginBottom: sp[3] }}>
                  Zeugnisnoten
                </T>
                {d.students.map((s, i) => (
                  <ListRow key={s.id} first={i === 0} title={s.name} sub={s.raw !== null ? `Schnitt ${s.raw.toFixed(2)}` : undefined} end={<T v="strong" tone={s.grade !== null && isInsufficient(s.grade) ? "err" : undefined}>{s.grade !== null ? fmtGrade(s.grade) : "–"}</T>} />
                ))}
              </Card>
            </>
          )}
        </View>
      )}
      {add && d && <NewAssessment classCode={d.classCode} subject={d.subject.code} onClose={() => setAdd(false)} />}
    </Screen>
  );
}

function NewAssessment({ classCode, subject, onClose }: { classCode: string; subject: string; onClose: () => void }) {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [weight, setWeight] = useState("1");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save() {
    setBusy(true);
    setError("");
    try {
      const a = await api.createAssessment({ classCode, subject, title, date, weight: Number(weight.replace(",", ".")) });
      toast.show("Probe angelegt.");
      onClose();
      router.push(`/klassen/probe?id=${encodeURIComponent(a.id)}`);
    } catch (e) {
      setError(e instanceof ApiFailure ? e.message : "Speichern fehlgeschlagen. Versuche es nochmals.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Sheet
      open
      onClose={onClose}
      title="Neue Probe"
      actions={
        <>
          <Button label="Abbrechen" variant="ghost" onPress={onClose} />
          <Button label="Probe anlegen" icon="check" busy={busy} disabled={!title.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !weight} onPress={save} />
        </>
      }
    >
      <TextField label="Titel" value={title} maxLength={80} onChangeText={setTitle} />
      <View style={{ flexDirection: "row", gap: sp[5] }}>
        <View style={{ flex: 2 }}>
          <TextField label="Datum (JJJJ-MM-TT)" value={date} maxLength={10} keyboardType="numbers-and-punctuation" placeholder="2026-11-20" onChangeText={setDate} />
        </View>
        <View style={{ flex: 1 }}>
          <TextField label="Gewicht" value={weight} keyboardType="decimal-pad" onChangeText={setWeight} />
        </View>
      </View>
      {!!error && (
        <T v="smallStrong" tone="err" accessibilityRole="alert">
          {error}
        </T>
      )}
    </Sheet>
  );
}
