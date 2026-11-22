import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DomainError, getGradebook } from "@bwd/db";
import { fmtGrade, fmtShort, isInsufficient } from "@bwd/shared";
import { Card, Empty, Icon } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { NewAssessment, SemesterPick } from "./GradebookForms";

type Props = { params: Promise<{ code: string; fach: string }>; searchParams: Promise<{ semester?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params;
  return { title: `Noten ${decodeURIComponent(p.code)}` };
}

const num = (v: number | null) => (v === null ? "–" : fmtGrade(v));

export default async function GradebookPage({ params, searchParams }: Props) {
  const { env, me } = await requireTeacher();
  const p = await params;
  const code = decodeURIComponent(p.code);
  const fach = decodeURIComponent(p.fach);
  const b = await getGradebook(env.db, me.id, code, fach, env.now, Number((await searchParams).semester) || undefined).catch((e: unknown) => {
    if (e instanceof DomainError) notFound();
    throw e;
  });
  const base = `/klassen/${encodeURIComponent(b.classCode)}/noten/${encodeURIComponent(b.subject.code)}`;
  const avg = (i: number) => {
    const v = b.students.map((s) => s.values[i]).filter((x): x is number => x !== null);
    return v.length >= 3 ? Math.round((v.reduce((a, c) => a + c, 0) / v.length) * 10) / 10 : null;
  };
  return (
    <>
      <nav className="crumb" aria-label="Pfad">
        <Link className="ul" href="/klassen">
          Klassen
        </Link>
        <Icon name="chev-r" small />
        <Link className="ul" href={`/klassen/${encodeURIComponent(b.classCode)}`}>
          {b.classCode}
        </Link>
        <Icon name="chev-r" small />
        <span aria-current="page">{b.subject.name}</span>
      </nav>
      <div className="ph">
        <div>
          <h1>
            {b.subject.name} {b.classCode}
          </h1>
          <p className="ph-sub">
            {b.semester}. Semester · {b.semesterLabel}
          </p>
        </div>
        <div className="ph-a">
          <SemesterPick semesters={b.semesters} value={b.semester} base={base} />
          {b.editable && <NewAssessment classCode={b.classCode} subject={b.subject.code} base={base} />}
        </div>
      </div>
      {b.students.length === 0 ? (
        <Empty icon="users" title="Keine Lernenden in dieser Klasse." />
      ) : b.assessments.length === 0 ? (
        <Empty icon="chart" title={`Noch keine Proben im ${b.semester}. Semester.`} />
      ) : (
        <Card aria-label="Notenbuch" className="nbuch-card">
          <div className="nbuch-wrap">
            <table className="nbuch">
              <thead>
                <tr>
                  <th scope="col">Lernende</th>
                  {b.assessments.map((a) => (
                    <th key={a.id} scope="col">
                      <Link href={`${base}/${encodeURIComponent(a.id)}`}>
                        <b>{a.title}</b>
                        <span>
                          {fmtShort(a.date)}
                          {a.weight !== 1 ? ` · ×${String(a.weight).replace(".", ",")}` : ""}
                        </span>
                      </Link>
                    </th>
                  ))}
                  <th scope="col" className="nbuch-z">
                    Zeugnis
                  </th>
                </tr>
              </thead>
              <tbody>
                {b.students.map((s) => (
                  <tr key={s.id}>
                    <th scope="row">{s.name}</th>
                    {s.values.map((v, i) => (
                      <td key={b.assessments[i]!.id} className={v !== null && isInsufficient(v) ? "low" : undefined}>
                        {num(v)}
                      </td>
                    ))}
                    <td className={`nbuch-z${s.grade !== null && isInsufficient(s.grade) ? " low" : ""}`} title={s.raw !== null ? `Schnitt ${s.raw.toFixed(2)}` : undefined}>
                      {num(s.grade)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">Schnitt</th>
                  {b.assessments.map((a, i) => (
                    <td key={a.id}>{num(avg(i))}</td>
                  ))}
                  <td className="nbuch-z" />
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
