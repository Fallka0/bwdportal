"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DemoAccount } from "@bwd/shared";
import { MicrosoftLogo, Wordmark } from "@/components/brand/Brand";
import { Banner, Dialog, Icon } from "@/components/ui";

const FOREIGN = "foreign";

const FAILURE = { microsoft: "Die Anmeldung mit Microsoft hat nicht geklappt. Versuche es nochmals.", planary: "Die Anmeldung mit Planary hat nicht geklappt. Versuche es nochmals." };

export function LoginView({
  mock,
  microsoft,
  planary,
  accounts,
  emailPattern,
  initialError,
}: {
  mock: boolean;
  microsoft: boolean;
  planary: boolean;
  accounts: DemoAccount[];
  emailPattern: string;
  initialError: "konto" | "microsoft" | "planary" | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(initialError === "konto");
  const [busy, setBusy] = useState<string | null>(null);
  const [failure, setFailure] = useState(initialError === "microsoft" || initialError === "planary" ? FAILURE[initialError] : "");

  async function choose(accountId: string) {
    setBusy(accountId);
    setFailure("");
    try {
      const res = await fetch("/api/v1/auth/mock", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ accountId }) });
      if (res.ok) {
        router.replace("/");
        router.refresh();
        return;
      }
      const body = (await res.json().catch(() => null)) as { error?: { code?: string; message?: string } } | null;
      setOpen(false);
      if (body?.error?.code === "foreign_account") setError(true);
      else setFailure(body?.error?.message ?? "Anmeldung fehlgeschlagen. Versuche es nochmals.");
    } catch {
      setFailure("Keine Verbindung. Versuche es nochmals.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="frame">
      <main className="site lg" id="main">
        <div className="lg-l">
          <Wordmark />
          <div className="lg-c">
            <h1>Alles für die Schule an einem Ort.</h1>
            {error && (
              <Banner tone="err">
                <b>Dieses Konto gehört nicht zur bwd.</b> Melde dich mit deiner Adresse {emailPattern} an.
              </Banner>
            )}
            {failure && <Banner tone="err">{failure}</Banner>}
            {/* Volle Navigation: die API leitet zu Planary oder Microsoft weiter (kein Next-Seitenwechsel). */}
            {planary && (
              // eslint-disable-next-line @next/next/no-html-link-for-pages
              <a className="btn btn-ink" href="/api/v1/auth/planary">
                Mit Planary-Konto anmelden
              </a>
            )}
            {microsoft && (
              // eslint-disable-next-line @next/next/no-html-link-for-pages
              <a className={planary ? "btn btn-line ms" : "btn btn-ink ms"} href="/api/v1/auth/microsoft">
                <MicrosoftLogo />
                Mit Microsoft anmelden
              </a>
            )}
            {mock && (
              <button className={planary || microsoft ? "btn btn-line" : "btn btn-ink"} type="button" onClick={() => setOpen(true)}>
                Demo-Konto wählen
              </button>
            )}
            {!planary && !microsoft && !mock && <Banner tone="err">Die Anmeldung ist noch nicht eingerichtet.</Banner>}
            {planary && (
              // eslint-disable-next-line @next/next/no-html-link-for-pages
              <a className="ul" href="/api/v1/auth/planary?signup=1">
                Planary-Konto erstellen
              </a>
            )}
            <p className="lg-f">{emailPattern}</p>
          </div>
          <div className="lg-f">
            <Link className="ul" href="/hilfe">
              Hilfe bei der Anmeldung
            </Link>
            <Link className="ul" href="/datenschutz">
              Datenschutz
            </Link>
          </div>
        </div>
        <div className="lg-r" aria-hidden="true">
          <div className="tiles">
            <span className="a">
              <Icon name="cal" />
            </span>
            <span>
              <Icon name="chart" />
            </span>
            <span>
              <Icon name="clock" />
            </span>
            <span>
              <Icon name="folder" />
            </span>
            <span className="a">
              <Icon name="grid4" />
            </span>
            <span>
              <Icon name="megaphone" />
            </span>
          </div>
          <h2>Stundenplan, Noten, Absenzen und Links in einer App.</h2>
        </div>
      </main>

      {mock && (
        <Dialog open={open} onClose={() => setOpen(false)} title="Demo-Konto wählen">
          <ul className="acc">
            {accounts.map((a) => (
              <li key={a.id}>
                <button type="button" className="acc-b" onClick={() => choose(a.id)} disabled={!!busy} aria-busy={busy === a.id}>
                  <span className="av av-ink">{a.name.split(" ").map((p) => p[0]).join("")}</span>
                  <span>
                    <b>{a.name}</b>
                    <span className="s">
                      {a.classCode} · {a.email}
                    </span>
                  </span>
                  {busy === a.id ? <span className="spin" aria-hidden="true" /> : <Icon name="chev-r" small />}
                </button>
              </li>
            ))}
            <li>
              <button type="button" className="acc-b" onClick={() => choose(FOREIGN)} disabled={!!busy}>
                <span className="av">
                  <Icon name="user" small />
                </span>
                <span>
                  <b>Anderes Microsoft-Konto</b>
                  <span className="s">Nicht von der bwd</span>
                </span>
                <Icon name="chev-r" small />
              </button>
            </li>
          </ul>
          <p className="s">Demo-Modus</p>
        </Dialog>
      )}
    </div>
  );
}
