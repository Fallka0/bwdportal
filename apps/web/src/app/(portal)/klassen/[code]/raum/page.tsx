import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DomainError, getClassroom } from "@bwd/db";
import { ClassroomView } from "@/components/classroom/ClassroomView";
import { Icon } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";

type Props = { params: Promise<{ code: string }>; searchParams: Promise<{ fach?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Klassenraum ${decodeURIComponent((await params).code)}` };
}

export default async function TeacherClassroom({ params, searchParams }: Props) {
  const { env, me } = await requireTeacher();
  const subject = (await searchParams).fach ?? null;
  const room = await getClassroom(env.db, me.id, decodeURIComponent((await params).code), subject).catch((e: unknown) => {
    if (e instanceof DomainError) notFound();
    throw e;
  });
  return (
    <>
      <nav className="crumb" aria-label="Pfad">
        <Link className="ul" href="/klassen">
          Klassen
        </Link>
        <Icon name="chev-r" small />
        <Link className="ul" href={`/klassen/${encodeURIComponent(room.classCode)}`}>
          {room.classCode}
        </Link>
        <Icon name="chev-r" small />
        <span aria-current="page">Klassenraum</span>
      </nav>
      <div className="ph">
        <div>
          <h1>Klassenraum {room.classCode}</h1>
        </div>
      </div>
      <ClassroomView room={room} subject={subject} />
    </>
  );
}
