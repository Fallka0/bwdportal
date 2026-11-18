import type { Metadata } from "next";
import { getAbsences, lessonsForAbsence } from "@bwd/db";
import { addDays, fmtShortLoose, monthShort, plural, weekday, type Absence } from "@bwd/shared";
import { Empty, Kpis, Status, type StatusTone } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { AbsenceActions, ExcuseButton, ReportButton } from "./AbsenceDialog";

export const metadata: Metadata = { title: "Absenzen" };

const STATUS: Record<Absence["status"], [StatusTone, string]> = {
  open: ["warn", "Offen"],
  sent: ["info", "In Prüfung"],
  excused: ["ok", "Entschuldigt"],
  unexcused: ["err", "Unentschuldigt"],
};

function subline(a: Absence) {
  if (a.status === "open" || a.status === "sent") return a.dueDate ? `bis ${fmtShortLoose(a.dueDate)} entschuldigen` : "";
  if (a.status === "unexcused") return "Frist verpasst";
  return a.reason ?? "";
}

export default async function Absences({ searchParams }: { searchParams: Promise<{ melden?: string; entschuldigen?: string }> }) {
  const { env, me } = await requireUser();
  const sp = await searchParams;
  const a = await getAbsences(env.db, me.id);
  // Für "Absenz melden": Schultage der letzten 14 Tage mit Lektionen
  const days: { date: string; lessons: Awaited<ReturnType<typeof lessonsForAbsence>> }[] = [];
  for (let i = 0; i <= 14; i++) {
    const d = addDays(env.now.date, -i);
    if (weekday(d) === 0 || weekday(d) === 6) continue;
    const lessons = await lessonsForAbsence(env.db, me.id, d);
    if (lessons.length) days.push({ date: d, lessons });
  }
  const open = a.items.filter((x) => x.status === "open");
  const openLessons = Object.fromEntries(await Promise.all(open.map(async (x) => [x.id, await lessonsForAbsence(env.db, me.id, x.date)] as const)));

  return (
    <>
      <div className="ph">
        <h1>Absenzen</h1>
        <div className="ph-a">
          <ReportButton />
        </div>
      </div>
      <Kpis
        items={[
          { label: "Offen", value: a.counts.open, tone: a.counts.open ? "warn" : undefined },
          { label: "Unentschuldigt", value: a.counts.unexcused },
          { label: "Entschuldigt", value: a.counts.excused },
        ]}
      />
      <div className="seg-app" style={{ marginBottom: "var(--sp-5)" }}>
        <ReportButton wide />
      </div>
      {a.items.length === 0 ? (
        <Empty icon="check" title="Keine Absenzen." />
      ) : (
        <section className="card" aria-label="Alle Absenzen">
          {a.items.map((x) => {
            const [tone, label] = STATUS[x.status];
            return (
              <div key={x.id} className="ab">
                <span className="ab-d" aria-hidden="true">
                  <b>{x.date.slice(8)}</b>
                  <span>{monthShort(x.date).replace(".", "")}</span>
                </span>
                <span className="ab-m">
                  <b>
                    <span className="sr">{x.date} </span>
                    {plural(x.lessons.length, "Lektion", "Lektionen")} · {x.subjectsLabel}
                  </b>
                  <span className="s">{subline(x)}</span>
                  <Status tone={tone}>{label}</Status>
                </span>
                <Status tone={tone}>{label}</Status>
                <span className="ab-a">{x.status === "open" && <ExcuseButton id={x.id} date={x.date} />}</span>
                {x.status === "open" && <ExcuseButton id={x.id} date={x.date} row />}
              </div>
            );
          })}
        </section>
      )}
      <AbsenceActions
        open={open.map((x) => ({ id: x.id, date: x.date, dueDate: x.dueDate, periods: x.lessons.map((l) => l.period), dayLessons: openLessons[x.id] ?? [] }))}
        days={days}
        initial={sp.entschuldigen ? { kind: "excuse", id: sp.entschuldigen } : sp.melden ? { kind: "report" } : null}
      />
    </>
  );
}
