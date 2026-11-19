import type { Metadata } from "next";
import Link from "next/link";
import type { IconName } from "@bwd/shared/icons";
import { getSolCalendar } from "@bwd/db";
import { WEEKDAYS, daysBetween, weekday } from "@bwd/shared";
import { Icon } from "@/components/ui";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Mehr" };

/** Übrige Bereiche mit Zähler (in der App über den Tab "Mehr"). */
export default async function More() {
  const { me, env } = await requireUser();
  const sol = await getSolCalendar(env.db, me.id, env.now);
  const solSub = sol.day ? (sol.day.date === env.now.date ? "SOL-Tag heute" : daysBetween(env.now.date, sol.day.date) < 7 ? `SOL-Tag am ${WEEKDAYS[weekday(sol.day.date)]}` : "") : "";
  const items: { href: string; title: string; sub?: string; icon: IconName; dot?: boolean }[] = [
    { href: "/sol", title: "SOL", sub: solSub, icon: "book" },
    { href: "/absenzen", title: "Absenzen", sub: me.counts.openAbsences ? `${me.counts.openAbsences} offen` : "", icon: "clock", dot: me.counts.openAbsences > 0 },
    { href: "/mitteilungen", title: "Mitteilungen", sub: me.counts.unreadNews ? `${me.counts.unreadNews} neu` : "", icon: "megaphone" },
    { href: "/dokumente", title: "Dokumente", icon: "folder" },
    { href: "/links", title: "Links", icon: "grid4" },
    { href: "/benachrichtigungen", title: "Benachrichtigungen", sub: me.counts.unreadNotifications ? `${me.counts.unreadNotifications} neu` : "", icon: "bell" },
    { href: "/profil", title: "Profil und Einstellungen", icon: "user" },
  ];
  return (
    <>
      <div className="ph">
        <h1>Mehr</h1>
      </div>
      <nav className="more" aria-label="Weitere Bereiche">
        {items.map((m) => (
          <Link key={m.href} href={m.href}>
            <span className="mi">
              <Icon name={m.icon} />
            </span>
            <span>
              <b>{m.title}</b>
              {m.sub && <span className="s">{m.sub}</span>}
            </span>
            {m.dot ? <span className="dot" aria-label="offen" /> : <span />}
            <Icon name="chev-r" small className="chev" />
          </Link>
        ))}
      </nav>
    </>
  );
}
