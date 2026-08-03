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
| Verifizierter App-Quellstand | `bf65fcf197b1453b05dbb27337c35079b2744c6a` |
| Gebautes und extern verifiziertes Pages-Artefakt | `10cd1c0dd6d9c72ebaddac100a7527aac2f7d056` |
| Vorherige gesunde Quellrevision | `d5f2d72b66a094b5d96b6029a8e63ec58168037c` |
| Vorherige gesunde Pages-Revision | `98265792f5c8ff4fc5ab8e5ac4d63faddfabe55a` |

Das Pages-Artefakt wurde ausschließlich mit `pnpm build` aus der
Quellrevision `bf65fcf197b1453b05dbb27337c35079b2744c6a` erzeugt. Der
anschließende Dokumentationscommit wird nicht als anderer App-Build
veröffentlicht.

GitHub Pages veröffentlichte die Artefaktrevision über den erfolgreichen
Workflow-Run `30815637403` (Build-Job `91692564682`, Deploy-Job
`91692603836`). Die Contract-QA bestätigte Essentials `v1.1.5` am Shared-Pin
`2942132ad3bf6cf39edc9f52ed918de6a230be23`, Shell `v2.0.3`, den bytegenauen
Sechser-Lock und einen echten Windows-Recheckout mit `core.autocrlf=true`.
Der fokussierte Lifecycle-Test hält dasselbe app-eigene Slot-SVG vor dem
Custom-Element-Upgrade verborgen und höchstens 38 × 38 Pixel, während bewusst
verzögerter Shell-Komponenten-CSS sichtbar und höchstens 38 × 38 Pixel sowie
im Endzustand exakt 38 × 38 Pixel. Der getrennte Essentials-Loader bleibt
32 × 32 Pixel. Die frische externe Prüfung bestätigte App und Health ohne
Login, 390 × 844 sowie 360 × 800 ohne horizontalen Überlauf und null
Browserfehler; der lokale 360-Viewport-Test mit 200 Prozent Textzoom blieb
ebenfalls überlauffrei.

Das Zwischenartefakt `e49c6b2242aa4ca73007493fff9f06d149f1360c`
wurde durch die externe Netzgrenzen-QA verworfen und nie als gesunde Revision
dokumentiert.

## Readiness

Die absolute Health-URL antwortet aktuell mit:

```json
{
  "status": "ready",
  "appKey": "daylight",
  "version": "0.7.1",
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
`10cd1c0dd6d9c72ebaddac100a7527aac2f7d056`. Der unmittelbare Rückfallstand ist
die vorherige gesunde Revision
`98265792f5c8ff4fc5ab8e5ac4d63faddfabe55a`, gebaut aus
`d5f2d72b66a094b5d96b6029a8e63ec58168037c`.

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
