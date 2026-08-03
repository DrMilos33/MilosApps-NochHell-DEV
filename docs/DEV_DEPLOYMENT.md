# Unabhängiges DEV-Deployment

Stand: 3. August 2026.

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
| Verifizierter App-Quellstand | `eb0af83ef0f9234819107ceab19a729895850021` |
| Gebautes und extern verifiziertes Pages-Artefakt | `d13eb3c842978a8e556b79a58e2ab82417e9cab1` |
| Vorherige gesunde Quellrevision | `bf65fcf197b1453b05dbb27337c35079b2744c6a` |
| Vorherige gesunde Pages-Revision | `10cd1c0dd6d9c72ebaddac100a7527aac2f7d056` |

Das Pages-Artefakt wurde ausschließlich mit `pnpm build` aus der
Quellrevision `eb0af83ef0f9234819107ceab19a729895850021` erzeugt. Der
anschließende Dokumentationscommit wird nicht als anderer App-Build
veröffentlicht.

GitHub Pages veröffentlichte die Artefaktrevision über den erfolgreichen
Workflow-Run `30820540034` (Build-Job `91709072493`, Status-Job
`91709150651`, Deploy-Job `91709150678`). Der neue Erststart zeigt Köln als
nicht gespeicherten Standardort sofort mit berechneter Tageslichtantwort. Die
Aktualisierungszeit besitzt eine kontrastreiche eigene Fläche; die vier
Ereignisse bilden eine kompakte zusammenhängende Leiste statt vier großer
Einzelkarten. 30 Unit-/Fachtests, 52 Chromium- und 43 Mobile-Chromium-Fälle
sowie drei fokussierte Firefox-Fälle bestanden. Die frische externe Matrix
bestätigte No-Login, DE/EN-Persistenz, echte Ortssuche, Offline-Wiederöffnung,
strikte CSP, 1440 × 900, 390 × 844 sowie 360 × 800 bei 200 Prozent ohne
horizontalen Überlauf und ohne Browserfehler.

Das Zwischenartefakt `e49c6b2242aa4ca73007493fff9f06d149f1360c`
wurde durch die externe Netzgrenzen-QA verworfen und nie als gesunde Revision
dokumentiert.

## Readiness

Die absolute Health-URL antwortet aktuell mit:

```json
{
  "status": "ready",
  "appKey": "daylight",
  "version": "0.8.0",
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
`d13eb3c842978a8e556b79a58e2ab82417e9cab1`. Der unmittelbare Rückfallstand ist
die vorherige gesunde Revision
`10cd1c0dd6d9c72ebaddac100a7527aac2f7d056`, gebaut aus
`bf65fcf197b1453b05dbb27337c35079b2744c6a`.

Ein Rollback veröffentlicht den Inhalt der vorherigen gesunden
Artefaktrevision erneut als neuen, vorwärts gerichteten `gh-pages`-Commit und
prüft anschließend Pages-Buildstatus, Health-Inhalt und Direktaufruf. Ein
Force-Push ist dafür nicht erforderlich. Der Quellbranch bleibt unverändert.
Portal-Redirects werden ausschließlich durch Portal & Identity zurückgerollt.

## Netzgrenze

Astronomische Berechnung, gewählter Ort und grobe Gerätekoordinaten bleiben
lokal. Ab drei Zeichen sendet die App den eingegebenen Suchtext bewusst an den
konfigurierten Open-Meteo-Vorschlagsendpunkt. Die genauere manuelle Suche
sendet ihn erst nach Enter oder „Suchen“ an den konfigurierten Nominatim-
Endpunkt. Ist das Gerät sicher offline, zeigt die App ausdrücklich:

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
