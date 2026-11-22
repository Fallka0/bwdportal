/**
 * Benachrichtigungen speichern und als Push an die Geräte senden (Expo Push Service). Ohne registrierte Geräte wird
 * nichts gesendet. Abgemeldete Geräte (DeviceNotRegistered) werden entfernt. Fehler beim Senden blockieren nie das
 * Speichern: die Benachrichtigung steht im Portal, der Push ist ein Zusatz.
 */
import { eq, inArray } from "drizzle-orm";
import type { Db } from "./client";
import * as s from "./schema";

export type NotificationRow = typeof s.notifications.$inferInsert;

const EXPO_PUSH = "https://exp.host/--/api/v2/push/send";

type Sender = (messages: { to: string; title: string }[]) => Promise<{ data?: { status: string; details?: { error?: string } }[] } | null>;

let pushSender: Sender = async (messages) => {
  const res = await fetch(EXPO_PUSH, { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(messages) });
  return res.ok ? ((await res.json()) as { data?: { status: string; details?: { error?: string } }[] }) : null;
};

/** Für Tests austauschbar. */
export function setPushSender(fn: Sender) {
  pushSender = fn;
}

export async function insertNotifications(db: Db, rows: NotificationRow[]): Promise<void> {
  if (!rows.length) return;
  // D1 begrenzt die Parameter pro Anweisung
  for (let i = 0; i < rows.length; i += 10) await db.insert(s.notifications).values(rows.slice(i, i + 10));
  await sendPush(db, rows).catch(() => {});
}

async function sendPush(db: Db, rows: NotificationRow[]) {
  const tokens = await db.select().from(s.pushTokens).where(inArray(s.pushTokens.userId, [...new Set(rows.map((r) => r.userId))]));
  if (!tokens.length) return;
  const messages = rows.flatMap((r) =>
    tokens.filter((t) => t.userId === r.userId).map((t) => ({ to: t.token, title: r.title, body: r.body ?? undefined, data: { href: r.href ?? "/benachrichtigungen" }, sound: "default", channelId: "default" })),
  );
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    const res = await pushSender(chunk);
    const gone = (res?.data ?? []).map((d, j) => (d.status === "error" && d.details?.error === "DeviceNotRegistered" ? chunk[j]!.to : null)).filter((x): x is string => !!x);
    if (gone.length) await db.delete(s.pushTokens).where(inArray(s.pushTokens.token, gone));
  }
}

/** Gerät registrieren (nach dem Login und bei jedem Start). */
export async function registerPushToken(db: Db, userId: string, token: string, platform: string, stamp: string) {
  await db
    .insert(s.pushTokens)
    .values({ token, userId, platform, createdAt: stamp, lastSeenAt: stamp })
    .onConflictDoUpdate({ target: s.pushTokens.token, set: { userId, platform, lastSeenAt: stamp } });
}

/** Gerät abmelden (Logout). Nur das eigene Token. */
export async function removePushToken(db: Db, userId: string, token: string) {
  const t = (await db.select().from(s.pushTokens).where(eq(s.pushTokens.token, token)).limit(1))[0];
  if (t?.userId === userId) await db.delete(s.pushTokens).where(eq(s.pushTokens.token, token));
}
