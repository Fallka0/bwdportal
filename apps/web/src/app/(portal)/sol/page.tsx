import type { Metadata } from "next";
import Link from "next/link";
import { getSolCalendar, getSolPortfolio, getSolTasks } from "@bwd/db";
import { config, fmtLong, solColumns, toMin, WEEKDAYS, weekday } from "@bwd/shared";
import { Card, Empty, Icon } from "@/components/ui";
import { TimeGrid } from "@/components/timegrid/TimeGrid";
import { requireUser } from "@/lib/auth";
import { BlockSelect, PlanForm, PortfolioForm, ProgressSlider } from "./SolClient";

export const metadata: Metadata = { title: "SOL" };

type Tab = "auftraege" | "kalender" | "portfolio";
type Search = { tab?: string; block?: string; fach?: string; tag?: string; eintrag?: string };

export default async function Sol({ searchParams }: { searchParams: Promise<Search> }) {
  const { env, me } = await requireUser();
  const sp = await searchParams;
  const tab: Tab = sp.tab === "kalender" || sp.tab === "portfolio" ? sp.tab : "auftraege";
  const tasks = await getSolTasks(env.db, me.id, env.now, Number(sp.block) || undefined);
  const block = tasks.block;
  const q = (p: Partial<Search>) => {
    const s = new URLSearchParams(Object.entries({ tab, block: block?.n ? String(block.n) : undefined, ...p }).filter(([, v]) => v) as [string, string][]);
    return `/sol?${s.toString()}`;
  };
  const tabs: [Tab, string][] = [
    ["auftraege", "Aufträge"],
    ["kalender", "Kalender"],
    ["portfolio", "Portfolio"],
  ];

  return (
    <>
      <div className="ph">
        <h1>SOL</h1>
        <div className="ph-a">{tasks.blocks.length > 0 && <BlockSelect blocks={tasks.blocks.map((b) => b.n)} value={block?.n ?? 0} tab={tab} />}</div>
      </div>
      <nav className="stabs" aria-label="SOL">
        {tabs.map(([t, label]) => (
          <Link key={t} href={q({ tab: t, fach: undefined, tag: undefined })} aria-current={tab === t ? "page" : undefined}>
            {label}
          </Link>
        ))}
      </nav>
      {tab === "auftraege" && <Tasks tasks={tasks} fach={sp.fach} q={q} />}
      {tab === "kalender" && <Calendar userId={me.id} env={env} dayId={sp.tag} q={q} tasks={tasks} />}
      {tab === "portfolio" && <Portfolio userId={me.id} env={env} editId={sp.eintrag} q={q} />}
    </>
  );
}

