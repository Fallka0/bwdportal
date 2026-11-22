import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getClassroom } from "@bwd/db";
import { ClassroomView } from "@/components/classroom/ClassroomView";
import { Empty } from "@/components/ui";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Klassenraum" };

type Props = { searchParams: Promise<{ fach?: string }> };

/** Klassenraum der eigenen Klasse (Lernende). Lehrpersonen öffnen ihn über Klassen. */
export default async function ClassroomPage({ searchParams }: Props) {
  const { env, me } = await requireUser();
  if (me.role === "teacher") redirect("/klassen");
  const subject = (await searchParams).fach ?? null;
  const room = me.classCode ? await getClassroom(env.db, me.id, null, subject) : null;
  return (
    <>
      <div className="ph">
        <div>
          <h1>Klassenraum</h1>
          {room && <p className="ph-sub">{room.classCode}</p>}
        </div>
      </div>
      {room ? <ClassroomView room={room} subject={subject} /> : <Empty icon="msg" title="Du bist keiner Klasse zugeteilt." />}
    </>
  );
}
