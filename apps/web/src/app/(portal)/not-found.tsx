import { LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="nf">
      <span className="nf-n" aria-hidden="true">
        404
      </span>
      <h1>Diese Seite gibt es nicht.</h1>
      <p>Vielleicht wurde der Link geändert oder die Seite ist nicht mehr im Portal.</p>
      <div className="nf-a">
        <LinkButton href="/" icon="home">
          Zur Übersicht
        </LinkButton>
        <LinkButton href="/stundenplan" variant="line">
          Stundenplan
        </LinkButton>
        <LinkButton href="/dokumente" variant="line">
          Dokumente
        </LinkButton>
      </div>
    </div>
  );
}
