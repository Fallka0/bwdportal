import type { Metadata } from "next";
import { checkinInfo } from "@bwd/db";
import { fmtLong } from "@bwd/shared";
import { Card, Empty } from "@/components/ui";
import { requireStudent } from "@/lib/auth";
import { nowMs } from "@/lib/clock";
import { CheckinButton } from "./CheckinButton";

export const metadata: Metadata = { title: "Check-in" };

type Props = { searchParams: Promise<{ c?: string }> };

/** Nach dem Scannen des QR-Codes in der Lernzone: bestätigen. */
export default async function Checkin({ searchParams }: Props) {
  const { env, me } = await requireStudent();
  const code = (await searchParams).c ?? "";
  const info = await checkinInfo(env.db, me.id, code, nowMs());
  return (
    <>
      <div className="ph">
        <h1>Check-in</h1>
      </div>
      {!info.valid ? (
        <Empty icon="clock" title="Dieser Code ist abgelaufen oder nicht für deine Klasse. Scanne den Code in der Lernzone nochmals." />
      ) : (
        <Card aria-labelledby="ci-h" className="ci-card">
          <h2 id="ci-h" className="box-t">
            SOL-Tag {info.classCode} · {fmtLong(info.date!)}
          </h2>
          <dl className="kv">
            <dt>Check-in</dt>
            <dd>{info.checkIn ?? "–"}</dd>
            <dt>Check-out</dt>
            <dd>{info.checkOut ?? "–"}</dd>
          </dl>
          {info.next === "done" ? <p>Du bist heute ein- und ausgecheckt.</p> : <CheckinButton code={code} next={info.next!} />}
        </Card>
      )}
    </>
  );
}
