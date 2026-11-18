# Kickoff

## Erster Prompt für Claude Code
```
Lies CLAUDE.md und alles unter handoff/docs. Sieh dir handoff/design/screens an und öffne handoff/prototype/web.html und app.html.
Baue das bwd Portal nach handoff/docs/KICKOFF.md, Phase für Phase. Beginne mit Phase 0 und 1.
Lies vor dem Aufsetzen die aktuelle Doku zu Next.js auf Cloudflare (OpenNext), D1, Drizzle und Expo.
Zeig mir nach jeder Phase, was läuft, und warte auf mein Okay. Nicht committen oder pushen, bis ich es sage.
```

## Phasen
| Phase | Inhalt | Abnahme |
|---|---|---|
| 0 Gerüst | pnpm-Monorepo, `apps/web`, `apps/mobile`, `packages/shared`, `packages/db`. TypeScript strict, ESLint, Vitest, CI. | `pnpm typecheck`, `pnpm lint`, `pnpm test` grün. Web und App starten leer. |
| 1 Design-Basis | Tokens aus `tokens.json` als CSS-Variablen und RN-Theme. Schriften. Hell, Dunkel, System. Grundkomponenten (Knopf, Karte, Status, Segment, Text-Tabs, Listenzeile, Feld, Dialog/Sheet, Skeleton, Toast). | Eine Testseite pro Plattform zeigt alle Komponenten in beiden Designs. |
| 2 Daten | Drizzle-Schema nach `schema.sql`, Migrationen, Seed aus `fixtures.json`, lokales D1. `DEMO_NOW`. | Seed läuft, Abfragen liefern die Beispieldaten. |
| 3 Login und Shell | Mock-Login hinter `AuthProvider`, Session, geschützte Routen. Web: Sidebar, Kopfzeile, Icon-Leiste, mobile Tab-Bar. App: Tabs und Stack. 404. | Login als Selin Hofer, Navigation zu allen Routen, Abmelden. |
| 4 Zeitraster | Rechnung in `shared` mit Tests. Komponente für Web und App. Stundenplan Tag und Woche, Übersicht "Heute", Jetzt-Linie. | Bild gleich wie `BWD-Timetable`, `BWD-Timetable-Day`, `BWD-App-Timetable`, `BWD-App-Timetable-Week`. |
| 5 Übersicht, Noten, Absenzen | Übersicht komplett. Noten mit Semester und Fach. Absenzen mit Dialog, Datei-Anhang nach R2, Toast. | Wege "Note ansehen" und "Absenz entschuldigen" laufen, Playwright-Test dafür. |
| 6 SOL | Aufträge mit Filter und Fortschritt, Kalender mit Einplanen, Portfolio mit Check-in und Check-out. | Einplanen erscheint im Kalender, Eintrag wird gespeichert. |
| 7 Infos | Mitteilungen, Mitteilung, Dokumente mit Suche und Filter, Links, Benachrichtigungen, Profil. | Alle Screens wie im Design, leer- und Fehlerzustände da. |
| 8 WebUntis | `TimetableSource`, Import-Skript nach `WEBUNTIS.md`, Banner bei altem Stand. | Import schreibt echte Lektionen ins lokale D1, oder dokumentiert, warum es nicht geht. Mock bleibt Standard. |
| 9 Abschluss | Deploy auf Cloudflare, Expo-Build oder Expo Go, Prüfung nach Checkliste (Titel, Meta, OG, Favicon, 404, Zustände, Tastatur, Kontrast, mobile Breiten, Konsole), README und Projektdoku. | Öffentlicher Link, App vorführbar, Doku fertig. |

## Reihenfolge bei wenig Zeit
0 bis 5 sind der Kern für eine Vorführung. Dann 6, dann 7. Phase 8 ist ein Bonus, der gut in die Doku passt.

## Für die Projektdoku mitschreiben
Entscheide mit Begründung (Stack, Mock-Login, Import statt Live-Zugriff), Datenmodell als Diagramm, Testkonzept, was nicht geklappt hat und warum.
