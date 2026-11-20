import type { Metadata } from "next";
import Link from "next/link";
import { getHome } from "@bwd/db";
import { config, dayColumns, fmtDate, fmtGrade, fmtLong, fmtShort, fmtWeekdayShort, greeting, isInsufficient, plural } from "@bwd/shared";
import { Card, CardHead, Icon, LinkButton, ListRow, Status } from "@/components/ui";
import { TimeGrid } from "@/components/timegrid/TimeGrid";
import { requireUser } from "@/lib/auth";
import { NextCard } from "./NextCard";
import { TestsCard } from "./TestsCard";
import { TeacherHome } from "./TeacherHome";

export const metadata: Metadata = { title: "Übersicht" };

export default async function Home() {
  const { env, me } = await requireUser();
  if (me.role === "teacher") return <TeacherHome env={env} me={me} />;
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
              <Link href="/absenzen?tab=abmeldungen&neu=abmeldung">
                <Icon name="plus" />
                Abmelden
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
            <CardHead id="ab-h" title="Absenzen" href="/absenzen" />
            <ListRow
              title={`Kontingent: ${h.absences.contingent.available} von ${h.absences.contingent.size} verfügbar`}
              sub={`${plural(h.absences.contingent.missed, "Lektion", "Lektionen")} gefehlt · ${h.absences.contingent.used} bezogen`}
              end={
                <LinkButton href="/absenzen?tab=abmeldungen&neu=abmeldung" small>
                  Abmelden
                </LinkButton>
              }
            />
            {h.absences.recent.map((a) => (
              <ListRow key={a.id} href="/absenzen" title={`${fmtWeekdayShort(a.date)} · ${plural(a.lessons.length, "Lektion", "Lektionen")}`} sub={a.subjectsLabel} end={<Status tone={a.status === "unexcused" ? "err" : a.status === "dispensed" ? "ok" : "info"}>{a.status === "unexcused" ? "Unentschuldigt" : a.status === "dispensed" ? "Dispensiert" : "Kontingent"}</Status>} />
            ))}
          </Card>

          <TestsCard tests={h.tests} />

          <Card className="h-gr" aria-labelledby="gr-h">
            <CardHead id="gr-h" title="Neue Noten" href="/noten" linkLabel="Alle Noten" />
            {h.recentGrades.length === 0 ? (
              <p className="empty-s">Noch keine Noten.</p>
            ) : (
              h.recentGrades.map((g) => (
                <ListRow key={g.examId} href={`/noten/${g.subjectCode}?semester=${g.semester ?? ""}${g.module ? `&modul=${g.module}` : ""}`} title={g.subjectName} sub={`${g.title} · ${fmtShort(g.date)}`} end={<span className={isInsufficient(g.value) ? "gv low" : "gv"}>{fmtGrade(g.value)}</span>} />
              ))
            )}
          </Card>

          <Card className="h-nw" aria-labelledby="nw-h">
            <CardHead id="nw-h" title="Mitteilungen" href="/mitteilungen" />
            {h.news.length === 0 ? (
              <p className="empty-s">Keine Mitteilungen.</p>
            ) : (
              h.news.map((n) => <ListRow key={n.id} href={`/mitteilungen/${n.id}`} title={n.title} sub={`${n.author ?? ""} · ${fmtDate(n.publishedAt.slice(0, 10))}`} />)
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
