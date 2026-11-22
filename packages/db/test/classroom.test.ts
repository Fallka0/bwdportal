import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import type { Db } from "../src/client";
import * as a from "../src/admin";
import * as c from "../src/classroom";
import * as schema from "../src/schema";
import { DEMO_USERS } from "../src/seed/build";
import { NOW, testDb } from "./helpers";

let db: Db;
beforeEach(async () => {
  db = await testDb();
});

const { selin, mia, teacher } = DEMO_USERS;
const file = (subject: string | null) => ({ classCode: "IM24b", subject, name: "Aufgaben Kapitel 4.pdf", ext: "pdf", mime: "application/pdf", bytes: 1200, r2Key: `klassenraum/x/${Math.random()}.pdf` });

describe("Klassenraum", () => {
  it("Lehrperson schreibt mit Datei, Lernende lesen und werden benachrichtigt", async () => {
    const f = await c.addClassFile(db, teacher, file("MA"), NOW);
    const p = await c.createClassPost(db, teacher, { classCode: "IM24b", subject: "MA", body: "Bitte bis Donnerstag lösen.\nSeite 12 bis 14.", fileIds: [f.id] }, NOW);
    expect(p).toMatchObject({ author: "Regula Keller", subject: { code: "MA" }, mine: true, files: [{ name: "Aufgaben Kapitel 4.pdf" }] });

    const room = await c.getClassroom(db, selin, null);
    expect(room.classCode).toBe("IM24b");
    expect(room.canPostFor).toEqual([]);
    expect(room.posts.map((x) => [x.body.split("\n")[0], x.mine, x.canDelete])).toEqual([["Bitte bis Donnerstag lösen.", false, false]]);
    expect(room.files).toEqual([]);
    expect(room.subjects.map((x) => x.code)).toEqual(["MA"]);

    const notes = await db.select().from(schema.notifications).where(eq(schema.notifications.userId, mia));
    expect(notes.find((n) => n.title === "Klassenraum: Mathematik")).toMatchObject({ body: "Bitte bis Donnerstag lösen.", href: "/klassenraum" });

    expect(await c.classFileForDownload(db, selin, f.id)).toMatchObject({ name: "Aufgaben Kapitel 4.pdf" });
  });

  it("Rechte: Lernende schreiben nicht, Fächer nur zugeteilt, ganze Klasse nur Klassenlehrperson", async () => {
    await expect(c.createClassPost(db, selin, { classCode: "IM24b", subject: "MA", body: "x", fileIds: [] }, NOW)).rejects.toThrow("Nur Lehrpersonen");
    await a.adminUpdatePerson(db, mia, { role: "teacher" });
    await a.adminSetAssignments(db, mia, [{ classCode: "IM24b", subject: "DE" }]);
    await expect(c.createClassPost(db, mia, { classCode: "IM24b", subject: "MA", body: "x", fileIds: [] }, NOW)).rejects.toThrow("nicht zugeteilt");
    await expect(c.createClassPost(db, mia, { classCode: "IM24b", subject: null, body: "x", fileIds: [] }, NOW)).rejects.toThrow("Klassenlehrperson");
    const p = await c.createClassPost(db, mia, { classCode: "IM24b", subject: "DE", body: "Lektüre mitbringen", fileIds: [] }, NOW);
    // Klassenlehrperson (Regula) darf an alle schreiben und fremde Beiträge löschen, aber nicht ändern
    const room = await c.getClassroom(db, teacher, "IM24b");
    expect(room.canPostFor.map((x) => x.code)).toEqual([null, "MA", "DE"]);
    expect(room.posts[0]).toMatchObject({ mine: false, canDelete: true });
    await expect(c.updateClassPost(db, teacher, p.id, "neu", NOW)).rejects.toThrow("Nur wer");
    await c.deleteClassPost(db, teacher, p.id);
    // Fremde Klasse
    await expect(c.getClassroom(db, mia, "IM99z")).rejects.toThrow("gibt es nicht");
  });

  it("Dateien: nur eigene anhängen, löschen gibt den Schlüssel zurück, Lehrperson ohne Klasse lädt nicht herunter", async () => {
    const f = await c.addClassFile(db, teacher, file(null), NOW);
    expect((await c.getClassroom(db, selin, null)).files.map((x) => x.id)).toEqual([f.id]);
    await a.adminUpdatePerson(db, mia, { role: "teacher" });
    expect(await c.classFileForDownload(db, mia, f.id)).toBeNull();
    await a.adminSetAssignments(db, mia, [{ classCode: "IM24b", subject: "DE" }]);
    await expect(c.createClassPost(db, mia, { classCode: "IM24b", subject: "DE", body: "x", fileIds: [f.id] }, NOW)).rejects.toThrow("gehört nicht");
    const p = await c.createClassPost(db, teacher, { classCode: "IM24b", subject: "MA", body: "Mit Datei", fileIds: [f.id] }, NOW);
    expect(await c.deleteClassPost(db, teacher, p.id)).toEqual([f.r2Key ?? expect.any(String)]);
    expect((await c.getClassroom(db, selin, null)).files).toEqual([]);
    await c.updateClassPost(db, teacher, (await c.createClassPost(db, teacher, { classCode: "IM24b", subject: "MA", body: "a", fileIds: [] }, NOW)).id, "b", { ...NOW, stamp: "2026-10-26T11:00" });
    expect((await c.getClassroom(db, selin, null)).posts[0]).toMatchObject({ body: "b", edited: true });
  });
});
