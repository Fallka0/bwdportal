import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getNewsArticle } from "@bwd/db";
import { fmtLong, fmtSize, parseBody } from "@bwd/shared";
import { Icon } from "@/components/ui";
import { currentUserId, requireUser } from "@/lib/auth";
import { serverEnv } from "@/lib/env";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const env = await serverEnv();
  const uid = await currentUserId(env);
  const a = uid ? await getNewsArticle(env.db, uid, (await params).id, env.now, false) : null;
  return { title: a ? a.title : "Mitteilung" };
}

export default async function Article({ params }: Props) {
  const { env, me } = await requireUser();
  const a = await getNewsArticle(env.db, me.id, (await params).id, env.now);
  if (!a) notFound();
  return (
    <>
      <nav className="crumb" aria-label="Pfad">
        <Link className="ul" href="/mitteilungen">
          Mitteilungen
        </Link>
        <Icon name="chev-r" small />
        <span aria-current="page">{a.title.split(" ")[0]}</span>
      </nav>
      <article className="art">
        {a.pinned && (
          <span className="pinned">
            <Icon name="pin" small />
            Angeheftet
          </span>
        )}
        <h1>{a.title}</h1>
        <p className="meta">
          <span>{a.author}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={a.publishedAt}>{fmtLong(a.publishedAt.slice(0, 10), true)}</time>
        </p>
        <div className="body">
          {parseBody(a.bodyMd).map((b, i) =>
            b.type === "p" ? (
              <p key={i}>{b.text}</p>
            ) : (
              <ul key={i}>
                {b.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            ),
          )}
        </div>
        {a.document && (
          <a className="att" href={`/api/v1/files/documents/${a.document.id}`} download aria-label={`${a.document.title} herunterladen, ${fmtSize(a.document.sizeBytes)}`}>
            <span className="dl-i" aria-hidden="true">
              {a.document.fileType}
            </span>
            <span style={{ flex: 1 }}>
              <b>{a.document.title}</b>
              <span className="s">{fmtSize(a.document.sizeBytes)}</span>
            </span>
            <Icon name="download" />
          </a>
        )}
      </article>
    </>
  );
}
