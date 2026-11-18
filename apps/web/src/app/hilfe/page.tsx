import type { Metadata } from "next";
import Link from "next/link";
import { config } from "@bwd/shared";
import { Wordmark } from "@/components/brand/Brand";

export const metadata: Metadata = { title: "Hilfe bei der Anmeldung" };

export default function Help() {
  return (
    <div className="frame">
      <main className="site" id="main" style={{ padding: "var(--sp-11) var(--sp-9)" }}>
        <div className="prose">
          <Wordmark href="/login" />
          <h1 className="d" style={{ fontSize: "var(--fs-h1-web)" }}>
            Hilfe bei der Anmeldung
          </h1>
          <ul>
            <li>Melde dich mit deinem Microsoft-Schulkonto an: {config.school.emailPattern}.</li>
            <li>Private Microsoft-Konten funktionieren nicht.</li>
            <li>Passwort vergessen oder Konto gesperrt: Wende dich an deine Klassenlehrperson.</li>
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
