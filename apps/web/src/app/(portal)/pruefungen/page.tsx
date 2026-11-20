import type { Metadata } from "next";
import Link from "next/link";
import { listTests, testOptions, testsBetween } from "@bwd/db";
import {
  addDays,
  daysBetween,
  fmtDate,
  fmtShort,
  mondayOf,
  MONTHS,
  WEEKDAYS_SHORT,
  weekday,
  type TestItem,
} from "@bwd/shared";
import { Card, Empty, Icon } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { MonthCalendar } from "./MonthCalendar";
import { EditTestLink, TestDialogs } from "./TestForms";

export const metadata: Metadata = { title: "Prüfungen" };

type View = "kalender" | "liste" | "vergangen";
type Props = { searchParams: Promise<{ ansicht?: string; monat?: string }> };

function when(date: string, today: string) {
  const d = daysBetween(today, date);
  return d === 0
    ? "Heute"
    : d === 1
      ? "Morgen"
      : d > 1 && d < 14
        ? `In ${d} Tagen`
        : "";
}

/** "2026-11" → erster Tag; ungültig → laufender Monat. */
function monthStart(raw: string | undefined, today: string) {
  return raw && /^\d{4}-(0[1-9]|1[0-2])$/.test(raw)
    ? `${raw}-01`
    : `${today.slice(0, 7)}-01`;
}

function shiftMonth(first: string, n: number) {
  const [y, m] = first.split("-").map(Number) as [number, number];
  const t = y * 12 + (m - 1) + n;
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, "0")}`;
}

export default async function Tests({ searchParams }: Props) {
  const { env, me } = await requireUser();
  const sp = await searchParams;
  const view: View =
    sp.ansicht === "liste" || sp.ansicht === "vergangen"
      ? sp.ansicht
      : "kalender";
  const today = env.now.date;
  const options = await testOptions(env.db, me.id);
  const teacher = me.role === "teacher";
  const canAdd = !teacher || options.classes.length > 0;

  // Kalender: ganze Wochen von Montag vor dem 1. bis Sonntag nach dem Monatsende
  const first = monthStart(sp.monat, today);
  const next = `${shiftMonth(first, 1)}-01`;
  const gridStart = mondayOf(first);
  const gridEnd = addDays(mondayOf(addDays(next, -1)), 6);
  const tests =
    view === "kalender"
      ? await testsBetween(env.db, me.id, gridStart, gridEnd)
      : await listTests(env.db, me.id, env.now, { past: view === "vergangen" });

  const keep =
    view === "kalender" ? `monat=${first.slice(0, 7)}&` : `ansicht=${view}&`;
  const seg = (
    <>
      <Link
        href="/pruefungen"
        aria-current={view === "kalender" ? "page" : undefined}
      >
        Kalender
      </Link>
      <Link
        href="/pruefungen?ansicht=liste"
        aria-current={view === "liste" ? "page" : undefined}
      >
        Liste
      </Link>
      <Link
        href="/pruefungen?ansicht=vergangen"
        aria-current={view === "vergangen" ? "page" : undefined}
      >
        Vergangen
      </Link>
    </>
  );
  const add = (wide: boolean) =>
    canAdd ? (
      <Link
        className={wide ? "btn btn-ink btn-wide" : "btn btn-ink"}
        href={`/pruefungen?${keep}neu=1`}
        scroll={false}
      >
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
      {view === "kalender" ? (
        <>
          <MonthCalendar
            first={first}
            gridStart={gridStart}
            gridEnd={gridEnd}
            today={today}
            tests={tests}
            teacher={teacher}
            title={`${MONTHS[Number(first.slice(5, 7)) - 1]} ${first.slice(0, 4)}`}
            prev={`/pruefungen?monat=${shiftMonth(first, -1)}`}
            next={`/pruefungen?monat=${shiftMonth(first, 1)}`}
            back={
              first.slice(0, 7) !== today.slice(0, 7) ? "/pruefungen" : null
            }
          />
          {/* Unter 600 px: die Prüfungen des Monats als Liste unter dem Kalender */}
          <div className="tcal-list">
            {tests.filter((t) => t.date >= first && t.date < next).length >
              0 && (
              <Card aria-label="Prüfungen im Monat">
                {tests
                  .filter((t) => t.date >= first && t.date < next)
                  .map((t) => (
                    <TestRow
                      key={t.id}
                      t={t}
                      today={today}
                      past={t.date < today}
                    />
                  ))}
              </Card>
            )}
          </div>
        </>
      ) : tests.length === 0 ? (
        <Empty
          icon="cal"
          title={
            view === "vergangen"
              ? "Keine vergangenen Prüfungen."
              : teacher && !canAdd
                ? "Dir sind noch keine Klassen zugeteilt."
                : "Keine Prüfungen geplant."
          }
        />
      ) : (
        <Card
          aria-label={
            view === "vergangen"
              ? "Vergangene Prüfungen"
              : "Bevorstehende Prüfungen"
          }
        >
          {tests.map((t) => (
            <TestRow
              key={t.id}
              t={t}
              today={today}
              past={view === "vergangen"}
            />
          ))}
        </Card>
      )}
      <TestDialogs tests={tests} options={options} teacher={teacher} />
    </>
  );
}

function TestRow({
  t,
  today,
  past,
}: {
  t: TestItem;
  today: string;
  past: boolean;
}) {
  const rel = past ? "" : when(t.date, today);
  const who = t.classCode
    ? [t.classCode, t.author].filter(Boolean).join(" · ")
    : "Eigene Prüfung";
  return (
    <div className="tst">
      <span className="tst-d">
        <span>{WEEKDAYS_SHORT[weekday(t.date)]}</span>
        <b>
          {past || t.date.slice(0, 4) !== today.slice(0, 4)
            ? fmtDate(t.date)
            : fmtShort(t.date)}
        </b>
        {rel && <span className="tst-r">{rel}</span>}
      </span>
      <span className="tst-b">
        <b>
          {t.subject.name} · {t.title}
        </b>
        <span className="s">{who}</span>
        {t.description && <p>{t.description}</p>}
      </span>
      <span>
        {t.mine && <EditTestLink id={t.id} label={`${t.title} bearbeiten`} />}
      </span>
    </div>
  );
}
