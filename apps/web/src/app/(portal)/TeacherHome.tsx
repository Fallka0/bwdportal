import Link from "next/link";
import { getTeacherHome } from "@bwd/db";
import { config, dayColumns, homeGridEnd, fmtDate, fmtLong, greeting, plural, type Me } from "@bwd/shared";
import { Card, CardHead, Icon, ListRow } from "@/components/ui";
import { TimeGrid } from "@/components/timegrid/TimeGrid";
import type { ServerEnv } from "@/lib/env";
import { NextCard } from "./NextCard";
import { AttendanceRow } from "./praesenz/AttendanceRow";
import { TestsCard } from "./TestsCard";

/** Übersicht einer Lehrperson: nächste Lektion, heute, ihre Klassen, Mitteilungen. */
export async function TeacherHome({ env, me }: { env: ServerEnv; me: Me }) {
  const h = await getTeacherHome(env.db, me.id, env.now);
  return (
    <>
      <div className="hi">
        <h1>
          {greeting(env.now.time)}, {me.firstName}.
        </h1>
        <p>{fmtLong(h.today)} · Lehrperson</p>
      </div>
      <div className="g12 home-grid">
        <div className="stack">
          <NextCard next={h.next} lessons={h.lessons} nowTime={h.now} />
          <div className="h-today">
            <TimeGrid
              variant="day"
              grid={{ end: homeGridEnd(h.lessons), columns: dayColumns([{ date: h.today }], h.lessons), lunch: h.lessons.length ? config.lunch : null }}
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
              <a href={config.services.moodle} target="_blank" rel="noopener noreferrer">
                <Icon name="grid4" />
                Moodle
              </a>
              <a href={config.services.teams} target="_blank" rel="noopener noreferrer">
                <Icon name="msg" />
                Teams
              </a>
              <Link href="/dokumente">
                <Icon name="folder" />
                Dokumente
              </Link>
              <Link href="/links">
                <Icon name="link" />
                Links
              </Link>
            </div>
          </section>

          <Card className="h-att" aria-labelledby="pz-h">
            <CardHead id="pz-h" title="Präsenz heute" href="/praesenz" />
            {h.attendance.length === 0 ? <p className="empty-s">Heute keine Lektionen.</p> : h.attendance.map((s) => <AttendanceRow key={s.id} slot={s} now={env.now} />)}
          </Card>

          <Card className="h-cls" aria-labelledby="kl-h">
            <CardHead id="kl-h" title="Meine Klassen" href="/klassen" />
            {h.classes.length === 0 ? (
              <p className="empty-s">Noch keine Klassen zugeteilt.</p>
            ) : (
              h.classes.map((c) => (
                <ListRow
                  key={c.code}
                  href={`/klassen/${encodeURIComponent(c.code)}`}
                  title={c.code}
                  sub={[c.subjects.map((s) => s.name).join(", "), plural(c.students, "Lernende Person", "Lernende")].filter(Boolean).join(" · ")}
                  end={c.classTeacher ? <span className="lr-s">Klassenlehrperson</span> : undefined}
                />
              ))
            )}
          </Card>

          <TestsCard tests={h.tests} teacher />

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
