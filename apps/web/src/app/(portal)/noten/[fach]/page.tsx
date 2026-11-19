import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSubjectGrades } from "@bwd/db";
import { fmtGrade, fmtWeekdayDate, fmtWeight, gradeBar, isInsufficient, monthShort, plural } from "@bwd/shared";
import { Card, Empty, Icon } from "@/components/ui";
import { currentUserId, requireUser } from "@/lib/auth";
import { serverEnv } from "@/lib/env";

type Props = { params: Promise<{ fach: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const env = await serverEnv();
  const id = await currentUserId(env);
  const s = id ? await getSubjectGrades(env.db, id, (await params).fach.toUpperCase()) : null;
  return { title: s ? `${s.subject.name} · Noten` : "Noten" };
}

export default async function Subject({ params }: Props) {
  const { env, me } = await requireUser();
  const s = await getSubjectGrades(env.db, me.id, decodeURIComponent((await params).fach).toUpperCase());
  if (!s) notFound();
  const graded = s.exams.filter((e) => e.value !== null);
  const chrono = [...graded].reverse();
  return (
    <>
      <nav className="crumb" aria-label="Pfad">
        <Link className="ul" href="/noten">
          Noten
        </Link>
        <Icon name="chev-r" small />
        <span aria-current="page">{s.subject.name}</span>
      </nav>
      <div className="ph">
        <div>
          <h1>{s.subject.name}</h1>
          <p className="ph-sub">
            {s.teacher ? `${s.teacher} · ` : ""}
            {plural(s.exams.length, "Prüfung", "Prüfungen")}
          </p>
        </div>
      </div>
      {s.exams.length === 0 ? (
        <Empty icon="chart" title={`Noch keine Noten in ${s.subject.name}.`} />
      ) : (
        <div className="g12">
          <Card aria-labelledby="ex-h">
            <h2 id="ex-h" className="box-t" style={{ marginBottom: "var(--sp-5)" }}>
              Prüfungen
            </h2>
            <div>
              {s.exams.map((e) => (
                <div key={e.id} className="ex">
                  <span>
                    <b>{e.title}</b>
                    <span className="s">
                      {fmtWeekdayDate(e.date)} · {fmtWeight(e.weight)}
                    </span>
                  </span>
                  <span className="w">{e.classAverage !== null ? `Klasse ${fmtGrade(e.classAverage)}` : ""}</span>
                  <span className={e.value !== null && isInsufficient(e.value) ? "gv low" : "gv"}>
                    <span className="sr">Note </span>
                    {e.value !== null ? fmtGrade(e.value) : "–"}
                  </span>
                </div>
              ))}
            </div>
          </Card>
          <div className="stack">
            <section className="next avg-card" aria-labelledby="avg-h">
              <span className="k" id="avg-h">
                Schnitt
              </span>
              <div className="next-t">
                <b>{s.average !== null ? fmtGrade(s.average) : "–"}</b>
                {s.classAverage !== null && <span>Klasse {fmtGrade(s.classAverage)}</span>}
              </div>
            </section>
            {chrono.length > 0 && (
              <Card aria-labelledby="vl-h">
                <h2 id="vl-h" className="box-t">
                  Verlauf
                </h2>
                <div className="spark" role="img" aria-label={`Noten von alt nach neu: ${chrono.map((e) => fmtGrade(e.value!)).join(", ")}`}>
                  {chrono.map((e, i) => (
                    <i key={e.id} className={i === chrono.length - 1 ? "last" : undefined} style={{ height: `${gradeBar(e.value!)}%` }} />
                  ))}
                </div>
                <div className="spark-l" aria-hidden="true">
                  <span>{monthShort(chrono[0]!.date)}</span>
                  <span>{monthShort(chrono.at(-1)!.date)}</span>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </>
  );
}
