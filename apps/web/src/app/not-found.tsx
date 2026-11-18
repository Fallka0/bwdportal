import Link from "next/link";

/** 404 ausserhalb des Portals (z. B. ohne Anmeldung). */
export default function NotFound() {
  return (
    <div className="frame">
      <main className="site" id="main" style={{ padding: "var(--sp-11)" }}>
        <div className="nf">
          <span className="nf-n" aria-hidden="true">
            404
          </span>
          <h1>Diese Seite gibt es nicht.</h1>
          <div className="nf-a">
            <Link className="btn btn-ink" href="/">
              Zur Übersicht
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
