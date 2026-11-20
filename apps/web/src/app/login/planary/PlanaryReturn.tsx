"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Wordmark } from "@/components/brand/Brand";

export function PlanaryReturn() {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const p = new URLSearchParams(window.location.hash.slice(1));
    // Tokens sofort aus der Adresszeile und dem Verlauf entfernen
    window.history.replaceState(null, "", window.location.pathname);
    const access = p.get("access_token");
    if (!access) {
      window.location.replace("/login?fehler=planary");
      return;
    }
    fetch("/api/v1/auth/planary", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ access_token: access, refresh_token: p.get("refresh_token") ?? undefined }) })
      .then((r) => r.json() as Promise<{ redirect?: string }>)
      .then((b) => window.location.replace(b.redirect ?? "/login?fehler=planary"))
      .catch(() => setFailed(true));
  }, []);
  return (
    <main className="site lg" id="main">
      <div className="lg-l">
        <Wordmark />
        <div className="lg-c">
          <h1>{failed ? "Anmeldung fehlgeschlagen" : "Anmelden"}</h1>
          {failed ? (
            <Link className="btn btn-ink" href="/login">
              Zurück zur Anmeldung
            </Link>
          ) : (
            <span className="spin" aria-label="Anmeldung läuft" />
          )}
        </div>
      </div>
    </main>
  );
}
