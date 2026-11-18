import type { Metadata } from "next";
import { getDocuments } from "@bwd/db";
import { fmtSize } from "@bwd/shared";
import { Empty, Icon, LinkButton } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { DocSearch, DocTabs } from "./DocControls";

export const metadata: Metadata = { title: "Dokumente" };

export default async function Documents({ searchParams }: { searchParams: Promise<{ q?: string; gruppe?: string }> }) {
  const { env } = await requireUser();
  const sp = await searchParams;
  const q = (sp.q ?? "").slice(0, 80);
  const group = sp.gruppe;
  const d = await getDocuments(env.db, env.now, q, group);
  const shown = d.groups.filter((g) => g.items.length);
  return (
    <>
      <div className="ph">
        <h1>Dokumente</h1>
      </div>
      <DocSearch initial={q} />
      <DocTabs groups={d.groups.map((g) => ({ name: g.name, total: g.total }))} total={d.total} active={group} q={q} />
      {shown.length === 0 ? (
        <Empty icon="search" title={q ? `Kein Dokument für «${q}».` : "Keine Dokumente."}>
          {(q || group) && (
            <LinkButton href="/dokumente" variant="line" small>
              Suche zurücksetzen
            </LinkButton>
          )}
        </Empty>
      ) : (
        shown.map((g) => (
          <section key={g.name} className="dl-g" aria-labelledby={`dg-${g.name}`}>
            <h2 id={`dg-${g.name}`} className="k">
              {g.name}
            </h2>
            <div className="card">
              {g.items.map((doc) => (
                <div key={doc.id} className="dl">
                  <span className="dl-i" aria-hidden="true">
                    {doc.fileType}
                  </span>
                  <span>
                    <b>
                      {doc.title}
                      {doc.isNew && <span className="new">Neu</span>}
                    </b>
                    <span className="s">
                      {fmtSize(doc.sizeBytes)}
                      {doc.note ? ` · ${doc.note}` : ""}
                    </span>
                  </span>
                  <a className="alink open" href={`/api/v1/files/documents/${doc.id}?inline=1`} target="_blank" rel="noopener noreferrer" aria-label={`${doc.title} öffnen (neuer Tab)`}>
                    Öffnen
                  </a>
                  <a className="ib" href={`/api/v1/files/documents/${doc.id}`} download aria-label={`Herunterladen: ${doc.title}`}>
                    <Icon name="download" small />
                  </a>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </>
  );
}
