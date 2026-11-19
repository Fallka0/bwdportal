"use client";

import { useState } from "react";
import { Button, useToast } from "@/components/ui";

/** Kalender-Abo: Link in die Kalender-App, kopieren oder neu erstellen. */
export function CalendarSetting({ initial }: { initial: { url: string; webcal: string } }) {
  const toast = useToast();
  const [urls, setUrls] = useState(initial);
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <div className="st">
        <span>
          <b>Kalender abonnieren</b>
          <span className="s">Stundenplan, Prüfungen und SOL-Plan</span>
        </span>
      </div>
      <div className="cal-actions">
        <a className="btn btn-ink btn-s" href={urls.webcal}>
          Im Kalender öffnen
        </a>
        <Button
          variant="line"
          small
          onClick={async () => {
            await navigator.clipboard.writeText(urls.url).catch(() => {});
            toast.show("Link kopiert.");
          }}
        >
          Link kopieren
        </Button>
        <Button
          variant="ghost"
          small
          busy={busy}
          onClick={async () => {
            setBusy(true);
            const r = await fetch("/api/v1/me/calendar", { method: "POST" }).catch(() => null);
            setBusy(false);
            if (r?.ok) {
              setUrls((await r.json()) as { url: string; webcal: string });
              toast.show("Neuer Link erstellt. Der alte funktioniert nicht mehr.");
            }
          }}
        >
          Neuen Link erstellen
        </Button>
      </div>
    </div>
  );
}
