import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import type { Db } from "../src/client";
import * as a from "../src/admin";
import * as q from "../src/queries";
import * as schema from "../src/schema";
import { DEMO_USERS } from "../src/seed/build";
import * as t from "../src/sol-teacher";
import { NOW, testDb } from "./helpers";

let db: Db;
beforeEach(async () => {
  db = await testDb();
});

const { selin, mia, teacher } = DEMO_USERS;

describe("SOL für Lehrpersonen", () => {
  it("Übersicht: Klassenlehrperson sieht alle Fächer, bearbeitet nur zugeteilte; Stand der Lernenden", async () => {
    const o = await t.getSolOverview(db, teacher, "IM24b", NOW);
    expect(o.block).not.toBeNull();
    expect(o.students.map((x) => x.name)).toEqual(["Selin Hofer", "Mia Steiner"]);
    expect(o.groups.length).toBeGreaterThan(1);
    expect(o.groups.filter((g) => g.editable).map((g) => g.subject.code)).toEqual(["MA"]);
    // Gleicher Stand wie in der Ansicht der Lernenden
    const mine = await q.getSolTasks(db, selin, NOW);
    const ma = mine.groups.find((g) => g.subject.code === "MA")!.tasks[0]!;
    const row = o.groups.find((g) => g.subject.code === "MA")!.tasks.find((x) => x.id === ma.id)!;
    expect(o.status[ma.id]?.[selin] ?? "open").toBe(ma.status);
    expect(row.counts.open + row.counts.started + row.counts.done).toBe(2);
  });

  it("Ohne Klassenlehrperson: nur zugeteilte Fächer", async () => {
    await a.adminUpdateClass(db, "IM24b", { classTeacherId: null });
    const o = await t.getSolOverview(db, teacher, "IM24b", NOW);
    expect(o.groups.map((g) => g.subject.code)).toEqual(["MA"]);
  });

  it("Auftrag anlegen, ändern, Dateien, löschen räumt Stand und Plan auf", async () => {
    const o = await t.getSolOverview(db, teacher, "IM24b", NOW);
    const block = o.block!.n;
    await expect(t.createSolTask(db, teacher, { classCode: "IM24b", block, subject: "DE", code: "X1", title: "x", minutes: 30 })).rejects.toThrow("nicht zugeteilt");
    const { id } = await t.createSolTask(db, teacher, { classCode: "IM24b", block, subject: "MA", code: "M9", title: "Wahrscheinlichkeit", minutes: 45, sharepointUrl: null });
    await expect(t.createSolTask(db, teacher, { classCode: "IM24b", block, subject: "MA", code: "m9", title: "y", minutes: 45 })).rejects.toThrow("Kürzel");
    await t.updateSolTask(db, teacher, id, { code: "M9", title: "Wahrscheinlichkeit 2", minutes: 60, sharepointUrl: null });
    // Lernende sehen ihn sofort
    const theirs = (await q.getSolTasks(db, selin, NOW, block)).groups.find((g) => g.subject.code === "MA")!.tasks.find((x) => x.id === id)!;
    expect(theirs).toMatchObject({ title: "Wahrscheinlichkeit 2", minutes: 60, status: "open" });

    const f = await t.addSolTaskFile(db, teacher, id, { kind: "solution", name: "Lösungen M9.pdf", ext: "pdf", key: "sol/x/1.pdf", bytes: 100 });
    expect((await t.getSolOverview(db, teacher, "IM24b", NOW)).groups.find((g) => g.subject.code === "MA")!.tasks.find((x) => x.id === id)!.files).toMatchObject([{ id: f.id, kind: "solution" }]);
    await q.setSolStatus(db, mia, id, "done");
    expect((await t.getSolOverview(db, teacher, "IM24b", NOW)).groups.find((g) => g.subject.code === "MA")!.tasks.find((x) => x.id === id)!.counts).toEqual({ open: 1, started: 0, done: 1 });

    expect(await t.deleteSolTask(db, teacher, id)).toEqual(["sol/x/1.pdf"]);
    expect(await db.select().from(schema.solProgress).where(eq(schema.solProgress.taskId, id))).toEqual([]);
  });

  it("Rechte: Lernende und fremde Klassen", async () => {
    await expect(t.getSolOverview(db, selin, "IM24b", NOW)).rejects.toThrow("Nur für Lehrpersonen");
    await expect(t.getSolOverview(db, teacher, "IM99z", NOW)).rejects.toThrow("gibt es nicht");
    const de = (await t.getSolOverview(db, teacher, "IM24b", NOW)).groups.find((g) => !g.editable)!.tasks[0]!;
    await expect(t.deleteSolTask(db, teacher, de.id)).rejects.toThrow("nicht zugeteilt");
  });

  it("Lesen nur in der eigenen Klasse: Lernende, zugeteilte Lehrperson, sonst null", async () => {
    const taskId = (await q.getSolTasks(db, selin, NOW)).groups[0]!.tasks[0]!.id;
    expect((await t.readableSolTask(db, selin, taskId))?.id).toBe(taskId);
    expect((await t.readableSolTask(db, teacher, taskId))?.id).toBe(taskId);
    await db.insert(schema.classes).values({ id: "c-other", code: "IM25a", program: "IM" });
    await db.insert(schema.users).values([
      { id: "u-out", email: "out@example.test", firstName: "Out", lastName: "Side", classId: "c-other", role: "student" },
      { id: "u-t2", email: "t2@example.test", firstName: "Zweite", lastName: "Lehrperson", role: "teacher" },
    ]);
    await db.insert(schema.teacherAssignments).values({ userId: "u-t2", classId: "c-other", subjectCode: "MA" });
    expect(await t.readableSolTask(db, "u-out", taskId)).toBeNull();
    expect(await t.readableSolTask(db, "u-t2", taskId)).toBeNull();
    expect(await t.readableSolTask(db, selin, "t-gibtsnicht")).toBeNull();
    await a.adminUpdateClass(db, "IM24b", { classTeacherId: null });
    await db.delete(schema.teacherAssignments).where(eq(schema.teacherAssignments.userId, teacher));
    expect(await t.readableSolTask(db, teacher, taskId)).toBeNull();
  });
});
