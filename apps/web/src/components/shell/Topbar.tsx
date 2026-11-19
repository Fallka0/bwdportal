import Link from "next/link";
import { Icon } from "@/components/ui";
import { SearchField } from "./SearchField";
import { ThemeToggle } from "./ThemeToggle";

export function Bell({ unread }: { unread: number }) {
  return (
    <Link className="ib bell" href="/benachrichtigungen" aria-label={unread ? `Benachrichtigungen, ${unread} neu` : "Benachrichtigungen"}>
      <Icon name="bell" />
      {unread > 0 && (
        <span className="count bdg" aria-hidden="true">
          {unread}
        </span>
      )}
    </Link>
  );
}

/** Kopfzeile im Web ab 600 px: Suche, Datum und Woche, Design, Glocke. */
export function Topbar({ dateLabel, unread }: { dateLabel: string; unread: number }) {
  return (
    <header className="tb">
      <SearchField />
      <div className="tb-r">
        <span className="tb-t">{dateLabel}</span>
        <ThemeToggle />
        <Bell unread={unread} />
      </div>
    </header>
  );
}
