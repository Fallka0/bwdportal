import { fmtBytes, fmtLong, type ClassFile, type Classroom } from "@bwd/shared";
import { Card, Empty, Icon } from "@/components/ui";
import { Composer, DeleteFile, PostActions, SubjectFilter, UploadFile } from "./ClassroomForms";

const when = (stamp: string) => `${fmtLong(stamp.slice(0, 10))}, ${stamp.slice(11, 16)}`;

function FileRow({ f }: { f: ClassFile }) {
  return (
    <li className="kr-file">
      <Icon name="file" small />
      <a href={`/api/v1/files/class/${encodeURIComponent(f.id)}`} download>
        <b>{f.name}</b>
        <span>
          {[f.subject?.name, fmtBytes(f.bytes), f.uploadedBy].filter(Boolean).join(" · ")}
        </span>
      </a>
      {f.canDelete && <DeleteFile id={f.id} name={f.name} />}
    </li>
  );
}

/** Klassenraum für Lernende und Lehrpersonen: Beiträge links, Dateien rechts; schreiben nur mit canPostFor. */
export function ClassroomView({ room, subject }: { room: Classroom; subject: string | null }) {
  const write = room.canPostFor.length > 0;
  return (
    <div className="g12">
      <div className="stack">
        {write && <Composer classCode={room.classCode} options={room.canPostFor} />}
        {room.posts.length === 0 ? (
          <Empty icon="msg" title={subject ? "Keine Beiträge in diesem Fach." : "Noch keine Beiträge."} />
        ) : (
          room.posts.map((p) => (
            <Card key={p.id} className="kr-post" aria-label={`Beitrag von ${p.author}`}>
              <div className="kr-h">
                <span className="av" aria-hidden="true">
                  {p.author
                    .split(" ")
                    .map((x) => x[0])
                    .join("")
                    .slice(0, 2)}
                </span>
                <span className="kr-who">
                  <b>{p.author}</b>
                  <span>
                    {[p.subject?.name ?? "Ganze Klasse", when(p.createdAt), p.edited ? "bearbeitet" : null].filter(Boolean).join(" · ")}
                  </span>
                </span>
                {(p.mine || p.canDelete) && <PostActions id={p.id} body={p.body} mine={p.mine} />}
              </div>
              <p className="kr-body">{p.body}</p>
              {p.files.length > 0 && (
                <ul className="kr-files">
                  {p.files.map((f) => (
                    <FileRow key={f.id} f={f} />
                  ))}
                </ul>
              )}
            </Card>
          ))
        )}
      </div>
      <div className="stack">
        {room.subjects.length > 1 && <SubjectFilter subjects={room.subjects} value={subject} />}
        <Card aria-labelledby="kr-f-h">
          <div className="row-h">
            <h2 id="kr-f-h" className="box-t">
              Dateien
            </h2>
            {write && <UploadFile classCode={room.classCode} options={room.canPostFor} />}
          </div>
          {room.files.length === 0 ? (
            <p className="empty-s">Keine Dateien.</p>
          ) : (
            <ul className="kr-files">
              {room.files.map((f) => (
                <FileRow key={f.id} f={f} />
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
