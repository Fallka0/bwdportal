import { setEfzValue } from "@bwd/db";
import { EfzValueInput } from "@bwd/shared";
import { parseBody, withUser } from "@/lib/api";

/** Note eines EFZ-Moduls setzen oder leeren. */
export const PATCH = withUser(async ({ env, userId, req }) => {
  const { value } = await parseBody(req, EfzValueInput);
  await setEfzValue(env.db, userId, decodeURIComponent(new URL(req.url).pathname.split("/").pop() ?? ""), value);
  return { ok: true };
});
