# Screens

Jeder Screenshot liegt unter `design/screens/<Name>.png`. Web 1440 breit, Tablet 834, App 390 x 844 im Rahmen.


## Web

| Screenshot | Route | Zustand | Inhalt |
|---|---|---|---|
| BWD-Login | /login | Standard | Logo, Titel, Knopf "Mit Microsoft anmelden", E-Mail-Muster, Links Hilfe und Datenschutz. Rechts dunkle Fläche mit Kacheln (nur Web). |
| BWD-Home | / | Standard | Begrüssung mit Datum und Klasse. Karte "Als Nächstes" (Fach, Zeit, Raum, Lehrperson, Raumänderung). Zeitraster Heute. Schnellzugriffe (Absenz melden, Moodle, Teams, SOL). Offene Absenzen, Neue Noten, Mitteilungen. |
| BWD-Timetable | /stundenplan | Woche | Umschalter Tag/Woche, Link "In WebUntis öffnen". Zeitraster mit Pfeilen. Woche mit Legende. |
| BWD-Timetable-Day | /stundenplan | Tag | Umschalter Tag/Woche, Link "In WebUntis öffnen". Zeitraster mit Pfeilen. Woche mit Legende. |
| BWD-Grades | /noten | Standard | Umschalter Semester. Drei Kennzahlen (Gesamtschnitt, Prüfungen, Ungenügend). Fächerliste mit Kürzel, Lehrperson, Balken, Schnitt. Unter 4.0 in Rot. |
| BWD-Subject | /noten/[fach] | Standard | Brotkrumen, Fach, Lehrperson. Prüfungen mit Datum, Gewicht, Klassenschnitt, Note. Karte Schnitt. Verlauf. |
| BWD-SOL | /sol | Standard | Aufträge: Filter nach Fach, pro Fach Liste mit Code, Titel, Minuten, Fortschritt, SharePoint-Link, Download. "Block herunterladen". |
| BWD-SOL-Calendar | /sol | Standard | Kalender: Zeitraster des SOL-Tags mit "Mein Plan" und "Lehrpersonen". Formular Einplanen (Auftrag, SOL-Tag, Von, Bis, Notiz). |
| BWD-SOL-Calendar-Today | /sol | SOL-Tag heute, Jetzt-Linie | Kalender: Zeitraster des SOL-Tags mit "Mein Plan" und "Lehrpersonen". Formular Einplanen (Auftrag, SOL-Tag, Von, Bis, Notiz). |
| BWD-SOL-Portfolio | /sol | Standard | Portfolio: Einträge pro SOL-Tag mit Check-in und Check-out, Formular für den nächsten SOL-Tag. |
| BWD-Absences | /absenzen | Standard | Drei Kennzahlen (Offen, Unentschuldigt, Entschuldigt). Liste mit Datum, Lektionen, Frist, Status, Knopf "Entschuldigen". Dialog: Datum mit Frist, Lektionen wählen, Grund, Bestätigung anhängen, Absenden. |
| BWD-Absence-Report | /absenzen | Dialog offen | Drei Kennzahlen (Offen, Unentschuldigt, Entschuldigt). Liste mit Datum, Lektionen, Frist, Status, Knopf "Entschuldigen". Dialog: Datum mit Frist, Lektionen wählen, Grund, Bestätigung anhängen, Absenden. |
| BWD-Documents | /dokumente | Standard | Suche, Filter als Text-Tabs, Gruppen (Prüfungspläne, Formulare, Reglemente, Merkblätter), Zeile mit Typ, Titel, Grösse, Öffnen, Herunterladen. |
| BWD-Links | /links | Standard | Gruppen Microsoft 365, Lernen, Schule. Kachel mit Kürzel, Name, Zweck. Öffnet extern. |
| BWD-News | /mitteilungen | Standard | Liste, angeheftete zuerst, ungelesene mit Punkt. Teaser, Absender, Datum. |
| BWD-Article | /mitteilungen/[id] | Standard | Brotkrumen, Titel, Absender, Datum, Text, Anhang. |
| BWD-Notifications | /benachrichtigungen | Standard | Gruppen Heute, Gestern, Diese Woche. Icon, Titel, Text, Zeit. "Alle als gelesen markieren". |
| BWD-Profile | /profil | Standard | Name, Klasse, E-Mail. Schalter für Benachrichtigungen. Konto (Klasse, Lehrgang, Klassenlehrperson, Anmeldung). Design System/Hell/Dunkel. Abmelden. |
| BWD-Dark-Home | / | dunkel | Begrüssung mit Datum und Klasse. Karte "Als Nächstes" (Fach, Zeit, Raum, Lehrperson, Raumänderung). Zeitraster Heute. Schnellzugriffe (Absenz melden, Moodle, Teams, SOL). Offene Absenzen, Neue Noten, Mitteilungen. |
| BWD-Login-Error | /login | falsches Konto | Logo, Titel, Knopf "Mit Microsoft anmelden", E-Mail-Muster, Links Hilfe und Datenschutz. Rechts dunkle Fläche mit Kacheln (nur Web). |
| BWD-Loading | / | lädt | Begrüssung mit Datum und Klasse. Karte "Als Nächstes" (Fach, Zeit, Raum, Lehrperson, Raumänderung). Zeitraster Heute. Schnellzugriffe (Absenz melden, Moodle, Teams, SOL). Offene Absenzen, Neue Noten, Mitteilungen. |
| BWD-Timetable-Error | /stundenplan | Fehler WebUntis | Umschalter Tag/Woche, Link "In WebUntis öffnen". Zeitraster mit Pfeilen. Woche mit Legende. |
| BWD-Grades-Empty | /noten | 2. Semester, leer | Umschalter Semester. Drei Kennzahlen (Gesamtschnitt, Prüfungen, Ungenügend). Fächerliste mit Kürzel, Lehrperson, Balken, Schnitt. Unter 4.0 in Rot. |
| BWD-Documents-Empty | /dokumente | Suche ohne Treffer | Suche, Filter als Text-Tabs, Gruppen (Prüfungspläne, Formulare, Reglemente, Merkblätter), Zeile mit Typ, Titel, Grösse, Öffnen, Herunterladen. |
| BWD-Absence-Sent | /absenzen | gesendet, Toast | Drei Kennzahlen (Offen, Unentschuldigt, Entschuldigt). Liste mit Datum, Lektionen, Frist, Status, Knopf "Entschuldigen". Dialog: Datum mit Frist, Lektionen wählen, Grund, Bestätigung anhängen, Absenden. |
| BWD-404 | 404 | Standard | 404, ein Satz, Knöpfe zur Übersicht, Stundenplan, Dokumente. |

