import { saveAssessmentGrades } from "@bwd/db";
import { AssessmentGradesInput } from "@bwd/shared";
import { parseBody, withUser } from "@/lib/api";

/** Noten einer Probe speichern; value null = keine Note. */
export const PUT = withUser(async ({ env, userId, req }) => {
  const parts = new URL(req.url).pathname.split("/");
  const id = decodeURIComponent(parts[parts.length - 2] ?? "");
  return saveAssessmentGrades(env.db, userId, id, await parseBody(req, AssessmentGradesInput), env.now);
});
