import { config, fmtDayMonth, fmtGrade, isInsufficient, plural } from "@bwd/shared";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { ErrorState, Screen } from "@/shell/Screen";
import { font, radius, sp, useTheme } from "@/theme";
import { Button, Card, Empty, Grade, Icon, Kpis, Segment, SkBox, SkeletonArea, T } from "@/ui";

export default function Grades() {
  const { c } = useTheme();
  const [sem, setSem] = useState<"1" | "2">("1");
  const g = useApi(() => api.grades(Number(sem)), [sem]);
  return (
    <Screen title="Noten" onRefresh={g.refresh} refreshing={g.refreshing}>
      <View style={{ marginBottom: sp[6] }}>
        <Segment label="Semester" value={sem} onChange={setSem} options={[{ value: "1", label: "1. Semester" }, { value: "2", label: "2. Semester" }]} />
      </View>
      {g.error && !g.data ? (
        <ErrorState message={g.error} onRetry={g.reload} />
      ) : !g.data || g.loading ? (
        <SkeletonArea label="Noten werden geladen">
          <View style={{ gap: sp[3] }}>
            <SkBox h={72} r={radius.l} />
            <SkBox h={520} />
          </View>
        </SkeletonArea>
      ) : g.data.subjects.length === 0 ? (
        <Empty icon="chart" title={`Noch keine Noten im ${sem}. Semester.`}>
          {sem === "2" && (
            <>
              <T tone="text2" style={{ textAlign: "center" }}>
                Das 2. Semester beginnt am {fmtDayMonth(config.secondSemesterStart)} {config.secondSemesterStart.slice(0, 4)}.
              </T>
              <Button label="1. Semester ansehen" small variant="line" onPress={() => setSem("1")} />
            </>
          )}
        </Empty>
      ) : (
        <>
          <Kpis
            items={[
              { label: "Gesamtschnitt", value: g.data.average !== null ? fmtGrade(g.data.average) : "–" },
              { label: "Prüfungen", value: g.data.examCount },
              { label: "Ungenügend", value: g.data.insufficient, tone: g.data.insufficient ? "err" : undefined },
            ]}
          />
          <Card pad={sp[7]}>
            {g.data.subjects.map((s, i) => {
              const low = s.average !== null && isInsufficient(s.average);
              return (
                <Pressable
                  key={s.code}
                  accessibilityRole="link"
                  accessibilityLabel={`${s.name}, Schnitt ${s.average !== null ? fmtGrade(s.average) : "keiner"}, ${plural(s.examCount, "Prüfung", "Prüfungen")}`}
                  onPress={() => router.push(`/noten/${s.code}`)}
                  style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: sp[5], paddingVertical: sp[5], borderTopWidth: i ? 1 : 0, borderTopColor: c.rule, opacity: pressed ? 0.6 : 1 })}
                >
                  <View style={{ width: 40, height: 40, borderRadius: radius.l, backgroundColor: c.fieldBg, borderWidth: low ? 1.5 : 1, borderColor: low ? c.err : c.rule, alignItems: "center", justifyContent: "center" }}>
                    <T style={{ fontFamily: font.display400, fontSize: 12, letterSpacing: -0.4 }}>{s.short}</T>
                  </View>
                  <View style={{ flex: 1 }}>
                    <T v="box">{s.name}</T>
                    <T v="small">
                      {plural(s.examCount, "Prüfung", "Prüfungen")}
                      {s.teacher ? ` · ${s.teacher}` : ""}
                    </T>
                  </View>
                  <Grade value={s.average} />
                  <Icon name="chev-r" small color={c.text2} />
                </Pressable>
              );
            })}
          </Card>
        </>
      )}
    </Screen>
  );
}
