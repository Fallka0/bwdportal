import { fmtPeriods, fmtUntil, lessonRun, periodOf, toMin, type Lesson } from "@bwd/shared";
import { Icon } from "@/components/ui";

/** "Als Nächstes" auf der Übersicht (Lernende: Lehrperson, Lehrperson: Klasse). */
export function NextCard({ next, lessons, nowTime }: { next: Lesson | null; lessons: Lesson[]; nowTime: string }) {
  if (!next) {
    return (
      <section className="next h-next" aria-labelledby="nx-h">
        <span className="k" id="nx-h">
          Als Nächstes
        </span>
        <p className="next-none">Heute keine weiteren Lektionen.</p>
      </section>
    );
  }
  const run = lessonRun(lessons, next);
  const periods = run.map((l) => periodOf(l.start)).filter((p): p is number => p !== null);
  const periodLabel = fmtPeriods(periods);
  return (
    <section className="next h-next" aria-labelledby="nx-h">
      <span className="k" id="nx-h">
        Als Nächstes · {fmtUntil(toMin(next.start) - toMin(nowTime))}
      </span>
      <div className="next-t">
        <b>{next.subject?.name}</b>
        <span>{next.start}</span>
      </div>
      <div className="next-m">
        {next.room && (
          <span>
            <Icon name="door" small />
            <span className="sr">Raum</span>
            {next.room}
          </span>
        )}
        {next.classCode ? (
          <span>
            <Icon name="users" small />
            <span className="sr">Klasse</span>
            {next.classCode}
          </span>
        ) : (
          next.teacher && (
            <span>
              <Icon name="user" small />
              <span className="sr">Lehrperson</span>
              {next.teacher.name}
            </span>
          )
        )}
        {periods.length > 0 && (
          <span>
            <Icon name="clock" small />
            {periodLabel}
          </span>
        )}
      </div>
      {next.state === "room_changed" && (
        <div className="next-chg">
          <Icon name="swap" small />
          Raumänderung: {next.room} statt {next.originalRoom}
        </div>
      )}
    </section>
  );
}
