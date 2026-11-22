import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { checkinBoard, DomainError } from "@bwd/db";
import { Icon } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { nowMs } from "@/lib/clock";
import { CheckinBoardView } from "./CheckinBoardView";

type Props = { params: Promise<{ code: string }> };

export const metadata: Metadata = { title: "Check-in Lernzone" };

export default async function CheckinBoardPage({ params }: Props) {
  const { env, me } = await requireTeacher();
  const board = await checkinBoard(env.db, me.id, decodeURIComponent((await params).code), env.now, nowMs()).catch((e: unknown) => {
    if (e instanceof DomainError) notFound();
    throw e;
  });
  return (
    <>
      <nav className="crumb" aria-label="Pfad">
        <Link className="ul" href={`/klassen/${encodeURIComponent(board.classCode)}`}>
          {board.classCode}
        </Link>
        <Icon name="chev-r" small />
        <Link className="ul" href={`/klassen/${encodeURIComponent(board.classCode)}/sol`}>
          SOL
        </Link>
        <Icon name="chev-r" small />
        <span aria-current="page">Check-in</span>
      </nav>
      <div className="ph">
        <h1>Check-in {board.classCode}</h1>
      </div>
      <CheckinBoardView initial={board} />
    </>
  );
}
