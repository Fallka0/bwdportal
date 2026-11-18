import { getSolTasks } from "@bwd/db";
import { apiError, withUser } from "@/lib/api";
import { downloadHeaders, fileName, placeholderPdf, zip } from "@/lib/files";

/** Alle Aufträge eines Blocks als ZIP. */
export const GET = withUser(async ({ env, userId, req }) => {
  const n = Number(new URL(req.url).pathname.split("/").pop());
  const t = await getSolTasks(env.db, userId, env.now, n);
  if (!t.block) return apiError(404, "not_found", "Diesen Block gibt es nicht.");
  const files = await Promise.all(
    t.groups.flatMap((g) =>
      g.tasks.map(async (task) => {
        const obj = await env.files.get(`sol/auftraege/${task.subjectCode.toLowerCase()}-sol-${task.code.replace(".", "-")}.pdf`).catch(() => null);
        const data = obj ? new Uint8Array(await obj.arrayBuffer()) : placeholderPdf(`SOL ${g.subject.name} ${task.code}: ${task.title}`, [`Bearbeitungszeit: ${task.minutes} Minuten`]);
        return { name: `${g.subject.name}/${fileName(`${task.code} ${task.title}`, "pdf")}`, data };
      }),
    ),
  );
  return new Response(zip(files), { headers: downloadHeaders(`SOL Block ${n}.zip`, "application/zip", false) });
});
