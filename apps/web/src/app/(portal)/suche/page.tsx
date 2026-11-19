import type { Metadata } from "next";
import Link from "next/link";
import { search } from "@bwd/db";
import { fmtDate, fmtGrade, fmtSize } from "@bwd/shared";
import { Card, Empty, Icon, ListRow } from "@/components/ui";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Suche" };

export default async function Search({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { env, me } = await requireUser();
  const q = ((await searchParams).q ?? "").slice(0, 80);
  const r = await search(env.db, me.id, env.now, q);
  const total = r.subjects.length + r.documents.length + r.links.length + r.news.length;
  return (
    <>
      <div className="ph">
        <h1>Suche</h1>
      </div>
      <form className="srchbig" action="/suche" role="search">
        <Icon name="search" />
        <label className="sr" htmlFor="s-q">
          Suchen
        </label>
        <input id="s-q" name="q" type="search" defaultValue={q} placeholder="Suchen: Fächer, Dokumente, Links" autoComplete="off" />
      </form>
      {q.length < 2 ? null : total === 0 ? (
        <Empty icon="search" title={`Nichts gefunden für «${q}».`} />
      ) : (
        <div className="stack">
          {r.subjects.length > 0 && (
            <Card aria-labelledby="s-f">
              <h2 id="s-f" className="box-t" style={{ marginBottom: "var(--sp-5)" }}>
                Fächer
              </h2>
              {r.subjects.map((s) => (
                <ListRow key={s.code} href={`/noten/${s.code}`} title={s.name} sub={s.average !== null ? `Schnitt ${fmtGrade(s.average)}` : undefined} />
              ))}
            </Card>
          )}
          {r.documents.length > 0 && (
            <Card aria-labelledby="s-d">
              <h2 id="s-d" className="box-t" style={{ marginBottom: "var(--sp-5)" }}>
                Dokumente
              </h2>
              {r.documents.map((d) => (
                <ListRow
                  key={d.id}
                  title={d.title}
                  sub={`${d.group} · ${fmtSize(d.sizeBytes)}`}
                  end={
                    <a className="ib" href={`/api/v1/files/documents/${d.id}`} download aria-label={`Herunterladen: ${d.title}`}>
                      <Icon name="download" small />
                    </a>
                  }
                />
              ))}
            </Card>
          )}
          {r.links.length > 0 && (
            <Card aria-labelledby="s-l">
              <h2 id="s-l" className="box-t" style={{ marginBottom: "var(--sp-5)" }}>
                Links
              </h2>
              {r.links.map((l) => (
                <ListRow
                  key={l.id}
                  title={l.title}
                  sub={l.sub}
                  end={
                    <a className="ib" href={l.url} target="_blank" rel="noopener noreferrer" aria-label={`${l.title} öffnen (neuer Tab)`}>
                      <Icon name="arrow-ur" small />
                    </a>
                  }
                />
              ))}
            </Card>
          )}
          {r.news.length > 0 && (
            <Card aria-labelledby="s-n">
              <h2 id="s-n" className="box-t" style={{ marginBottom: "var(--sp-5)" }}>
                Mitteilungen
              </h2>
              {r.news.map((n) => (
                <ListRow key={n.id} href={`/mitteilungen/${n.id}`} title={n.title} sub={`${n.author ?? ""} · ${fmtDate(n.publishedAt.slice(0, 10))}`} />
              ))}
            </Card>
          )}
        </div>
      )}
      <p className="sr">
        <Link href="/">Zur Übersicht</Link>
      </p>
    </>
  );
}