## Tablet

| Screenshot | Route | Zustand | Inhalt |
|---|---|---|---|
| BWD-Tablet-Home | / | Standard | Begrüssung mit Datum und Klasse. Karte "Als Nächstes" (Fach, Zeit, Raum, Lehrperson, Raumänderung). Zeitraster Heute. Schnellzugriffe (Absenz melden, Moodle, Teams, SOL). Offene Absenzen, Neue Noten, Mitteilungen. |
| BWD-Tablet-Timetable | /stundenplan | Woche | Umschalter Tag/Woche, Link "In WebUntis öffnen". Zeitraster mit Pfeilen. Woche mit Legende. |

## App

| Screenshot | Route | Zustand | Inhalt |
|---|---|---|---|
| BWD-App-Login | /login | Standard | Logo, Titel, Knopf "Mit Microsoft anmelden", E-Mail-Muster, Links Hilfe und Datenschutz. Rechts dunkle Fläche mit Kacheln (nur Web). |
| BWD-App-Home | / | Standard | Begrüssung mit Datum und Klasse. Karte "Als Nächstes" (Fach, Zeit, Raum, Lehrperson, Raumänderung). Zeitraster Heute. Schnellzugriffe (Absenz melden, Moodle, Teams, SOL). Offene Absenzen, Neue Noten, Mitteilungen. |
| BWD-App-Timetable | /stundenplan | Tag | Umschalter Tag/Woche, Link "In WebUntis öffnen". Zeitraster mit Pfeilen. Woche mit Legende. |
| BWD-App-Timetable-Week | /stundenplan | Woche | Umschalter Tag/Woche, Link "In WebUntis öffnen". Zeitraster mit Pfeilen. Woche mit Legende. |
| BWD-App-Grades | /noten | Standard | Umschalter Semester. Drei Kennzahlen (Gesamtschnitt, Prüfungen, Ungenügend). Fächerliste mit Kürzel, Lehrperson, Balken, Schnitt. Unter 4.0 in Rot. |
| BWD-App-Subject | /noten/[fach] | Standard | Brotkrumen, Fach, Lehrperson. Prüfungen mit Datum, Gewicht, Klassenschnitt, Note. Karte Schnitt. Verlauf. |
| BWD-App-More | (App) Tab Mehr | Standard | Liste der übrigen Bereiche mit Zähler. |
| BWD-App-SOL | /sol | Standard | Aufträge: Filter nach Fach, pro Fach Liste mit Code, Titel, Minuten, Fortschritt, SharePoint-Link, Download. "Block herunterladen". |
| BWD-App-SOL-Calendar | /sol | Standard | Kalender: Zeitraster des SOL-Tags mit "Mein Plan" und "Lehrpersonen". Formular Einplanen (Auftrag, SOL-Tag, Von, Bis, Notiz). |
| BWD-App-SOL-Calendar-Today | /sol | SOL-Tag heute, Jetzt-Linie | Kalender: Zeitraster des SOL-Tags mit "Mein Plan" und "Lehrpersonen". Formular Einplanen (Auftrag, SOL-Tag, Von, Bis, Notiz). |
| BWD-App-SOL-Plan-Sheet | /sol | Sheet Einplanen | Kalender: Zeitraster des SOL-Tags mit "Mein Plan" und "Lehrpersonen". Formular Einplanen (Auftrag, SOL-Tag, Von, Bis, Notiz). |
| BWD-App-SOL-Portfolio | /sol | Standard | Portfolio: Einträge pro SOL-Tag mit Check-in und Check-out, Formular für den nächsten SOL-Tag. |
| BWD-App-SOL-Portfolio-Sheet | /sol | Sheet Eintrag | Portfolio: Einträge pro SOL-Tag mit Check-in und Check-out, Formular für den nächsten SOL-Tag. |
| BWD-App-Absences | /absenzen | Standard | Drei Kennzahlen (Offen, Unentschuldigt, Entschuldigt). Liste mit Datum, Lektionen, Frist, Status, Knopf "Entschuldigen". Dialog: Datum mit Frist, Lektionen wählen, Grund, Bestätigung anhängen, Absenden. |
| BWD-App-Absence-Report | /absenzen | Dialog offen | Drei Kennzahlen (Offen, Unentschuldigt, Entschuldigt). Liste mit Datum, Lektionen, Frist, Status, Knopf "Entschuldigen". Dialog: Datum mit Frist, Lektionen wählen, Grund, Bestätigung anhängen, Absenden. |
| BWD-App-Documents | /dokumente | Standard | Suche, Filter als Text-Tabs, Gruppen (Prüfungspläne, Formulare, Reglemente, Merkblätter), Zeile mit Typ, Titel, Grösse, Öffnen, Herunterladen. |
| BWD-App-Links | /links | Standard | Gruppen Microsoft 365, Lernen, Schule. Kachel mit Kürzel, Name, Zweck. Öffnet extern. |
| BWD-App-News | /mitteilungen | Standard | Liste, angeheftete zuerst, ungelesene mit Punkt. Teaser, Absender, Datum. |
| BWD-App-Article | /mitteilungen/[id] | Standard | Brotkrumen, Titel, Absender, Datum, Text, Anhang. |
| BWD-App-Notifications | /benachrichtigungen | Standard | Gruppen Heute, Gestern, Diese Woche. Icon, Titel, Text, Zeit. "Alle als gelesen markieren". |
| BWD-App-Profile | /profil | Standard | Name, Klasse, E-Mail. Schalter für Benachrichtigungen. Konto (Klasse, Lehrgang, Klassenlehrperson, Anmeldung). Design System/Hell/Dunkel. Abmelden. |
| BWD-App-Dark-Home | / | dunkel | Begrüssung mit Datum und Klasse. Karte "Als Nächstes" (Fach, Zeit, Raum, Lehrperson, Raumänderung). Zeitraster Heute. Schnellzugriffe (Absenz melden, Moodle, Teams, SOL). Offene Absenzen, Neue Noten, Mitteilungen. |
| BWD-App-Login-Error | /login | falsches Konto | Logo, Titel, Knopf "Mit Microsoft anmelden", E-Mail-Muster, Links Hilfe und Datenschutz. Rechts dunkle Fläche mit Kacheln (nur Web). |
| BWD-App-Loading | / | lädt | Begrüssung mit Datum und Klasse. Karte "Als Nächstes" (Fach, Zeit, Raum, Lehrperson, Raumänderung). Zeitraster Heute. Schnellzugriffe (Absenz melden, Moodle, Teams, SOL). Offene Absenzen, Neue Noten, Mitteilungen. |
| BWD-App-Timetable-Error | /stundenplan | Fehler WebUntis | Umschalter Tag/Woche, Link "In WebUntis öffnen". Zeitraster mit Pfeilen. Woche mit Legende. |
| BWD-App-Grades-Empty | /noten | 2. Semester, leer | Umschalter Semester. Drei Kennzahlen (Gesamtschnitt, Prüfungen, Ungenügend). Fächerliste mit Kürzel, Lehrperson, Balken, Schnitt. Unter 4.0 in Rot. |
| BWD-App-Absence-Sent | /absenzen | gesendet, Toast | Drei Kennzahlen (Offen, Unentschuldigt, Entschuldigt). Liste mit Datum, Lektionen, Frist, Status, Knopf "Entschuldigen". Dialog: Datum mit Frist, Lektionen wählen, Grund, Bestätigung anhängen, Absenden. |
| BWD-App-404 | 404 | Standard | 404, ein Satz, Knöpfe zur Übersicht, Stundenplan, Dokumente. |

## Texte
Alle Texte der Oberfläche stehen im Prototyp und in den Screenshots. Genau so übernehmen. Texte für Fehler: "WebUntis antwortet gerade nicht." mit Stand des Plans, "Dieses Konto gehört nicht zur bwd.", "Noch keine Noten im 2. Semester.", "Diese Seite gibt es nicht.", Toast "Absenz gesendet. Deine Klassenlehrperson prüft sie."
