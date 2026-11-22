import { config, dayColumns, homeGridEnd, fmtLong, fmtWeekdayShort, getNow, greeting, plural } from "@bwd/shared";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { HomeSkeleton, NextCard, QuickAccess } from "@/home/parts";
import { api } from "@/lib/api";
import { useMe } from "@/lib/me";
import { useApi } from "@/lib/useApi";
import { ErrorState, Screen } from "@/shell/Screen";
import { sp } from "@/theme";
import { TimeGrid } from "@/timegrid/TimeGrid";
import { Card, CardHead, Icon, ListRow, T } from "@/ui";
import { AttendanceRow } from "./AttendanceRow";

/** Übersicht einer Lehrperson: nächste Lektion, Präsenz heute, heute, Klassen, Prüfungen. */
export function TeacherHome() {
  const me = useMe();
  const h = useApi(() => api.teacherHome(), [], { cache: "teacher-home" });
  const now = getNow();
  const d = h.data;
  return (
    <Screen
      onRefresh={async () => {
        await Promise.all([h.refresh(), me.refresh()]);
      }}
      refreshing={h.refreshing}
    >
      {h.error && !d ? (
        <ErrorState message={h.error} onRetry={h.reload} />
      ) : !d || !me.data ? (
        <HomeSkeleton />
      ) : (
        <View style={{ gap: sp[5] }}>
          <View style={{ paddingHorizontal: sp[1], marginBottom: sp[1] }}>
            <T v="h1" style={{ fontSize: 28, lineHeight: 30 }}>
              {greeting(d.now)}, {me.data.firstName}.
            </T>
            <T tone="text2" style={{ marginTop: sp[1] }}>
              {fmtLong(d.today)} · Lehrperson
            </T>
          </View>
          <NextCard h={d} />
          <Card>
            <CardHead title="Präsenz heute" onLink={() => router.navigate("/praesenz")} />
            {d.attendance.length === 0 ? <T tone="text2">Heute keine Lektionen.</T> : d.attendance.map((s, i) => <AttendanceRow key={s.id} slot={s} now={now} first={i === 0} />)}
          </Card>
          <QuickAccess />
          <TimeGrid
            variant="day"
            grid={{ end: homeGridEnd(d.lessons), columns: dayColumns([{ date: d.today }], d.lessons), lunch: d.lessons.length ? config.lunch : null }}
            now={{ date: d.today, time: d.now }}
            live={false}
            title="Heute"
            sub={fmtLong(d.today)}
            aside={
              <Pressable accessibilityRole="link" onPress={() => router.navigate("/stundenplan?ansicht=woche")} hitSlop={8} style={{ flexDirection: "row", alignItems: "center", gap: sp[2], minHeight: 44 }}>
                <T v="label">Woche</T>
                <Icon name="arrow-r" small />
              </Pressable>
            }
          />
          <Card>
            <CardHead title="Meine Klassen" onLink={() => router.navigate("/klassen")} />
            {d.classes.length === 0 ? (
              <T tone="text2">Noch keine Klassen zugeteilt.</T>
            ) : (
              d.classes.map((c, i) => (
                <ListRow
                  key={c.code}
                  first={i === 0}
                  title={c.code}
                  sub={[c.subjects.map((s) => s.name).join(", "), plural(c.students, "Lernende Person", "Lernende")].filter(Boolean).join(" · ")}
                  end={c.classTeacher ? <T v="small">Klassenlehrperson</T> : undefined}
                  onPress={() => router.push(`/klassen/${encodeURIComponent(c.code)}`)}
                />
              ))
            )}
          </Card>
          <Card>
            <CardHead title="Prüfungen" onLink={() => router.navigate("/pruefungen")} />
            {d.tests.length === 0 ? (
              <T tone="text2">Keine Prüfungen in den nächsten zwei Wochen.</T>
            ) : (
              d.tests.map((t, i) => <ListRow key={t.id} first={i === 0} title={`${t.subject.name}${t.classCode ? ` · ${t.classCode}` : ""}`} sub={t.title} end={<T v="small">{fmtWeekdayShort(t.date)}</T>} />)
            )}
          </Card>
        </View>
      )}
    </Screen>
  );
}
