import { fmtPeriods, type AttendanceSlot } from "@bwd/shared";
import { ListRow, Status } from "@/components/ui";

/** Eine Kontrolle in Listen: Fach und Klasse, Zeit, Stand. */
export function AttendanceRow({ slot, now }: { slot: AttendanceSlot; now: { date: string; time: string } }) {
  const due = slot.date < now.date || slot.start <= now.time;
  const state = slot.checked ? (
    <Status tone="ok">{slot.checked.absent === 0 ? "Alle da" : slot.checked.absent === 1 ? "1 fehlt" : `${slot.checked.absent} fehlen`}</Status>
  ) : due ? (
    <Status tone="warn">Offen</Status>
  ) : (
    <span className="lr-s">{slot.start}</span>
  );
  return (
    <ListRow
      href={`/praesenz/${encodeURIComponent(slot.id)}`}
      title={`${slot.subject.name} · ${slot.classCode}`}
      sub={[`${slot.start} bis ${slot.end}`, fmtPeriods(slot.periods), slot.room].filter(Boolean).join(" · ")}
      end={state}
    />
  );
}
