import { adminPeople } from "@bwd/db";
import { internal } from "@/lib/internal";

/** Konten: ?q= (Name oder Adresse), ?role=student|teacher, ?class=IM24a */
export const GET = internal(async ({ env, url }) => ({
  people: await adminPeople(env.db, { q: url.searchParams.get("q") ?? undefined, role: url.searchParams.get("role") ?? undefined, classCode: url.searchParams.get("class") ?? undefined }),
}));
