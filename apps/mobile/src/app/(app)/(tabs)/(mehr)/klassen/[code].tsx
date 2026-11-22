import { fmtShort, plural } from "@bwd/shared";
import { router, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { ErrorState, Screen } from "@/shell/Screen";
import { sp } from "@/theme";
import { Card, ListRow, SkBox, SkeletonArea, Status, T } from "@/ui";

/** Klasse: Klassenraum, Notenbücher der eigenen Fächer, Lernende (Absenzen nur für die Klassenlehrperson). */
export default function ClassScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const c = useApi(() => api.classView(code), [code]);
  const d = c.data;
  return (
    <Screen title={code} back={{ label: "Klassen", href: "/klassen" }} onRefresh={c.refresh} refreshing={c.refreshing}>
      {c.error && !d ? (
        <ErrorState message={c.error} onRetry={c.reload} />
      ) : !d ? (
        <SkeletonArea label="Klasse wird geladen">
          <SkBox h={260} />
        </SkeletonArea>
      ) : (
        <View style={{ gap: sp[5] }}>
          <T tone="text2">{[d.program, d.classTeacher ? "Klassenlehrperson" : null].filter(Boolean).join(" · ")}</T>
          <Card>
            <ListRow first title="Klassenraum" onPress={() => router.push(`/klassen/raum?code=${encodeURIComponent(d.code)}`)} />
            {d.subjects
              .filter((s) => s.code !== "IN")
              .map((s) => (
                <ListRow key={s.code} title={`Noten ${s.name}`} onPress={() => router.push(`/klassen/noten?code=${encodeURIComponent(d.code)}&fach=${encodeURIComponent(s.code)}`)} />
              ))}
          </Card>
          <Card>
            <T v="box" style={{ marginBottom: sp[3] }}>
              {plural(d.students.length, "Lernende Person", "Lernende")}
            </T>
            {d.students.map((st, i) => {
              const a = st.absences;
              return (
                <ListRow
                  key={st.id}
                  first={i === 0}
                  title={st.name}
                  sub={a ? [plural(a.missed, "Lektion gefehlt", "Lektionen gefehlt"), a.lastDate ? `zuletzt ${fmtShort(a.lastDate)}` : null].filter(Boolean).join(" · ") : st.email}
                  end={a ? a.unexcused > 0 ? <Status tone="err" label={`${a.unexcused} unentschuldigt`} /> : <Status tone={a.contingentAvailable === 0 ? "warn" : "ok"} label={`Kontingent ${a.contingentAvailable} von ${a.contingentSize}`} /> : undefined}
                />
              );
            })}
          </Card>
        </View>
      )}
    </Screen>
  );
}
