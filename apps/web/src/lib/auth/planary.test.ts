import { describe, expect, it } from "vitest";
import { parseAuthMethods } from "../env";
import { planaryMe, planaryStartUrl, schoolEmail, splitName } from "./planary";

const BASE = "https://auth.planary.ch";

describe("Planary-Login", () => {
  it("Start ohne Single Sign-on (Planary fragt nach dem Konto), Konto erstellen, Konto wechseln", () => {
    const u = new URL(planaryStartUrl(BASE, "https://bwdportal.planary.ch", "login"));
    expect(u.origin + u.pathname).toBe("https://auth.planary.ch/");
    expect(u.searchParams.get("returnTo")).toBe("https://bwdportal.planary.ch/login/planary");
    expect(u.searchParams.has("auto")).toBe(false);
    expect(new URL(planaryStartUrl(BASE, "http://localhost:3000", "signup")).pathname).toBe("/signup");
    expect(new URL(planaryStartUrl(BASE, "http://localhost:3000", "switch")).pathname).toBe("/logout");
  });

  it("prüft das Token bei /api/auth/me", async () => {
    const ok = (async () => new Response(JSON.stringify({ user: { id: "u1", email: "Mykyta.Pantelei@bwdbern.ch", name: "Mykyta Pantelei" } }))) as unknown as typeof fetch;
    expect(await planaryMe(BASE, "tok", ok)).toEqual({ id: "u1", email: "mykyta.pantelei@bwdbern.ch", name: "Mykyta Pantelei" });
    const denied = (async () => new Response("{}", { status: 401 })) as unknown as typeof fetch;
    expect(await planaryMe(BASE, "tok", denied)).toBeNull();
  });

  it("nur die Schul-Domain, Testdomains nur wenn gesetzt", () => {
    expect(schoolEmail("a.b@bwdbern.ch", [])).toBe(true);
    expect(schoolEmail("a.b@gmail.com", [])).toBe(false);
    expect(schoolEmail("a.b@bwdbern.ch.evil.com", [])).toBe(false);
    expect(schoolEmail("a.b@gmail.com", ["gmail.com"])).toBe(true);
  });

  it("Schuladresse: Name immer aus der Adresse, sonst von Planary", () => {
    expect(splitName("xX_gamer_Xx", "mykyta.pantelei@bwdbern.ch")).toEqual({ firstName: "Mykyta", lastName: "Pantelei" });
    expect(splitName("", "anna-lena.de.la.cruz@bwdbern.ch")).toEqual({ firstName: "Anna-Lena", lastName: "De La Cruz" });
    expect(splitName("Max Muster", "max@gmail.com")).toEqual({ firstName: "Max", lastName: "Muster" });
  });

  it("AUTH_METHODS, früheres AUTH_MODE gilt weiter", () => {
    expect([...parseAuthMethods("planary, microsoft")]).toEqual(["planary", "microsoft"]);
    expect([...parseAuthMethods(undefined, "both")]).toEqual(["mock", "microsoft"]);
    expect([...parseAuthMethods(undefined, undefined)]).toEqual(["mock"]);
  });
});
