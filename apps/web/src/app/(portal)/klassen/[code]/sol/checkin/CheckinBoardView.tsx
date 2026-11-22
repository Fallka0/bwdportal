"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { fmtLong, type CheckinBoard } from "@bwd/shared";
import { Card, Empty, ListRow, Status } from "@/components/ui";

/** QR-Code (alle 20 Sekunden neu) und Stand der Klasse. */
export function CheckinBoardView({ initial }: { initial: CheckinBoard }) {
  const [board, setBoard] = useState(initial);
  const [svg, setSvg] = useState("");
  useEffect(() => {
    if (!board.day) return;
    const t = window.setInterval(async () => {
      const res = await fetch(`/api/v1/sol/checkin/board?klasse=${encodeURIComponent(board.classCode)}`).catch(() => null);
      if (res?.ok) setBoard((await res.json()) as CheckinBoard);
    }, 20_000);
    return () => window.clearInterval(t);
  }, [board.day, board.classCode]);
  useEffect(() => {
    if (!board.code) return;
    let alive = true;
    void QRCode.toString(`${window.location.origin}/api/v1/sol/scan?c=${board.code}`, { type: "svg", margin: 1, errorCorrectionLevel: "M" }).then((s) => alive && setSvg(s));
    return () => {
      alive = false;
    };
  }, [board.code]);

  if (!board.day) return <Empty icon="cal" title={board.nextDay ? `Heute ist kein SOL-Tag. Nächster SOL-Tag: ${fmtLong(board.nextDay)}.` : "Heute ist kein SOL-Tag."} />;
  const inside = board.students.filter((s) => s.checkIn && !s.checkOut).length;
  return (
    <div className="g12">
      <Card aria-label="QR-Code" className="ci-qr">
        {/* Das SVG kommt aus der QR-Bibliothek, ohne Daten von aussen */}
        <div className="ci-code" role="img" aria-label="QR-Code zum Einchecken" dangerouslySetInnerHTML={{ __html: svg }} />
        <p className="box-s">{fmtLong(board.date)}</p>
      </Card>
      <Card aria-labelledby="ci-l">
        <h2 id="ci-l" className="box-t" style={{ marginBottom: "var(--sp-3)" }}>
          {inside} von {board.students.length} in der Lernzone
        </h2>
        {board.students.map((s) => (
          <ListRow
            key={s.id}
            title={s.name}
            sub={[s.checkIn ? `ein ${s.checkIn}` : null, s.checkOut ? `aus ${s.checkOut}` : null].filter(Boolean).join(" · ") || undefined}
            end={s.checkOut ? <Status tone="ok">Ausgecheckt</Status> : s.checkIn ? <Status tone="info">Da</Status> : <Status tone="warn">Fehlt</Status>}
          />
        ))}
      </Card>
    </div>
  );
}
