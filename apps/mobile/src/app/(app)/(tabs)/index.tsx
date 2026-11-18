import { config, dayColumns, fmtDate, fmtLong, fmtPeriods, fmtShort, fmtShortLoose, fmtUntil, fmtWeekdayShort, greeting, lessonRun, periodOf, plural, toMin, type Home } from "@bwd/shared";
import type { IconName } from "@bwd/shared/icons";
import { router } from "expo-router";
import { Linking, Pressable, View } from "react-native";
import { api } from "@/lib/api";
import { useMe } from "@/lib/me";
import { useApi } from "@/lib/useApi";
import { ErrorState, Screen } from "@/shell/Screen";
import { font, fs, radius, sp, tracking, useTheme } from "@/theme";
import { TimeGrid } from "@/timegrid/TimeGrid";
import { Button, Card, CardHead, Grade, Icon, ListRow, SkBox, SkeletonArea, SkLine, T } from "@/ui";

export default function HomeScreen() {
  const me = useMe();
  const h = useApi(() => api.home(), []);
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
        grid={{ end: config.homeGridEnd, columns: dayColumns([{ date: h.today }], h.lessons), lunch: h.lessons.length ? config.lunch : null }}
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
        <CardHead title="Offene Absenzen" onLink={() => router.navigate("/absenzen")} />
        {h.openAbsences.length === 0 ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: sp[3] }}>
            <Icon name="check" small />
            <T tone="text2">Keine offenen Absenzen.</T>
          </View>
        ) : (
          h.openAbsences.map((a, i) => (
            <ListRow
              key={a.id}
              first={i === 0}
              title={`${fmtWeekdayShort(a.date)} · ${plural(a.lessons.length, "Lektion", "Lektionen")}`}
              sub={`${a.subjectsLabel}${a.dueDate ? ` · bis ${fmtShortLoose(a.dueDate)} entschuldigen` : ""}`}
              end={<Button label="Entschuldigen" small onPress={() => router.navigate(`/absenzen?entschuldigen=${a.id}`)} />}
            />
          ))
        )}
      </Card>
      <Card>
        <CardHead title="Neue Noten" linkLabel="Alle Noten" onLink={() => router.navigate("/noten")} />
        {h.recentGrades.map((g, i) => (
          <ListRow key={g.examId} first={i === 0} onPress={() => router.navigate(`/noten/${g.subjectCode}`)} title={g.subjectName} sub={`${g.title} · ${fmtShort(g.date)}`} end={<Grade value={g.value} />} />
        ))}
      </Card>
      <Card>
        <CardHead title="Mitteilungen" onLink={() => router.navigate("/mitteilungen")} />
        {h.news.map((n, i) => (
          <ListRow key={n.id} first={i === 0} onPress={() => router.navigate(`/mitteilungen/${n.id}`)} title={n.title} sub={`${n.author ?? ""} · ${fmtDate(n.publishedAt.slice(0, 10))}`} />
        ))}
      </Card>
    </View>
  );
}

function NextCard({ h }: { h: Home }) {
  const { c, scheme } = useTheme();
  const dark = scheme === "dark";
  const bg = dark ? c.raise : c.btn;
  const fg = dark ? c.ink : c.btnFg;
  const next = h.next;
  if (!next) {
    return (
      <View style={{ backgroundColor: bg, borderRadius: radius.xxl, padding: 18, gap: sp[3] }}>
        <T v="smallStrong" style={{ color: fg, opacity: 0.7 }}>
          Als Nächstes
        </T>
        <T style={{ color: fg }}>Heute keine weiteren Lektionen.</T>
      </View>
    );
  }
  const periods = lessonRun(h.lessons, next)
    .map((l) => periodOf(l.start))
    .filter((p): p is number => p !== null);
  const meta: [IconName, string, string][] = [
    ["door", "Raum", next.room ?? ""],
    ["user", "Lehrperson", next.teacher?.name ?? ""],
    ["clock", "", fmtPeriods(periods)],
  ];
  return (
    <View accessible accessibilityLabel={`Als Nächstes ${fmtUntil(toMin(next.start) - toMin(h.now))}: ${next.subject?.name}, ${next.start}, Raum ${next.room}, ${next.teacher?.name ?? ""}`} style={{ backgroundColor: bg, borderRadius: radius.xxl, padding: 18, gap: sp[4], borderWidth: dark ? 1 : 0, borderColor: c.rule }}>
      <T v="smallStrong" style={{ color: fg, opacity: 0.7 }}>
        Als Nächstes · {fmtUntil(toMin(next.start) - toMin(h.now))}
      </T>
      <View>
        <T style={{ fontFamily: font.display, fontSize: fs.h1App, lineHeight: 28, letterSpacing: tracking(fs.h1App), color: fg }}>{next.subject?.name}</T>
        <T numeric style={{ fontFamily: font.display400, fontSize: fs.h3, letterSpacing: -0.5, color: fg, marginTop: sp[1] }}>
          {next.start}
        </T>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 18 }}>
        {meta
          .filter((m) => m[2])
          .map(([icon, , text]) => (
            <View key={icon} style={{ flexDirection: "row", alignItems: "center", gap: sp[2], opacity: 0.85 }}>
              <Icon name={icon} small color={fg} />
              <T style={{ color: fg }}>{text}</T>
            </View>
          ))}
      </View>
      {next.state === "room_changed" && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: sp[3], paddingVertical: sp[4], paddingHorizontal: sp[5], borderRadius: radius.l, backgroundColor: dark ? c.warnBg : c.nextChgBg }}>
          <Icon name="swap" small color={dark ? c.warn : fg} />
          <T v="strong" style={{ color: dark ? c.warn : fg, fontSize: fs.m }}>
            Raumänderung: {next.room} statt {next.originalRoom}
          </T>
        </View>
      )}
    </View>
  );
}

function QuickAccess() {
  const { c } = useTheme();
  const items: { icon: IconName; label: string; onPress: () => void }[] = [
    { icon: "plus", label: "Absenz melden", onPress: () => router.navigate("/absenzen?melden=1") },
    { icon: "grid4", label: "Moodle", onPress: () => Linking.openURL(config.services.moodle) },
    { icon: "msg", label: "Teams", onPress: () => Linking.openURL(config.services.teams) },
    { icon: "book", label: "SOL", onPress: () => router.navigate("/sol") },
  ];
  return (
    <View style={{ flexDirection: "row", gap: sp[3] }}>
      {items.map((q) => (
        <Pressable key={q.label} accessibilityRole={q.label === "Moodle" || q.label === "Teams" ? "link" : "button"} accessibilityLabel={q.label} onPress={q.onPress} style={({ pressed }) => ({ flex: 1, minHeight: 72, alignItems: "center", gap: sp[4], paddingVertical: sp[5], paddingHorizontal: sp[1], borderRadius: radius.l, backgroundColor: pressed ? c.panel2 : c.panel })}>
          <Icon name={q.icon} size={22} />
          <T style={{ fontFamily: font.body700, fontSize: fs.xs, textAlign: "center" }}>{q.label}</T>
        </Pressable>
      ))}
    </View>
  );
}

function HomeSkeleton() {
  return (
    <SkeletonArea label="Übersicht wird geladen">
      <View style={{ gap: sp[5] }}>
        <SkLine w="70%" h={28} />
        <SkLine w="45%" />
        <SkBox h={180} r={radius.xxl} />
        <View style={{ flexDirection: "row", gap: sp[3] }}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={{ flex: 1 }}>
              <SkBox h={72} r={radius.l} />
            </View>
          ))}
        </View>
        <SkBox h={320} />
      </View>
    </SkeletonArea>
  );
}
