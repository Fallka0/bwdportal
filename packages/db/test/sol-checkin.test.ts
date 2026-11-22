import { beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../src/client";
import * as a from "../src/admin";
import * as c from "../src/sol-checkin";
import { DEMO_USERS } from "../src/seed/build";
import { NOW, testDb } from "./helpers";

let db: Db;
beforeEach(async () => {
  db = await testDb();
});

const { selin, mia, teacher } = DEMO_USERS;
const FRIDAY = { date: "2026-10-30", time: "08:05", stamp: "2026-10-30T08:05" };
const T0 = 1_000_000;

describe("SOL-Check-in", () => {
  it("Kein SOL-Tag: kein Code, nächster SOL-Tag", async () => {
    const b = await c.checkinBoard(db, teacher, "IM24b", NOW, T0);
    expect(b).toMatchObject({ day: null, code: null, nextDay: "2026-10-30" });
  });

  it("Scan: erst Check-in, dann Check-out, dann fertig; Tafel zeigt den Stand", async () => {
    const b = await c.checkinBoard(db, teacher, "IM24b", FRIDAY, T0);
    expect(b.day?.date).toBe("2026-10-30");
    expect(b.code).toMatch(/^[0-9a-f]{24}$/);
    expect(await c.checkinInfo(db, mia, b.code!, T0 + 1000)).toMatchObject({ valid: true, classCode: "IM24b", next: "in" });
    expect(await c.redeemCheckin(db, mia, b.code!, FRIDAY, T0 + 1000)).toMatchObject({ next: "out", checkIn: "08:05" });
    const later = await c.checkinBoard(db, teacher, "IM24b", { ...FRIDAY, time: "15:50", stamp: "2026-10-30T15:50" }, T0 + 60_000);
    expect(later.students.find((x) => x.id === mia)).toMatchObject({ checkIn: "08:05", checkOut: null });
    expect(await c.redeemCheckin(db, mia, later.code!, { ...FRIDAY, time: "15:50" }, T0 + 61_000)).toMatchObject({ next: "done", checkOut: "15:50" });
    await expect(c.redeemCheckin(db, mia, later.code!, FRIDAY, T0 + 62_000)).rejects.toThrow("schon ein- und ausgecheckt");
  });

  it("Abgelaufen, fremde Klasse oder Lehrperson: ungültig", async () => {
    const b = await c.checkinBoard(db, teacher, "IM24b", FRIDAY, T0);
    await expect(c.redeemCheckin(db, selin, b.code!, FRIDAY, T0 + c.CHECKIN_TTL_MS + 1)).rejects.toThrow("abgelaufen");
    expect((await c.checkinInfo(db, teacher, b.code!, T0)).valid).toBe(false);
    await a.adminCreateClass(db, { code: "IM25a", program: null });
    await a.adminUpdatePerson(db, selin, { classCode: "IM25a" });
    expect((await c.checkinInfo(db, selin, b.code!, T0)).valid).toBe(false);
    await expect(c.checkinBoard(db, selin, "IM24b", FRIDAY, T0)).rejects.toThrow("Nur für Lehrpersonen");
  });
});
