"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { fmtWeekdayShort, type NotificationItem } from "@bwd/shared";
import type { IconName } from "@bwd/shared/icons";
import { Button, Icon } from "@/components/ui";

export function MarkAllRead() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="ghost"
      small
      icon="check"
      busy={busy}
      onClick={async () => {
        setBusy(true);
        await fetch("/api/v1/notifications/read", { method: "POST" }).catch(() => null);
        setBusy(false);
        router.refresh();
      }}
    >
      Alle als gelesen markieren
    </Button>
  );
}

/** Eine Benachrichtigung. Antippen markiert sie als gelesen und öffnet das Ziel. */
export function NotificationRow({ n, group }: { n: NotificationItem; group: string }) {
  const router = useRouter();
  const time = group === "Heute" || group === "Gestern" ? n.createdAt.slice(11, 16) : fmtWeekdayShort(n.createdAt.slice(0, 10));
  return (
    <button
      type="button"
      className={n.unread ? "nt unread" : "nt"}
      onClick={async () => {
        if (n.unread) await fetch("/api/v1/notifications/read", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ids: [n.id] }) }).catch(() => null);
        if (n.href) router.push(n.href);
        else router.refresh();
      }}
    >
      <span className={`nt-i ${n.kind}`} aria-hidden="true">
        <Icon name={n.icon as IconName} small />
      </span>
      <span>
        <b>
          {n.unread && <span className="sr">Neu: </span>}
          {n.title}
        </b>
        {n.body && <p>{n.body}</p>}
      </span>
      <time dateTime={n.createdAt}>{time}</time>
    </button>
  );
}