function Tasks({ tasks, fach, q }: { tasks: Awaited<ReturnType<typeof getSolTasks>>; fach?: string; q: (p: Partial<Search>) => string }) {
  if (!tasks.block || tasks.groups.length === 0) return <Empty icon="book" title={tasks.block ? `Keine Aufträge in Block ${tasks.block.n}.` : "Keine SOL-Blöcke."} />;
  const groups = tasks.groups.filter((g) => !fach || g.subject.code === fach);
  return (
    <>
      <div className="sol-bar">
        <nav className="tabs ftabs" aria-label="Fach">
          <Link href={q({ fach: undefined })} aria-current={!fach ? "true" : undefined}>
            Alle
          </Link>
          {tasks.groups.map((g) => (
            <Link key={g.subject.code} href={q({ fach: g.subject.code })} aria-current={fach === g.subject.code ? "true" : undefined}>
              {g.subject.short}
            </Link>
          ))}
        </nav>
        <a className="alink sol-dl" href={`/api/v1/files/sol-block/${tasks.block.n}`} download>
          Block {tasks.block.n} herunterladen
          <Icon name="download" small />
        </a>
      </div>
      {groups.map((g) => (
        <section key={g.subject.code} className="sg" aria-labelledby={`sg-${g.subject.code}`}>
          <div className="sg-h">
            <h2 id={`sg-${g.subject.code}`}>{g.subject.name}</h2>
            {g.teacher && <span className="s">{g.teacher}</span>}
          </div>
          <div className="card sg-l">
            {g.tasks.map((t) => (
              <div key={t.id} className={t.percent === 100 ? "so done" : "so"}>
                <span className="code">{t.code}</span>
                <b className="so-t">{t.title}</b>
                <span className="so-min">{t.minutes} Min.</span>
                <ProgressSlider id={t.id} title={`${g.subject.short} ${t.code} ${t.title}`} value={t.percent} />
                <span className="so-a">
                  {t.sharepointUrl && (
                    <a className="ib" href={t.sharepointUrl} target="_blank" rel="noopener noreferrer" aria-label={`${t.title} in SharePoint öffnen`} title="SharePoint">
                      <Icon name="arrow-ur" small />
                    </a>
                  )}
                  <a className="ib" href={`/api/v1/files/sol/${encodeURIComponent(t.id)}`} download aria-label={`${t.title} herunterladen`} title="Herunterladen">
                    <Icon name="download" small />
                  </a>
                </span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

async function Calendar({ userId, env, dayId, q, tasks }: { userId: string; env: Awaited<ReturnType<typeof requireUser>>["env"]; dayId?: string; q: (p: Partial<Search>) => string; tasks: Awaited<ReturnType<typeof getSolTasks>> }) {
  const cal = await getSolCalendar(env.db, userId, env.now, dayId);
  if (!cal.day) return <Empty icon="cal" title="Keine SOL-Tage." />;
  const day = cal.day;
  const i = cal.days.findIndex((d) => d.id === day.id);
  const prev = cal.days[i - 1];
  const next = cal.days[i + 1];
  const isToday = day.date === env.now.date;
  const lastEnd = cal.plan.reduce((m, p) => (p.end > m ? p.end : m), "08:00");
  // Offene, noch nicht eingeplante Aufträge; zuerst das Fach mit der wenigsten geplanten Zeit an diesem Tag.
  const plannedIds = new Set(cal.plan.map((p) => p.taskId));
  const plannedMin = (code: string) => cal.plan.filter((p) => p.subjectCode === code).reduce((m, p) => m + toMin(p.end) - toMin(p.start), 0);
  const openTasks = tasks.groups
    .flatMap((g) => g.tasks.filter((t) => t.percent < 100 && !plannedIds.has(t.id)).map((t) => ({ id: t.id, label: `${g.subject.name} ${t.code} · ${t.title} · ${t.minutes} Min.`, short: `${g.subject.short} ${t.code}`, minutes: t.minutes, load: plannedMin(g.subject.code) })))
    .sort((a, b) => a.load - b.load);
  return (
    <div className="cal">
      <TimeGrid
        variant="sol"
        grid={{ end: config.timeGridEnd, columns: solColumns(day.date, cal.plan, cal.presence), lunch: config.solLunch }}
        now={{ date: env.now.date, time: env.now.time }}
        live={!env.demo}
        title={isToday ? "Heute" : fmtLong(day.date)}
        sub={isToday ? `${fmtLong(day.date)} · Block ${day.blockN}` : `Block ${day.blockN}`}
        titleId="cal-h"
        prev={prev ? { href: q({ tag: prev.id }), label: "Vorheriger SOL-Tag" } : undefined}
        next={next ? { href: q({ tag: next.id }), label: "Nächster SOL-Tag" } : undefined}
      />
      <PlanForm dayId={day.id} dayLabel={fmtLong(day.date)} dayShort={WEEKDAYS[weekday(day.date)]!} tasks={openTasks} lastEnd={lastEnd} plan={cal.plan.map((p) => ({ id: p.id, label: `${p.subjectShort} ${p.code}, ${p.start} bis ${p.end}` }))} />
    </div>
  );
}

async function Portfolio({ userId, env, editId, q }: { userId: string; env: Awaited<ReturnType<typeof requireUser>>["env"]; editId?: string; q: (p: Partial<Search>) => string }) {
  const pf = await getSolPortfolio(env.db, userId, env.now);
  const editing = editId ? pf.entries.find((e) => e.solDayId === editId) : undefined;
  const target = editing ?? pf.next;
  const pastEntries = pf.entries;
  return (
    <>
      <div className="pfw">
        <div className="stack">
          {pastEntries.length === 0 && <Empty icon="note" title="Noch keine Einträge im Portfolio." />}
          {pastEntries.map((e) => (
            <Card key={e.solDayId} className="pf-e" aria-labelledby={`pf-${e.solDayId}`}>
              <div className="row-h">
                <h2 id={`pf-${e.solDayId}`} className="box-t">
                  {fmtLong(e.date)}
                </h2>
                <Link className="ib" href={q({ eintrag: e.solDayId })} scroll={false} aria-label={`Eintrag vom ${fmtLong(e.date)} bearbeiten`}>
                  <Icon name="edit" small />
                </Link>
              </div>
              <h3>Check-in</h3>
              <p>{e.checkIn ?? "–"}</p>
              {e.checkOut && (
                <>
                  <h3>Check-out</h3>
                  <p>{e.checkOut}</p>
                </>
              )}
            </Card>
          ))}
        </div>
        {target && <PortfolioForm key={target.solDayId} solDayId={target.solDayId} title={fmtLong(target.date)} checkIn={target.checkIn ?? ""} checkOut={target.checkOut ?? ""} cancelHref={editing ? q({ eintrag: undefined }) : undefined} />}
      </div>
    </>
  );
}

