"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/brand/Brand";
import { Icon } from "@/components/ui";
import { backTarget } from "@/lib/nav";
import { Bell } from "./Topbar";

/** Kopfzeile unter 600 px: Logo oder Zurück, Glocke, Avatar. */
export function AppBar({ initials, unread }: { initials: string; unread: number }) {
  const back = backTarget(usePathname());
  return (
    <header className="abar">
      {back ? (
        <Link className="back" href={back.href}>
          <Icon name="chev-l" />
          {back.label}
        </Link>
      ) : (
        <Wordmark href="/" />
      )}
      <span className="grow" />
      <Bell unread={unread} />
      <Link className="av av-ink abar-av" href="/profil" aria-label="Profil">
        {initials}
      </Link>
    </header>
  );
}
