import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DomainError, getAttendanceSheet } from "@bwd/db";
import { fmtLong, fmtPeriods } from "@bwd/shared";
import { Icon } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { AttendanceForm } from "./AttendanceForm";

export const metadata: Metadata = { title: "Präsenz" };

type Props = { params: Promise<{ id: string }> };

export default async function AttendanceSheetPage({ params }: Props) {
  const { env, me } = await requireTeacher();
  const id = decodeURIComponent((await params).id);
  const sheet = await getAttendanceSheet(env.db, me.id, id, env.now).catch((e: unknown) => {
    if (e instanceof DomainError) notFound();
    throw e;
  });
  const { slot } = sheet;
  return (
    <>
      <nav className="crumb" aria-label="Pfad">
        <Link className="ul" href="/praesenz">
          Präsenz
        </Link>
        <Icon name="chev-r" small />
        <span aria-current="page">
          {slot.subject.name} {slot.classCode}
        </span>
      </nav>
      <div className="ph">
        <div>
          <h1>
            {slot.subject.name} {slot.classCode}
          </h1>
          <p className="ph-sub">{[fmtLong(slot.date), fmtPeriods(slot.periods), `${slot.start} bis ${slot.end}`, slot.room].filter(Boolean).join(" · ")}</p>
        </div>
      </div>
      <AttendanceForm sheet={sheet} />
    </>
  );
}
