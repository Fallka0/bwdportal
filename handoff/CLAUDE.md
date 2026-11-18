# bwd Portal: Regeln für dieses Projekt

Schulprojekt mit Abgabe. Ein Portal für Lernende der bwd Bern: Web (Next.js) und App (Expo), eine gemeinsame Codebasis für Typen, Daten und Design-Tokens. Lies zuerst `docs/BRIEF.md`, dann `docs/KICKOFF.md`.

## Feste Regeln
- Sprache der Oberfläche: nur Deutsch, Schweizer Schreibweise (ss, nie ß). Keine Gedankenstriche in Texten, keine Ausrufezeichen, keine Emojis. Du-Form.
- Kein erklärender Fülltext in der Oberfläche: keine Untertitel unter Seitentiteln, keine Kicker, keine Hinweistexte. Nur Beschriftungen, Daten und Aktionen.
- Keine "Pills" (getönte runde Status-Tags). Status ist ein einfaches farbiges Wort, erledigte Zustände grau. Zähler an Glocke und Navigation sind erlaubt.
- Kein Glow, keine Verläufe, kein Blur. Flächen, Linien, Typografie.
- Alle Stundenpläne (Übersicht, Stundenplan Tag und Woche, SOL-Kalender) nutzen dieselbe Zeitraster-Komponente: dunkle Blöcke, graues Band "Mittag", rote Jetzt-Linie mit Uhrzeit. Eine Komponente, keine Varianten mit anderem Aussehen.
- SOL hat genau drei Tabs: Aufträge, Kalender, Portfolio. Nichts dazu erfinden.
- Design-Werte nur aus `design/tokens.json`. Keine freien Farben, Radien oder Schriftgrössen.
- Keine URLs, Domains oder echten Daten erfinden. Platzhalter stehen in `docs/OFFENE-PUNKTE.md` und kommen aus der Konfiguration, nie fest im Code.
- Keine echten Personendaten im Repo. Die Beispieldaten in `data/fixtures.json` sind erfunden.
- Commits und Pushes nur, wenn ich es sage.
- Versionen von Next.js, Expo, OpenNext, Drizzle und Wrangler nicht aus dem Gedächtnis: vor dem Aufsetzen die aktuelle Doku lesen.

## Definition of Done pro Screen
- Sieht aus wie der Screenshot in `design/screens/` (hell und dunkel, Web und App).
- Zustände vorhanden: lädt (Skeleton), leer, Fehler mit "Erneut laden".
- Tastatur bedienbar, sichtbarer Fokus, genau eine H1, Formularfelder mit Label, Touch-Ziele ab 44 px.
- Keine Fehler in der Konsole, Typecheck und Lint grün.
