# Unabhängiges DEV-Deployment

Stand: 1. August 2026.

## Öffentlicher Vertrag

- App-Key: `daylight`
- Umgebung: `DEV`
- Production-Freigabe: `false`
- Login: keiner
- URL: `https://drmilos33.github.io/MilosApps-NochHell-DEV/`
- Health:
  `https://drmilos33.github.io/MilosApps-NochHell-DEV/health.json`
- Repository:
  `https://github.com/DrMilos33/MilosApps-NochHell-DEV`
- Git-Remote:
  `https://github.com/DrMilos33/MilosApps-NochHell-DEV.git`

Die App läuft statisch über GitHub Pages. Pages erzwingt HTTPS und liest den
Root des Branches `gh-pages`. Es gibt keine Shared-Runtime-Abhängigkeit,
App-Datenbank, Portal-Session oder Production-Domain.

## Revisionen und Herkunft

| Rolle | Vollständiger SHA |
| --- | --- |
| Verifizierter App-Quellstand | `6d48e47ad6189cc98a22ca0424da1360c92bf1d6` |
| Gebautes und extern verifiziertes Pages-Artefakt | `2fb055e6b7f4a038142a82309d65a362b2e9ab6f` |
| Vorherige gesunde Quellrevision | `97efdc563e70c01ea4ae31f0d097df111e99e645` |
| Vorherige gesunde Pages-Revision | `53acdf37d08fdb0a21881119d35b6d7bfe390394` |

Das Pages-Artefakt wurde ausschließlich mit `pnpm build` aus der
Quellrevision `6d48e47ad6189cc98a22ca0424da1360c92bf1d6` erzeugt. Der
anschließende Dokumentationscommit wird nicht als anderer App-Build
veröffentlicht.

GitHub Pages meldete die Artefaktrevision am 1. August 2026 um 15:24:23Z
terminal als `built`. Die externe Prüfung umfasste zusätzlich die beiden
app-eigenen CSS-Assets unter einer echten Response-CSP mit
`style-src 'self'`; es gab weder Inline-Ausnahmen noch CSP-Fehler.

Das Zwischenartefakt `e49c6b2242aa4ca73007493fff9f06d149f1360c`
wurde durch die externe Netzgrenzen-QA verworfen und nie als gesunde Revision
dokumentiert.

## Readiness

Die absolute Health-URL antwortet aktuell mit:

```json
{
  "status": "ready",
  "appKey": "daylight",
  "version": "0.4.0",
  "environment": "dev",
  "database": false
}
```

Ein HTTP-200 allein genügt nicht. Verbraucher müssen mindestens
`status=ready`, `appKey=daylight` und `environment=dev` prüfen.

## App-eigener Lifecycle

Ein DEV-Update beginnt immer mit einer ausdrücklich freigegebenen und
vollständig geprüften Quellrevision. Danach:

1. Quellrevision und sauberen Arbeitsbaum bestätigen.
2. `pnpm test:all` und `pnpm build` ausführen.
3. ausschließlich `dist/` in einen neuen `gh-pages`-Artefaktcommit übernehmen;
4. `gh-pages` pushen und den GitHub-Pages-Buildstatus prüfen;
5. Healthcheck sowie frische Smartphone-/Desktop-Smokes gegen HTTPS ausführen;
6. erst danach die neue gesunde Artefaktrevision dokumentieren und an Portal
   sowie Struktur melden.

Quellbranch und `gh-pages` sind bewusst getrennt. GitHub Pages ist der eigene
DEV-Hostingdienst; das Portal ist weder Build- noch Laufzeitvoraussetzung.

## Rollback

Die aktuelle gesunde DEV-Artefaktrevision ist
`2fb055e6b7f4a038142a82309d65a362b2e9ab6f`. Der unmittelbare Rückfallstand ist
die vorherige gesunde Revision
`53acdf37d08fdb0a21881119d35b6d7bfe390394`, gebaut aus
`97efdc563e70c01ea4ae31f0d097df111e99e645`.

Ein Rollback veröffentlicht den Inhalt der vorherigen gesunden
Artefaktrevision erneut als neuen, vorwärts gerichteten `gh-pages`-Commit und
prüft anschließend Pages-Buildstatus, Health-Inhalt und Direktaufruf. Ein
Force-Push ist dafür nicht erforderlich. Der Quellbranch bleibt unverändert.
Portal-Redirects werden ausschließlich durch Portal & Identity zurückgerollt.

## Netzgrenze

Astronomische Berechnung, gewählter Ort und grobe Gerätekoordinaten bleiben
lokal. Eine neue manuelle Ortssuche sendet den eingegebenen Ortsnamen bewusst
an den konfigurierten Nominatim-Endpunkt. Ist das Gerät sicher offline, zeigt
die App ausdrücklich:

> Du bist offline. Ein gespeicherter Ort funktioniert weiterhin.

Scheitert der Fetch, obwohl der Browser seinen Online-Status nicht korrekt
aktualisiert, lautet die sichere Aussage:

> Eine neue Ortssuche braucht eine erreichbare Netzwerkverbindung. Ein
> gespeicherter Ort funktioniert weiterhin.

Damit ist Offline-Wiederöffnung vom netzabhängigen Ermitteln eines neuen Orts
getrennt.

## Nicht verändert

- keine MilosApps-Production-Domain;
- kein OpenAI-Sites-Deployment;
- keine Portaldatei oder Portalroute;
- keine Shared-Runtime-Abhängigkeit;
- keine Datenbank und keine Secrets.
