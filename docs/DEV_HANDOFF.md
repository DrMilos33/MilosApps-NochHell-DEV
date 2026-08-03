# DEV- und Portalübergabe

Stand: 3. August 2026.

## Metadaten

| Feld | Wert |
| --- | --- |
| App-Key | `daylight` |
| Titel | Noch hell? |
| Kurzbeschreibung | Zeigt für einen gewählten Ort, wie lange es noch hell ist, wann die bürgerliche Dämmerung endet und wann morgen die Sonne aufgeht. |
| Sprachen | `de-DE`, `en-GB`; vollständige Umschaltung mit lokaler Persistenz |
| Konto | keines; vollständig öffentlich |
| Status | unabhängiges öffentliches HTTPS-DEV bereit |
| Externe DEV-URL | `https://drmilos33.github.io/MilosApps-NochHell-DEV/` |
| Lokale DEV-URL | `http://127.0.0.1:4319/` |
| Aktive Portal-DEV-Route | `/apps/daylight` |
| App-Datenbank | keine |
| Production | nicht freigegeben |
| GitHub-Repository | `https://github.com/DrMilos33/MilosApps-NochHell-DEV` |
| Deployte Quellrevision | `d5f2d72b66a094b5d96b6029a8e63ec58168037c` |
| Pages-Artefaktrevision | `98265792f5c8ff4fc5ab8e5ac4d63faddfabe55a` |
| Gepinnte Verträge | `public-app-shell-v2.0.3` aus Shared `ed898412306e22c6ae1b10ee8953df29f8acd627`; `public-app-essentials-v1.1.4` aus Shared `b22c94cc6d648fd3052f7d32c9bd80f703094f8d` |

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
  "version": "0.7.0",
  "environment": "dev",
  "database": false
}
```

Portal und E2E dürfen den Dienst nur akzeptieren, wenn mindestens
`status=ready`, `appKey=daylight` und `environment=dev` übereinstimmen. Der
Start bricht bei einer Portkollision ab und beendet keinen bestehenden
Prozess.

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

Nach dem v2.0.3-Shell-Update wurde die unveränderte Portal-DEV-Route erneut
read-only aufgerufen. `https://dev.milos-apps.de/apps/daylight` leitete auf die
exakte unabhängige App-URL weiter. Der Zielstand wies
`appKey=daylight`, `environment=dev`, das DEV-Badge, die vollständige
Sprachumschaltung und den absoluten DEV-Link zu „Alle Apps“ aus. Bei
390 × 844 und 1440 × 900 trat kein horizontaler Überlauf auf. Die frische
App-QA erfolgte ohne Portal-Cookie oder Loginzustand.

Portal & Identity bestätigte anschließend den aktiven Gate-Stand
`9643129b5688e4bd925b3ac198619ac260a61071` und das erfolgreiche
Railway-Staging-Deployment `f82ad853-1134-48cb-a67d-bb05bf754b99`.
Cookie-lose GET- und HEAD-Aufrufe von `/apps/daylight` liefern jeweils HTTP 302
mit exakt der unabhängigen Daylight-DEV-URL als Ziel. App und Health liefern
HTTP 200; die Health-Antwort stimmt mit `ready/daylight/0.3.0/dev` überein.
Portal-CI Run `30703116695` / Job `91377476515` war vollständig erfolgreich.

Aktuell gesund ist `98265792f5c8ff4fc5ab8e5ac4d63faddfabe55a`. Der
app-eigene Rollback veröffentlicht den Inhalt der vorherigen gesunden
Artefaktrevision `f3bae04b8b9e64f8fa3790c0d020504e0c22d2db` als neuen
vorwärts gerichteten `gh-pages`-Commit. Die Quellrevision bleibt davon
unberührt. Ein Portal-Rollback gehört ausschließlich dem Portal-Task.

Der 0.4.0-Stand wurde am 2. August 2026 app-eigen veröffentlicht. GitHub Pages
meldete `b7c9a5511d52b64a6438393acc7d6a399df8129f` terminal als `built`.
Frische Kontexte bestätigten Health `ready/daylight/0.4.0/dev`, Direktaufruf
ohne Login, DE/EN-Persistenz, echte Berlin-Suche, Offline-Wiederöffnung,
strikte Same-Origin-CSP, externe Essentials-Styles sowie Desktop, 390 × 844
und 360 × 800 bei 200 Prozent ohne horizontalen Überlauf.

