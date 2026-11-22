import { fmtLong, fmtPeriods, type AttendanceSheet } from "@bwd/shared";
import { ApiFailure } from "@bwd/shared/api";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { ErrorState, Screen } from "@/shell/Screen";
import { sp } from "@/theme";
import { Button, Card, Segment, SkBox, SkeletonArea, T, useToast } from "@/ui";

/** Klassenliste einer Lektion: anwesend oder abwesend. */
export default function AttendanceSheetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = useApi(() => api.attendanceSheet(id), [id]);
  const d = s.data;
  return (
    <Screen title={d ? `${d.slot.subject.name} ${d.slot.classCode}` : "Präsenz"} back={{ label: "Präsenz", href: "/praesenz" }}>
      {s.error && !d ? (
        <ErrorState message={s.error} onRetry={s.reload} />
      ) : !d ? (
        <SkeletonArea label="Klassenliste wird geladen">
          <SkBox h={300} />
        </SkeletonArea>
      ) : (
        <SheetBody key={d.slot.id} d={d} id={id} />
      )}
    </Screen>
  );
}

/** Abgemeldete und Dispensierte sind beim ersten Erfassen abwesend. */
function SheetBody({ d, id }: { d: AttendanceSheet; id: string }) {
  const toast = useToast();
  const [absent, setAbsent] = useState(() => new Set(d.students.filter((x) => x.absent || (!d.slot.checked && (x.notice || x.dispensed))).map((x) => x.id)));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setBusy(true);
    setError("");
    try {
      await api.saveAttendance(id, [...absent]);
      toast.show(absent.size === 0 ? "Präsenz gespeichert: alle da." : `Präsenz gespeichert: ${absent.size === 1 ? "1 fehlt" : `${absent.size} fehlen`}.`);
      router.back();
    } catch (e) {
      setError(e instanceof ApiFailure ? e.message : "Speichern fehlgeschlagen. Versuche es nochmals.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: sp[5] }}>
      <T tone="text2">{[fmtLong(d.slot.date), fmtPeriods(d.slot.periods), `${d.slot.start} bis ${d.slot.end}`, d.slot.room].filter(Boolean).join(" · ")}</T>
      <Card>
        <T v="box" style={{ marginBottom: sp[4] }}>
          {d.students.length - absent.size} von {d.students.length} anwesend
        </T>
        <View style={{ gap: sp[5] }}>
          {d.students.map((st) => (
            <View key={st.id} style={{ gap: sp[2] }}>
              <T v="strong">{st.name}</T>
              {(st.notice || st.dispensed) && <T v="small">{st.dispensed ? "Dispensiert" : "Abgemeldet"}</T>}
              <Segment
                label={st.name}
                value={absent.has(st.id) ? "absent" : "present"}
                options={[
                  { value: "present", label: "Anwesend" },
                  { value: "absent", label: "Abwesend" },
                ]}
                onChange={(v) => {
                  if (!d.editable) return;
                  const next = new Set(absent);
                  if (v === "absent") next.add(st.id);
                  else next.delete(st.id);
                  setAbsent(next);
                }}
              />
            </View>
          ))}
        </View>
      </Card>
      {!!error && (
        <T v="smallStrong" tone="err" accessibilityRole="alert">
          {error}
        </T>
      )}
      {d.editable ? <Button label="Präsenz speichern" icon="check" wide busy={busy} haptic onPress={save} /> : <T tone="text2">Erfassen ab dem Tag der Lektion.</T>}
    </View>
  );
}
