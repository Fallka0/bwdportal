import type { Metadata } from "next";
import { Card } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { LogoutButton } from "./LogoutButton";
import { ThemeSetting, NotificationSettings } from "./SettingsClient";

export const metadata: Metadata = { title: "Profil" };

export default async function Profile() {
  const { me } = await requireUser();
  return (
    <>
      <div className="ph">
        <h1>Profil</h1>
      </div>
      <div className="g12">
        <div className="stack">
          <section className="pf" aria-labelledby="pf-name">
            <span className="av av-ink" aria-hidden="true">
              {me.initials}
            </span>
            <div>
              <h2 id="pf-name">{me.name}</h2>
              <p>
                {me.classCode} · {me.email}
              </p>
            </div>
          </section>
          <Card aria-labelledby="ns-h">
            <h2 id="ns-h" className="box-t" style={{ marginBottom: "var(--sp-6)" }}>
              Benachrichtigungen
            </h2>
            <NotificationSettings initial={me.settings} />
          </Card>
        </div>
        <div className="stack">
          <Card aria-labelledby="kt-h">
            <h2 id="kt-h" className="box-t" style={{ marginBottom: "var(--sp-6)" }}>
              Konto
            </h2>
            <dl className="kv">
              <dt>Klasse</dt>
              <dd>{me.classCode}</dd>
              <dt>Lehrgang</dt>
              <dd>{me.program ?? "–"}</dd>
              <dt>Klassenlehrperson</dt>
              <dd>{me.classTeacher ?? "–"}</dd>
              <dt>Anmeldung</dt>
              <dd>{me.id.startsWith("u-ms-") ? "Microsoft-Schulkonto" : "Demo-Konto"}</dd>
            </dl>
          </Card>
          <Card aria-labelledby="ds-h">
            <h2 id="ds-h" className="box-t" style={{ marginBottom: "var(--sp-6)" }}>
              Darstellung
            </h2>
            <div>
              <ThemeSetting />
            </div>
          </Card>
          <LogoutButton />
        </div>
      </div>
    </>
  );
}
