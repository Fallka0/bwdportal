# Architektur

## Monorepo (pnpm Workspaces)
```
apps/web        Next.js, auch die API unter /api/v1
apps/mobile     Expo mit Expo Router
packages/shared Typen, Zod-Schemas, Datums- und Notenformat, Zeitraster-Rechnung, API-Client, Tokens
packages/db     Drizzle-Schema, Migrationen, Seed aus fixtures.json
tools/import    WebUntis-Import als Skript
```
Die Zeitraster-Rechnung (Minuten zu Pixel, Jetzt-Linie, vergangene Blöcke) liegt in `shared` und wird von Web und App gleich benutzt. Nur das Zeichnen ist pro Plattform.

## Web auf Cloudflare
Next.js läuft über den OpenNext-Adapter für Cloudflare auf Workers. D1 und R2 sind Bindings in der Wrangler-Konfiguration. Vor dem Aufsetzen die aktuelle Anleitung von Cloudflare und OpenNext lesen und deren Vorlage benutzen. Lokale Entwicklung mit lokalem D1.

## API
Route Handler unter `/api/v1`, JSON, Antworten mit Zod geprüft. Web liest auf dem Server direkt aus der Datenbank, die App benutzt die API über den Client aus `shared`.

| Methode | Pfad | Zweck |
|---|---|---|
| POST | /auth/mock | Demo-Konto wählen, Session anlegen |
| POST | /auth/logout | Session beenden |
| GET | /me | Profil und Einstellungen |
| PATCH | /me/settings | Design, Benachrichtigungen |
| GET | /timetable?from&to | Lektionen im Zeitraum |
| GET | /grades?semester | Fächer mit Schnitt |
| GET | /grades/:subject | Prüfungen eines Fachs |
| GET, POST | /absences | Liste, neue Entschuldigung |
| GET | /sol/tasks?block | Aufträge |
| PATCH | /sol/tasks/:id | Fortschritt |
| GET, POST, DELETE | /sol/plan | Einplanen am SOL-Tag |
| GET | /sol/presence?day | Lehrpersonen am SOL-Tag |
| GET, PUT | /sol/portfolio | Check-in, Check-out |
| GET | /news, /news/:id | Mitteilungen |
| GET | /documents?q&group | Dokumente |
| GET | /links | Links |
| GET, POST | /notifications, /notifications/read | Benachrichtigungen |

## Mock-Login
- Login-Seite wie im Design, der Knopf "Mit Microsoft anmelden" öffnet im Mock eine Auswahl von Demo-Konten (mindestens Selin Hofer, IM24b). Deutlich sichtbar nur in Entwicklung und Demo, über eine Umgebungsvariable `AUTH_MODE=mock`.
- Session: zufällige ID in D1, im Web als HttpOnly-Cookie, in der App als Bearer-Token in SecureStore.
- Alles hinter einer Schnittstelle `AuthProvider` mit `signIn`, `signOut`, `getSession`. Später kommt `MicrosoftAuthProvider` (Entra ID, OIDC) dazu, ohne die Screens zu ändern. Der Fehlerfall "Dieses Konto gehört nicht zur bwd" ist im Design schon da.

## Daten
Schema in `data/schema.sql`. Seed aus `data/fixtures.json`. Stichtag der Beispieldaten ist Montag, 26.10.2026, 10:20. Für die Demo eine Variable `DEMO_NOW`, damit Jetzt-Linie, "Als Nächstes" und vergangene Lektionen wie im Design aussehen. Ohne die Variable gilt die echte Zeit (Europe/Zurich).

## Qualität
TypeScript strict, ESLint, Vitest für `shared` (Zeitraster, Notenschnitt, Fristen), Playwright für die wichtigsten Wege im Web (Login, Stundenplan, Absenz entschuldigen, SOL einplanen). CI mit Typecheck, Lint, Tests.
