# bwd Portal

Ein Portal für Lernende der bwd Bern: Stundenplan, Noten, Absenzen, SOL, Mitteilungen, Dokumente und Links an einem Ort. Als Website und als App für iOS und Android.

Schulprojekt. **Alle Personen, Noten und Absenzen sind erfunden.** Kein offizielles Produkt der Schule.

- Web: https://bwdportal.planary.ch (Anmeldung mit Planary-Konto oder Microsoft, nur mit Adresse der bwd). Lässt sich als App installieren (PWA).
- Projektdoku: [docs/PROJEKTDOKU.md](docs/PROJEKTDOKU.md)
- Vorgaben und Design: [handoff/](handoff/)

## Aufbau

```
apps/web         Next.js 16 (App Router) auf Cloudflare Workers über OpenNext, API unter /api/v1
apps/mobile      Expo SDK 58 mit Expo Router (iOS, Android)
packages/shared  Typen, Zod-Schemas, Zeitraster-Rechnung, Datum, Noten, Design-Tokens, Icons, API-Client
packages/db      Drizzle-Schema, Migrationen, Seed, Abfragen für alle Screens
tools/import     Stundenplan-Import (mock, WebUntis, iCal, Datei)
config/          Adressen der Schule und Lektionenzeiten (Platzhalter markiert)
handoff/         Brief, Design, Screenshots, Prototyp, Beispieldaten
```

## Lokal starten

Voraussetzungen: Node 24, pnpm 12.

```bash
pnpm install
pnpm db:reset                 # lokales D1: Migration und Beispieldaten
pnpm dev                      # Web auf http://localhost:3000
pnpm dev:mobile               # App in Expo Go (QR-Code scannen)
```

Die App spricht standardmässig mit dem Deployment. Für das lokale Portal in `apps/mobile/.env.local`:

```
EXPO_PUBLIC_API_URL=http://<IP dieses Rechners>:3000
```

Im Deployment gilt die echte Zeit in Europe/Zurich. Lokal setzt `DEMO_NOW` in `apps/web/.dev.vars` (siehe `.dev.vars.example`) die Zeit auf Montag, 26.10.2026, 10:20, damit Jetzt-Linie und "Als Nächstes" wie im Design aussehen und die Tests feste Daten haben. Das Zurücksetzen der Demo-Daten (`POST /api/v1/dev/reset`) geht nur mit `DEMO_NOW`.

## Prüfen

```bash
pnpm typecheck && pnpm lint && pnpm test        # TypeScript, ESLint, Vitest, Jest (App)
pnpm --filter @bwd/web e2e                      # Playwright gegen next dev
BASE_URL=<Adresse> pnpm --filter @bwd/web e2e  # gegen ein Deployment mit DEMO_NOW
```

## Befehle

| Befehl | Zweck |
|---|---|
| `pnpm tokens` | CSS-Variablen und RN-Theme aus `handoff/design/tokens.json` erzeugen |
| `pnpm icons` | Icons aus dem Prototyp erzeugen |
| `pnpm db:generate` | Migration aus dem Drizzle-Schema erzeugen |
| `pnpm db:seed-sql` | `packages/db/seed/seed.sql` aus den Fixtures erzeugen |
| `pnpm db:reset` | lokales D1 neu aufsetzen |
| `pnpm timetable:import -- --source webuntis` | Stundenplan importieren, siehe [tools/import](tools/import/README.md) |
| `pnpm sol:import -- --file <datei>` | SOL-Daten einer Klasse importieren |
| `pnpm sol:files -- suggest …` / `import …` | SOL-Dateien zuordnen und hochladen, siehe [tools/import](tools/import/README.md) |
| `pnpm --filter @bwd/web run deploy` | Web auf Cloudflare bauen und veröffentlichen |

## Anmeldung

`AUTH_METHODS` in `apps/web/wrangler.jsonc`, kommagetrennt:

| Wert | Anmeldung |
|---|---|
| `planary` | Planary-Konto (auth.planary.ch): E-Mail und Passwort mit bestätigter Adresse, Google oder GitHub |
| `microsoft` | Microsoft (Entra ID) |
| `mock` | Demo-Konten, nur lokal (`apps/web/.dev.vars`) und in den Tests |

Im Deployment gilt `planary,microsoft`. Zugelassen sind nur Adressen der Schul-Domain aus `config/portal.json`, zum Testen weitere über `AUTH_EXTRA_DOMAINS` (im Deployment leer: die SOL-Unterlagen sind Dokumente der Schule). Ein Konto ist dasselbe, egal ob über Planary oder Microsoft angemeldet (gleiche E-Mail-Adresse).

Planary: `PLANARY_AUTH_URL` zeigt auf auth.planary.ch, dort muss die Adresse des Portals in `ALLOWED_RETURN_TO_ORIGINS` stehen (lokal ist `http://localhost:3000` erlaubt). Der Rücksprung landet auf `/login/planary`; das Portal prüft das Token bei `/api/auth/me` und verwirft das Refresh-Token von Planary, danach gilt die eigene Session.

Microsoft braucht eine App-Registrierung in Entra ID (Web, Redirect-URIs `https://bwdportal.planary.ch/api/v1/auth/callback` und `http://localhost:3000/api/v1/auth/callback`). Die Client-ID steht als `MS_CLIENT_ID` in `wrangler.jsonc`, das Secret kommt mit `npx wrangler secret put MS_CLIENT_SECRET` (lokal in `apps/web/.dev.vars`).

Neue Konten kommen in die Klasse aus `DEFAULT_CLASS` (zurzeit `IM24a`), solange die Zuordnung nicht aus dem Schulsystem kommt. Die Klasse wird bei Bedarf angelegt; ein Konto ohne Klasse bekommt sie beim nächsten Login.

## Deployment (Cloudflare)

Einmalig:

```bash
cd apps/web
npx wrangler d1 create bwd-portal           # ID in wrangler.jsonc eintragen
npx wrangler r2 bucket create bwd-portal-files
npx wrangler d1 migrations apply DB --remote
npx wrangler d1 execute DB --remote --file=../../packages/db/seed/seed.sql
```

Neue Migrationen: `npx wrangler d1 migrations apply DB --remote`.

Danach bei jeder Änderung: `pnpm --filter @bwd/web run deploy`.

App als Android-Build (APK): `cd apps/mobile && npx eas-cli@latest build --profile preview --platform android` (Expo-Konto nötig). Zum Vorführen reicht Expo Go.
