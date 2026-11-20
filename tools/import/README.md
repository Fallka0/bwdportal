# Stundenplan- und SOL-Import

Holt Lektionen aus einer Quelle und schreibt sie in D1. Die Web-App und die App lesen nur aus D1, darum läuft die Demo auch ohne WebUntis. Hintergrund: `handoff/docs/WEBUNTIS.md`.

| Quelle | Woher | Zugang |
|---|---|---|
| `mock` | Beispieldaten aus `handoff/data/fixtures.json` | keiner (Standard) |
| `webuntis` | Inoffizielle JSON-RPC-Schnittstelle über das npm-Paket `webuntis` (nicht von Untis, eigenes Risiko) | eigenes Konto, am besten Secret oder QR-Daten |
| `ical` | Kalender-Abo aus dem WebUntis-Profil, falls die Schule es freigibt | Adresse des Abos |
| `file` | JSON-Datei mit einer Liste von Lektionen (Form wie `LessonInput` in `src/types.ts`), z. B. von Hand aus WebUntis übertragen | keiner; Pfad über `--file` oder `TIMETABLE_FILE` |

## Benutzung

```bash
cp tools/import/.env.example tools/import/.env.local   # Zugangsdaten eintragen, nie committen
pnpm timetable:import -- --source webuntis          # lokales D1, vier Wochen ab dieser Woche
pnpm timetable:import -- --source webuntis --from 2026-10-26 --to 2026-11-20
pnpm timetable:import -- --source mock --dry-run    # SQL nur anzeigen
pnpm timetable:import -- --source webuntis --remote # ins Deployment (Cloudflare)
pnpm timetable:import -- --source file --file .local/im24a-lektionen.json --class c-im24a --from 2026-11-16 --to 2026-12-18 --remote
```

## Was passiert
1. Die Quelle liefert Lektionen (`TimetableSource.fetchLessons`).
2. Fächer und Lehrpersonen werden ergänzt, die Lektionen der Klasse im Zeitraum ersetzt (Upsert über `source` + `external_id`).
3. Jeder Lauf kommt in `import_runs`. Schlägt ein Lauf fehl oder ist ein laufender Abgleich (`webuntis`, `ical`) älter als ein Tag, zeigt der Stundenplan das Banner "WebUntis antwortet gerade nicht." mit dem Stand des Plans. Läufe aus `file` und `mock` veralten nicht.

Echte Daten (Dateien für `file`) gehören in `tools/import/.local/`. Der Ordner ist von Git ausgeschlossen. `--class` wählt die Klasse (Standard: die Demo-Klasse); sie muss in D1 existieren.

## SOL-Import

```bash
pnpm sol:import -- --file .local/im24a-sol.json --dry-run   # SQL nur anzeigen
pnpm sol:import -- --file .local/im24a-sol.json --remote    # ins Deployment
```

Die Datei (Form `SolInput` in `src/sol.ts`) enthält die Klasse, den Wochentag des SOL-Tags, die Blöcke als Kalenderwochen (`2026-W47`), die Aufträge mit Zeitvorgabe, die Präsenzen der Lehrpersonen und die Lehrperson pro Fach. Daraus entstehen Blöcke (Montag der ersten bis Freitag der letzten Woche), SOL-Tage, Aufträge und Präsenzen. Blöcke, Tage und Aufträge werden per Upsert geschrieben, damit Fortschritt und Plan der Lernenden bleiben; die Präsenzen der Klasse werden ersetzt. Die Fächer müssen schon in D1 sein (kommen mit dem Stundenplan).

## SOL-Dateien

Die Ordner der Schule (SharePoint, pro Fach ein ZIP) sind nicht einheitlich benannt. Darum zwei Schritte:

```bash
# 1. Vorschlag: Fach aus dem Ordner (02_Math, 03_Französisch …), Auftrag über die Nummer im Namen
#    (M-SOL_4.01, F_SOL_3.1, SOL_Lernbaustein 6.1), sonst der einzige Auftrag des Fachs im Block
pnpm sol:files -- suggest --dir <entpackter Ordner> --tasks .local/im24a-sol.json --out .local/sol-files-map.json
# 2. Zuordnung prüfen und korrigieren: "task" ("F 3.1" oder null), "kind" (task, material, solution), "name"
# 3. Import: Original nach R2, Word und PowerPoint zusätzlich als PDF (LibreOffice), Dateien der Aufträge in D1 ersetzen
pnpm sol:files -- import --dir <entpackter Ordner> --map .local/sol-files-map.json --remote
```

Pro Auftrag ist eine Datei "der Auftrag" (bevorzugt ein "Lernbaustein"), weitere Dateien sind Unterlagen, Lösungen ("Lösung", "Loesung", "solutions", "corrigé", "_sol") werden als solche angezeigt. Audio und Video gibt es einzeln, nicht im Block-ZIP. LibreOffice: `brew install --cask libreoffice`. ZIP-Dateien mit Umlauten mit Python oder `ditto` entpacken, nicht mit `unzip`.

## Abbildung WebUntis
| WebUntis | Portal |
|---|---|
| `date` 20261026, `startTime` 1045 | `2026-10-26`, `10:45` |
| `su[0]` | Fach (Kürzel und Name) |
| `te[0]` | Lehrperson |
| `ro[0].name`, `ro[0].orgname` | Raum; mit `orgname` als Raumänderung ("B 015 statt A 207") |
| `code: "cancelled"` | Entfällt |
| Fach `SOL` | SOL-Tag |

## Grenzen
- Nicht geprüft gegen den echten Server der bwd: Servername, Schulname und Erlaubnis der Schule sind offen (`handoff/docs/OFFENE-PUNKTE.md`).
- Das Paket `webuntis` läuft nur in Node, nicht auf Cloudflare Workers. Darum ein Import-Skript statt Live-Zugriff.
- Zugangsdaten bleiben in `.env.local`. Das Portal speichert keine WebUntis-Passwörter.
