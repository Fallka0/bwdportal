import { fmtGrade, fmtShortLoose, fmtWeekdayDate, gradeBar, monthShort, plural, type PortfolioEntry } from "@bwd/shared";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { GradeSheet } from "@/grades/GradeSheets";
import { WishGrade } from "@/grades/WishGrade";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { ErrorState, Screen } from "@/shell/Screen";
import { font, fs, radius, sp, tracking, useTheme } from "@/theme";
import { Button, Card, Empty, Grade, Icon, SkBox, SkeletonArea, T } from "@/ui";

const weightLabel = (w: number) => (w === 0 ? "zählt nicht (ohne Gewicht)" : `Gewicht ${String(w).replace(".", ",")}`);

export default function Subject() {
  const { c, scheme } = useTheme();
  const { fach, semester, modul } = useLocalSearchParams<{ fach: string; semester?: string; modul?: string }>();
  const s = useApi(() => api.subject(String(fach), Number(semester) || undefined, modul ?? null), [fach, semester, modul], { cache: "subject" });
  const d = s.data;
  const chrono = d ? [...d.entries].reverse() : [];
  const [sheet, setSheet] = useState<{ entry?: PortfolioEntry } | null>(null);
  const dark = scheme === "dark";
  return (
    <Screen back={{ label: "Noten", href: "/noten" }} onRefresh={s.refresh} refreshing={s.refreshing}>
      {sheet && d && (
        <GradeSheet
          semester={d.semester}
          subject={d.code}
          module={d.module}
          entry={sheet.entry}
          onClose={() => setSheet(null)}
          onDone={async () => {
            setSheet(null);
            await s.refresh();
          }}
        />
      )}
      {s.error && !d ? (
        <ErrorState message={s.error} onRetry={s.reload} />
      ) : !d ? (
        <SkeletonArea label="Fach wird geladen">
          <SkBox h={400} />
        </SkeletonArea>
      ) : (
        <View style={{ gap: sp[5] }}>
          <View style={{ paddingHorizontal: sp[1] }}>
            <T v="h1">{d.module && d.moduleName ? `${d.module} ${d.moduleName}` : d.name}</T>
            <T tone="text2" style={{ marginTop: sp[2] }}>
              {d.semester}. Semester · {d.label}
              {d.teacher ? ` · ${d.teacher}` : ""} · {plural(d.entries.length, "Probe", "Proben")}
            </T>
          </View>
          <Button label="Neue Note" icon="plus" wide onPress={() => setSheet({})} />
          {d.entries.length === 0 ? (
            <Empty icon="chart" title={`Noch keine Noten in ${d.name}.`} />
          ) : (
            <>
              <Card>
                <T v="box" accessibilityRole="header" style={{ marginBottom: sp[5] }}>
                  Proben
                </T>
                {d.entries.map((e, i) => (
                  <Pressable
                    key={e.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${e.title}, Note ${fmtGrade(e.value)}. Bearbeiten`}
                    onPress={() => setSheet({ entry: e })}
                    style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: sp[5], paddingVertical: sp[6], paddingTop: i ? sp[6] : 0, borderTopWidth: i ? 1 : 0, borderTopColor: c.rule, opacity: pressed ? 0.6 : 1 })}
                  >
                    <View style={{ flex: 1 }}>
                      <T v="strong" style={{ fontFamily: font.body700 }}>
                        {e.title}
                      </T>
                      <T v="small">
                        {e.date ? fmtWeekdayDate(e.date) : `Erfasst ${fmtShortLoose(e.enteredAt)}`} · {weightLabel(e.weight)}
                      </T>
                      {e.classAverage !== null && <T v="small">Klasse {fmtGrade(e.classAverage)}</T>}
                    </View>
                    <Grade value={e.value} />
                    <Icon name="edit" small color={c.text2} />
                  </Pressable>
                ))}
              </Card>
              <View style={{ backgroundColor: dark ? c.raise : c.btn, borderRadius: radius.xxl, padding: 18, gap: sp[3], borderWidth: dark ? 1 : 0, borderColor: c.rule }}>
                <T v="smallStrong" style={{ color: dark ? c.ink : c.btnFg, opacity: 0.7 }}>
                  {d.code === "IN" ? "Modulnote" : "Zeugnisnote"}
                </T>
                <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
                  <T numeric style={{ fontFamily: font.display, fontSize: fs.h1App, letterSpacing: tracking(fs.h1App), color: dark ? c.ink : c.btnFg }}>
                    {d.grade !== null ? fmtGrade(d.grade) : "–"}
                  </T>
                  {d.classAverage !== null && <T style={{ fontFamily: font.display400, fontSize: fs.base, color: dark ? c.ink : c.btnFg, opacity: 0.75 }}>Klasse {fmtGrade(d.classAverage)}</T>}
                </View>
              </View>
              <WishGrade entries={d.entries} current={d.grade} module={d.code === "IN"} />
              {chrono.length > 1 && (
                <Card>
                  <T v="box" accessibilityRole="header">
                    Verlauf
                  </T>
                  <View accessible accessibilityLabel={`Noten von alt nach neu: ${chrono.map((e) => fmtGrade(e.value)).join(", ")}`} style={{ flexDirection: "row", alignItems: "flex-end", gap: sp[2], height: 90, paddingTop: sp[3] }}>
                    {chrono.map((e, i) => (
                      <View key={e.id} style={{ width: 28, height: `${gradeBar(e.value)}%`, borderTopLeftRadius: radius.s, borderTopRightRadius: radius.s, borderBottomLeftRadius: 3, borderBottomRightRadius: 3, backgroundColor: i === chrono.length - 1 ? (dark ? c.ink : c.btn) : c.ruleStrong }} />
                    ))}
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: sp[2] }}>
                    <T v="small" style={{ fontSize: 11 }}>
                      {monthShort(chrono[0]!.date ?? chrono[0]!.enteredAt)}
                    </T>
                    <T v="small" style={{ fontSize: 11 }}>
                      {monthShort(chrono.at(-1)!.date ?? chrono.at(-1)!.enteredAt)}
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
