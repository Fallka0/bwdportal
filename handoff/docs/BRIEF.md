# Brief

## Was
Ein Portal für Lernende der bwd Bern. Es bündelt, was heute auf WebUntis, SOL-UP (solup.bwdbern.ch), Moodle, SharePoint und die Website verteilt ist: Stundenplan, Noten, Absenzen, SOL, Mitteilungen, Dokumente und Links. Als Website und als App für iOS und Android.

## Rahmen
- Schulprojekt mit Abgabe. Es muss vorführbar sein und sauber dokumentiert.
- Kein offizielles Produkt der Schule. Alle Daten im Projekt sind erfunden, ausser dem Stundenplan-Import (siehe `WEBUNTIS.md`).
- Nur Deutsch.

## Entscheide
| Thema | Entscheid |
|---|---|
| Web | Next.js (App Router, TypeScript) |
| App | Expo (React Native, TypeScript) |
| Gemeinsam | Ein Paket mit Typen, Zod-Schemas, Formatierung, Tokens, API-Client |
| Hosting | Cloudflare (Workers), Datenbank D1, Dateien R2 |
| Login | Vorerst Mock-Login. Microsoft-Login später, die Stelle dafür ist vorbereitet. |
| Stundenplan | Import aus WebUntis, wenn machbar. Sonst Beispieldaten. Immer hinter einer Schnittstelle. |
| Noten, Absenzen, SOL, Mitteilungen, Dokumente | Eigene Tabellen in D1, mit Beispieldaten gefüllt |

## Umfang (alle im Design vorhanden)
Login, Übersicht, Stundenplan (Tag, Woche), Noten, Fach, Absenzen mit "Absenz entschuldigen", SOL (Aufträge, Kalender mit Einplanen, Portfolio mit Check-in und Check-out), Mitteilungen, Mitteilung, Dokumente mit Suche und Filter, Links, Benachrichtigungen, Profil und Einstellungen, 404. Hell und dunkel. Zustände: lädt, leer, Fehler.

## Nicht im Umfang
Ansicht für Lehrpersonen oder Verwaltung, Push-Nachrichten in echt, echte Noten oder Absenzen aus Schulsystemen, weitere Sprachen.

## Abgabe
Laufende Web-Version mit Link, App in Expo Go oder als Build, Repo mit README, kurze Doku (Ziel, Architektur, Datenmodell, Tests, Reflexion). Was die Schule genau verlangt, steht in `OFFENE-PUNKTE.md` als Frage.
