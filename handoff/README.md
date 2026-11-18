# bwd Portal: Handoff für Claude Code

Stand 16.11.2026. Alles, was es braucht, um das Portal zu bauen.

| Ordner | Inhalt |
|---|---|
| `CLAUDE.md` | Projektregeln. Gehört ins Wurzelverzeichnis des neuen Repos. |
| `docs/BRIEF.md` | Was gebaut wird, für wen, Umfang, Entscheide. |
| `docs/ARCHITECTURE.md` | Monorepo, Next.js, Expo, Cloudflare D1, Mock-Login, API. |
| `docs/SCREENS.md` | Jeder Screen mit Route, Inhalt, Zuständen und Screenshot. |
| `docs/DESIGN.md` | Tokens, Komponenten, Zeitraster, Standards 2026. |
| `docs/WEBUNTIS.md` | Stundenplan-Import: was möglich ist und wie. |
| `docs/KICKOFF.md` | Bauplan in Phasen mit Abnahmekriterien und dem ersten Prompt. |
| `docs/OFFENE-PUNKTE.md` | Platzhalter und Fragen an die Schule. |
| `design/tokens.json` | Farben, Schrift, Radien, Abstände, Masse. |
| `design/screens/` | 56 Screenshots: 26 Web, 2 Tablet, 28 App. |
| `prototype/` | Klickbarer Prototyp: `web.html`, `web-login.html`, `app.html`. Im Browser öffnen, läuft offline. Die `reference-*` Dateien sind die Quelle des Prototyps, nur zum Nachschlagen. |
| `data/fixtures.json` | Erfundene Beispieldaten für den Mock. |
| `data/schema.sql` | Vorschlag für das D1-Schema. |

## Start
1. Neues Repo anlegen, diesen Ordner als `handoff/` hineinlegen, `CLAUDE.md` ins Wurzelverzeichnis kopieren.
2. Claude Code im Repo starten und den Prompt aus `docs/KICKOFF.md` einfügen.