Portal & Identity revalidierte die bestehende Route anschließend auf dem
aktiven Portalstand `be0e17591bcc58df4317875c36f3a0e1e47f90d0`, dem grünen
CI-Lauf `30746592136` und dem aktiven Railway-Staging-Deployment
`7181c8f8-a30a-450f-a42c-556b74e8859c`. Cookie-lose GET- und HEAD-Aufrufe
liefern jeweils HTTP 302 exakt auf die unabhängige Daylight-DEV-URL; App und
Health liefern HTTP 200 mit `ready/daylight/0.4.0/dev` und `database=false`.
Die Productionroute bleibt HTTP 404. Weder App-Repository noch Daylight-
Deployment wurden durch diese Portalprüfung verändert.

Der kompakte 0.5.0-Stand wurde am 3. August 2026 app-eigen veröffentlicht.
GitHub Pages meldete `4445064d440f0140b2c5c232e4d10f1196fd7d5d`
terminal als `built`, Fehler `null`; gebaut wurde exakt aus
`0ef76e08df2533949fd215b7b5564d4098f73ade`. Frische cookie-lose Kontexte
bestätigten Health `ready/daylight/0.5.0/dev`, echte Berlin-Suche,
Offline-Wiederöffnung, vollständige DE/EN-Persistenz, strikte Same-Origin-CSP,
Desktop, 390 × 844 sowie 360 × 800 bei 200 Prozent ohne horizontalen
Überlauf. `daylight-icon.svg` lieferte HTTP 200, `image/svg+xml` und den zur
Quell-SVG identischen SHA-256
`fe3be26d339687cfcc22809b4c9eeac055166ba512977faa709fa959a1cad645`.
Portal & Identity revalidierte die unveränderte Route anschließend auf
Portal-DEV `bad3ba236096f5643e99ef56ab509b13611e3df2`, dem erfolgreichen
CI-Lauf `30783381444` und dem aktiven Railway-Staging-Deployment
`753d9c63-b3bb-400f-a910-f53f9f45131c`. Cookie-lose GET- und HEAD-Aufrufe von
`/apps/daylight` liefern jeweils HTTP 302 exakt auf die unabhängige App-URL.
App und Health antworten HTTP 200; Health liefert
`application/json; charset=utf-8` und exakt `ready/daylight/0.5.0/dev` mit
`database=false`. Die Productionroute bleibt HTTP 404. App-Repository,
Pages-Artefakt und Production blieben bei der Portalprüfung unverändert.

Der Touchziel-Patch 0.5.1 wurde anschließend aus
`24e8222c40af099f8d7adc25232f6376378e390e` als Pages-Artefakt
`649118c87730e38de157be548ab1aa5feb90b228` veröffentlicht. GitHub Pages Run
`30785833022` war vollständig erfolgreich. Frische cookie-lose Kontexte
bestätigten Health `ready/daylight/0.5.1/dev`, DE/EN-Persistenz,
Offline-Wiederöffnung, strikte CSP und null Überlauf auf Desktop, 390 × 844
sowie 360 × 800 bei 200 Prozent. `Privacy` misst 49,69 × 44 Pixel,
`OpenStreetMap contributors` 152,25 × 44 Pixel. Portal & Identity
revalidierte die bestehende Route anschließend ohne Mutation: cookie-lose GET-
und HEAD-Aufrufe liefern jeweils HTTP 302 exakt auf die unabhängige App-URL,
der direkte App-Aufruf HTTP 200 mit `text/html; charset=utf-8` und Health HTTP
200 mit `application/json; charset=utf-8` sowie exakt
`ready/daylight/0.5.1/dev`, `database=false`. Die Productionroute bleibt HTTP
404. Source, Pages, Portal, Shared und Production blieben unverändert.

Der kompakte Ortssuche-Stand 0.6.0 wurde aus
`e0e1dc95f31fba7dc390d1e4c4cb57663d85193e` als Pages-Artefakt
`f3bae04b8b9e64f8fa3790c0d020504e0c22d2db` veröffentlicht. Der GitHub-Pages-
Run `30793869668` mit Build-Job `91622983482` und Deploy-Job `91623011230`
war vollständig erfolgreich. Die externe cookie-lose Matrix bestätigte Health
`ready/daylight/0.6.0/dev`, echte Berlin-Suche, lokale Vorschläge nach Eingabe,
Offline-Wiederöffnung, DE/EN-Persistenz, strikte CSP sowie Desktop,
390 × 844 und 360 × 800 bei 200 Prozent ohne horizontalen Überlauf. Auf dem
390-Pixel-Profil messen Eingabe und kompakter Gerätestandort jeweils 44 Pixel
Höhe; die Icon-Aktion ist 44 × 44 Pixel groß. Die unveränderte Portalroute
wird nach diesem app-eigenen Handoff separat read-only revalidiert.

