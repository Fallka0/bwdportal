# Stundenplan aus WebUntis

Recherche vom 16.11.2026. Vor dem Bauen nochmals prüfen, die Lage kann sich ändern.

## Was es gibt
1. **Offizielle REST-APIs von Untis** (OneRoster und "WebUntis APIs" für Stammdaten, Stundenplan, Absenzen, Prüfungen). Gedacht für Integrationspartner und Schulen. Zugang braucht die Schule oder Untis. Für ein Schulprojekt nur mit Hilfe der Schul-IT realistisch.
2. **Inoffizielle JSON-RPC-Schnittstelle**, die auch die WebUntis-Seite selbst benutzt. Dafür gibt es das npm-Paket `webuntis` (nicht von Untis, Benutzung auf eigenes Risiko). Login mit Benutzername und Passwort, mit QR-Code oder Secret aus dem WebUntis-Profil, oder anonym, falls die Schule den öffentlichen Plan freigibt. Liefert den eigenen Stundenplan. Das Paket ist für Node gebaut, auf Cloudflare Workers ist es nicht gesichert lauffähig.
3. **Kalender-Abo (iCal)** aus dem WebUntis-Profil. Nur vorhanden, wenn die Schule es eingeschaltet hat. Nicht geprüft, im eigenen Profil nachsehen.

## Empfehlung für dieses Projekt
Ein Import-Skript, kein Live-Zugriff.
- `tools/import` läuft lokal in Node, meldet sich mit dem eigenen Konto an (am besten mit Secret oder QR-Daten, nicht mit dem Passwort), holt die Lektionen für einige Wochen und schreibt sie per Upsert in die Tabelle `lessons` (`source = 'webuntis'`, `external_id` aus WebUntis). Jeder Lauf kommt in `import_runs`.
- Zugangsdaten nur in `.env.local`, nie im Repo, nie in D1. Das Portal selbst speichert keine WebUntis-Passwörter.
- Die App liest nur aus D1. So läuft die Demo auch ohne WebUntis.

```ts
interface TimetableSource {
  name: 'mock' | 'webuntis' | 'ical'
  fetchLessons(range: { from: string; to: string }): Promise<LessonInput[]>
}
```
Drei Umsetzungen: `mock` (aus fixtures.json), `webuntis` (JSON-RPC über das npm-Paket), `ical` (falls das Abo existiert). Abbildung: Fach, Lehrperson, Raum, Start, Ende, Zustand (`normal`, `room_changed` mit `original_room`, `cancelled`). SOL-Tage als `sol`.

## Fehlerfall
Wenn der letzte Import alt ist oder fehlgeschlagen, zeigt der Stundenplan das Banner aus dem Design ("WebUntis antwortet gerade nicht", mit Stand des Plans und "Erneut laden") und den letzten Stand.

## Vor dem Einsatz klären
Servername und Schulname der bwd in WebUntis, ob das eigene Konto den Zugriff erlaubt, und ob die Schule mit dem Import für das Projekt einverstanden ist. Siehe `OFFENE-PUNKTE.md`.
