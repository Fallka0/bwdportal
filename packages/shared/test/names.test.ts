import { describe, expect, it } from "vitest";
import { nameFromSchoolEmail, nameMatchesAddress } from "../src/domain";

describe("Name aus der Schuladresse", () => {
  it("vorname.nachname, Doppelnamen, Nummern, fremde Domains", () => {
    expect(nameFromSchoolEmail("anna-lena.de.la.cruz@bwdbern.ch")).toEqual({ firstName: "Anna-Lena", lastName: "De La Cruz" });
    expect(nameFromSchoolEmail("max.muster2@bwdbern.ch")).toEqual({ firstName: "Max", lastName: "Muster" });
    expect(nameFromSchoolEmail("info@bwdbern.ch")).toBeNull();
    expect(nameFromSchoolEmail("max.muster@gmail.com")).toBeNull();
    expect(nameMatchesAddress({ firstName: "Lea", lastName: "Müller" }, { firstName: "Lea", lastName: "Mueller" })).toBe(true);
    expect(nameMatchesAddress({ firstName: "Zoé", lastName: "Favre" }, { firstName: "Zoe", lastName: "Favre" })).toBe(true);
    expect(nameMatchesAddress({ firstName: "Cool", lastName: "Name" }, { firstName: "Lea", lastName: "Mueller" })).toBe(false);
  });
});
