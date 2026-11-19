import type { Metadata } from "next";
import Link from "next/link";
import { getAbsences } from "@bwd/db";
import { fmtShortLoose, monthShort, plural, type Absence, type Dispensation } from "@bwd/shared";
import { Empty, Kpis, Status, type StatusTone } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { EditLink, NewButton, NoticeForms } from "./NoticeForms";

export const metadata: Metadata = { title: "Absenzen" };

type Tab = "absenzen" | "abmeldungen" | "dispensationen";
type Search = { tab?: string; fach?: string; neu?: string; bearbeiten?: string };

const STATUS: Record<Absence["status"], [StatusTone, string]> = {
  dispensed: ["ok", "Dispensiert"],
  contingent: ["info", "Kontingent"],
  unexcused: ["err", "Unentschuldigt"],
};

const DISP_STATUS: Record<Dispensation["status"], [StatusTone, string]> = {
  submitted: ["info", "Eingereicht"],
  approved: ["ok", "Bewilligt"],
  rejected: ["err", "Abgelehnt"],
};

/** Zeitpunkt "2026-10-21T19:30" als "Erfasst 21.10. 19:30". */
const created = (stamp: string) => `Erfasst ${fmtShortLoose(stamp.slice(0, 10))} ${stamp.slice(11, 16)}`;

function DateBox({ date }: { date: string }) {
  return (
    <span className="ab-d" aria-hidden="true">
      <b>{date.slice(8)}</b>
      <span>{monthShort(date).replace(".", "")}</span>
    </span>
  );
}

/** Wie die Lektionen zählen: "2 aufs Kontingent · ohne Abmeldung doppelt". */
function countLine(lessons: Absence["lessons"]) {
  const charged = lessons.reduce((n, l) => n + (l.state === "dispensed" ? 0 : l.weight), 0);
  const dispensed = lessons.filter((l) => l.state === "dispensed").length;
  const parts: string[] = [];
  if (dispensed && dispensed < lessons.length) parts.push(`${dispensed} dispensiert`);
  if (charged) parts.push(`${charged} aufs Kontingent`);
  if (lessons.some((l) => l.state !== "dispensed" && !l.notified)) parts.push("ohne Abmeldung doppelt");
  return parts.join(" · ");
}

export default async function Absences({ searchParams }: { searchParams: Promise<Search> }) {
  const { env, me } = await requireUser();
  const sp = await searchParams;
  const tab: Tab = sp.tab === "abmeldungen" || sp.tab === "dispensationen" ? sp.tab : "absenzen";
  const a = await getAbsences(env.db, me.id, env.now);
  const c = a.contingent;
  const tabs: [Tab, string][] = [
    ["absenzen", "Absenzen"],
    ["abmeldungen", "Abmeldungen"],
    ["dispensationen", "Dispensationen"],
  ];
  const kind = tab === "dispensationen" ? "gesuch" : "abmeldung";

  return (
    <>
      <div className="ph">
        <h1>Absenzen</h1>
        <div className="ph-a">
          <NewButton kind={kind} />
        </div>
      </div>
      <Kpis
        items={[
          { label: "Gefehlte Lektionen", value: c.missed },
          { label: `Verfügbares Kontingent von ${c.size}`, value: c.available, tone: c.available === 0 ? "err" : c.available <= 3 ? "warn" : undefined },
          { label: "Bezogenes Kontingent", value: c.used, tone: c.used > c.size ? "err" : undefined },
        ]}
      />
      <nav className="stabs" aria-label="Absenzen">
        {tabs.map(([t, label]) => (
          <Link key={t} href={`/absenzen?tab=${t}`} aria-current={tab === t ? "page" : undefined} scroll={false}>
            {label}
          </Link>
        ))}
      </nav>
      <div className="seg-app" style={{ marginBottom: "var(--sp-5)" }}>
        <NewButton kind={kind} wide />
      </div>
      {tab === "absenzen" && <AbsenceList items={a.items} subjects={a.subjects} fach={sp.fach} />}
      {tab === "abmeldungen" &&
        (a.notices.length === 0 ? (
          <Empty icon="check" title="Keine Abmeldungen." />
        ) : (
          <section className="card" aria-label="Abmeldungen">
            {a.notices.map((n) => (
              <div key={n.id} className="ab">
                <DateBox date={n.date} />
                <span className="ab-m">
                  <b>
                    <span className="sr">{n.date} </span>
                    {n.from} bis {n.to}
                  </b>
                  <span className="s">{[n.fromPeriod === n.toPeriod ? `L${n.fromPeriod}` : `L${n.fromPeriod} bis L${n.toPeriod}`, n.note, created(n.createdAt)].filter(Boolean).join(" · ")}</span>
                </span>
                <span />
                <span className="ab-a">{n.editable && <EditLink tab="abmeldungen" id={n.id} label={`Abmeldung vom ${fmtShortLoose(n.date)} bearbeiten`} />}</span>
                {n.editable && <EditLink tab="abmeldungen" id={n.id} label={`Abmeldung vom ${fmtShortLoose(n.date)} bearbeiten`} row />}
              </div>
            ))}
          </section>
        ))}
      {tab === "dispensationen" &&
        (a.dispensations.length === 0 ? (
          <Empty icon="check" title="Keine Dispensationsgesuche." />
        ) : (
          <section className="card" aria-label="Dispensationsgesuche">
            {a.dispensations.map((d) => {
              const [tone, label] = DISP_STATUS[d.status];
              const subjects = [...new Set(d.lessons.map((l) => l.subjectName).filter(Boolean))].join(", ");
              const sub = [`${plural(d.lessons.length, "Lektion", "Lektionen")}${subjects ? ` · ${subjects}` : ""}`, d.note, d.attachments ? plural(d.attachments, "Anhang", "Anhänge") : null, d.late ? "Verspätet" : null, created(d.createdAt)];
              return (
                <div key={d.id} className="ab">
                  <DateBox date={d.date} />
                  <span className="ab-m">
                    <b>
                      <span className="sr">{d.date} </span>
                      {d.reason}
                    </b>
                    <span className="s">{sub.filter(Boolean).join(" · ")}</span>
                    <Status tone={tone}>{label}</Status>
                  </span>
                  <Status tone={tone}>{label}</Status>
                  <span className="ab-a">{d.editable && <EditLink tab="dispensationen" id={d.id} label={`Gesuch vom ${fmtShortLoose(d.date)} bearbeiten`} />}</span>
                  {d.editable && <EditLink tab="dispensationen" id={d.id} label={`Gesuch vom ${fmtShortLoose(d.date)} bearbeiten`} row />}
                </div>
              );
            })}
          </section>
        ))}
      <NoticeForms today={env.now.date} tab={tab} notices={a.notices} dispensations={a.dispensations} />
    </>
  );
}

