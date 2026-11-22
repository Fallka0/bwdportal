import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DomainError, getSolOverview } from "@bwd/db";
import { fmtShort, SOL_STATUS_LABEL } from "@bwd/shared";
import { Card, Empty, Icon } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { BlockPick, DeleteTaskFile, NewTask, TaskActions } from "./SolForms";

type Props = { params: Promise<{ code: string }>; searchParams: Promise<{ block?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `SOL ${decodeURIComponent((await params).code)}` };
}

const KIND = { task: "Auftrag", material: "Unterlagen", solution: "Lösung" } as const;

export default async function SolTeacherPage({ params, searchParams }: Props) {
  const { env, me } = await requireTeacher();
  const o = await getSolOverview(env.db, me.id, decodeURIComponent((await params).code), env.now, Number((await searchParams).block) || undefined).catch((e: unknown) => {
    if (e instanceof DomainError) notFound();
    throw e;
  });
  const base = `/klassen/${encodeURIComponent(o.classCode)}/sol`;
  return (
    <>
      <nav className="crumb" aria-label="Pfad">
        <Link className="ul" href="/klassen">
          Klassen
        </Link>
        <Icon name="chev-r" small />
        <Link className="ul" href={`/klassen/${encodeURIComponent(o.classCode)}`}>
          {o.classCode}
        </Link>
        <Icon name="chev-r" small />
        <span aria-current="page">SOL</span>
      </nav>
      <div className="ph">
        <div>
          <h1>SOL {o.classCode}</h1>
          {o.block && (
            <p className="ph-sub">
              Block {o.block.n}
              {o.block.starts && o.block.ends ? ` · ${fmtShort(o.block.starts)} bis ${fmtShort(o.block.ends)}` : ""}
            </p>
          )}
        </div>
        <div className="ph-a">
          <Link className="btn btn-line" href={`${base}/checkin`}>
            <Icon name="check" small />
            Check-in
          </Link>
          {o.blocks.length > 1 && <BlockPick blocks={o.blocks.map((b) => b.n)} value={o.block?.n ?? 0} base={base} />}
        </div>
      </div>
      {!o.block ? (
        <Empty icon="book" title="Diese Klasse hat noch keine SOL-Blöcke." />
      ) : (
        <div className="stack">
          {o.groups.map((g) => (
            <Card key={g.subject.code} aria-labelledby={`sg-${g.subject.code}`}>
              <div className="row-h">
                <h2 id={`sg-${g.subject.code}`} className="box-t">
                  {g.subject.name}
                </h2>
                {g.editable && <NewTask classCode={o.classCode} block={o.block!.n} subject={g.subject.code} />}
              </div>
              {g.tasks.length === 0 ? (
                <p className="empty-s">Keine Aufträge in diesem Block.</p>
              ) : (
                <>
                  <ul className="soltk">
                    {g.tasks.map((t) => (
                      <li key={t.id}>
                        <div className="soltk-h">
                          <span>
                            <b>
                              {t.code} · {t.title}
                            </b>
                            <span className="s">
                              {t.minutes} Min. · {t.counts.done} erledigt · {t.counts.started} angefangen · {t.counts.open} offen
                            </span>
                          </span>
                          {g.editable && <TaskActions task={t} />}
                        </div>
                        {t.files.length > 0 && (
                          <ul className="kr-files">
                            {t.files.map((f) => (
                              <li key={f.id} className="kr-file">
                                <Icon name="file" small />
                                <a href={f.pdfHref ?? f.href} target="_blank" rel="noopener noreferrer">
                                  <b>{f.name}</b>
                                  <span>
                                    {KIND[f.kind]} · {f.ext.toUpperCase()}
                                  </span>
                                </a>
                                {g.editable ? <DeleteTaskFile id={f.id} name={f.name} /> : <span />}
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                  {o.students.length > 0 && (
                    <div className="nbuch-wrap" style={{ marginTop: "var(--sp-6)" }}>
                      <table className="nbuch solmx">
                        <caption className="sr">Stand {g.subject.name}</caption>
                        <thead>
                          <tr>
                            <th scope="col">Lernende</th>
                            {g.tasks.map((t) => (
                              <th key={t.id} scope="col" title={t.title}>
                                {t.code}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {o.students.map((s) => (
                            <tr key={s.id}>
                              <th scope="row">{s.name}</th>
                              {g.tasks.map((t) => {
                                const st = o.status[t.id]?.[s.id] ?? "open";
                                return (
                                  <td key={t.id} className={`sm-${st}`}>
                                    {st === "done" ? <Icon name="check" small /> : st === "started" ? <Icon name="clock" small /> : <span aria-hidden="true">–</span>}
                                    <span className="sr">{SOL_STATUS_LABEL[st]}</span>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
