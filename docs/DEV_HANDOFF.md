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
| Status | lokaler DEV-Stand bereit, externes HTTPS-DEV blockiert |
| Lokale DEV-URL | `http://127.0.0.1:4319/` |
| Gewünschte Portalroute | `/apps/daylight` |
| App-Datenbank | keine |
| Production | nicht freigegeben |

## Readiness

```text
GET http://127.0.0.1:4319/health.json
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

Die spätere stabile Portalroute `/apps/daylight` soll ausschließlich auf eine
unabhängige HTTPS-DEV-URL weiterleiten. Die App bleibt ohne Portal-Login
nutzbar. Portal-Ausfall darf Direktaufruf und App-Readiness nicht beeinflussen.
Rollback ist das Entfernen beziehungsweise Zurücksetzen dieses Redirects; das
eigenständige App-Deployment bleibt dabei unberührt.

## Offene Blocker

1. Es gibt kein eingetragenes GitHub-Repository, kein freigegebenes
   Hostingziel und keine DEV-Zugangsdaten. Deshalb kann keine echte
   unabhängige HTTPS-DEV-URL übergeben werden.
2. Sites-Deployment wäre eine Production-URL und ist ohne
   Production-Freigabe nicht zulässig.
3. Die Portalroute darf bis zur echten HTTPS-URL nicht geändert werden.
4. Dieses Eigentümer-Task läuft vorübergehend aus dem Workspace-Projekt. Das
   Repository muss als eigenes lokales Codex-Projekt registriert und die
   Fortsetzung dorthin übergeben werden.

Es wurde keine URL erfunden und kein fremdes Repository verändert.
