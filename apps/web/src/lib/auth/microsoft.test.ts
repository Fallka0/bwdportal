import { describe, expect, it } from "vitest";
import { safeAppReturn } from "./flow";
import { allowedDomain, authorizeUrl, msConfigured, pkce } from "./microsoft";

const ms = { clientId: "abc", clientSecret: "s", tenant: "common", extraDomains: ["test.example"] };

describe("Microsoft-Login", () => {
  it("PKCE: Challenge ist SHA-256 des Verifiers (base64url)", async () => {
    const { verifier, challenge } = await pkce();
    expect(verifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
    const expected = btoa(String.fromCharCode(...hash)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    expect(challenge).toBe(expected);
  });

  it("Authorize-URL mit allen Pflichtparametern", () => {
    const u = new URL(authorizeUrl(ms, { redirectUri: "http://localhost:3000/api/v1/auth/callback", state: "st", nonce: "no", challenge: "ch" }));
    expect(u.origin + u.pathname).toBe("https://login.microsoftonline.com/common/oauth2/v2.0/authorize");
    expect(Object.fromEntries(u.searchParams)).toMatchObject({ client_id: "abc", response_type: "code", scope: "openid profile email", state: "st", nonce: "no", code_challenge: "ch", code_challenge_method: "S256" });
  });

  it("nur Schul-Domain (und Test-Domains aus der Umgebung)", () => {
    expect(allowedDomain("selin.hofer@bwdbern.ch", ms)).toBe(true);
    expect(allowedDomain("x@test.example", ms)).toBe(true);
    expect(allowedDomain("someone@gmail.com", ms)).toBe(false);
    expect(allowedDomain("evil@bwdbern.ch.evil.com", ms)).toBe(false);
  });

  it("ohne Secret gilt Microsoft als nicht eingerichtet", () => {
    expect(msConfigured(ms)).toBe(true);
    expect(msConfigured({ ...ms, clientSecret: "" })).toBe(false);
    expect(msConfigured(null)).toBe(false);
  });

  it("Rücksprung nur in die App (kein offener Redirect)", () => {
    expect(safeAppReturn("bwdportal://auth")).toBe("bwdportal://auth");
    expect(safeAppReturn("exp://192.168.1.5:8081/--/auth")).toBe("exp://192.168.1.5:8081/--/auth");
    expect(safeAppReturn("https://evil.example/")).toBeNull();
    expect(safeAppReturn(null)).toBeNull();
  });
});
