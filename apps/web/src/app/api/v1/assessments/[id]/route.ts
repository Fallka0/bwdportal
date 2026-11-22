import { deleteAssessment, getAssessment, updateAssessment } from "@bwd/db";
import { AssessmentInput } from "@bwd/shared";
import { parseBody, withUser } from "@/lib/api";

const idOf = (req: Request) => decodeURIComponent(new URL(req.url).pathname.split("/").pop() ?? "");
const Change = AssessmentInput.omit({ classCode: true, subject: true });

export const GET = withUser(({ env, userId, req }) => getAssessment(env.db, userId, idOf(req), env.now));

export const PATCH = withUser(async ({ env, userId, req }) => updateAssessment(env.db, userId, idOf(req), await parseBody(req, Change), env.now));

export const DELETE = withUser(async ({ env, userId, req }) => {
  await deleteAssessment(env.db, userId, idOf(req));
  return { ok: true };
});
