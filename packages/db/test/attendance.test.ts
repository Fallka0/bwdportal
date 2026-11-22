import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import type { Db } from "../src/client";
import * as a from "../src/admin";
import * as p from "../src/attendance";
import * as q from "../src/queries";
import * as schema from "../src/schema";
import { DEMO_USERS } from "../src/seed/build";
import { NOW, testDb } from "./helpers";

let db: Db;
beforeEach(async () => {
  db = await testDb();
});

const { selin, mia, teacher } = DEMO_USERS;
const mondayMath = async () => (await p.attendanceSlots(db, teacher, "2026-10-26", "2026-10-26"))[0]!;

describe("Präsenz", () => {
  it("Doppellektion ist eine Kontrolle, zuerst offen", async () => {
    const slots = await p.attendanceSlots(db, teacher, "2026-10-26", "2026-10-30");
    expect(slots.length).toBeGreaterThan(0);
    expect(slots.every((x) => x.subject.code === "MA" && x.classCode === "IM24b" && x.checked === null)).toBe(true);
    const mon = await mondayMath();
    expect(mon).toMatchObject({ date: "2026-10-26", start: "08:00", periods: [1, 2] });
  });

  it("Fehlende erfassen: Absenz für die Lernenden, Benachrichtigung, wieder anwesend räumt auf", async () => {
    const slot = await mondayMath();
    const sheet = await p.getAttendanceSheet(db, teacher, slot.id, NOW);
    expect(sheet.students.map((x) => x.name)).toEqual(["Selin Hofer", "Mia Steiner"]);
    expect(sheet.editable).toBe(true);

    const saved = await p.saveAttendance(db, teacher, slot.id, [mia], NOW);
    expect(saved.students.find((x) => x.id === mia)?.absent).toBe(true);
    expect(saved.slot.checked).toEqual({ at: NOW.stamp, absent: 1 });
    const abs = await q.getAbsences(db, mia, NOW);
    expect(abs.items[0]).toMatchObject({ date: "2026-10-26" });
    expect(abs.items[0]!.lessons.map((l) => [l.period, l.subjectCode])).toEqual([
      [1, "MA"],
      [2, "MA"],
    ]);
    const notes = await db.select().from(schema.notifications).where(eq(schema.notifications.userId, mia));
    expect(notes.find((n) => n.title === "Absenz erfasst: Mathematik")).toMatchObject({ href: "/absenzen" });
    expect((await mondayMath()).checked?.absent).toBe(1);

    // Nochmals speichern: keine zweite Benachrichtigung
    await p.saveAttendance(db, teacher, slot.id, [mia], NOW);
    expect((await db.select().from(schema.notifications).where(eq(schema.notifications.userId, mia))).filter((n) => n.title.startsWith("Absenz erfasst"))).toHaveLength(1);

    await p.saveAttendance(db, teacher, slot.id, [], NOW);
    expect((await q.getAbsences(db, mia, NOW)).items).toHaveLength(0);
    expect((await mondayMath()).checked?.absent).toBe(0);
  });

  it("Abmeldung wird angezeigt", async () => {
    await db.insert(schema.absenceNotices).values({ id: "an-x", userId: mia, date: "2026-10-26", fromPeriod: 2, toPeriod: 4, note: null, createdAt: "2026-10-25T20:00" });
    const sheet = await p.getAttendanceSheet(db, teacher, (await mondayMath()).id, NOW);
    expect(sheet.students.find((x) => x.id === mia)?.notice).toBe(true);
    expect(sheet.students.find((x) => x.id === selin)?.notice).toBe(false);
  });

  it("Rechte: nur Lehrpersonen mit Fach oder Klassenlehrperson, nicht in der Zukunft", async () => {
    const slot = await mondayMath();
    await expect(p.getAttendanceSheet(db, selin, slot.id, NOW)).rejects.toThrow("Nur für Lehrpersonen");
    await expect(p.saveAttendance(db, teacher, slot.id, ["u-unbekannt"], NOW)).rejects.toThrow("nicht in der Klasse");
    const thursday = (await p.attendanceSlots(db, teacher, "2026-10-29", "2026-10-29"))[0]!;
    await expect(p.saveAttendance(db, teacher, thursday.id, [], NOW)).rejects.toThrow("erst ab dem Tag");

    // Andere Lehrperson ohne Fach: nein; als Klassenlehrperson: ja
    await a.adminUpdatePerson(db, mia, { role: "teacher" });
    await a.adminSetAssignments(db, mia, [{ classCode: "IM24b", subject: "DE" }]);
    await expect(p.getAttendanceSheet(db, mia, slot.id, NOW)).rejects.toThrow("nicht zugeteilt");
    await a.adminUpdateClass(db, "IM24b", { classTeacherId: mia });
    expect((await p.getAttendanceSheet(db, mia, slot.id, NOW)).students.map((x) => x.name)).toEqual(["Selin Hofer"]);
  });

  it("Klasse: Absenzen nur für die Klassenlehrperson", async () => {
    const own = await p.getClassView(db, teacher, "im24b", NOW);
    expect(own).toMatchObject({ code: "IM24b", classTeacher: true });
    expect(own.students.find((x) => x.id === selin)?.absences?.missed).toBeGreaterThan(0);
    await a.adminUpdateClass(db, "IM24b", { classTeacherId: null });
    const other = await p.getClassView(db, teacher, "IM24b", NOW);
    expect(other.classTeacher).toBe(false);
    expect(other.students.every((x) => x.absences === null)).toBe(true);
    await expect(p.getClassView(db, teacher, "IM99z", NOW)).rejects.toThrow("nicht zugeteilt");
  });

  it("Übersicht der Lehrperson zeigt die heutige Präsenz", async () => {
    const h = await q.getTeacherHome(db, teacher, NOW);
    expect(h.attendance.map((x) => x.periods)).toEqual([[1, 2]]);
  });
});
