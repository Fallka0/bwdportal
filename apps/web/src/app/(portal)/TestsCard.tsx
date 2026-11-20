import { fmtWeekdayShort, type TestItem } from "@bwd/shared";
import { Card, CardHead, ListRow } from "@/components/ui";

/** Prüfungen der nächsten zwei Wochen auf der Übersicht. */
export function TestsCard({ tests, teacher = false }: { tests: TestItem[]; teacher?: boolean }) {
  return (
    <Card className="h-ts" aria-labelledby="ts-h">
      <CardHead id="ts-h" title="Prüfungen" href="/pruefungen" />
      {tests.length === 0 ? (
        <p className="empty-s">Keine Prüfungen in den nächsten zwei Wochen.</p>
      ) : (
        tests.map((t) => (
          <ListRow
            key={t.id}
            href="/pruefungen"
            title={`${t.subject.name}${teacher && t.classCode ? ` · ${t.classCode}` : ""}`}
            sub={`${t.title}${!t.classCode ? " · Eigene" : ""}`}
            end={<span className="lr-s">{fmtWeekdayShort(t.date)}</span>}
          />
        ))
      )}
    </Card>
  );
}
