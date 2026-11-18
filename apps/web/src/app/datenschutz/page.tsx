import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/brand/Brand";

export const metadata: Metadata = { title: "Datenschutz" };

export default function Privacy() {
  return (
    <div className="frame">
      <main className="site" id="main" style={{ padding: "var(--sp-11) var(--sp-9)" }}>
        <div className="prose">
          <Wordmark href="/login" />
          <h1 className="d" style={{ fontSize: "var(--fs-h1-web)" }}>
            Datenschutz
          </h1>
          <p>Das bwd Portal ist ein Schulprojekt. Alle Personen, Noten und Absenzen im Portal sind erfunden.</p>
          <h2>Was gespeichert wird</h2>
          <ul>
            <li>Ein Sitzungs-Cookie, damit du angemeldet bleibst.</li>
            <li>Deine Einstellungen (Design, Benachrichtigungen).</li>
            <li>Was du selbst eingibst: Absenzen mit Anhang, SOL-Plan und Portfolio.</li>
          </ul>
          <h2>Was nicht gespeichert wird</h2>
          <ul>
            <li>Keine Passwörter. Die Anmeldung läuft über Microsoft.</li>
            <li>Kein Tracking und keine Werbung.</li>
          </ul>
          <p>
            <Link className="alink" href="/login">
              Zur Anmeldung
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