Portal & Identity schloss diese Revalidierung anschließend ohne Mutation ab:
Cookie-lose GET- und HEAD-Aufrufe von `https://dev.milos-apps.de/apps/daylight`
liefern jeweils HTTP 302 exakt auf die unabhängige Daylight-DEV-URL. Die App
antwortet HTTP 200 mit `text/html; charset=utf-8`, Health HTTP 200 mit
`application/json; charset=utf-8` und exakt `ready/daylight/0.6.0/dev` sowie
`database=false`. Die Productionroute bleibt HTTP 404. Portalroute, App,
Shared und Production wurden nicht verändert.

Der dynamische Ortssuche-Stand 0.7.0 wurde aus
`d5f2d72b66a094b5d96b6029a8e63ec58168037c` als Pages-Artefakt
`98265792f5c8ff4fc5ab8e5ac4d63faddfabe55a` veröffentlicht. GitHub Pages Run
`30804537717` mit Build-Job `91656693505`, Status-Job `91656720020` und
Deploy-Job `91656720225` war vollständig erfolgreich. Die externe
cookie-lose Matrix bestätigte Health `ready/daylight/0.7.0/dev`, strikte CSP,
korrekte Same-Origin-MIME-Typen, das bytegleiche Loader-SVG, DE/EN-Persistenz,
Offline-Wiederöffnung, Desktop, 390 × 844 sowie 360 × 800 bei 200 Prozent.

Die sichtbare Live-Prüfung lud für `Freib` ohne Enter sechs echte
Open-Meteo-Treffer. Genau eine Shared-Listbox lag statisch im Seitenfluss; auf
360 Pixel Breite maß sie 192 Pixel Höhe, jede Option mindestens 44 Pixel und
das kompakte Gerätestandortziel 44 × 44 Pixel. Ortskarte und anschließende
Tageslichtkarten berührten sich ohne Überlagerung; client/scroll blieb
345/345. Außenklick und Escape schlossen die Liste und entfernten
`aria-activedescendant`; `ArrowDown` markierte den ersten Treffer korrekt.
Die vorhandene Portalroute wird nach diesem app-eigenen Handoff ausschließlich
read-only revalidiert. Production bleibt unverändert und nicht freigegeben.

## Verbleibende Blocker und Grenzen

1. Dieses Eigentümer-Task läuft vorübergehend aus dem Workspace-Projekt. Das
   Repository muss als eigenes lokales Codex-Projekt registriert und die
   Fortsetzung dorthin übergeben werden.
2. GitHub Pages besitzt keine eigene App-Datenbank oder Secrets; neue
   Ortssuchen bleiben von der Erreichbarkeit des konfigurierten
   Nominatim-Dienstes abhängig.

Die Portal-DEV-Validierung und -route sind abgeschlossen. Der historische
Actions-Lauf vom 30. Juli startete wegen des damaligen Billing-/Spending-Limits
keinen Step; die aktuelle Gate-Revision besitzt dagegen den oben genannten
vollständig erfolgreichen CI- und Railway-Nachweis. Dies ist kein Blocker für
die aktive `daylight`-DEV-Route.

Nach dem kompakten App-DEV-Update auf 0.3.1 wurde die unveränderte Portalroute
erneut read-only ohne Cookies geprüft. GET und HEAD liefern weiterhin HTTP 302
auf exakt die unabhängige Daylight-DEV-URL; App und Health antworten HTTP 200,
die aktuelle Health-Identität ist `ready/daylight/0.3.1/dev`. Weder Portalcode
noch Portal-Deployment wurden dafür verändert.

Portal & Identity bestätigte diese Revalidierung anschließend auf dem aktiven
Portal-DEV-Stand `ca84446a263d4fc0d38c177da606ae5ae3cde34c` und dem
Railway-Deployment `59ebcbec-fedc-4cc0-8d17-e59e353278b6`: cookie-lose GET-
und HEAD-Aufrufe liefern exakt denselben Redirect, App und Health HTTP 200 und
die vollständige Health-Antwort für 0.3.1. Daylight verursachte keine
Portalmutation; Production blieb unverändert.

OpenAI Sites, MilosApps-Production und das Portal-Repository wurden nicht
verändert.
