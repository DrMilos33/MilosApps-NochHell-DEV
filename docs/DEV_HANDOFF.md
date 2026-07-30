# DEV- und Portalübergabe

Stand: 30. Juli 2026.

## Metadaten

| Feld | Wert |
| --- | --- |
| App-Key | `daylight` |
| Titel | Noch hell? |
| Kurzbeschreibung | Zeigt für einen gewählten Ort, wie lange es noch hell ist, wann die bürgerliche Dämmerung endet und wann morgen die Sonne aufgeht. |
| Sprache | `de-DE` |
| Konto | keines; vollständig öffentlich |
| Status | unabhängiges öffentliches HTTPS-DEV bereit |
| Externe DEV-URL | `https://drmilos33.github.io/MilosApps-NochHell-DEV/` |
| Lokale DEV-URL | `http://127.0.0.1:4319/` |
| Aktive Portal-DEV-Route | `/apps/daylight` |
| App-Datenbank | keine |
| Production | nicht freigegeben |
| GitHub-Repository | `https://github.com/DrMilos33/MilosApps-NochHell-DEV` |
| Deployte Quellrevision | `f4ee359367f9b89766976a627bc6b9a82719f89f` |
| Pages-Artefaktrevision | `2735413d04d1a300fc67424f3e2e50f3ea0d93e0` |

## Readiness

```text
GET http://127.0.0.1:4319/health.json
```

Extern:

```text
GET https://drmilos33.github.io/MilosApps-NochHell-DEV/health.json
```

Erforderlicher Inhalt:

```json
{
  "status": "ready",
  "appKey": "daylight",
  "version": "0.1.0",
  "environment": "dev",
  "database": false
}
```

Portal und E2E dürfen den Dienst nur akzeptieren, wenn mindestens
`status=ready` und `appKey=daylight` übereinstimmen. Der Start bricht bei einer
Portkollision ab und beendet keinen bestehenden Prozess.

## Vorschaubild

- Datei: `public/portal-preview.png`
- Erzeugung: `pnpm preview:capture`
- Rechte: ausschließlich Screenshot der eigenen `Noch hell?`-Oberfläche;
  keine fremden Bildassets oder Kartenkacheln.
- OpenStreetMap-Attribution betrifft nur Suchdaten und ist in der laufenden App
  sichtbar; sie ist nicht Bestandteil des Vorschaubildmotivs.

## Portalvertrag und Rollback

Bekannter Portalvertrag:

- Portal-Branch `codex/portal-dev-integration-contract`
- Portal-Commit `708669c`
- Datei `DEV_APP_INTEGRATION_CONTRACT.md`

Portal & Identity hat die DEV-Integration am 30. Juli 2026 final abgenommen.
Der Portal-Integrationscommit `eab551a` ist direkter Vorgänger des dabei
aktiven Railway-Stands `e74bc712`. Die Route `/apps/daylight` leitet im
Portal-DEV auf die oben genannte unabhängige HTTPS-DEV-URL weiter. `/apps`
zeigt die Karte „Noch hell?“.

Die Portalprüfung umfasste Direktaufruf, Desktop und 390 Pixel Breite ohne
Login, Browserfehler oder horizontalen Überlauf. Production zeigt die Karte
nicht und blieb unverändert. Der App-Direktaufruf und die App-Readiness bleiben
auch bei einem Portal-Ausfall unabhängig verfügbar.

Der app-eigene Rollback erfolgt durch Zurücksetzen des `gh-pages`-Branches auf
die letzte gesunde Artefaktrevision. Aktuell ist dies
`2735413d04d1a300fc67424f3e2e50f3ea0d93e0`. Die Quellrevision bleibt davon
unberührt. Ein Portal-Rollback gehört ausschließlich dem Portal-Task.

## Verbleibende Blocker und Grenzen

1. Dieses Eigentümer-Task läuft vorübergehend aus dem Workspace-Projekt. Das
   Repository muss als eigenes lokales Codex-Projekt registriert und die
   Fortsetzung dorthin übergeben werden.
2. GitHub Pages besitzt keine eigene App-Datenbank oder Secrets; neue
   Ortssuchen bleiben von der Erreichbarkeit des konfigurierten
   Nominatim-Dienstes abhängig.

Die Portal-DEV-Validierung und -route sind abgeschlossen. Der zugehörige
GitHub-Actions-Lauf scheiterte laut Portal-Task vor dem ersten Step
ausschließlich am Billing-/Spending-Limit; die aktive Railway-Integration
wurde separat live sowie mit lokalen Portaltests validiert. Dies ist kein
Blocker für die aktive `daylight`-DEV-Route.

OpenAI Sites, MilosApps-Production und das Portal-Repository wurden nicht
verändert.
