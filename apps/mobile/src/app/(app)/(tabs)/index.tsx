import { config, dayColumns, homeGridEnd, fmtDate, fmtLong, fmtShort, fmtWeekdayShort, greeting, plural, type Home } from "@bwd/shared";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { api } from "@/lib/api";
import { useMe } from "@/lib/me";
import { useApi } from "@/lib/useApi";
import { ErrorState, Screen } from "@/shell/Screen";
import { sp } from "@/theme";
import { TimeGrid } from "@/timegrid/TimeGrid";
import { Button, Card, CardHead, Grade, Icon, ListRow, Status, T } from "@/ui";
import { HomeSkeleton, NextCard, QuickAccess } from "@/home/parts";
import { TeacherHome } from "@/teacher/TeacherHome";

export default function HomeScreen() {
  return useMe().data?.role === "teacher" ? <TeacherHome /> : <StudentHome />;
}

function StudentHome() {
  const me = useMe();
  const h = useApi(() => api.home(), [], { cache: "home" });
  const refresh = async () => {
    await Promise.all([h.refresh(), me.refresh()]);
  };
  return (
    <Screen onRefresh={refresh} refreshing={h.refreshing}>
      {h.error && !h.data ? <ErrorState message={h.error} onRetry={h.reload} /> : !h.data || !me.data ? <HomeSkeleton /> : <HomeBody h={h.data} firstName={me.data.firstName} classCode={me.data.classCode} />}
    </Screen>
  );
}

function HomeBody({ h, firstName, classCode }: { h: Home; firstName: string; classCode: string }) {
  return (
    <View style={{ gap: sp[5] }}>
      <View style={{ paddingHorizontal: sp[1], marginBottom: sp[1] }}>
        <T v="h1" style={{ fontSize: 28, lineHeight: 30 }}>
          {greeting(h.now)}, {firstName}.
        </T>
        <T tone="text2" style={{ marginTop: sp[1] }}>
          {fmtLong(h.today)} · {classCode}
        </T>
      </View>
      <NextCard h={h} />
      <QuickAccess />
      <TimeGrid
        variant="day"
        grid={{ end: homeGridEnd(h.lessons), columns: dayColumns([{ date: h.today }], h.lessons), lunch: h.lessons.length ? config.lunch : null }}
        now={{ date: h.today, time: h.now }}
        live={false}
        title="Heute"
        sub={fmtLong(h.today)}
        aside={
          <Pressable accessibilityRole="link" onPress={() => router.navigate("/stundenplan?ansicht=woche")} hitSlop={8} style={{ flexDirection: "row", alignItems: "center", gap: sp[2], minHeight: 44 }}>
            <T v="label">Woche</T>
            <Icon name="arrow-r" small />
          </Pressable>
        }
      />
      <Card>
        <CardHead title="Absenzen" onLink={() => router.navigate("/absenzen")} />
        <ListRow
          first
          title={`Kontingent: ${h.absences.contingent.available} von ${h.absences.contingent.size} verfügbar`}
          sub={`${plural(h.absences.contingent.missed, "Lektion", "Lektionen")} gefehlt · ${h.absences.contingent.used} bezogen`}
          end={<Button label="Abmelden" small onPress={() => router.navigate("/absenzen?neu=abmeldung")} />}
        />
        {h.absences.recent.map((a) => (
          <ListRow
            key={a.id}
            onPress={() => router.navigate("/absenzen")}
            title={`${fmtWeekdayShort(a.date)} · ${plural(a.lessons.length, "Lektion", "Lektionen")}`}
            sub={a.subjectsLabel}
            end={<Status tone={a.status === "unexcused" ? "err" : a.status === "dispensed" ? "ok" : "info"} label={a.status === "unexcused" ? "Unentschuldigt" : a.status === "dispensed" ? "Dispensiert" : "Kontingent"} />}
          />
        ))}
      </Card>
      <Card>
        <CardHead title="Neue Noten" linkLabel="Alle Noten" onLink={() => router.navigate("/noten")} />
        {h.recentGrades.length === 0 && <T tone="text2">Noch keine Noten.</T>}
        {h.recentGrades.map((g, i) => (
          <ListRow key={g.examId} first={i === 0} onPress={() => router.navigate(`/noten/${g.subjectCode}?semester=${g.semester ?? ""}${g.module ? `&modul=${g.module}` : ""}`)} title={g.subjectName} sub={`${g.title} · ${fmtShort(g.date)}`} end={<Grade value={g.value} />} />
        ))}
      </Card>
      <Card>
        <CardHead title="Mitteilungen" onLink={() => router.navigate("/mitteilungen")} />
        {h.news.length === 0 && <T tone="text2">Keine Mitteilungen.</T>}
        {h.news.map((n, i) => (
          <ListRow key={n.id} first={i === 0} onPress={() => router.navigate(`/mitteilungen/${n.id}`)} title={n.title} sub={`${n.author ?? ""} · ${fmtDate(n.publishedAt.slice(0, 10))}`} />
        ))}
      </Card>
    </View>
  );
}

