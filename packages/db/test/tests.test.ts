import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import type { Db } from "../src/client";
import * as a from "../src/admin";
import * as q from "../src/queries";
import * as schema from "../src/schema";
import { DEMO_USERS } from "../src/seed/build";
import * as t from "../src/tests";
import { NOW, testDb } from "./helpers";

let db: Db;
beforeEach(async () => {
  db = await testDb();
});

const { selin, mia, teacher } = DEMO_USERS;

describe("Prüfungskalender", () => {
  it("Lernende sehen Klassenprüfungen und nur die eigenen persönlichen", async () => {
    expect((await t.listTests(db, selin, NOW)).map((x) => [x.id, x.mine])).toEqual([
      ["ts-ma-1", false],
      ["ts-en-1", true],
    ]);
    expect((await t.listTests(db, mia, NOW)).map((x) => x.id)).toEqual(["ts-ma-1"]);
    const ma = (await t.listTests(db, mia, NOW))[0]!;
    expect(ma).toMatchObject({ classCode: "IM24b", author: "Regula Keller", subject: { code: "MA", name: "Mathematik" }, description: "Kapitel 4 und 5, Taschenrechner erlaubt" });
  });

  it("Lehrperson sieht ihr Fach, nicht die eigenen Prüfungen der Lernenden", async () => {
    expect((await t.listTests(db, teacher, NOW)).map((x) => [x.id, x.mine])).toEqual([["ts-ma-1", true]]);
  });

  it("Lehrperson erfasst nur in zugewiesenen Fächern; Lernende werden benachrichtigt", async () => {
    await expect(t.createTest(db, teacher, { date: "2026-11-10", subject: "DE", title: "Aufsatz", classCode: "IM24b" }, NOW)).rejects.toThrow("nicht zugeteilt");
    await expect(t.createTest(db, teacher, { date: "2026-11-10", subject: "MA", title: "Geometrie" }, NOW)).rejects.toThrow("Klasse");
    const before = (await db.select().from(schema.notifications).where(eq(schema.notifications.userId, mia))).length;
    const x = await t.createTest(db, teacher, { date: "2026-11-10", subject: "MA", title: "Geometrie", classCode: "im24b", description: "  " }, NOW);
    expect(x).toMatchObject({ classCode: "IM24b", mine: true, description: null });
    const after = await db.select().from(schema.notifications).where(eq(schema.notifications.userId, mia));
    expect(after.length).toBe(before + 1);
    expect(after.find((n) => n.title === "Neue Prüfung in Mathematik")).toMatchObject({ href: "/pruefungen" });
    expect((await t.listTests(db, selin, NOW)).map((y) => y.id)).toContain(x.id);
  });

  it("nur wer erfasst hat, ändert und löscht", async () => {
    await expect(t.deleteTest(db, selin, "ts-ma-1")).rejects.toThrow("Nur wer");
    await expect(t.updateTest(db, teacher, "ts-en-1", { date: "2026-11-04", subject: "EN", title: "x" }, NOW)).rejects.toThrow("Nur wer");
    const own = await t.createTest(db, mia, { date: "2026-11-02", subject: "FR", title: "Vocabulaire", classCode: "IM24b" }, NOW);
    // Lernende: classCode wird ignoriert, die Prüfung bleibt persönlich
    expect(own).toMatchObject({ classCode: null, mine: true, author: null });
    expect((await t.listTests(db, selin, NOW)).map((y) => y.id)).not.toContain(own.id);
    const changed = await t.updateTest(db, mia, own.id, { date: "2026-11-03", subject: "FR", title: "Vocabulaire 2", description: "Unité 3" }, NOW);
    expect(changed).toMatchObject({ date: "2026-11-03", title: "Vocabulaire 2", description: "Unité 3" });
    await t.deleteTest(db, mia, own.id);
    expect(await t.listTests(db, mia, NOW)).toHaveLength(1);
  });

  it("Klassenlehrperson sieht alle Prüfungen der Klasse, auch ohne Fach", async () => {
    await a.adminUpdatePerson(db, mia, { role: "teacher" });
    await a.adminSetAssignments(db, mia, [{ classCode: "IM24b", subject: "DE" }]);
    await t.createTest(db, mia, { date: "2026-11-09", subject: "DE", title: "Aufsatz", classCode: "IM24b" }, NOW);
    await a.adminSetAssignments(db, teacher, []);
    expect((await t.listTests(db, teacher, NOW)).map((x) => x.subject.code)).toEqual(["MA", "DE"]);
  });

  it("Stundenplan markiert die Lektion, vergangene Prüfungen absteigend", async () => {
    const tt = await q.getTimetable(db, selin, "2026-10-29", "2026-10-29", NOW);
    expect(tt.lessons.filter((l) => l.test).map((l) => [l.subject?.code, l.test])).toEqual(
      tt.lessons.filter((l) => l.subject?.code === "MA" && l.state !== "cancelled").map(() => ["MA", "Lineare Funktionen"]),
    );
    expect(tt.lessons.some((l) => l.test)).toBe(true);
    const later = { date: "2026-11-20", time: "08:00", stamp: "2026-11-20T08:00" };
    expect((await t.listTests(db, selin, later, { past: true })).map((x) => x.id)).toEqual(["ts-en-1", "ts-ma-1"]);
    expect((await q.getHome(db, selin, NOW)).tests.map((x) => x.id)).toEqual(["ts-ma-1", "ts-en-1"]);
  });

  it("Auswahl: Lernende Fächer des Stundenplans ohne SOL, Lehrperson ihre Zuteilungen", async () => {
    const s = await t.testOptions(db, selin);
    expect(s.subjects.map((x) => x.code)).toContain("MA");
    expect(s.subjects.map((x) => x.code)).not.toContain("SOL");
    expect((await t.testOptions(db, teacher)).classes).toEqual([{ classCode: "IM24b", subject: { code: "MA", name: "Mathematik", short: expect.any(String) } }]);
  });
});
