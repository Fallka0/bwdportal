import { WEEKDAYS, WEEKDAYS_SHORT, addDays, config, dayColumns, fmtDayMonth, fmtLong, fmtRange, fmtShort, getNow, isoWeek, mondayOf, weekday } from "@bwd/shared";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { api } from "@/lib/api";
import { useMe } from "@/lib/me";
import { useApi } from "@/lib/useApi";
import { ErrorState, Screen } from "@/shell/Screen";
import { sp } from "@/theme";
import { TimeGrid, TimeGridLegend } from "@/timegrid/TimeGrid";
import { Banner, Button, Segment, SkBox, SkeletonArea, T } from "@/ui";

const schoolDay = (d: string, dir: 1 | -1 = 1) => {
  let x = d;
  while (weekday(x) === 0 || weekday(x) === 6) x = addDays(x, dir);
  return x;
};

/** Stundenplan der App: Tag (Standard) und Woche. Zeit vom Server (DEMO_NOW) über /home. */
export default function Timetable() {
  const params = useLocalSearchParams<{ ansicht?: string }>();
  const [view, setView] = useState<"tag" | "woche">(params.ansicht === "woche" ? "woche" : "tag");
  const me = useMe();
  const clock = useApi(() => api.home(), [], { cache: "home" });
  const today = clock.data?.today ?? getNow().date;
  const now = { date: today, time: clock.data?.now ?? getNow().time };
  const live = !clock.data;
  const [date, setDate] = useState<string | null>(null);
  const d = schoolDay(date ?? today);
  const from = view === "woche" ? mondayOf(d) : d;
  const to = view === "woche" ? addDays(from, 4) : d;
  const tt = useApi(() => api.timetable(from, to), [from, to], { cache: "timetable" });

  const dates = view === "woche" ? [0, 1, 2, 3, 4].map((i) => addDays(from, i)) : [d];
  const columns = tt.data ? dayColumns(dates.map((x) => ({ date: x, header: WEEKDAYS_SHORT[weekday(x)], headerNum: String(Number(x.slice(8))) })), tt.data.lessons) : [];
  const isToday = d === today;
  const sol = tt.data?.lessons.some((l) => l.state === "sol");
  const title = view === "woche" ? fmtRange(from, to) : isToday ? "Heute" : WEEKDAYS[weekday(d)]!;
  const sub = view === "woche" ? `Woche ${isoWeek(from)}` : (isToday ? fmtLong(d) : fmtDayMonth(d)) + (sol ? " · SOL-Tag" : "");
  const current = view === "woche" ? mondayOf(today) === from : isToday;
  const step = (dir: 1 | -1) => setDate(view === "woche" ? addDays(from, 7 * dir) : schoolDay(addDays(d, dir), dir));
  const src = tt.data?.source;
  const stand = src?.lastRunAt ? (src.lastRunAt.slice(0, 10) === today ? `von heute ${src.lastRunAt.slice(11, 16)}` : `vom ${fmtShort(src.lastRunAt.slice(0, 10))} ${src.lastRunAt.slice(11, 16)}`) : null;

  return (
    <Screen title="Stundenplan" onRefresh={tt.refresh} refreshing={tt.refreshing}>
      <View style={{ marginBottom: sp[6] }}>
        <Segment label="Ansicht" value={view} onChange={setView} options={[{ value: "tag", label: "Tag" }, { value: "woche", label: "Woche" }]} />
      </View>
      {src?.stale && (
        <Banner action={<Button label="Erneut laden" small variant="line" onPress={tt.reload} />}>
          <T v="strong" tone="warn">
            WebUntis antwortet gerade nicht.
          </T>{" "}
          {stand ? `Du siehst den Stundenplan ${stand}. Änderungen seither fehlen.` : "Es gibt noch keinen Stand des Plans."}
        </Banner>
      )}
      {tt.error && !tt.data ? (
        <ErrorState message={tt.error} onRetry={tt.reload} />
      ) : !tt.data || clock.loading ? (
        <SkeletonArea label="Stundenplan wird geladen">
          <SkBox h={560} />
        </SkeletonArea>
      ) : (
        <>
          <TimeGrid
            variant={view === "woche" ? "week" : "day"}
            grid={{ end: config.timeGridEnd, columns, lunch: config.lunch }}
            now={now}
            live={live}
            title={title}
            sub={view === "woche" && me.data ? `${sub} · ${me.data.classCode}` : sub}
            prev={{ onPress: () => step(-1), label: view === "woche" ? "Vorherige Woche" : "Vorheriger Tag" }}
            next={{ onPress: () => step(1), label: view === "woche" ? "Nächste Woche" : "Nächster Tag" }}
            today={current ? undefined : { onPress: () => setDate(null), label: "Zu heute" }}
          />
          {view === "woche" && <TimeGridLegend />}
        </>
      )}
    </Screen>
  );
}
