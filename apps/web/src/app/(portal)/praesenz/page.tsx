import type { Metadata } from "next";
import { ATTENDANCE_DAYS_BACK, attendanceSlots } from "@bwd/db";
import { addDays, fmtLong, type AttendanceSlot } from "@bwd/shared";
import { Card, Empty } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { AttendanceRow } from "./AttendanceRow";

export const metadata: Metadata = { title: "Präsenz" };

/** Präsenz: eigene Lektionen von heute und den letzten Tagen, offene zuerst sichtbar am Status. */
export default async function Attendance() {
  const { env, me } = await requireTeacher();
  const slots = await attendanceSlots(env.db, me.id, addDays(env.now.date, -ATTENDANCE_DAYS_BACK), env.now.date);
  const days = new Map<string, AttendanceSlot[]>();
  for (const s of [...slots].reverse()) days.set(s.date, [...(days.get(s.date) ?? []), s]);
  return (
    <>
      <div className="ph">
        <h1>Präsenz</h1>
      </div>
      {slots.length === 0 ? (
        <Empty icon="check" title={me.teaches.length ? "Keine Lektionen in den letzten Tagen." : "Dir sind noch keine Klassen zugeteilt."} />
      ) : (
        <div className="stack">
          {[...days].map(([date, list]) => (
            <Card key={date} aria-labelledby={`pd-${date}`}>
              <h2 id={`pd-${date}`} className="box-t" style={{ marginBottom: "var(--sp-3)" }}>
                {date === env.now.date ? `Heute, ${fmtLong(date).split(", ")[1]}` : fmtLong(date)}
              </h2>
              {[...list].reverse().map((s) => (
                <AttendanceRow key={s.id} slot={s} now={env.now} />
              ))}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
