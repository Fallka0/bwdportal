import Link from "next/link";
import { addDays, fmtLong, type TestItem } from "@bwd/shared";
import { Icon } from "@/components/ui";

const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

type Props = {
  first: string;
  gridStart: string;
  gridEnd: string;
  today: string;
  tests: TestItem[];
  teacher: boolean;
  title: string;
  prev: string;
  next: string;
  back: string | null;
};

/** Monatskalender der Prüfungen: Wochen als Zeilen, jede Prüfung als Block am Tag. Klick zeigt die Details. */
export function MonthCalendar({
  first,
  gridStart,
  gridEnd,
  today,
  tests,
  teacher,
  title,
  prev,
  next,
  back,
}: Props) {
  const month = first.slice(0, 7);
  const weeks: string[][] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) {
    if (!weeks.length || weeks.at(-1)!.length === 7) weeks.push([]);
    weeks.at(-1)!.push(d);
  }
  const byDay = new Map<string, TestItem[]>();
  for (const t of tests) byDay.set(t.date, [...(byDay.get(t.date) ?? []), t]);
  const inMonth = tests.filter((t) => t.date.startsWith(month)).length;

  return (
    <>
      <section className="card tcal" aria-labelledby="tc-h">
        <div className="cal-h">
          <Link
            className="ib"
            href={prev}
            aria-label="Vorheriger Monat"
            scroll={false}
          >
            <Icon name="chev-l" />
          </Link>
          <div>
            <b id="tc-h" aria-live="polite">
              {title}
            </b>
            <span className="s">
              {inMonth === 1 ? "1 Prüfung" : `${inMonth} Prüfungen`}
            </span>
            {back && (
              <Link className="alink cal-back" href={back} scroll={false}>
                Zum heutigen Monat
              </Link>
            )}
          </div>
          <Link
            className="ib"
            href={next}
            aria-label="Nächster Monat"
            scroll={false}
          >
            <Icon name="chev-r" />
          </Link>
        </div>
        <table className="tcal-t">
          <thead>
            <tr>
              {DAYS.map((d, i) => (
                <th key={d} scope="col" className={i > 4 ? "we" : undefined}>
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((w) => (
              <tr key={w[0]}>
                {w.map((d, i) => {
                  const list = byDay.get(d) ?? [];
                  const cls = [
                    d.slice(0, 7) !== month && "out",
                    i > 4 && "we",
                    d === today && "now",
                    d < today && "past",
                  ]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <td
                      key={d}
                      className={cls || undefined}
                      aria-label={`${fmtLong(d)}${list.length ? `, ${list.length === 1 ? "1 Prüfung" : `${list.length} Prüfungen`}` : ""}`}
                    >
                      <span className="tcal-n" aria-hidden="true">
                        {Number(d.slice(8))}
                      </span>
                      {list.map((t) => (
                        <Link
                          key={t.id}
                          className={t.classCode ? "tcal-e" : "tcal-e own"}
                          href={`/pruefungen?monat=${month}&pruefung=${encodeURIComponent(t.id)}`}
                          scroll={false}
                          aria-label={`${t.subject.name}${t.classCode && teacher ? ` ${t.classCode}` : ""}: ${t.title}${t.classCode ? "" : ", eigene Prüfung"}`}
                        >
                          <b>
                            {t.subject.short}
                            {teacher && t.classCode ? ` ${t.classCode}` : ""}
                          </b>
                          <span>{t.title}</span>
                        </Link>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <div className="legend" aria-hidden="true">
        <span>
          <i className="tcal-k" />
          Prüfung der Klasse
        </span>
        <span>
          <i className="tcal-k own" />
          Eigene Prüfung
        </span>
      </div>
    </>
  );
}
