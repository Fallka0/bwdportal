"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui";
import { isActive, TABS, TEACHER_TABS } from "@/lib/nav";

/** Tab-Bar unter 600 px. Zähler an "Mehr": ungelesene Benachrichtigungen. */
export function TabBar({ unread, teacher = false }: { unread: number; teacher?: boolean }) {
  const path = usePathname();
  return (
    <nav className="tabbar" aria-label="Hauptnavigation" style={teacher ? ({ "--tabs": TEACHER_TABS.length } as React.CSSProperties) : undefined}>
      {(teacher ? TEACHER_TABS : TABS).map((t) => {
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
