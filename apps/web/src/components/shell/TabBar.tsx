"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui";
import { isActive, TABS } from "@/lib/nav";

/** Tab-Bar unter 600 px. Zähler an "Mehr": ungelesene Benachrichtigungen. */
export function TabBar({ unread }: { unread: number }) {
  const path = usePathname();
  return (
    <nav className="tabbar" aria-label="Hauptnavigation">
      {TABS.map((t) => {
        const on = isActive(t.href, path);
        return (
          <Link key={t.href} href={t.href} aria-current={on ? "page" : undefined}>
            <Icon name={t.icon} />
            {t.label}
            {t.href === "/mehr" && unread > 0 && (
              <span className="count bdg" aria-label={`${unread} neu`}>
                {unread}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
