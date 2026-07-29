# Noch hell? Repository-Regeln

## Zuständigkeit

Dieses Repository enthält ausschließlich `Noch hell?` mit dem App-Key
`daylight`. Fachlogik anderer MilosApps gehört nicht hierher.

## Portfolio-Verträge

- App-Klasse: `öffentlich`
- Plattformen: `Web, mobil und Desktop`
- Datenhaltung: `gewählter Ort oder grobe Koordinaten lokal; keine App-Datenbank`
- Deployment: `eigener DEV-Dienst; Production nicht freigegeben`
- Gemeinsame Abhängigkeiten: `keine`

Wenn der lokale MilosApps Workspace verfügbar ist, vor appübergreifenden
Änderungen die Register-, Portfolio-, Identity- und
`docs/PORTFOLIO_LEARNINGS.md`-Dokumente dort lesen.

## Arbeitsgrenzen

- Nur Dateien dieses Repositorys ändern.
- Keine Datenbank, Cookies, Secrets oder Quellcode mit anderen Apps teilen.
- Standort nur nach Nutzeraktion anfragen und nicht in Teil-URLs übernehmen.
- Orts- und Zeitzonendaten auf Lizenz, Attribution und Genauigkeit prüfen.
- DEV und Production strikt trennen; Production nur nach ausdrücklicher
  Freigabe verändern.

## Qualität

- astronomische Berechnung, Zeitzonen und Grenzfälle automatisiert testen;
- nach dem ersten lauffähigen Stand mindestens zwei QA-/Verbesserungsrunden
  durchführen;
- Smartphone, Desktop, Tastatur, Screenreader, hohen Zoom, verweigerte Ortung
  und Offlinezustand prüfen;
- allgemeine Erkenntnisse in `docs/LEARNINGS.md` festhalten und zurückmelden.
