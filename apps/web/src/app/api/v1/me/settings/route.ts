import { updateSettings } from "@bwd/db";
import { SettingsPatch } from "@bwd/shared";
import { parseBody, withUser } from "@/lib/api";

export const PATCH = withUser(async ({ env, userId, req }) => updateSettings(env.db, userId, await parseBody(req, SettingsPatch)));
