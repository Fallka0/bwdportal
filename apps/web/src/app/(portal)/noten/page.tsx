import type { Metadata } from "next";
import Link from "next/link";
import { getGrades } from "@bwd/db";
import { config, fmtDayMonth, fmtGrade, gradeBar, isInsufficient, plural } from "@bwd/shared";
import { Empty, Icon, Kpis, LinkButton } from "@/components/ui";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Noten" };

export default async function Grades({ searchParams }: { searchParams: Promise<{ semester?: string }> }) {
  const { env, me } = await requireUser();
  const sem = (await searchParams).semester === "2" ? 2 : 1;
  const g = await getGrades(env.db, me.id, sem);
  const seg = (
    <>
      <Link href="/noten" aria-current={sem === 1 ? "page" : undefined}>
        1. Semester
      </Link>
      <Link href="/noten?semester=2" aria-current={sem === 2 ? "page" : undefined}>
        2. Semester
      </Link>
    </>
  );
  return (
    <div className="tt-head">
      <div className="ph">
        <h1>Noten</h1>
        <div className="ph-a">
          <nav className="seg" aria-label="Semester">
            {seg}
          </nav>
        </div>
      </div>
      <nav className="seg seg-full seg-app" aria-label="Semester">
        {seg}
      </nav>
      {g.subjects.length === 0 ? (
        <Empty icon="chart" title={`Noch keine Noten im ${sem}. Semester.`}>
          {sem === 2 && <p>Das 2. Semester beginnt am {fmtDayMonth(config.secondSemesterStart)} {config.secondSemesterStart.slice(0, 4)}.</p>}
          {sem === 2 && (
            <LinkButton href="/noten" variant="line" small>
              1. Semester ansehen
            </LinkButton>
          )}
        </Empty>
      ) : (
        <>
          <Kpis
            items={[
              { label: "Gesamtschnitt", value: g.average !== null ? fmtGrade(g.average) : "–" },
              { label: "Prüfungen", value: g.examCount },
              { label: "Ungenügend", value: g.insufficient, tone: g.insufficient ? "err" : undefined },
            ]}
          />
          <section className="card" aria-label="Fächer">
            <div className="subj">
              {g.subjects.map((s) => {
                const low = s.average !== null && isInsufficient(s.average);
                return (
                  <Link key={s.code} className={low ? "sj flag" : "sj"} href={`/noten/${s.code}`}>
                    <span className="sj-i" aria-hidden="true">
                      {s.short}
                    </span>
                    <span className="sj-m">
                      <b>{s.name}</b>
                      <span className="s">
                        {plural(s.examCount, "Prüfung", "Prüfungen")}
                        {s.teacher ? ` · ${s.teacher}` : ""}
                      </span>
                    </span>
                    <span className={low ? "gb low" : "gb"} aria-hidden="true">
                      <i style={{ width: `${gradeBar(s.average ?? 1)}%` }} />
                    </span>
                    <span className={low ? "gv low" : "gv"}>
                      <span className="sr">Schnitt </span>
                      {s.average !== null ? fmtGrade(s.average) : "–"}
                    </span>
                    <Icon name="chev-r" small />
                  </Link>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
