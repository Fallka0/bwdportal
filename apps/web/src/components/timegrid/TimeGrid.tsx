"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { getNow, layoutGrid, type GridInput, type PlacedBlock } from "@bwd/shared";
import { Icon } from "@/components/ui";

type Nav = { href: string; label: string };

type Props = {
  /** Raster ohne "jetzt"; die Komponente setzt die aktuelle Zeit. */
  grid: Omit<GridInput, "now">;
  now: { date: string; time: string };
  /** Echte Zeit: Jetzt-Linie jede Minute neu. Mit DEMO_NOW bleibt sie stehen. */
  live: boolean;
  title: string;
  sub?: string;
  titleId?: string;
  prev?: Nav;
  next?: Nav;
  /** Rechts im Kopf statt "weiter", z. B. Link "Woche" in der Übersicht */
  aside?: ReactNode;
  /** Link unter dem Titel, wenn man nicht auf heute steht */
  today?: Nav;
  variant: "day" | "week" | "sol";
  footer?: ReactNode;
};

/**
 * Das eine Zeitraster für alle Stundenpläne: dunkle Blöcke, graues Band "Mittag", rote Jetzt-Linie mit Uhrzeit.
 */
export function TimeGrid({ grid, now: initialNow, live, title, sub, titleId, prev, next, aside, today, variant, footer }: Props) {
  const [ticked, setTicked] = useState<{ date: string; time: string } | null>(null);
  useEffect(() => {
    if (!live) return;
    const tick = () => {
      const n = getNow();
      setTicked({ date: n.date, time: n.time });
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [live]);

  // Mit DEMO_NOW gilt die Zeit vom Server; sonst tickt die Uhr jede Minute.
  const now = live && ticked ? ticked : initialNow;
  const g = layoutGrid({ ...grid, now });
  const multi = g.columns.length > 1;
  const weights = g.columns.map((c) => `minmax(0, ${c.weight ?? 1}fr)`).join(" ");
  const style = { "--cols": weights } as CSSProperties;

  return (
    <section className={`card tg-card tg-${variant}`} aria-labelledby={titleId}>
      <div className={aside ? "cal-h cal-h2" : "cal-h"}>
        {prev ? (
          <Link className="ib" href={prev.href} aria-label={prev.label} scroll={false}>
            <Icon name="chev-l" />
          </Link>
        ) : (
          <span />
        )}
        <div>
          <b id={titleId} aria-live="polite">
            {title}
          </b>
          {sub && <span className="s">{sub}</span>}
          {today && (
            <Link className="alink cal-back" href={today.href} scroll={false}>
              {today.label}
            </Link>
          )}
        </div>
        {aside ??
          (next ? (
            <Link className="ib" href={next.href} aria-label={next.label} scroll={false}>
              <Icon name="chev-r" />
            </Link>
          ) : (
            <span />
          ))}
      </div>

      <div className="tg" style={style}>
        {multi && (
          <div className="tg-hd" aria-hidden="true">
            <span />
            <div className="tg-hd-cols">
              {g.columns.map((c) => (
                <span key={c.key} className={c.today && variant === "week" ? "tg-d today" : "tg-d"}>
                  {c.header} {c.headerNum && <b>{c.headerNum}</b>}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="tg-bd" style={{ height: g.height }}>
          <div className="tg-ax" aria-hidden="true">
            {g.hours.map((h) => (
              <span key={h.label} style={{ top: h.top }}>
                {h.label}
              </span>
            ))}
          </div>
          <div className="tg-cols">
            {g.hours.map((h) => (
              <i key={h.label} className="tg-hr" style={{ top: h.top }} aria-hidden="true" />
            ))}
            {g.lunch && (
              <div className="tg-lunch" style={{ top: g.lunch.top, height: g.lunch.height }} aria-hidden="true">
                Mittag
              </div>
            )}
            {g.columns.map((c) => (
              <div key={c.key} className="tg-col" role="list" aria-label={c.header ? `${c.header} ${c.headerNum ?? ""}`.trim() : title}>
                {c.blocks.map((b) => (
                  <Block key={b.id} b={b} lanes={c.lanes} variant={variant} />
                ))}
              </div>
            ))}
            {g.now && (
              <div className="tg-now" style={{ top: g.now.top }} role="note" aria-label={`Jetzt ${g.now.label}`}>
                <span className="tg-nl">{g.now.label}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      {footer}
    </section>
  );
}

function Block({ b, lanes, variant }: { b: PlacedBlock; lanes?: number; variant: Props["variant"] }) {
  const style: CSSProperties = { top: b.top, height: b.height };
  if (lanes && b.lane !== undefined) {
    style.left = `calc(${b.lane} * 100% / ${lanes})`;
    style.width = `calc(100% / ${lanes} - 4px)`;
    style.right = "auto";
  }
  const cls = ["tg-b", `k-${b.kind}`, b.past && "past", b.compact && "compact", b.medium && "medium"].filter(Boolean).join(" ");
  return (
    <div className={cls} style={style} role="listitem" aria-label={b.label}>
      <span className="tg-t" aria-hidden="true">
        <b className="tg-n">{b.title}</b>
        {b.titleShort && <b className="tg-ns">{b.titleShort}</b>}
        {b.sub && <span className="tg-s">{b.sub}</span>}
        {b.subShort !== undefined && <span className="tg-ss">{b.subShort}</span>}
      </span>
      {b.detail && (
        <span className="tg-x" aria-hidden="true">
          {b.detail}
        </span>
      )}
      {(variant !== "week" || b.kind === "sol") && (
        <span className="tm" aria-hidden="true">
          {b.timeLabel}
        </span>
      )}
    </div>
  );
}

/** Legende unter der Wochenansicht. */
export function TimeGridLegend() {
  return (
    <div className="legend" aria-hidden="true">
      <span>
        <i className="nowl" />
        Jetzt
      </span>
      <span>
        <i className="chg" />
        Raumänderung
      </span>
      <span>
        <i className="off" />
        Entfällt
      </span>
    </div>
  );
}
