import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPortfolioSubject } from "@bwd/db";
import { fmtGrade, fmtShortLoose, fmtWeekdayDate, gradeBar, isInsufficient, monthShort, plural } from "@bwd/shared";
import { Card, Empty, Icon } from "@/components/ui";
import { currentUserId, requireUser } from "@/lib/auth";
import { serverEnv } from "@/lib/env";
import { EditLink, GradeActions, GradeDialogs, WishGrade } from "../GradeForms";

type Props = { params: Promise<{ fach: string }>; searchParams: Promise<{ semester?: string; modul?: string }> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const env = await serverEnv();
  const id = await currentUserId(env);
  const sp = await searchParams;
  const s = id ? await getPortfolioSubject(env.db, id, env.now, (await params).fach.toUpperCase(), Number(sp.semester) || undefined, sp.modul) : null;
  return { title: s ? `${s.name} · Noten` : "Noten" };
}

const weightLabel = (w: number) => (w === 0 ? "zählt nicht (ohne Gewicht)" : `Gewicht ${String(w).replace(".", ",")}`);

export default async function Subject({ params, searchParams }: Props) {
  const { env, me } = await requireUser();
  const sp = await searchParams;
  const code = decodeURIComponent((await params).fach).toUpperCase();
  const s = await getPortfolioSubject(env.db, me.id, env.now, code, Number(sp.semester) || undefined, sp.modul);
  if (!s) notFound();
  const chrono = [...s.entries].reverse();
  const when = (e: (typeof s.entries)[number]) => (e.date ? fmtWeekdayDate(e.date) : `Erfasst ${fmtShortLoose(e.enteredAt)}`);
  return (
    <>
      <nav className="crumb" aria-label="Pfad">
        <Link className="ul" href={`/noten?semester=${s.semester}`}>
          Noten
        </Link>
        <Icon name="chev-r" small />
        <span aria-current="page">{s.name}</span>
      </nav>
      <div className="ph">
        <div>
          <h1>{s.module && s.moduleName ? `${s.module} ${s.moduleName}` : s.name}</h1>
          <p className="ph-sub">
            {s.semester}. Semester · {s.label}
            {s.teacher ? ` · ${s.teacher}` : ""} · {plural(s.entries.length, "Probe", "Proben")}
          </p>
        </div>
        <div className="ph-a">
          <GradeActions semester={s.semester} subject={s.code} module={s.module} />
        </div>
      </div>
      <div className="seg-app" style={{ marginBottom: "var(--sp-5)" }}>
        <GradeActions semester={s.semester} subject={s.code} module={s.module} wide />
      </div>
      {s.entries.length === 0 ? (
        <Empty icon="chart" title={`Noch keine Noten in ${s.name}.`} />
      ) : (
        <div className="g12">
          <Card aria-labelledby="ex-h">
            <h2 id="ex-h" className="box-t" style={{ marginBottom: "var(--sp-5)" }}>
              Proben
            </h2>
            <div>
              {s.entries.map((e) => (
                <div key={e.id} className="ex">
                  <span>
                    <b>{e.title}</b>
                    <span className="s">
                      {when(e)} · {weightLabel(e.weight)}
                    </span>
                  </span>
                  <span className="w">
                    {e.classAverage !== null ? `Klasse ${fmtGrade(e.classAverage)} ` : ""}
                    <EditLink id={e.id} label={`${e.title} bearbeiten`} />
                  </span>
                  <span className={isInsufficient(e.value) ? "gv low" : "gv"}>
                    <span className="sr">Note </span>
                    {fmtGrade(e.value)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
          <div className="stack">
            <section className="next avg-card" aria-labelledby="avg-h">
              <span className="k" id="avg-h">
                {s.code === "IN" ? "Modulnote" : "Zeugnisnote"}
              </span>
              <div className="next-t">
                <b>{s.grade !== null ? fmtGrade(s.grade) : "–"}</b>
                {s.raw !== null && s.code !== "IN" && <span>Schnitt {s.raw.toFixed(2)}</span>}
                {s.classAverage !== null && <span>Klasse {fmtGrade(s.classAverage)}</span>}
              </div>
            </section>
            <WishGrade entries={s.entries} current={s.grade} module={s.code === "IN"} />
            {chrono.length > 1 && (
              <Card aria-labelledby="vl-h">
                <h2 id="vl-h" className="box-t">
                  Verlauf
                </h2>
                <div className="spark" role="img" aria-label={`Noten von alt nach neu: ${chrono.map((e) => fmtGrade(e.value)).join(", ")}`}>
                  {chrono.map((e, i) => (
                    <i key={e.id} className={i === chrono.length - 1 ? "last" : undefined} style={{ height: `${gradeBar(e.value)}%` }} />
                  ))}
                </div>
                <div className="spark-l" aria-hidden="true">
                  <span>{monthShort(chrono[0]!.date ?? chrono[0]!.enteredAt)}</span>
                  <span>{monthShort(chrono.at(-1)!.date ?? chrono.at(-1)!.enteredAt)}</span>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
      <GradeDialogs semester={s.semester} subject={s.code} module={s.module} entries={s.entries} />
    </>
  );
}
