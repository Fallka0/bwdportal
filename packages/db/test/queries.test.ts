import { fmtGrade } from "@bwd/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import type { Db } from "../src/client";
import * as q from "../src/queries";
import * as schema from "../src/schema";
import { DEMO_USERS } from "../src/seed/build";
import { NOW, testDb } from "./helpers";

const U = DEMO_USERS.selin;
let db: Db;
beforeEach(async () => {
  db = await testDb();
});

describe("Konto", () => {
  it("Selin Hofer, IM24b, Zähler wie im Design", async () => {
    const me = await q.getMe(db, U, NOW);
    expect(me?.name).toBe("Selin Hofer");
    expect(me?.initials).toBe("SH");
    expect(me?.classCode).toBe("IM24b");
    expect(me?.classTeacher).toBe("R. Keller");
    expect(me?.counts).toEqual({ unreadNotifications: 3, contingentAvailable: 13, contingentSize: 20, unreadNews: 2 });
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

  it("Als Nächstes um 10:20: Wirtschaft und Recht 10:50 in B 015", async () => {
    const h = await q.getHome(db, U, NOW);
    expect(h.next?.subject?.name).toBe("Wirtschaft und Recht");
    expect(h.next?.start).toBe("10:50");
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
  it("Zustand pro Lektion: dispensiert, aufs Kontingent, ohne Abmeldung doppelt", async () => {
    const a = await q.getAbsences(db, U, NOW);
    expect(a.items.map((x) => [x.date, x.lessons.length, x.subjectsLabel, x.status, x.lessons.reduce((n, l) => n + l.weight, 0)])).toEqual([
      ["2026-10-22", 2, "Französisch, Mathematik", "contingent", 2],
      ["2026-10-19", 1, "Englisch", "contingent", 1],
      ["2026-10-09", 4, "Vormittag", "dispensed", 0],
      ["2026-09-29", 1, "Sport", "contingent", 2],
      ["2026-09-16", 2, "Deutsch", "contingent", 2],
    ]);
    expect(a.items[3]?.lessons[0]).toMatchObject({ notified: false, weight: 2 });
  });

  it("Kontingent: 10 gefehlt, 4 dispensiert, Sport doppelt, 7 bezogen, 13 verfügbar", async () => {
    const a = await q.getAbsences(db, U, NOW);
    expect(a.contingent).toEqual({ semester: 1, size: 20, missed: 10, used: 7, available: 13 });
    const me = await q.getMe(db, U, NOW);
    expect(me?.counts).toMatchObject({ contingentAvailable: 13, contingentSize: 20 });
  });

  it("Fachkontingent: doppelte Wochenlektionen", async () => {
    const a = await q.getAbsences(db, U, NOW);
    const sport = a.subjects.find((x) => x.subjectName === "Sport");
    expect(sport?.used).toBe(1);
    expect(sport?.max).toBeGreaterThan(0);
    expect(a.subjects.every((x) => x.max % 2 === 0)).toBe(true);
  });

  it("Abmeldungen und Gesuche, neuste zuerst", async () => {
    const a = await q.getAbsences(db, U, NOW);
    expect(a.notices.map((n) => [n.date, n.note, n.editable])).toEqual([
      ["2026-10-22", "Arzttermin", false],
      ["2026-10-19", "Zahnarzt", false],
      ["2026-10-09", "Krank", false],
      ["2026-09-16", "Arzttermin", false],
    ]);
    expect(a.dispensations.map((d) => [d.date, d.status, d.lessons.length, d.late, d.editable])).toEqual([
      ["2026-11-05", "submitted", 2, false, true],
      ["2026-10-09", "approved", 4, false, false],
    ]);
  });

  it("Abmeldung erfassen, ändern bis zum Beginn, löschen", async () => {
    const n = await q.submitAbsenceNotice(db, U, { date: "2026-10-27", fromPeriod: 9, toPeriod: 10, note: " Termin " }, NOW);
    expect(n).toMatchObject({ date: "2026-10-27", from: "15:15", to: "16:55", note: "Termin", createdAt: NOW.stamp, editable: true });
    const u = await q.updateAbsenceNotice(db, U, n.id, { date: "2026-10-27", fromPeriod: 1, toPeriod: 2 }, NOW);
    expect(u).toMatchObject({ from: "08:00", to: "09:40", note: null });
    await q.deleteAbsenceNotice(db, U, n.id, NOW);
    expect((await q.getAbsences(db, U, NOW)).notices.some((x) => x.id === n.id)).toBe(false);
    await expect(q.submitAbsenceNotice(db, U, { date: "2026-10-01", fromPeriod: 1, toPeriod: 1 }, NOW)).rejects.toThrow("14 Tage");
  });

  it("Abmeldung nach Beginn gesperrt", async () => {
    const n = await q.submitAbsenceNotice(db, U, { date: NOW.date, fromPeriod: 1, toPeriod: 2 }, NOW);
    expect(n.editable).toBe(false);
    await expect(q.deleteAbsenceNotice(db, U, n.id, NOW)).rejects.toThrow("schon begonnen");
  });

  it("Gesuch: Anhang Pflicht ausser ab 2. Krankheitstag, verspätet unter 5 Arbeitstagen, zählt erst bewilligt", async () => {
    await expect(q.submitDispensation(db, U, { date: "2026-10-26", reason: "Todesfall in der Familie", periods: [1] }, NOW)).rejects.toThrow("Bestätigung");
    const d = await q.submitDispensation(db, U, { date: "2026-10-26", reason: "Todesfall in der Familie", periods: [1, 2], attachmentKeys: ["absenzen/x/1.pdf"] }, NOW);
    expect(d).toMatchObject({ status: "submitted", attachments: 1, late: true, editable: true, lessons: [{ period: 1, subjectName: "Mathematik" }, { period: 2, subjectName: "Mathematik" }] });
    const sick = await q.submitDispensation(db, U, { date: "2026-10-19", reason: "Dispensation ab 2. Krankheitstag", periods: [1] }, NOW);
    expect(sick).toMatchObject({ attachments: 0, late: false });
    expect((await q.getAbsences(db, U, NOW)).contingent.used).toBe(7);
  });

  it("Gesuch ändern behält Anhänge, löschen gibt sie zurück, entschiedene sind gesperrt", async () => {
    const d = await q.submitDispensation(db, U, { date: "2026-11-20", reason: "Aufgebot durch Amts- und Dienststellen", periods: [1], attachmentKeys: ["absenzen/x/a.pdf"] }, NOW);
    expect(d.late).toBe(false);
    const u = await q.updateDispensation(db, U, d.id, { date: "2026-11-20", reason: "Aufgebot durch Amts- und Dienststellen", periods: [1, 2], keepAttachments: true, attachmentKeys: ["absenzen/x/b.pdf"] }, NOW);
    expect(u.dispensation).toMatchObject({ attachments: 2, lessons: [{ period: 1 }, { period: 2 }] });
    expect(u.removedKeys).toEqual([]);
    expect(await q.deleteDispensation(db, U, d.id)).toEqual(["absenzen/x/a.pdf", "absenzen/x/b.pdf"]);
    await expect(q.deleteDispensation(db, U, "di-1")).rejects.toThrow("entschieden");
  });
});

describe("SOL", () => {
  it("Block 3 mit 6 Fächern, Mathematik zuerst", async () => {
    const t = await q.getSolTasks(db, U, NOW);
    expect(t.block?.n).toBe(3);
    expect(t.blocks.map((b) => b.n)).toEqual([3, 2, 1]);
    expect(t.groups.map((g) => g.subject.code)).toEqual(["MA", "EN", "DE", "FRW", "WR", "FR"]);
    expect(t.groups[0]?.tasks[0]).toMatchObject({ code: "3.01", title: "Repetition Terme II", minutes: 90, status: "done", files: [{ kind: "task", ext: "pdf", href: "/api/v1/files/sol/t-ma-3.01", pdfHref: null }] });
  });

  it("Stand setzen: offen, angefangen, erledigt", async () => {
    await q.setSolStatus(db, U, "t-ma-3.02", "started");
    const t = await q.getSolTasks(db, U, NOW);
    expect(t.groups[0]?.tasks.find((x) => x.id === "t-ma-3.02")?.status).toBe("started");
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

describe("Stand des Imports", () => {
  it("fehlgeschlagener Lauf: veraltet, Stand bleibt der letzte erfolgreiche", async () => {
    await db.insert(schema.importRuns).values({ id: "r-fail", source: "webuntis", startedAt: "2026-10-26T09:00", finishedAt: "2026-10-26T09:00", ok: false, lessons: 0, error: "Zeitüberschreitung" });
    const src = await q.timetableSource(db, NOW);
    expect(src).toMatchObject({ ok: false, stale: true, lastRunAt: "2026-10-26T07:58" });
  });

  it("alter Stand aus WebUntis gilt als veraltet, Beispieldaten und Datei nicht", async () => {
    const later = { date: "2026-10-29", time: "08:00", stamp: "2026-10-29T08:00" };
    expect((await q.timetableSource(db, later)).stale).toBe(false);
    await db.insert(schema.importRuns).values({ id: "r-file", source: "file", startedAt: "2026-10-26T09:00", finishedAt: "2026-10-26T09:00", ok: true, lessons: 1, error: null });
    expect((await q.timetableSource(db, later)).stale).toBe(false);
    await db.insert(schema.importRuns).values({ id: "r-untis", source: "webuntis", startedAt: "2026-10-26T09:01", finishedAt: "2026-10-26T09:01", ok: true, lessons: 1, error: null });
    expect((await q.timetableSource(db, later)).stale).toBe(true);
  });
});

describe("Microsoft-Login", () => {
  it("legt ein Konto an oder findet das bestehende über die E-Mail", async () => {
    const selin = await q.findOrCreateUser(db, { email: "Selin.Hofer@bwdbern.ch", firstName: "X", lastName: "Y", oid: "1" }, NOW);
    expect(selin.id).toBe(U);
    const neu = await q.findOrCreateUser(db, { email: "lena.muster@bwdbern.ch", firstName: "Lena", lastName: "Muster", oid: "abc" }, NOW);
    expect(neu).toMatchObject({ id: "u-ms-abc", firstName: "Lena", classId: null });
    expect((await q.getMe(db, neu.id))?.classCode).toBe("");
  });

  it("Microsoft: Name aus dem Verzeichnis gewinnt (Umlaute), Planary: Name aus der Adresse", async () => {
    const ms = await q.findOrCreateUser(db, { email: "lea.mueller@bwdbern.ch", firstName: "Lea", lastName: "Müller", oid: "m1", trustedName: true }, NOW);
    expect(ms).toMatchObject({ firstName: "Lea", lastName: "Müller" });
    // Später über Planary: "Müller" passt zur Adresse mueller und bleibt
    expect(await q.findOrCreateUser(db, { email: "lea.mueller@bwdbern.ch", firstName: "x", lastName: "", oid: "p0" }, NOW)).toMatchObject({ lastName: "Müller" });
    const nr = await q.findOrCreateUser(db, { email: "max.muster2@bwdbern.ch", firstName: "Gamer", lastName: "", oid: "p1" }, NOW);
    expect(nr).toMatchObject({ firstName: "Max", lastName: "Muster" });
  });

  it("Schuladresse: Name kommt aus der Adresse, auch wenn der Anbieter einen anderen schickt", async () => {
    const neu = await q.findOrCreateUser(db, { email: "anna-lena.de.la.cruz@bwdbern.ch", firstName: "xX", lastName: "gamer", oid: "n1" }, NOW);
    expect(neu).toMatchObject({ firstName: "Anna-Lena", lastName: "De La Cruz" });
    // Bestehendes Konto mit falschem Namen wird beim nächsten Login korrigiert
    await db.update(schema.users).set({ firstName: "Cool", lastName: "Name" }).where(eq(schema.users.id, neu.id));
    expect(await q.findOrCreateUser(db, { email: "anna-lena.de.la.cruz@bwdbern.ch", firstName: "Cool", lastName: "Name", oid: "n1" }, NOW)).toMatchObject({ firstName: "Anna-Lena", lastName: "De La Cruz" });
  });

  it("legt neue Konten in die Standardklasse und ergänzt sie bei Konten ohne Klasse", async () => {
    const neu = await q.findOrCreateUser(db, { email: "tim.test@bwdbern.ch", firstName: "Tim", lastName: "Test", oid: "t1" }, NOW, "IM24a");
    expect(neu.classId).toBe("c-im24a");
    expect((await q.getMe(db, neu.id))?.classCode).toBe("IM24a");
    const ohne = await q.findOrCreateUser(db, { email: "ohne.klasse@bwdbern.ch", firstName: "O", lastName: "K", oid: "t2" }, NOW);
    expect(ohne.classId).toBeNull();
    expect((await q.findOrCreateUser(db, { email: "ohne.klasse@bwdbern.ch", firstName: "O", lastName: "K", oid: "t2" }, NOW, "IM24a")).classId).toBe("c-im24a");
    // Bestehende Klasse bleibt
    expect((await q.findOrCreateUser(db, { email: "Selin.Hofer@bwdbern.ch", firstName: "X", lastName: "Y", oid: "1" }, NOW, "IM24a")).classId).toBe("c-im24b");
  });

  it("Einmal-Code: einlösbar genau einmal und nur 60 Sekunden", async () => {
    const s = await q.createSession(db, U, NOW);
    const code = await q.createLoginCode(db, s.id, NOW);
    expect(await q.consumeLoginCode(db, code, NOW)).toBe(s.id);
    expect(await q.consumeLoginCode(db, code, NOW)).toBeNull();
    const late = await q.createLoginCode(db, s.id, NOW);
    expect(await q.consumeLoginCode(db, late, { date: "2026-10-26", time: "10:22", stamp: "2026-10-26T10:22" })).toBeNull();
  });
});

describe("Kalender-Abo", () => {
  it("Token ist stabil, neu erstellen macht den alten ungültig", async () => {
    const t1 = await q.calendarToken(db, U, NOW);
    expect(await q.calendarToken(db, U, NOW)).toBe(t1);
    expect(await q.userByCalendarToken(db, t1)).toBe(U);
    const t2 = await q.resetCalendarToken(db, U, NOW);
    expect(t2).not.toBe(t1);
    expect(await q.userByCalendarToken(db, t1)).toBeNull();
    expect(await q.userByCalendarToken(db, t2)).toBe(U);
  });

  it("enthält Lektionen, Ausfall, Raumänderung, Prüfungen und SOL-Plan, keine Fristen", async () => {
    const ev = await q.calendarEvents(db, U, NOW);
    expect(ev.find((e) => e.summary === "Deutsch (entfällt)" && e.date === "2026-10-26")?.cancelled).toBe(true);
    expect(ev.find((e) => e.date === "2026-10-26" && e.start === "10:50")?.location).toBe("B 015 (statt A 207)");
    expect(ev.find((e) => e.summary === "Prüfung Mathematik: Funktionen")).toMatchObject({ date: "2026-10-20", description: "Note 4.5" });
    expect(ev.some((e) => e.summary === "SOL Mathe 3.02: Lineare Optimierung I" && e.start === "08:00")).toBe(true);
    expect(ev.some((e) => e.summary.startsWith("Frist"))).toBe(false);
    expect(new Set(ev.map((e) => e.uid)).size).toBe(ev.length);
  });
});
