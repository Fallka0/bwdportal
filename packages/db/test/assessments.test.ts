import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import type { Db } from "../src/client";
import * as a from "../src/admin";
import * as g from "../src/assessments";
import * as q from "../src/queries";
import * as schema from "../src/schema";
import { DEMO_USERS } from "../src/seed/build";
import { NOW, testDb } from "./helpers";

let db: Db;
beforeEach(async () => {
  db = await testDb();
});

const { selin, mia, teacher } = DEMO_USERS;
const probe = { classCode: "IM24b", subject: "MA", title: "Vektoren", date: "2026-10-20", weight: 1 };

describe("Noten der Lehrperson", () => {
  it("Probe erfassen und benoten: zählt bei den Lernenden, eigene Einträge zählen nicht mehr", async () => {
    const before = await q.getPortfolioSemester(db, selin, NOW);
    expect(before.subjects.find((x) => x.code === "MA")).toMatchObject({ grade: 4.5, count: 3 });

    const p = await g.createAssessment(db, teacher, probe, NOW);
    expect(p).toMatchObject({ semester: 5, subject: { code: "MA", name: "Mathematik" }, mine: true, graded: 0 });
    const sheet = await g.saveAssessmentGrades(db, teacher, p.id, { grades: [{ userId: selin, value: 6 }, { userId: mia, value: 4 }] }, NOW);
    expect(sheet.students.map((x) => [x.name, x.value])).toEqual([
      ["Selin Hofer", 6],
      ["Mia Steiner", 4],
    ]);

    const after = await q.getPortfolioSemester(db, selin, NOW);
    expect(after.subjects.find((x) => x.code === "MA")).toMatchObject({ grade: 6, count: 4 });
    const detail = (await q.getPortfolioSubject(db, selin, NOW, "MA"))!;
    expect(detail.grade).toBe(6);
    expect(detail.teacher).toBe("Regula Keller");
    expect(detail.entries.filter((e) => e.source === "teacher").map((e) => [e.title, e.counts])).toEqual([["Vektoren", true]]);
    expect(detail.entries.filter((e) => e.source === "own").every((e) => !e.counts)).toBe(true);
    // Andere Fächer unverändert
    expect(after.subjects.find((x) => x.code === "D")).toMatchObject({ grade: 5 });
    const recent = await q.recentGrades(db, selin, 10);
    expect(recent.find((r) => r.title === "Vektoren")).toMatchObject({ subjectCode: "MA", value: 6 });
    // Nicht zählende eigene Einträge erscheinen nicht unter den neuen Noten
    expect(recent.filter((r) => r.subjectCode === "MA").map((r) => r.title)).toEqual(["Vektoren"]);
    // Mia hatte keine eigenen Noten
    expect((await q.getPortfolioSemester(db, mia, NOW)).subjects).toMatchObject([{ code: "MA", grade: 4, count: 1 }]);

    const notes = await db.select().from(schema.notifications).where(eq(schema.notifications.userId, mia));
    expect(notes.find((n) => n.title === "Neue Note in Mathematik")).toMatchObject({ body: "Vektoren", href: "/noten/MA?semester=5" });

    await g.deleteAssessment(db, teacher, p.id);
    expect((await q.getPortfolioSemester(db, selin, NOW)).subjects.find((x) => x.code === "MA")).toMatchObject({ grade: 4.5, count: 3 });
  });

  it("Notenbuch: Zeugnisnote auf 0.5 aus gewichteten Proben, leer = keine Note", async () => {
    const p1 = await g.createAssessment(db, teacher, probe, NOW);
    const p2 = await g.createAssessment(db, teacher, { ...probe, title: "Matrizen", date: "2026-10-23", weight: 2 }, NOW);
    await g.saveAssessmentGrades(db, teacher, p1.id, { grades: [{ userId: selin, value: 4 }, { userId: mia, value: 5 }] }, NOW);
    await g.saveAssessmentGrades(db, teacher, p2.id, { grades: [{ userId: selin, value: 5.5 }, { userId: mia, value: null }] }, NOW);
    const book = await g.getGradebook(db, teacher, "im24b", "MA", NOW);
    expect(book).toMatchObject({ classCode: "IM24b", semester: 5, editable: true });
    expect(book.assessments.map((x) => [x.title, x.graded])).toEqual([
      ["Vektoren", 2],
      ["Matrizen", 1],
    ]);
    expect(book.students.map((x) => [x.name, x.values, x.grade])).toEqual([
      ["Selin Hofer", [4, 5.5], 5],
      ["Mia Steiner", [5, null], 5],
    ]);
  });

  it("Rechte und Prüfungen der Eingabe", async () => {
    await expect(g.createAssessment(db, teacher, { ...probe, subject: "DE" }, NOW)).rejects.toThrow("nicht zugeteilt");
    await expect(g.createAssessment(db, teacher, { ...probe, subject: "IN" }, NOW)).rejects.toThrow("gibb");
    await expect(g.createAssessment(db, teacher, { ...probe, date: "2023-05-01" }, NOW)).rejects.toThrow("ausserhalb");
    await expect(g.getGradebook(db, selin, "IM24b", "MA", NOW)).rejects.toThrow("Nur für Lehrpersonen");
    const p = await g.createAssessment(db, teacher, probe, NOW);
    await expect(g.saveAssessmentGrades(db, teacher, p.id, { grades: [{ userId: "u-x", value: 5 }] }, NOW)).rejects.toThrow("nicht in der Klasse");

    // Zweite Lehrperson im selben Fach: sieht, ändert nicht
    await a.adminUpdatePerson(db, mia, { role: "teacher" });
    await a.adminSetAssignments(db, mia, [{ classCode: "IM24b", subject: "MA" }]);
    expect((await g.getAssessment(db, mia, p.id, NOW)).editable).toBe(false);
    await expect(g.deleteAssessment(db, mia, p.id)).rejects.toThrow("Nur wer");

    // Klassenlehrperson ohne Fach: Notenbuch ansehen, nicht bearbeiten
    await a.adminSetAssignments(db, teacher, [{ classCode: "IM24b", subject: "WR" }]);
    const book = await g.getGradebook(db, teacher, "IM24b", "MA", NOW);
    expect(book.editable).toBe(false);
    await expect(g.createAssessment(db, teacher, probe, NOW)).rejects.toThrow("nicht zugeteilt");
    expect((await g.gradebookSubjects(db, teacher, "IM24b")).map((x) => [x.subject.code, x.edit, x.count])).toEqual([
      ["MA", false, 1],
      ["WR", true, 0],
    ]);
  });

  it("Deutsch: DE aus dem Stundenplan und D aus der Vorlage sind dasselbe Fach", async () => {
    await a.adminSetAssignments(db, teacher, [{ classCode: "IM24b", subject: "DE" }]);
    const p = await g.createAssessment(db, teacher, { ...probe, subject: "DE", title: "Erörterung" }, NOW);
    expect(p.subject).toMatchObject({ code: "D", name: "Deutsch" });
    await g.saveAssessmentGrades(db, teacher, p.id, { grades: [{ userId: selin, value: 3.5 }] }, NOW);
    expect((await q.getPortfolioSemester(db, selin, NOW)).subjects.find((x) => x.code === "D")).toMatchObject({ grade: 3.5, count: 4 });
  });
});
