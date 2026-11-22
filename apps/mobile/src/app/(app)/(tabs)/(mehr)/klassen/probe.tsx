import { fmtLong, type AssessmentSheet } from "@bwd/shared";
import { ApiFailure } from "@bwd/shared/api";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { ErrorState, Screen } from "@/shell/Screen";
import { sp } from "@/theme";
import { Button, Card, SkBox, SkeletonArea, T, TextField, useToast } from "@/ui";

/** Noten einer Probe erfassen: ein Feld pro Person, leer = keine Note. */
export default function AssessmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = useApi(() => api.assessment(id), [id]);
  const d = s.data;
  return (
    <Screen title={d?.assessment.title ?? "Probe"} back={{ label: "Notenbuch" }}>
      {s.error && !d ? (
        <ErrorState message={s.error} onRetry={s.reload} />
      ) : !d ? (
        <SkeletonArea label="Probe wird geladen">
          <SkBox h={260} />
        </SkeletonArea>
      ) : (
        <Entry key={d.assessment.id} d={d} />
      )}
    </Screen>
  );
}

const parse = (v: string): number | null | "bad" => {
  const t = v.trim().replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 1 && n <= 6 ? n : "bad";
};

function Entry({ d }: { d: AssessmentSheet }) {
  const toast = useToast();
  const a = d.assessment;
  const [vals, setVals] = useState<Record<string, string>>(() => Object.fromEntries(d.students.map((x) => [x.id, x.value === null ? "" : String(x.value)])));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const parsed = d.students.map((x) => ({ userId: x.id, value: parse(vals[x.id] ?? "") }));
  const bad = parsed.some((p) => p.value === "bad");
  async function save() {
    setBusy(true);
    setError("");
    try {
      await api.saveAssessmentGrades(a.id, { grades: parsed.map((p) => ({ userId: p.userId, value: p.value as number | null })) });
      toast.show("Noten gespeichert.");
      router.back();
    } catch (e) {
      setError(e instanceof ApiFailure ? e.message : "Speichern fehlgeschlagen. Versuche es nochmals.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={{ gap: sp[5] }}>
      <T tone="text2">{[`${a.subject.name} ${a.classCode}`, fmtLong(a.date, true), `Gewicht ${String(a.weight).replace(".", ",")}`].join(" · ")}</T>
      <Card>
        <View style={{ gap: sp[4] }}>
          {d.students.map((x, i) => (
            <TextField key={x.id} label={x.name} value={vals[x.id] ?? ""} keyboardType="decimal-pad" placeholder="–" editable={d.editable} error={parsed[i]!.value === "bad" ? "Noten gehen von 1 bis 6." : undefined} onChangeText={(t) => setVals((v) => ({ ...v, [x.id]: t }))} />
          ))}
        </View>
      </Card>
      {!!error && (
        <T v="smallStrong" tone="err" accessibilityRole="alert">
          {error}
        </T>
      )}
      {d.editable && <Button label="Noten speichern" icon="check" wide haptic busy={busy} disabled={bad} onPress={save} />}
    </View>
  );
}
