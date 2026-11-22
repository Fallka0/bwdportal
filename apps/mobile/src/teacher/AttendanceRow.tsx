import { fmtPeriods, type AttendanceSlot } from "@bwd/shared";
import { router } from "expo-router";
import { ListRow, Status, T } from "@/ui";

/** Eine Kontrolle: Fach und Klasse, Zeit, Stand. */
export function AttendanceRow({ slot, now, first }: { slot: AttendanceSlot; now: { date: string; time: string }; first?: boolean }) {
  const due = slot.date < now.date || slot.start <= now.time;
  const end = slot.checked ? (
    <Status tone="ok" label={slot.checked.absent === 0 ? "Alle da" : slot.checked.absent === 1 ? "1 fehlt" : `${slot.checked.absent} fehlen`} />
  ) : due ? (
    <Status tone="warn" label="Offen" />
  ) : (
    <T v="small">{slot.start}</T>
  );
  return (
    <ListRow
      first={first}
      title={`${slot.subject.name} · ${slot.classCode}`}
      sub={[`${slot.start} bis ${slot.end}`, fmtPeriods(slot.periods), slot.room].filter(Boolean).join(" · ")}
      end={end}
      onPress={() => router.push(`/praesenz/${encodeURIComponent(slot.id)}`)}
    />
  );
}
