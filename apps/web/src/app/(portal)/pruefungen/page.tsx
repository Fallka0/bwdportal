import type { Metadata } from "next";
import Link from "next/link";
import { listTests, testOptions } from "@bwd/db";
import { daysBetween, fmtDate, fmtShort, WEEKDAYS_SHORT, weekday, type TestItem } from "@bwd/shared";
import { Card, Empty, Icon } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { EditTestLink, TestDialogs } from "./TestForms";

export const metadata: Metadata = { title: "Prüfungen" };

type Props = { searchParams: Promise<{ ansicht?: string }> };

function when(date: string, today: string) {
  const d = daysBetween(today, date);
  return d === 0 ? "Heute" : d === 1 ? "Morgen" : d > 1 && d < 14 ? `In ${d} Tagen` : "";
}

export default async function Tests({ searchParams }: Props) {
  const { env, me } = await requireUser();
  const past = (await searchParams).ansicht === "vergangen";
  const tests = await listTests(env.db, me.id, env.now, { past });
  const options = await testOptions(env.db, me.id);
  const teacher = me.role === "teacher";
  const canAdd = !teacher || options.classes.length > 0;
  const seg = (
    <>
      <Link href="/pruefungen" aria-current={!past ? "page" : undefined}>
        Bevorstehend
      </Link>
      <Link href="/pruefungen?ansicht=vergangen" aria-current={past ? "page" : undefined}>
        Vergangen
      </Link>
    </>
  );
  const add = (wide: boolean) =>
    canAdd ? (
      <Link className={wide ? "btn btn-ink btn-wide" : "btn btn-ink"} href={`/pruefungen?${past ? "ansicht=vergangen&" : ""}neu=1`} scroll={false}>
        <Icon name="plus" small />
        Neue Prüfung
      </Link>
    ) : null;

  return (
    <>
      <div className="ph tst-head">
        <h1>Prüfungen</h1>
        <div className="ph-a">
          <nav className="seg" aria-label="Ansicht">
            {seg}
          </nav>
          {add(false)}
        </div>
      </div>
      <div className="seg-app" style={{ marginBottom: "var(--sp-5)" }}>
        <div className="stack-s" style={{ width: "100%" }}>
          <nav className="seg seg-full" aria-label="Ansicht">
            {seg}
          </nav>
          {add(true)}
        </div>
      </div>
      {tests.length === 0 ? (
        <Empty icon="cal" title={past ? "Keine vergangenen Prüfungen." : teacher && !canAdd ? "Dir sind noch keine Klassen zugeteilt." : "Keine Prüfungen geplant."} />
      ) : (
        <Card aria-label={past ? "Vergangene Prüfungen" : "Bevorstehende Prüfungen"}>
          {tests.map((t) => (
            <TestRow key={t.id} t={t} today={env.now.date} past={past} />
          ))}
        </Card>
      )}
      <TestDialogs tests={tests} options={options} teacher={teacher} />
    </>
  );
}

function TestRow({ t, today, past }: { t: TestItem; today: string; past: boolean }) {
  const rel = past ? "" : when(t.date, today);
  const who = t.classCode ? [t.classCode, t.author].filter(Boolean).join(" · ") : "Eigene Prüfung";
  return (
    <div className="tst">
      <span className="tst-d">
        <span>{WEEKDAYS_SHORT[weekday(t.date)]}</span>
        <b>{past || t.date.slice(0, 4) !== today.slice(0, 4) ? fmtDate(t.date) : fmtShort(t.date)}</b>
        {rel && <span className="tst-r">{rel}</span>}
      </span>
      <span className="tst-b">
        <b>
          {t.subject.name} · {t.title}
        </b>
        <span className="s">{who}</span>
        {t.description && <p>{t.description}</p>}
      </span>
      <span>{t.mine && <EditTestLink id={t.id} label={`${t.title} bearbeiten`} />}</span>
    </div>
  );
}
