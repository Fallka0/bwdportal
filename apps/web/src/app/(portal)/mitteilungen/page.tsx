import type { Metadata } from "next";
import Link from "next/link";
import { getNews } from "@bwd/db";
import { fmtDate } from "@bwd/shared";
import { Empty, Icon } from "@/components/ui";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Mitteilungen" };

export default async function News() {
  const { env, me } = await requireUser();
  const items = await getNews(env.db, me.id);
  return (
    <>
      <div className="ph">
        <h1>Mitteilungen</h1>
      </div>
      {items.length === 0 ? (
        <Empty icon="megaphone" title="Keine Mitteilungen." />
      ) : (
        <div className="news">
          {items.map((n) => (
            <Link key={n.id} className={n.unread ? "nw unread" : "nw"} href={`/mitteilungen/${n.id}`}>
              <b>
                {n.unread && <span className="sr">Ungelesen: </span>}
                {n.title}
              </b>
              {n.pinned ? (
                <span className="pinned">
                  <Icon name="pin" small />
                  Angeheftet
                </span>
              ) : (
                <span />
              )}
              {n.teaser && <p>{n.teaser}</p>}
              <span className="meta">
                {n.author} · {fmtDate(n.publishedAt.slice(0, 10))}
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
