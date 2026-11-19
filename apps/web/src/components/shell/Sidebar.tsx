"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/brand/Brand";
import { Icon } from "@/components/ui";
import { isActive, NAV } from "@/lib/nav";

type Counts = { absences: number; notifications: number };

export function Sidebar({ name, classCode, initials, counts }: { name: string; classCode: string; initials: string; counts: Counts }) {
  const path = usePathname();
  return (
    <aside className="sb" aria-label="Navigation">
      <div className="sb-brand">
        <Wordmark href="/" light />
      </div>
      {NAV.map((g) => (
        <nav key={g.group} aria-label={g.group}>
          <span className="sb-g">{g.group}</span>
          {g.items.map((n) => {
            const on = isActive(n.href, path);
            const c = n.count ? counts[n.count] : 0;
            return (
              <Link key={n.href} className="nl" href={n.href} aria-current={on ? "page" : undefined} title={n.label}>
                <Icon name={n.icon} />
                <span className="nl-t">{n.label}</span>
                {c > 0 && (
                  <span className="n" aria-label={`${c} ${n.count === "absences" ? "offen" : "neu"}`}>
                    {c}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      ))}
      <Link className="sb-me" href="/profil" aria-label={`Profil von ${name}`} aria-current={path === "/profil" ? "page" : undefined}>
        <span className="av">{initials}</span>
        <span className="sb-me-t">
          <b>{name}</b>
          <span>{classCode}</span>
        </span>
        <Icon name="chev-r" small className="sb-me-c" />
      </Link>
    </aside>
  );
}
