# Stundenplan-Import

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
