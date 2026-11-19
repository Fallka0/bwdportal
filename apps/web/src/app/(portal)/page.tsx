import type { Metadata } from "next";
import Link from "next/link";
import { getHome } from "@bwd/db";
import { config, dayColumns, fmtDate, fmtGrade, fmtLong, fmtPeriods, fmtShort, fmtShortLoose, fmtUntil, fmtWeekdayShort, greeting, isInsufficient, lessonRun, periodOf, plural, toMin, type Lesson } from "@bwd/shared";
import { Card, CardHead, Icon, LinkButton, ListRow } from "@/components/ui";
import { TimeGrid } from "@/components/timegrid/TimeGrid";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Übersicht" };

export default async function Home() {
  const { env, me } = await requireUser();
  const h = await getHome(env.db, me.id, env.now);
  return (
    <>
      <div className="hi">
        <h1>
          {greeting(env.now.time)}, {me.firstName}.
        </h1>
        <p>
          {fmtLong(h.today)} · {me.classCode}
        </p>
      </div>
      <div className="g12 home-grid">
        <div className="stack">
          <NextCard next={h.next} lessons={h.lessons} nowTime={h.now} />
          <div className="h-today">
            <TimeGrid
              variant="day"
              grid={{ end: config.homeGridEnd, columns: dayColumns([{ date: h.today }], h.lessons), lunch: h.lessons.length ? config.lunch : null }}
              now={{ date: env.now.date, time: env.now.time }}
              live={!env.demo}
              title="Heute"
              sub={fmtLong(h.today)}
              titleId="td-h"
              aside={
                <Link className="alink" href="/stundenplan">
                  Woche
                  <Icon name="arrow-r" small />
                </Link>
              }
            />
          </div>
        </div>
        <div className="stack">
          <section className="h-qa" aria-labelledby="qa-h">
            <h2 id="qa-h" className="sr">
              Schnellzugriff
            </h2>
            <div className="qa">
              <Link href="/absenzen?melden=1">
                <Icon name="plus" />
                Absenz melden
              </Link>
              <a href={config.services.moodle} target="_blank" rel="noopener noreferrer">
                <Icon name="grid4" />
                Moodle
              </a>
              <a href={config.services.teams} target="_blank" rel="noopener noreferrer">
                <Icon name="msg" />
                Teams
              </a>
              <Link href="/sol">
                <Icon name="book" />
                SOL
              </Link>
            </div>
          </section>

          <Card className="h-abs" aria-labelledby="ab-h">
            <CardHead id="ab-h" title="Offene Absenzen" href="/absenzen" />
            {h.openAbsences.length === 0 ? (
              <p className="empty-s">
                <Icon name="check" small />
                Keine offenen Absenzen.
              </p>
            ) : (
              h.openAbsences.map((a) => (
                <ListRow
                  key={a.id}
                  title={`${fmtWeekdayShort(a.date)} · ${plural(a.lessons.length, "Lektion", "Lektionen")}`}
                  sub={`${a.subjectsLabel}${a.dueDate ? ` · bis ${fmtShortLoose(a.dueDate)} entschuldigen` : ""}`}
                  end={
                    <LinkButton href={`/absenzen?entschuldigen=${a.id}`} small>
                      Entschuldigen
                    </LinkButton>
                  }
                />
              ))
            )}
          </Card>

          <Card className="h-gr" aria-labelledby="gr-h">
            <CardHead id="gr-h" title="Neue Noten" href="/noten" linkLabel="Alle Noten" />
            {h.recentGrades.length === 0 ? (
              <p className="empty-s">Noch keine Noten.</p>
            ) : (
              h.recentGrades.map((g) => (
                <ListRow key={g.examId} href={`/noten/${g.subjectCode}`} title={g.subjectName} sub={`${g.title} · ${fmtShort(g.date)}`} end={<span className={isInsufficient(g.value) ? "gv low" : "gv"}>{fmtGrade(g.value)}</span>} />
              ))
            )}
          </Card>

          <Card className="h-nw" aria-labelledby="nw-h">
            <CardHead id="nw-h" title="Mitteilungen" href="/mitteilungen" />
            {h.news.map((n) => (
              <ListRow key={n.id} href={`/mitteilungen/${n.id}`} title={n.title} sub={`${n.author ?? ""} · ${fmtDate(n.publishedAt.slice(0, 10))}`} />
            ))}
          </Card>
        </div>
      </div>
    </>
  );
}

function NextCard({ next, lessons, nowTime }: { next: Lesson | null; lessons: Lesson[]; nowTime: string }) {
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
        {next.teacher && (
          <span>
            <Icon name="user" small />
            <span className="sr">Lehrperson</span>
            {next.teacher.name}
          </span>
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
