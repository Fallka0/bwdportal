import { beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../src/client";
import * as a from "../src/admin";
import { DEMO_USERS } from "../src/seed/build";
import { testDb } from "./helpers";

let db: Db;
beforeEach(async () => {
  db = await testDb();
});

describe("Verwaltung (admin.planary.ch)", () => {
  it("Konten suchen, nach Rolle und Klasse", async () => {
    const all = await a.adminPeople(db);
    expect(all.map((p) => p.name)).toContain("Selin Hofer");
    expect((await a.adminPeople(db, { q: "hofer" })).map((p) => p.id)).toEqual([DEMO_USERS.selin]);
    expect((await a.adminPeople(db, { role: "teacher" })).map((p) => p.id)).toEqual([DEMO_USERS.teacher]);
    expect((await a.adminPeople(db, { classCode: "IM24b" })).length).toBe(2);
  });

  it("Lehrperson: Rolle, Zuteilungen, Klassenlehrperson; zurück zu student räumt auf", async () => {
    const t = await a.adminUpdatePerson(db, DEMO_USERS.mia, { role: "teacher" });
    expect(t).toMatchObject({ role: "teacher", classCode: null });
    await a.adminCreateClass(db, { code: "IM25a", program: "Informatikmittelschule" });
    const withA = await a.adminSetAssignments(db, t.id, [
      { classCode: "IM24b", subject: "MA" },
      { classCode: "IM25a", subject: "MA" },
      { classCode: "IM25a", subject: "MA" },
    ]);
    expect(withA.assignments).toEqual([
      { classCode: "IM24b", subject: "MA" },
      { classCode: "IM25a", subject: "MA" },
    ]);
    const c = await a.adminUpdateClass(db, "IM25a", { classTeacherId: t.id });
    expect(c).toMatchObject({ code: "IM25a", classTeacher: { id: t.id }, teachers: 1, students: 0 });
    expect((await a.adminPerson(db, t.id)).classTeacherOf).toEqual(["IM25a"]);
    const back = await a.adminUpdatePerson(db, t.id, { role: "student" });
    expect(back).toMatchObject({ role: "student", assignments: [], classTeacherOf: [] });
  });

  it("prüft Eingaben", async () => {
    await expect(a.adminUpdatePerson(db, DEMO_USERS.selin, { role: "admin" })).rejects.toThrow("Rolle");
    await expect(a.adminSetAssignments(db, DEMO_USERS.selin, [])).rejects.toThrow("Nur Lehrpersonen");
    await expect(a.adminCreateClass(db, { code: "IM24b" })).rejects.toThrow("gibt es schon");
    await expect(a.adminCreateClass(db, { code: "Klasse 1" })).rejects.toThrow("Kürzel");
    await expect(a.adminUpdateClass(db, "IM24b", { classTeacherId: DEMO_USERS.selin })).rejects.toThrow("Lehrperson");
    await expect(a.adminUpdatePerson(db, DEMO_USERS.selin, { classCode: "XX99" })).rejects.toThrow("gibt es nicht");
  });

  it("Klassen und Fächer", async () => {
    expect((await a.adminClasses(db)).map((c) => [c.code, c.students])).toEqual([["IM24b", 2]]);
    const subj = await a.adminSubjects(db);
    expect(subj.find((x) => x.name === "Informatik")).toBeTruthy();
    expect(subj.filter((x) => x.name === "Deutsch")).toHaveLength(1);
    expect(subj.some((x) => x.code === "SOL")).toBe(false);
  });
});
