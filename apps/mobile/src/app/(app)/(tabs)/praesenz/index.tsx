import { fmtLong, getNow, type AttendanceSlot } from "@bwd/shared";
import { View } from "react-native";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { ErrorState, Screen } from "@/shell/Screen";
import { sp } from "@/theme";
import { AttendanceRow } from "@/teacher/AttendanceRow";
import { Card, Empty, SkBox, SkeletonArea, T } from "@/ui";

/** Präsenz: eigene Lektionen von heute und den letzten Tagen. */
export default function Attendance() {
  const a = useApi(() => api.attendance(), []);
  const now = getNow();
  const days = new Map<string, AttendanceSlot[]>();
  for (const s of [...(a.data?.slots ?? [])].reverse()) days.set(s.date, [...(days.get(s.date) ?? []), s]);
  return (
    <Screen title="Präsenz" onRefresh={a.refresh} refreshing={a.refreshing}>
      {a.error && !a.data ? (
        <ErrorState message={a.error} onRetry={a.reload} />
      ) : !a.data ? (
        <SkeletonArea label="Präsenz wird geladen">
          <SkBox h={220} />
        </SkeletonArea>
      ) : a.data.slots.length === 0 ? (
        <Empty icon="check" title="Keine Lektionen in den letzten Tagen." />
      ) : (
        <View style={{ gap: sp[5] }}>
          {[...days].map(([date, list]) => (
            <Card key={date}>
              <T v="box" style={{ marginBottom: sp[3] }}>
                {date === now.date ? "Heute" : fmtLong(date)}
              </T>
              {[...list].reverse().map((s, i) => (
                <AttendanceRow key={s.id} slot={s} now={now} first={i === 0} />
              ))}
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}
