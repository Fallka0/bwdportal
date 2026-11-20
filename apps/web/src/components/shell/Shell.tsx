import type { ReactNode } from "react";
import { fmtMedium, isoWeek, type Me, type Now } from "@bwd/shared";
import { roleLine } from "@/lib/nav";
import { AppBar } from "./AppBar";
import { Sidebar } from "./Sidebar";
import { TabBar } from "./TabBar";
import { Topbar } from "./Topbar";

/** Rahmen des Portals: dunkler Rand, Sidebar (Icon-Leiste ab 600 bis 900 px), Kopfzeile, Inhalt, Tab-Bar unter 600 px. */
export function Shell({ me, now, children }: { me: Me; now: Now; children: ReactNode }) {
  const unread = me.counts.unreadNotifications;
  return (
    <div className="frame">
      <a className="skip" href="#main">
        Zum Inhalt
      </a>
      <div className="site shell">
        <Sidebar name={me.name} classCode={roleLine(me)} initials={me.initials} counts={{ notifications: unread }} teacher={me.role === "teacher"} />
        <div className="mn">
          <Topbar dateLabel={`${fmtMedium(now.date)} · Woche ${isoWeek(now.date)}`} unread={unread} />
          <AppBar initials={me.initials} unread={unread} />
          <main className="pg" id="main" tabIndex={-1}>
            {children}
          </main>
          <TabBar unread={unread} teacher={me.role === "teacher"} />
        </div>
      </div>
    </div>
  );
}
