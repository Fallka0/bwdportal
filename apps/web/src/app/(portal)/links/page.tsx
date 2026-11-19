import type { Metadata } from "next";
import { getLinks } from "@bwd/db";
import { Icon } from "@/components/ui";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Links" };

export default async function Links() {
  const { env } = await requireUser();
  const links = await getLinks(env.db);
  const groups = [...new Set(links.map((l) => l.group))];
  return (
    <>
      <div className="ph">
        <h1>Links</h1>
      </div>
      {groups.map((g) => (
        <section key={g} className="dl-g" aria-labelledby={`lg-${g}`}>
          <h2 id={`lg-${g}`} className="k" style={{ marginBottom: "var(--sp-3)" }}>
            {g}
          </h2>
          <div className="lk">
            {links
              .filter((l) => l.group === g)
              .map((l) => (
                <a key={l.id} className="lc" href={l.url} target="_blank" rel="noopener noreferrer" aria-label={`${l.title} öffnen (neuer Tab)`}>
                  <span className={l.accent ? "lc-i" : "lc-i l2"} aria-hidden="true">
                    {l.badge}
                  </span>
                  <span>
                    <b>{l.title}</b>
                    {l.sub && <span className="s">{l.sub}</span>}
                  </span>
                  <Icon name="arrow-ur" small />
                </a>
              ))}
          </div>
        </section>
      ))}
    </>
  );
}
