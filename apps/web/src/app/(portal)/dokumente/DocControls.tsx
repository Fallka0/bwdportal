"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui";

/** Suche: aktualisiert die URL kurz nach dem Tippen (Ergebnis kommt vom Server). */
export function DocSearch({ initial }: { initial: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  return (
    <form
      role="search"
      className="srchbig"
      onSubmit={(e) => {
        e.preventDefault();
        router.replace(q ? `/dokumente?q=${encodeURIComponent(q)}` : "/dokumente", { scroll: false });
      }}
    >
      <Icon name="search" />
      <label className="sr" htmlFor="doc-q">
        Dokumente suchen
      </label>
      <input
        id="doc-q"
        type="search"
        placeholder="Dokumente suchen"
        value={q}
        autoComplete="off"
        onChange={(e) => {
          const v = e.target.value;
          setQ(v);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => router.replace(v ? `/dokumente?q=${encodeURIComponent(v)}` : "/dokumente", { scroll: false }), 250);
        }}
      />
    </form>
  );
}

/** Filter als Text-Tabs. */
export function DocTabs({ groups, total, active, q }: { groups: { name: string; total: number }[]; total: number; active?: string; q: string }) {
  const href = (g?: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (g) p.set("gruppe", g);
    const s = p.toString();
    return s ? `/dokumente?${s}` : "/dokumente";
  };
  return (
    <nav className="tabs ftabs" aria-label="Kategorie">
      <Link href={href()} aria-current={!active ? "true" : undefined} scroll={false}>
        Alle <span className="c">{total}</span>
      </Link>
      {groups.map((g) => (
        <Link key={g.name} href={href(g.name)} aria-current={active === g.name ? "true" : undefined} scroll={false}>
          {g.name} <span className="c">{g.total}</span>
        </Link>
      ))}
    </nav>
  );
}
