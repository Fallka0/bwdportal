import type { Metadata } from "next";
import { teacherClasses } from "@bwd/db";
import { plural } from "@bwd/shared";
import { Card, Empty, ListRow } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";

export const metadata: Metadata = { title: "Klassen" };

export default async function Classes() {
  const { env, me } = await requireTeacher();
  const classes = await teacherClasses(env.db, me.id);
  return (
    <>
      <div className="ph">
        <h1>Klassen</h1>
      </div>
      {classes.length === 0 ? (
        <Empty icon="users" title="Dir sind noch keine Klassen zugeteilt." />
      ) : (
        <Card aria-label="Meine Klassen">
          {classes.map((c) => (
            <ListRow
              key={c.code}
              href={`/klassen/${encodeURIComponent(c.code)}`}
              title={c.code}
              sub={[c.subjects.map((s) => s.name).join(", "), plural(c.students, "Lernende Person", "Lernende")].filter(Boolean).join(" · ")}
              end={c.classTeacher ? <span className="lr-s">Klassenlehrperson</span> : undefined}
            />
          ))}
        </Card>
      )}
    </>
  );
}
