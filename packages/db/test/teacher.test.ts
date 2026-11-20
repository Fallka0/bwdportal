import { beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../src/client";
import * as a from "../src/admin";
import * as q from "../src/queries";
import { DEMO_USERS } from "../src/seed/build";
import { NOW, testDb } from "./helpers";

let db: Db;
beforeEach(async () => {
  db = await testDb();
});

describe("Lehrperson", () => {
  it("Stundenplan: nur zugewiesene Fächer, mit Klasse", async () => {
    const mine = await q.lessonsBetween(db, DEMO_USERS.teacher, "2026-10-26", "2026-10-30");
    expect(mine.length).toBeGreaterThan(0);
    expect(mine.every((l) => l.subject?.code === "MA" && l.classCode === "IM24b")).toBe(true);
    const all = await q.lessonsBetween(db, DEMO_USERS.selin, "2026-10-26", "2026-10-30");
    expect(all.filter((l) => l.subject?.code === "MA").length).toBe(mine.length);
    // Lernende sehen keine Klasse an der Lektion
    expect(all.every((l) => l.classCode === undefined)).toBe(true);
  });

  it("ohne Zuteilung: kein Stundenplan", async () => {
    await a.adminSetAssignments(db, DEMO_USERS.teacher, []);
    expect(await q.lessonsBetween(db, DEMO_USERS.teacher, "2026-10-26", "2026-10-30")).toEqual([]);
  });

  it("Me und Übersicht: Fächer, Klassen, Klassenlehrperson", async () => {
    const me = (await q.getMe(db, DEMO_USERS.teacher, NOW))!;
    expect(me).toMatchObject({ role: "teacher", classCode: "", teaches: [{ classCode: "IM24b", subject: "MA", subjectName: "Mathematik" }], classTeacherOf: ["IM24b"] });
    expect(me.counts.contingentSize).toBe(0);
    const h = await q.getTeacherHome(db, DEMO_USERS.teacher, NOW);
    expect(h.classes).toEqual([{ code: "IM24b", program: expect.any(String), subjects: [{ code: "MA", name: "Mathematik", short: expect.any(String) }], students: 2, classTeacher: true }]);
    expect(h.lessons.every((l) => l.subject?.code === "MA")).toBe(true);
    // Mitteilungen der eigenen Klassen wie bei den Lernenden der Klasse
    expect((await q.getNews(db, DEMO_USERS.teacher)).map((n) => n.id)).toEqual((await q.getNews(db, DEMO_USERS.selin)).map((n) => n.id));
  });

  it("Klassenlehrperson ohne eigenes Fach erscheint trotzdem", async () => {
    await a.adminSetAssignments(db, DEMO_USERS.teacher, []);
    const h = await q.getTeacherHome(db, DEMO_USERS.teacher, NOW);
    expect(h.classes).toMatchObject([{ code: "IM24b", subjects: [], classTeacher: true }]);
  });
});
