# bwd Portal

Ein Portal für Lernende der bwd Bern: Stundenplan, Noten, Absenzen, SOL, Mitteilungen, Dokumente und Links an einem Ort. Als Website und als App für iOS und Android.

Schulprojekt. **Alle Personen, Noten und Absenzen sind erfunden.** Kein offizielles Produkt der Schule.

- Web: https://bwd-portal.planary.workers.dev (Demo-Anmeldung: "Mit Microsoft anmelden", dann "Selin Hofer"). Lässt sich als App installieren (PWA).
- Projektdoku: [docs/PROJEKTDOKU.md](docs/PROJEKTDOKU.md)
- Vorgaben und Design: [handoff/](handoff/)

## Aufbau

```
apps/web         Next.js 16 (App Router) auf Cloudflare Workers über OpenNext, API unter /api/v1
apps/mobile      Expo SDK 58 mit Expo Router (iOS, Android)
packages/shared  Typen, Zod-Schemas, Zeitraster-Rechnung, Datum, Noten, Design-Tokens, Icons, API-Client
packages/db      Drizzle-Schema, Migrationen, Seed, Abfragen für alle Screens
tools/import     Stundenplan-Import (mock, WebUntis, iCal)
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

Mit `DEMO_NOW` (in `apps/web/wrangler.jsonc`) steht die Zeit auf Montag, 26.10.2026, 10:20, damit Jetzt-Linie und "Als Nächstes" wie im Design aussehen. Ohne die Variable gilt die echte Zeit in Europe/Zurich.

## Prüfen

```bash
pnpm typecheck && pnpm lint && pnpm test        # TypeScript, ESLint, Vitest, Jest (App)
pnpm --filter @bwd/web e2e                      # Playwright gegen next dev
BASE_URL=https://bwd-portal.planary.workers.dev pnpm --filter @bwd/web e2e   # gegen das Deployment
```

## Befehle

| Befehl | Zweck |
|---|---|
| `pnpm tokens` | CSS-Variablen und RN-Theme aus `handoff/design/tokens.json` erzeugen |
| `pnpm icons` | Icons aus dem Prototyp erzeugen |
| `pnpm db:generate` | Migration aus dem Drizzle-Schema erzeugen |
| `pnpm db:seed-sql` | `packages/db/seed/seed.sql` aus den Fixtures erzeugen |
| `pnpm db:reset` | lokales D1 neu aufsetzen |
| `pnpm timetable:import --source webuntis` | Stundenplan importieren, siehe [tools/import](tools/import/README.md) |
| `pnpm --filter @bwd/web deploy` | Web auf Cloudflare bauen und veröffentlichen |

## Anmeldung

`AUTH_MODE` in `apps/web/wrangler.jsonc`:

| Wert | Verhalten |
|---|---|
| `mock` | nur Demo-Konten |
| `microsoft` | nur Microsoft (Entra ID) |
| `both` | Demo-Konten und "Echtes Microsoft-Konto" (Vorführung) |

Microsoft braucht eine App-Registrierung in Entra ID (Web, Redirect-URI `<Adresse>/api/v1/auth/callback`). Die Client-ID steht als `MS_CLIENT_ID` in `wrangler.jsonc`, das Secret kommt mit `npx wrangler secret put MS_CLIENT_SECRET` (lokal in `apps/web/.dev.vars`). Zugelassen sind nur Konten mit der Schul-Domain aus `config/portal.json`; zum Testen weitere über `AUTH_EXTRA_DOMAINS`. Ohne Client-ID und Secret verhält sich `both` wie `mock`.

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

Danach bei jeder Änderung: `pnpm --filter @bwd/web deploy`.

App als Android-Build (APK): `cd apps/mobile && npx eas-cli@latest build --profile preview --platform android` (Expo-Konto nötig). Zum Vorführen reicht Expo Go.
