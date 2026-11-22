import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../src/client";
import * as p from "../src/push";
import * as schema from "../src/schema";
import { DEMO_USERS } from "../src/seed/build";
import * as t from "../src/tests";
import { NOW, testDb } from "./helpers";

let db: Db;
let sent: { to: string; title: string }[][] = [];
beforeEach(async () => {
  db = await testDb();
  sent = [];
  p.setPushSender(async (m) => {
    sent.push(m);
    return { data: m.map((x) => (x.to.includes("alt") ? { status: "error", details: { error: "DeviceNotRegistered" } } : { status: "ok" })) };
  });
});
afterEach(() => p.setPushSender(async () => null));

const { selin, mia, teacher } = DEMO_USERS;

describe("Push", () => {
  it("Neue Prüfung geht an die Geräte der Klasse; abgemeldete Geräte werden entfernt", async () => {
    await p.registerPushToken(db, mia, "ExponentPushToken[mia]", "android", NOW.stamp);
    await p.registerPushToken(db, selin, "ExponentPushToken[selin-alt]", "android", NOW.stamp);
    await t.createTest(db, teacher, { date: "2026-11-10", subject: "MA", title: "Geometrie", classCode: "IM24b" }, NOW);
    expect(sent.flat().map((m) => [m.to, m.title])).toEqual([
      ["ExponentPushToken[selin-alt]", "Neue Prüfung in Mathematik"],
      ["ExponentPushToken[mia]", "Neue Prüfung in Mathematik"],
    ]);
    expect((await db.select().from(schema.pushTokens)).map((x) => x.token)).toEqual(["ExponentPushToken[mia]"]);
  });

  it("Ohne Geräte wird nichts gesendet; Token wechselt bei neuem Konto, abmelden nur eigenes", async () => {
    await t.createTest(db, teacher, { date: "2026-11-10", subject: "MA", title: "Geometrie", classCode: "IM24b" }, NOW);
    expect(sent).toEqual([]);
    await p.registerPushToken(db, mia, "tok", "ios", NOW.stamp);
    await p.registerPushToken(db, selin, "tok", "ios", NOW.stamp);
    expect((await db.select().from(schema.pushTokens))[0]).toMatchObject({ userId: selin });
    await p.removePushToken(db, mia, "tok");
    expect(await db.select().from(schema.pushTokens)).toHaveLength(1);
    await p.removePushToken(db, selin, "tok");
    expect(await db.select().from(schema.pushTokens)).toHaveLength(0);
  });

  it("Fehler beim Senden blockieren das Speichern nicht", async () => {
    p.setPushSender(async () => {
      throw new Error("offline");
    });
    await p.registerPushToken(db, mia, "tok", "android", NOW.stamp);
    await t.createTest(db, teacher, { date: "2026-11-10", subject: "MA", title: "Geometrie", classCode: "IM24b" }, NOW);
    const notes = await db.select().from(schema.notifications);
    expect(notes.some((n) => n.userId === mia && n.title === "Neue Prüfung in Mathematik")).toBe(true);
  });
});
