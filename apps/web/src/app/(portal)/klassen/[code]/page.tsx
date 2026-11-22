import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DomainError, getClassView } from "@bwd/db";
import { fmtShort, plural } from "@bwd/shared";
import { Card, Empty, Icon, ListRow, Status } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: decodeURIComponent((await params).code) };
}

export default async function ClassPage({ params }: Props) {
  const { env, me } = await requireTeacher();
  const c = await getClassView(env.db, me.id, decodeURIComponent((await params).code), env.now).catch((e: unknown) => {
    if (e instanceof DomainError) notFound();
    throw e;
  });
  return (
    <>
      <nav className="crumb" aria-label="Pfad">
        <Link className="ul" href="/klassen">
          Klassen
        </Link>
        <Icon name="chev-r" small />
        <span aria-current="page">{c.code}</span>
      </nav>
      <div className="ph">
        <div>
          <h1>{c.code}</h1>
          <p className="ph-sub">{[c.program, c.subjects.map((s) => s.name).join(", "), c.classTeacher ? "Klassenlehrperson" : null].filter(Boolean).join(" · ")}</p>
        </div>
      </div>
      {c.students.length === 0 ? (
        <Empty icon="users" title="Keine Lernenden in dieser Klasse." />
      ) : (
        <Card aria-labelledby="ls-h">
          <h2 id="ls-h" className="box-t" style={{ marginBottom: "var(--sp-3)" }}>
            {plural(c.students.length, "Lernende Person", "Lernende")}
          </h2>
          {c.students.map((s) => {
            const a = s.absences;
            return (
              <ListRow
                key={s.id}
                title={s.name}
                sub={a ? [plural(a.missed, "Lektion gefehlt", "Lektionen gefehlt"), a.lastDate ? `zuletzt ${fmtShort(a.lastDate)}` : null].filter(Boolean).join(" · ") : s.email}
                end={
                  a ? (
                    a.unexcused > 0 ? (
                      <Status tone="err">{`${a.unexcused} unentschuldigt`}</Status>
                    ) : (
                      <Status tone={a.contingentAvailable === 0 ? "warn" : "ok"}>{`Kontingent ${a.contingentAvailable} von ${a.contingentSize}`}</Status>
                    )
                  ) : undefined
                }
              />
            );
          })}
        </Card>
      )}
    </>
  );
}
