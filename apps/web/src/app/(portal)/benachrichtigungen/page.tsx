import type { Metadata } from "next";
import { getNotifications } from "@bwd/db";
import { notificationGroup } from "@bwd/shared";
import { Empty } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { MarkAllRead, NotificationRow } from "./NotificationClient";

export const metadata: Metadata = { title: "Benachrichtigungen" };

const ORDER = ["Heute", "Gestern", "Diese Woche", "Früher"] as const;

export default async function Notifications() {
  const { env, me } = await requireUser();
  const items = await getNotifications(env.db, me.id);
  const unread = items.some((n) => n.unread);
  return (
    <>
      <div className="ph">
        <h1>Benachrichtigungen</h1>
        <div className="ph-a">{unread && <MarkAllRead />}</div>
      </div>
      {items.length === 0 ? (
        <Empty icon="bell" title="Keine Benachrichtigungen." />
      ) : (
        <div className="nts">
          {ORDER.map((g) => {
            const list = items.filter((n) => notificationGroup(n.createdAt, env.now.date) === g);
            if (!list.length) return null;
            return (
              <section key={g} aria-labelledby={`nt-${g}`}>
                <h2 id={`nt-${g}`} className="nt-d">
                  {g}
                </h2>
                {list.map((n) => (
                  <NotificationRow key={n.id} n={n} group={g} />
                ))}
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
