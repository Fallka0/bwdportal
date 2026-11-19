import type { Metadata } from "next";
import Link from "next/link";
import { getTimetable } from "@bwd/db";
import { WEEKDAYS, WEEKDAYS_SHORT, addDays, config, dayColumns, fmtDayMonth, fmtLong, fmtRange, isoWeek, mondayOf, weekday } from "@bwd/shared";
import { Icon } from "@/components/ui";
import { TimeGrid, TimeGridLegend } from "@/components/timegrid/TimeGrid";
import { requireUser } from "@/lib/auth";
import { isDate, schoolDay } from "@/lib/dates";
import { StaleBanner } from "./StaleBanner";

export const metadata: Metadata = { title: "Stundenplan" };

type Search = { ansicht?: string; datum?: string };

export default async function TimetablePage({ searchParams }: { searchParams: Promise<Search> }) {
  const { env, me } = await requireUser();
  const sp = await searchParams;
  const view = sp.ansicht === "tag" ? "tag" : "woche";
  const today = env.now.date;
  const date = schoolDay(isDate(sp.datum) ? sp.datum : today);
  const href = (v: string, d: string) => `/stundenplan?ansicht=${v}&datum=${d}`;

  const from = view === "woche" ? mondayOf(date) : date;
  const to = view === "woche" ? addDays(from, 4) : date;
  const tt = await getTimetable(env.db, me.id, from, to, env.now);

  let title: string, sub: string, prev: string, next: string, isCurrent: boolean;
  const dates = view === "woche" ? [0, 1, 2, 3, 4].map((i) => addDays(from, i)) : [date];
  if (view === "woche") {
    title = fmtRange(from, to);
    sub = `Woche ${isoWeek(from)} · ${me.classCode}`;
    prev = href("woche", addDays(from, -7));
    next = href("woche", addDays(from, 7));
    isCurrent = mondayOf(today) === from;
  } else {
    const isToday = date === today;
    const sol = tt.lessons.some((l) => l.state === "sol");
    title = isToday ? "Heute" : WEEKDAYS[weekday(date)]!;
    sub = (isToday ? fmtLong(date) : fmtDayMonth(date)) + (sol ? " · SOL-Tag" : "");
    prev = href("tag", schoolDay(addDays(date, -1), -1));
    next = href("tag", schoolDay(addDays(date, 1), 1));
    isCurrent = isToday;
  }

  const columns = dayColumns(
    dates.map((d) => ({ date: d, header: WEEKDAYS_SHORT[weekday(d)], headerNum: String(Number(d.slice(8))) })),
    tt.lessons,
  );

  const seg = (
    <>
      <Link href={href("tag", view === "tag" ? date : date === mondayOf(today) || mondayOf(today) === from ? schoolDay(today) : from)} aria-current={view === "tag" ? "page" : undefined}>
        Tag
      </Link>
      <Link href={href("woche", date)} aria-current={view === "woche" ? "page" : undefined}>
        Woche
      </Link>
    </>
  );

  return (
    <div className="tt-head">
      <div className="ph">
        <h1>Stundenplan</h1>
        <div className="ph-a">
          <a className="alink" href={config.services.webuntis} target="_blank" rel="noopener noreferrer">
            In WebUntis öffnen
            <Icon name="arrow-ur" small />
          </a>
          <nav className="seg" aria-label="Ansicht">
            {seg}
          </nav>
        </div>
      </div>
      <nav className="seg seg-full seg-app" aria-label="Ansicht">
        {seg}
      </nav>
      {tt.source.stale && <StaleBanner lastRunAt={tt.source.lastRunAt} today={today} />}
      <TimeGrid
        variant={view === "woche" ? "week" : "day"}
        grid={{ end: config.timeGridEnd, columns, lunch: config.lunch }}
        now={{ date: env.now.date, time: env.now.time }}
        live={!env.demo}
        title={title}
        sub={sub}
        titleId="tt-title"
        prev={{ href: prev, label: view === "woche" ? "Vorherige Woche" : "Vorheriger Tag" }}
        next={{ href: next, label: view === "woche" ? "Nächste Woche" : "Nächster Tag" }}
        today={isCurrent ? undefined : { href: href(view, today), label: "Zu heute" }}
      />
      {view === "woche" && <TimeGridLegend />}
    </div>
  );
}
