import { fmtGrade, fmtWeekdayDate, fmtWeight, gradeBar, monthShort, plural } from "@bwd/shared";
import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { ErrorState, Screen } from "@/shell/Screen";
import { font, fs, radius, sp, tracking, useTheme } from "@/theme";
import { Card, Empty, Grade, SkBox, SkeletonArea, T } from "@/ui";

export default function Subject() {
  const { c, scheme } = useTheme();
  const { fach } = useLocalSearchParams<{ fach: string }>();
  const s = useApi(() => api.subject(String(fach)), [fach], { cache: "subject" });
  const d = s.data;
  const chrono = d ? [...d.exams].filter((e) => e.value !== null).reverse() : [];
  const dark = scheme === "dark";
  return (
    <Screen back={{ label: "Noten", href: "/noten" }} onRefresh={s.refresh} refreshing={s.refreshing}>
      {s.error && !d ? (
        <ErrorState message={s.error} onRetry={s.reload} />
      ) : !d ? (
        <SkeletonArea label="Fach wird geladen">
          <SkBox h={400} />
        </SkeletonArea>
      ) : (
        <View style={{ gap: sp[5] }}>
          <View style={{ paddingHorizontal: sp[1] }}>
            <T v="h1">{d.subject.name}</T>
            <T tone="text2" style={{ marginTop: sp[2] }}>
              {d.teacher ? `${d.teacher} · ` : ""}
              {plural(d.exams.length, "Prüfung", "Prüfungen")}
            </T>
          </View>
          {d.exams.length === 0 ? (
            <Empty icon="chart" title={`Noch keine Noten in ${d.subject.name}.`} />
          ) : (
            <>
              <Card>
                <T v="box" accessibilityRole="header" style={{ marginBottom: sp[5] }}>
                  Prüfungen
                </T>
                {d.exams.map((e, i) => (
                  <View key={e.id} accessible accessibilityLabel={`${e.title}, Note ${e.value !== null ? fmtGrade(e.value) : "keine"}`} style={{ flexDirection: "row", alignItems: "center", gap: sp[5], paddingVertical: sp[6], paddingTop: i ? sp[6] : 0, borderTopWidth: i ? 1 : 0, borderTopColor: c.rule }}>
                    <View style={{ flex: 1 }}>
                      <T v="strong" style={{ fontFamily: font.body700 }}>
                        {e.title}
                      </T>
                      <T v="small">
                        {fmtWeekdayDate(e.date)} · {fmtWeight(e.weight)}
                      </T>
                      {e.classAverage !== null && <T v="small">Klasse {fmtGrade(e.classAverage)}</T>}
                    </View>
                    <Grade value={e.value} />
                  </View>
                ))}
              </Card>
              <View style={{ backgroundColor: dark ? c.raise : c.btn, borderRadius: radius.xxl, padding: 18, gap: sp[3], borderWidth: dark ? 1 : 0, borderColor: c.rule }}>
                <T v="smallStrong" style={{ color: dark ? c.ink : c.btnFg, opacity: 0.7 }}>
                  Schnitt
                </T>
                <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
                  <T numeric style={{ fontFamily: font.display, fontSize: fs.h1App, letterSpacing: tracking(fs.h1App), color: dark ? c.ink : c.btnFg }}>
                    {d.average !== null ? fmtGrade(d.average) : "–"}
                  </T>
                  {d.classAverage !== null && <T style={{ fontFamily: font.display400, fontSize: fs.base, color: dark ? c.ink : c.btnFg, opacity: 0.75 }}>Klasse {fmtGrade(d.classAverage)}</T>}
                </View>
              </View>
              {chrono.length > 0 && (
                <Card>
                  <T v="box" accessibilityRole="header">
                    Verlauf
                  </T>
                  <View accessible accessibilityLabel={`Noten von alt nach neu: ${chrono.map((e) => fmtGrade(e.value!)).join(", ")}`} style={{ flexDirection: "row", alignItems: "flex-end", gap: sp[2], height: 90, paddingTop: sp[3] }}>
                    {chrono.map((e, i) => (
                      <View key={e.id} style={{ width: 28, height: `${gradeBar(e.value!)}%`, borderTopLeftRadius: radius.s, borderTopRightRadius: radius.s, borderBottomLeftRadius: 3, borderBottomRightRadius: 3, backgroundColor: i === chrono.length - 1 ? (dark ? c.ink : c.btn) : c.ruleStrong }} />
                    ))}
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: sp[2] }}>
                    <T v="small" style={{ fontSize: 11 }}>
                      {monthShort(chrono[0]!.date)}
                    </T>
                    <T v="small" style={{ fontSize: 11 }}>
                      {monthShort(chrono.at(-1)!.date)}
                    </T>
                  </View>
                </Card>
              )}
            </>
          )}
        </View>
      )}
    </Screen>
  );
}
