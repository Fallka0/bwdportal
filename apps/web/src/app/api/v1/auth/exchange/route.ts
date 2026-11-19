import { z } from "zod";
import { consumeLoginCode, DomainError } from "@bwd/db";
import { apiError, json, parseBody } from "@/lib/api";
import { serverEnv } from "@/lib/env";

const Body = z.object({ code: z.string().min(10).max(100) });

/** App: Einmal-Code aus dem Microsoft-Login gegen das Session-Token tauschen. */
export async function POST(req: Request) {
  const env = await serverEnv();
  try {
    const { code } = await parseBody(req, Body);
    const session = await consumeLoginCode(env.db, code, env.now);
    if (!session) return apiError(400, "invalid_code", "Die Anmeldung ist abgelaufen. Versuche es nochmals.");
    return json({ token: session });
  } catch (e) {
    if (e instanceof DomainError) return apiError(422, e.code, e.message, e.field);
    throw e;
  }
}
