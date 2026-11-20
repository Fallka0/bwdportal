import { describe, expect, it } from "vitest";
import { parseAuthMethods } from "../env";
import { planaryMe, planaryStartUrl, schoolEmail, splitName } from "./planary";

const BASE = "https://auth.planary.ch";

describe("Planary-Login", () => {
  it("Start: Anmelden mit Single Sign-on, Konto erstellen ohne, zurück auf /login/planary", () => {
    const u = new URL(planaryStartUrl(BASE, "https://bwdportal.planary.ch", false));
    expect(u.origin + u.pathname).toBe("https://auth.planary.ch/");
    expect(u.searchParams.get("returnTo")).toBe("https://bwdportal.planary.ch/login/planary");
    expect(u.searchParams.get("auto")).toBe("1");
    const s = new URL(planaryStartUrl(BASE, "http://localhost:3000", true));
    expect(s.pathname).toBe("/signup");
    expect(s.searchParams.has("auto")).toBe(false);
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

  it("Name aus Planary oder aus der Adresse", () => {
    expect(splitName("Mykyta Pantelei", "x@bwdbern.ch")).toEqual({ firstName: "Mykyta", lastName: "Pantelei" });
    expect(splitName("", "selin.hofer@bwdbern.ch")).toEqual({ firstName: "Selin", lastName: "Hofer" });
  });

  it("AUTH_METHODS, früheres AUTH_MODE gilt weiter", () => {
    expect([...parseAuthMethods("planary, microsoft")]).toEqual(["planary", "microsoft"]);
    expect([...parseAuthMethods(undefined, "both")]).toEqual(["mock", "microsoft"]);
    expect([...parseAuthMethods(undefined, undefined)]).toEqual(["mock"]);
  });
});
