import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DomainError, getAssessment } from "@bwd/db";
import { fmtLong } from "@bwd/shared";
import { Icon } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { GradeEntry } from "./GradeEntry";

type Props = { params: Promise<{ code: string; fach: string; id: string }> };

export const metadata: Metadata = { title: "Noten erfassen" };

export default async function AssessmentPage({ params }: Props) {
  const { env, me } = await requireTeacher();
  const p = await params;
  const sheet = await getAssessment(env.db, me.id, decodeURIComponent(p.id), env.now).catch((e: unknown) => {
    if (e instanceof DomainError) notFound();
    throw e;
  });
  const a = sheet.assessment;
  const book = `/klassen/${encodeURIComponent(a.classCode)}/noten/${encodeURIComponent(a.subject.code)}?semester=${a.semester}`;
  return (
    <>
      <nav className="crumb" aria-label="Pfad">
        <Link className="ul" href={`/klassen/${encodeURIComponent(a.classCode)}`}>
          {a.classCode}
        </Link>
        <Icon name="chev-r" small />
        <Link className="ul" href={book}>
          {a.subject.name}
        </Link>
        <Icon name="chev-r" small />
        <span aria-current="page">{a.title}</span>
      </nav>
      <div className="ph">
        <div>
          <h1>{a.title}</h1>
          <p className="ph-sub">{[`${a.subject.name} ${a.classCode}`, fmtLong(a.date, true), `Gewicht ${String(a.weight).replace(".", ",")}`, `${a.semester}. Semester`].join(" · ")}</p>
        </div>
      </div>
      <GradeEntry sheet={sheet} book={book} />
    </>
  );
}
