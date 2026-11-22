import { createAssessment } from "@bwd/db";
import { AssessmentInput } from "@bwd/shared";
import { json, parseBody, withUser } from "@/lib/api";

/** Probe für eine zugeteilte Klasse und ein Fach anlegen. */
export const POST = withUser(async ({ env, userId, req }) => json(await createAssessment(env.db, userId, await parseBody(req, AssessmentInput), env.now), 201));