/** Absenzen wie von den Lehrpersonen erfasst, mit Filter nach Fach und Fachkontingent. */
function AbsenceList({ items, subjects, fach }: { items: Absence[]; subjects: { subjectCode: string; subjectName: string; used: number; max: number }[]; fach?: string }) {
  if (items.length === 0) return <Empty icon="check" title="Keine Absenzen." />;
  const names = new Map<string, string>();
  for (const x of items) for (const l of x.lessons) if (l.subjectCode && l.subjectName) names.set(l.subjectCode, l.subjectName);
  const shown = fach ? items.filter((x) => x.lessons.some((l) => l.subjectCode === fach)) : items;
  const limit = fach ? subjects.find((s) => s.subjectCode === fach) : undefined;
  return (
    <>
      {names.size > 1 && (
        <nav className="tabs ftabs" aria-label="Fach" style={{ marginBottom: "var(--sp-5)" }}>
          <Link href="/absenzen" aria-current={!fach ? "true" : undefined} scroll={false}>
            Alle Fächer
          </Link>
          {[...names].map(([code, name]) => (
            <Link key={code} href={`/absenzen?fach=${encodeURIComponent(code)}`} aria-current={fach === code ? "true" : undefined} scroll={false}>
              {name}
            </Link>
          ))}
        </nav>
      )}
      {limit && limit.max > 0 && (
        <Kpis
          items={[
            { label: `${limit.subjectName} auf Kontingent`, value: limit.used, tone: limit.used > limit.max ? "err" : limit.used === limit.max ? "warn" : undefined },
            { label: "Höchstens im Semester", value: limit.max },
          ]}
        />
      )}
      {shown.length === 0 ? (
        <Empty icon="check" title="Keine Absenzen in diesem Fach." />
      ) : (
        <section className="card" aria-label="Alle Absenzen">
          {shown.map((x) => {
            const lessons = fach ? x.lessons.filter((l) => l.subjectCode === fach) : x.lessons;
            const status = lessons.some((l) => l.state === "unexcused") ? "unexcused" : lessons.some((l) => l.state === "contingent") ? "contingent" : "dispensed";
            const [tone, label] = STATUS[status];
            const teachers = [...new Set(lessons.map((l) => l.teacher).filter(Boolean))].join(", ");
            return (
              <div key={x.id} className="ab">
                <DateBox date={x.date} />
                <span className="ab-m">
                  <b>
                    <span className="sr">{x.date} </span>
                    {plural(lessons.length, "Lektion", "Lektionen")} · {fach ? (lessons[0]?.subjectName ?? x.subjectsLabel) : x.subjectsLabel}
                  </b>
                  <span className="s">{[teachers, countLine(lessons)].filter(Boolean).join(" · ")}</span>
                  <Status tone={tone}>{label}</Status>
                </span>
                <Status tone={tone}>{label}</Status>
                <span />
              </div>
            );
          })}
        </section>
      )}
    </>
  );
}
