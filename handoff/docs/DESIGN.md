# Design

Quelle der Wahrheit: die Screenshots in `design/screens/`, der Prototyp in `prototype/` und `design/tokens.json`. Bei Widerspruch gilt der Screenshot.

## Grundlagen
- Schrift: Unbounded (300, 400) für Titel und grosse Zahlen, Laufweite -0.045em. Manrope (400 bis 700) für alles andere. Zahlen immer `tabular-nums`. Schriften selbst hosten (Web: `next/font`, App: `expo-font`).
- Farben: neutrale Flächen (`bg`, `panel`, `panel2`, `raise`), Tinte `ink`, Sekundärtext `text2`. Akzent ist das dunkle Violett `btn`. Farbe trägt nur Bedeutung: `warn` offen oder geändert, `err` ungenügend oder entfällt, `ok` selten, `now` für die Jetzt-Linie.
- Radien: Karten 18, grosse Karte "Als Nächstes" 24, Felder und Blöcke 10 bis 14, Knöpfe rund.
- Rahmen: Das Web sitzt in einem dunklen Rahmen von 14 px mit dunkler Sidebar (248 px), der Inhalt ist die helle Fläche.
- Dunkel: gleiche Struktur, Tokens aus `color.dark`. Stundenplan-Blöcke werden hell mit dunkler Schrift.

## Layout
- Web ab 901 px: Sidebar mit Gruppen "Schule" und "Infos", oben Suche, Datum, Design-Schalter, Glocke.
- 600 bis 900 px: Sidebar als Icon-Leiste.
- Unter 600 px und App: Kopfzeile mit Logo, Glocke, Avatar. Tab-Bar mit Übersicht, Stundenplan, Noten, Mehr. "Mehr" führt zu SOL, Absenzen, Mitteilungen, Dokumente, Links, Benachrichtigungen, Profil. Unterseiten haben "Zurück" statt Logo.
- Dialoge: im Web zentrierter Dialog, in der App ein Sheet von unten (Absenz entschuldigen, Einplanen, Portfolio-Eintrag).

## Komponenten
| Komponente | Regeln |
|---|---|
| Knopf | Höhe 44 (klein 36), rund. Primär `btn`, sekundär mit Linie, Ghost ohne Fläche. Gedrückt: scale .98. |
| Karte | `panel`, Radius 18, kein Schatten, keine Linie. |
| Status | Ein Wort in Farbe, kein Hintergrund. Offen = `warn`, Unentschuldigt = `err`, Entschuldigt = grau. |
| Filter | Text-Tabs mit Unterstrich, keine Chips. |
| Segment | Umschalter Tag/Woche, Semester, Design. Aktiv = `raise`. |
| Listenzeile | Titel 14/600, darunter Sekundärzeile 12, rechts Wert oder Pfeil. Trennlinie `rule`. |
| KPI | Beschriftung 12 grau, Zahl in Unbounded. Keine getönten Kacheln. |
| Zähler | Kleiner Punkt mit Zahl an Glocke und Navigation, Farbe `live`. |
| Banner | Nur für Störungen (WebUntis nicht erreichbar) und Login-Fehler. |
| Skeleton | Graue Balken in der Form des Inhalts, leichtes Pulsieren, bei reduzierter Bewegung statisch. |
| Toast | Unten, ein Satz, verschwindet von selbst, `role="status"`. |

## Zeitraster (eine Komponente für alle Stundenpläne)
- 1.1 px pro Minute ab 08:00, Stundenlinien alle 66 px, Achse links mit Uhrzeiten (Web 52 px, App 40 px).
- Kopf: Pfeile links und rechts, Titel in Unbounded, darunter eine Zeile (Datum oder Woche und Klasse).
- Block: Fläche `btn`, Schrift hell, Radius 10. Fach fett, Raum und Kürzel daneben, Zeit darunter kleiner. In der Wochenansicht Kurzname und Raum.
- Vergangen: 50 % Deckkraft. Raumänderung: Text "B 015 statt A 207" in `live`. Entfällt: graue Fläche, Fach durchgestrichen, Wort "Entfällt" in `err`. SOL-Tag: graue Fläche.
- "Mittag": graues Band über alle Spalten.
- Jetzt-Linie: 2 px in `now` über alle Spalten, links ein Etikett mit der Uhrzeit. Nur am heutigen Tag, jede Minute neu.
- SOL-Kalender: gleiche Optik, zwei Bereiche "Mein Plan" (dunkle Blöcke) und "Lehrpersonen" (graue Blöcke in Spuren).
- Übersicht: gleiche Komponente, nur heute, bis 15:00.

## Standards 2026 (Pflicht)
- Kontrast mindestens 4.5:1 für Text, 3:1 für Bedienelemente. `prefers-contrast: more` verstärkt Linien und Sekundärtext.
- Fokus: 2 px Ring in `focus` mit 2 px Abstand, nur bei Tastatur (`:focus-visible`). Skip-Link zum Inhalt.
- Touch-Ziele ab 44 px, in der App Safe-Area beachten, Tab-Bar über dem Home-Indikator.
- Bewegung: 80 bis 120 ms, nur Farbe, Deckkraft, transform. Seitenwechsel im Web mit View Transitions als kurze Überblendung. `prefers-reduced-motion` schaltet alles ab.
- Design-Wahl: System, Hell, Dunkel. Kein Aufblitzen beim Laden (Theme vor dem ersten Rendern setzen), `color-scheme` gesetzt.
- Titel mit `text-wrap: balance`, Lauftext mit `pretty`. Keine Texte unter 12 px ausser Zählern, Achsen und dem Wochenraster der App.
- Zustände für jede Datenansicht: lädt, leer, Fehler. Formulare mit Label, Fehlertext am Feld, Absende-Knopf zeigt Fortschritt.
- Web: eigener Seitentitel pro Route ("Noten · bwd Portal"), Favicon, OG-Bild, 404-Seite, `lang="de-CH"`. Vorlagen dafür auf dem Board "BWD-Meta" im Canvas.
- Leistung: Schriften als woff2 mit `font-display: swap`, Bilder in modernen Formaten, kein Layout-Sprung beim Laden.
- App: native Gesten (Zurück-Wischen, Sheet nach unten ziehen), haptische Rückmeldung bei Absenden, Pull-to-Refresh auf Listen.
