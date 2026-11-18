import { fmtGrade } from "@bwd/shared";
import { beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../src/client";
import * as q from "../src/queries";
import { DEMO_USERS } from "../src/seed/build";
import { NOW, testDb } from "./helpers";

const U = DEMO_USERS.selin;
let db: Db;
beforeEach(async () => {
  db = await testDb();
});

describe("Konto", () => {
  it("Selin Hofer, IM24b, Zähler wie im Design", async () => {
    const me = await q.getMe(db, U);
    expect(me?.name).toBe("Selin Hofer");
    expect(me?.initials).toBe("SH");
    expect(me?.classCode).toBe("IM24b");
    expect(me?.classTeacher).toBe("R. Keller");
    expect(me?.counts).toEqual({ unreadNotifications: 3, openAbsences: 2, unreadNews: 2 });
  });

  it("Demo-Konten: Selin und Mia von der bwd", async () => {
    const acc = await q.demoAccounts(db);
    expect(acc.map((a) => a.name)).toEqual(["Selin Hofer", "Mia Steiner"]);
    expect(acc.every((a) => a.school)).toBe(true);
  });

  it("Session anlegen, lesen, ablaufen, löschen", async () => {
    const s = await q.createSession(db, U, NOW, 1);
    expect(await q.sessionUser(db, s.id, NOW)).toBe(U);
    expect(await q.sessionUser(db, s.id, { date: "2026-10-28", time: "10:20", stamp: "2026-10-28T10:20" })).toBeNull();
    const s2 = await q.createSession(db, U, NOW);
    await q.deleteSession(db, s2.id);
    expect(await q.sessionUser(db, s2.id, NOW)).toBeNull();
  });
});

describe("Stundenplan", () => {
  it("Montag 26.10.: 7 Lektionen, Raumänderung W&R, Deutsch entfällt", async () => {
    const t = await q.getTimetable(db, U, "2026-10-26", "2026-10-26", NOW);
    expect(t.lessons).toHaveLength(7);
    const wr = t.lessons.filter((l) => l.subject?.code === "WR");
    expect(wr.map((l) => [l.state, l.room, l.originalRoom])).toEqual([
      ["room_changed", "B 015", "A 207"],
      ["room_changed", "B 015", "A 207"],
    ]);
    expect(t.lessons.find((l) => l.subject?.code === "DE")?.state).toBe("cancelled");
    expect(t.source.stale).toBe(false);
  });

  it("andere Wochen ohne Sonderfälle, Freitag ist SOL-Tag", async () => {
    const t = await q.getTimetable(db, U, "2026-11-02", "2026-11-06", NOW);
    expect(t.lessons.some((l) => l.state === "room_changed" || l.state === "cancelled")).toBe(false);
    expect(t.lessons.filter((l) => l.date === "2026-11-06").every((l) => l.state === "sol")).toBe(true);
  });

  it("Als Nächstes um 10:20: Wirtschaft und Recht 10:45 in B 015", async () => {
    const h = await q.getHome(db, U, NOW);
    expect(h.next?.subject?.name).toBe("Wirtschaft und Recht");
    expect(h.next?.start).toBe("10:45");
    expect(h.next?.room).toBe("B 015");
    expect(h.next?.teacher?.name).toBe("T. Brunner");
  });
});

describe("Noten", () => {
  it("Kennzahlen 4.9, 25 Prüfungen, 1 ungenügend", async () => {
    const g = await q.getGrades(db, U, 1);
    expect(fmtGrade(g.average!)).toBe("4.9");
    expect(g.examCount).toBe(25);
    expect(g.insufficient).toBe(1);
  });

  it("Fächer mit Schnitt in der Reihenfolge des Designs", async () => {
    const g = await q.getGrades(db, U, 1);
    expect(g.subjects.map((s) => [s.code, fmtGrade(s.average!), s.examCount, s.teacher])).toEqual([
      ["IN", "5.6", 4, "B. Schneider"],
      ["EN", "5.4", 3, "J. Moret"],
      ["DE", "5.2", 3, "C. Mäder"],
      ["GP", "5.1", 2, "L. Weber"],
      ["FRW", "5.0", 3, "T. Brunner"],
      ["WR", "4.8", 3, "T. Brunner"],
      ["MA", "4.6", 3, "R. Keller"],
      ["FR", "4.3", 2, "A. Dupont"],
      ["NW", "3.8", 2, "S. Graf"],
    ]);
  });

  it("2. Semester ist leer", async () => {
    const g = await q.getGrades(db, U, 2);
    expect(g.subjects).toEqual([]);
    expect(g.average).toBeNull();
  });

  it("Mathematik: 3 Prüfungen, Schnitt 4.6, Klasse 4.4", async () => {
    const m = await q.getSubjectGrades(db, U, "MA");
    expect(m?.exams.map((e) => [e.title, e.date, e.value, e.weight, e.classAverage])).toEqual([
      ["Funktionen", "2026-10-20", 4.5, 1, 4.4],
      ["Gleichungssysteme", "2026-09-22", 5, 1, 4.7],
      ["Prozentrechnen", "2026-09-01", 4, 0.5, 4.1],
    ]);
    expect(fmtGrade(m!.average!)).toBe("4.6");
    expect(fmtGrade(m!.classAverage!)).toBe("4.4");
  });

  it("Neue Noten: Englisch 5.5, Mathematik 4.5, Naturwissenschaften 3.5", async () => {
    const r = await q.recentGrades(db, U);
    expect(r.map((x) => [x.subjectName, x.title, x.value])).toEqual([
      ["Englisch", "Unit 4 Test", 5.5],
      ["Mathematik", "Funktionen", 4.5],
      ["Naturwissenschaften", "Zellbiologie", 3.5],
    ]);
  });
});

describe("Absenzen", () => {
  it("2 offen, 1 unentschuldigt, 2 entschuldigt, Fächer und Fristen", async () => {
    const a = await q.getAbsences(db, U);
    expect(a.counts).toEqual({ open: 2, sent: 0, excused: 2, unexcused: 1 });
    expect(a.items.map((x) => [x.date, x.lessons.length, x.subjectsLabel, x.status, x.dueDate])).toEqual([
      ["2026-10-22", 2, "Französisch, Mathematik", "open", "2026-11-05"],
      ["2026-10-19", 1, "Englisch", "open", "2026-11-02"],
      ["2026-10-09", 4, "Vormittag", "excused", "2026-10-23"],
      ["2026-09-29", 1, "Sport", "unexcused", "2026-10-13"],
      ["2026-09-16", 2, "Deutsch", "excused", "2026-09-30"],
    ]);
  });

  it("Entschuldigen setzt In Prüfung und speichert die Lektionen", async () => {
    const r = await q.submitAbsence(db, U, { absenceId: "a-1", periods: [1, 2], reason: "Krankheit" }, NOW);
    expect(r.status).toBe("sent");
    const a = await q.getAbsences(db, U);
    expect(a.counts.open).toBe(1);
    expect(a.counts.sent).toBe(1);
  });

  it("lehnt Lektionen ab, die es an dem Tag nicht gibt", async () => {
    await expect(q.submitAbsence(db, U, { absenceId: "a-1", periods: [8], reason: "Arzt" }, NOW)).rejects.toThrow("keine 8. Lektion");
  });

  it("neue Absenz melden", async () => {
    const r = await q.submitAbsence(db, U, { date: "2026-10-26", periods: [1, 2], reason: "Termin" }, NOW);
    expect(r.subjectsLabel).toBe("Mathematik");
    expect(r.dueDate).toBe("2026-11-09");
  });
});

describe("SOL", () => {
  it("Block 3 mit 6 Fächern, Mathematik zuerst", async () => {
    const t = await q.getSolTasks(db, U, NOW);
    expect(t.block?.n).toBe(3);
    expect(t.blocks.map((b) => b.n)).toEqual([3, 2, 1]);
    expect(t.groups.map((g) => g.subject.code)).toEqual(["MA", "EN", "DE", "FRW", "WR", "FR"]);
    expect(t.groups[0]?.tasks[0]).toMatchObject({ code: "3.01", title: "Repetition Terme II", minutes: 90, percent: 100 });
  });

  it("Kalender zeigt den nächsten SOL-Tag (Freitag, 30. Oktober) mit Plan und Präsenz", async () => {
    const c = await q.getSolCalendar(db, U, NOW);
    expect(c.day?.date).toBe("2026-10-30");
    expect(c.plan).toHaveLength(7);
    expect(c.presence).toHaveLength(8);
  });

  it("Einplanen erscheint im Kalender, Überschneidung wird abgelehnt", async () => {
    await q.addSolPlan(db, U, { solDayId: "sd-2026-10-30", taskId: "t-fr-3.01", start: "16:30", end: "17:00" });
    const c = await q.getSolCalendar(db, U, NOW);
    expect(c.plan.at(-1)).toMatchObject({ subjectCode: "FR", start: "16:30", end: "17:00" });
    await expect(q.addSolPlan(db, U, { solDayId: "sd-2026-10-30", taskId: "t-fr-3.01", start: "16:00", end: "16:40" })).rejects.toThrow("schon ein Auftrag");
  });

  it("Portfolio: zwei Einträge, Eintrag für den nächsten SOL-Tag wird gespeichert", async () => {
    let p = await q.getSolPortfolio(db, U, NOW);
    expect(p.entries.map((e) => e.date)).toEqual(["2026-10-16", "2026-09-18"]);
    expect(p.next).toMatchObject({ date: "2026-10-30", checkIn: null });
    await q.putSolPortfolio(db, U, "sd-2026-10-30", "Mathe 3.02 und 3.03 am Morgen.", "", NOW);
    p = await q.getSolPortfolio(db, U, NOW);
    expect(p.entries[0]).toMatchObject({ date: "2026-10-30", checkIn: "Mathe 3.02 und 3.03 am Morgen.", checkOut: null });
  });
});

describe("Infos", () => {
  it("Mitteilungen: angeheftete zuerst, zwei ungelesen; Lesen markiert", async () => {
    const n = await q.getNews(db, U);
    expect(n[0]).toMatchObject({ id: "pp", pinned: true, unread: true });
    expect(n.filter((x) => x.unread)).toHaveLength(2);
    const a = await q.getNewsArticle(db, U, "pp", NOW);
    expect(a?.document?.title).toBe("Prüfungsplan 1. Semester 2026/27");
    expect((await q.getNews(db, U)).filter((x) => x.unread)).toHaveLength(1);
  });

  it("Dokumente: 10 in 4 Gruppen, Suche ohne Treffer", async () => {
    const d = await q.getDocuments(db, NOW);
    expect(d.total).toBe(10);
    expect(d.groups.map((g) => [g.name, g.total])).toEqual([
      ["Prüfungspläne", 2],
      ["Formulare", 3],
      ["Reglemente", 3],
      ["Merkblätter", 2],
    ]);
    expect(d.groups[0]?.items[0]?.isNew).toBe(true);
    const none = await q.getDocuments(db, NOW, "Zeugnis xyz");
    expect(none.groups.every((g) => g.items.length === 0)).toBe(true);
    const f = await q.getDocuments(db, NOW, "", "Formulare");
    expect(f.groups.flatMap((g) => g.items)).toHaveLength(3);
  });

  it("Links aus der Konfiguration", async () => {
    const l = await q.getLinks(db);
    expect(l.map((x) => x.group)).toEqual(["Microsoft 365", "Microsoft 365", "Microsoft 365", "Microsoft 365", "Lernen", "Schule", "Schule", "Schule"]);
    expect(l.find((x) => x.title === "Moodle")?.url).toBe("https://moodle.bwdbern.ch/");
  });

  it("Benachrichtigungen: 3 ungelesen, alle als gelesen markieren", async () => {
    expect((await q.getNotifications(db, U)).filter((n) => n.unread)).toHaveLength(3);
    await q.markNotificationsRead(db, U, NOW);
    expect((await q.getNotifications(db, U)).filter((n) => n.unread)).toHaveLength(0);
  });

  it("Einstellungen speichern", async () => {
    const s = await q.updateSettings(db, U, { theme: "dark", nEmail: true });
    expect(s).toMatchObject({ theme: "dark", nEmail: true, nGrades: true });
  });
});

describe("Leeres Konto (Mia Steiner)", () => {
  it("hat Stundenplan, aber keine Noten und Absenzen", async () => {
    const m = DEMO_USERS.mia;
    expect((await q.getTimetable(db, m, "2026-10-26", "2026-10-26", NOW)).lessons).toHaveLength(7);
    expect((await q.getGrades(db, m, 1)).subjects).toEqual([]);
    expect((await q.getAbsences(db, m)).items).toEqual([]);
    expect((await q.getSolPortfolio(db, m, NOW)).entries).toEqual([]);
  });
});

describe("Suche", () => {
  it("findet Fach, Dokument, Link und Mitteilung", async () => {
    const r = await q.search(db, U, NOW, "prüfungsplan");
    expect(r.documents.map((d) => d.title)).toContain("Prüfungsplan 1. Semester 2026/27");
    expect(r.news.map((n) => n.id)).toContain("pp");
    expect((await q.search(db, U, NOW, "Mathe")).subjects.map((s) => s.code)).toEqual(["MA"]);
    expect((await q.search(db, U, NOW, "moodle")).links.map((l) => l.title)).toEqual(["Moodle"]);
    expect((await q.search(db, U, NOW, "x")).documents).toEqual([]);
  });
});
