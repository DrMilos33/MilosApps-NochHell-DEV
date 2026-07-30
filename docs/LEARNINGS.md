# Noch-hell-Erkenntnisse

Die Einträge enthalten keine Nutzerdaten. Allgemein relevante Punkte werden
zusätzlich per Task-Nachricht an Struktur & Architektur sowie Ideen & Portfolio
gemeldet; das Workspace-Dokument `docs/PORTFOLIO_LEARNINGS.md` wird von diesem
App-Task nicht verändert.

## 2026-07-30: Ein lokaler Kalendertag ist keine feste UTC-Spanne

- **Evidenz:** Berlin hat am 29. März 2026 einen 23-Stunden-Tag und am
  25. Oktober 2026 einen 25-Stunden-Tag. In `Pacific/Kiritimati` ist
  1. Januar 2026 bereits ab `2025-12-31T10:00:00Z`.
- **Folge:** Ereignisse werden zwischen den tatsächlichen UTC-Grenzen des
  lokalen Datums gesucht. „Morgen“ wird als lokaler Kalendertag addiert, nicht
  als `+24 Stunden`.
- **Regression:** `tests/unit/timezone.test.ts` und die Oberflächentests für
  beide Berliner Zeitumstellungen sowie den Datumssprung.
- **Commit:** `2b5ffe7`, erweitert in `a259a5f`.
- **Gültigkeitsgrenze:** Die Laufzeitdaten stammen aus `Intl`/der IANA-Zeitzone
  des Browsers; sehr alte oder zukünftige Regeländerungen hängen von dessen
  Aktualität ab.

## 2026-07-30: Standortdatenschutz beginnt vor der Speicherung

- **Evidenz:** Browser-Geolocation liefert genaue Koordinaten. Eine reine
  lokale Speicherung verhindert nicht, dass später versehentlich Präzision in
  UI, Logs oder URLs gelangt.
- **Folge:** Gerätekoordinaten werden sofort auf zwei Nachkommastellen gerundet.
  Der gerundete Datensatz bleibt lokal, wird nicht rückwärts geocodiert und
  gelangt nicht in die Seiten-URL. Manuelle Ortssuche bleibt gleichwertig.
- **Regression:** E2E-Fälle für erlaubt, verweigert/abgebrochen, technisch nicht
  verfügbar, Timeout, lokales Löschen und URL-Prüfung.
- **Commit:** `2b5ffe7`.
- **Gültigkeitsgrenze:** Eine manuelle Suchanfrage übermittelt den eingegebenen
  Ortsnamen bewusst an den konfigurierten Geocoder; die Oberfläche erklärt
  diesen Datenfluss.

## 2026-07-30: Fehlende Sonnenereignisse sind fachliche Zustände

- **Evidenz:** USNO-Referenzen bestätigen für Tromsø am 21. Juni Polartag, am
  21. Dezember Polarnacht mit bürgerlicher Dämmerung sowie für Longyearbyen am
  21. Dezember auch das Ausbleiben bürgerlicher Dämmerung.
- **Folge:** Die App erfindet keine Uhrzeit. Sie unterscheidet durchgehend über
  dem Horizont, durchgehend darunter, Dämmerungs-Crossings und kein Crossing am
  lokalen Datum.
- **Regression:** `tests/unit/astronomy.test.ts` und die Grenzfallansichten in
  `tests/e2e/daylight.spec.ts`.
- **Commit:** `2b5ffe7`, Oberflächenmatrix erweitert in `a259a5f`.
- **Gültigkeitsgrenze:** Berechnete Zeiten sind Näherungen; Refraktion,
  Geländehorizont und Wetter können die beobachtete Helligkeit verschieben.

## 2026-07-30: Service-Worker-Registrierung darf das `load`-Ereignis nicht verpassen

- **Evidenz:** Im ersten Offline-Test wurde der App-Code nach dem
  `load`-Ereignis ausgeführt; ein ausschließlich dort registrierter Listener
  lief nicht mehr und der Offline-Cache blieb leer.
- **Folge:** Bei `document.readyState === "complete"` wird sofort registriert,
  sonst einmalig beim `load`-Ereignis.
- **Regression:** E2E-Wiederöffnung des gespeicherten Orts im Offline-Modus.
- **Commit:** `2b5ffe7`.
- **Gültigkeitsgrenze:** Die Erstladung und eine neue Ortssuche benötigen
  weiterhin Netz; nur der App-Shell und lokale Ortsdaten sind offline nutzbar.

## 2026-07-30: Readiness muss die App-Identität beweisen

- **Evidenz:** Ein früher Testlauf akzeptierte auf Port 4173 eine fremde App,
  weil ein generischer HTTP-200 als bereit galt.
- **Folge:** `daylight` verwendet exklusiv Port 4319 mit `strictPort`.
  Readiness verlangt `status=ready` und `appKey=daylight`;
  `reuseExistingServer` ist deaktiviert. Fremde Prozesse werden nicht beendet.
- **Regression:** Healthcheck-E2E-Test sowie
  `scripts/check-readiness.mjs` und `scripts/e2e-server.mjs`.
- **Commit:** `2b5ffe7`; normaler DEV-Start, Kollisionsnachweis und Übergabe in
  `8071fe2`.
- **Gültigkeitsgrenze:** Die Identitätsprüfung schützt die lokale
  Prozessauswahl; sie ersetzt keine Authentifizierung eines späteren
  Deployment-Systems.

## 2026-07-30: Vollständige Lokalisierung braucht Fachzustände statt fertiger Sätze

- **Evidenz:** Die frühere Tageslichtlogik gab deutsche Antwortsätze zurück.
  Eine bloße Shell-Übersetzung hätte dadurch Resthelligkeit, Polartag,
  Polarnacht und Resume-Zustände teilweise deutsch belassen.
- **Folge:** Die Berechnung liefert sprachneutrale Zustandskennungen und
  Zeitziele. Erst die UI formatiert daraus DE oder EN. Statische und dynamische
  Texte, Dokumenttitel, zugängliche Namen sowie Datums-/Zeitformate wechseln
  gemeinsam.
- **Regression:** `tests/unit/i18n.test.ts` sowie die Shell-E2E-Fälle für
  Sprache, Reload, Suche, Sonnenzeiten, Fehler und axe.
- **Gültigkeitsgrenze:** Eigennamen und gespeicherte Ortskontexte werden nicht
  ohne Netz rückübersetzt. Neue Suchen fragen Nominatim mit der aktuell
  gewählten Sprache an.

## 2026-07-30: Sprachabhängige Netzdaten brauchen getrennte Cache-Schlüssel

- **Evidenz:** Ein nur nach Suchtext indizierter Geocoding-Cache hätte nach
  einem Sprachwechsel weiterhin deutsche Ländernamen in der englischen
  Ergebnisliste gezeigt.
- **Folge:** Der Cache-Schlüssel enthält Sprache und normalisierten Suchtext.
  `accept-language` und `Accept-Language` verwenden dieselbe aktuelle Sprache.
- **Regression:** Browsertest mit englischer Suche, Ergebnistypen und
  Persistenz; die bestehende Cache-Wiederverwendung bleibt für dieselbe Sprache
  grün.
- **Gültigkeitsgrenze:** Orts-Eigennamen folgen der Antwort des Geocoders und
  sind nicht für jede Region vollständig lokalisierbar.

## 2026-07-30: DEV-Badge und Portal-Linkbasis teilen eine Umgebungsquelle

- **Evidenz:** Ein festes DEV-Badge neben separat hartcodierten Links könnte
  später zu einem widersprüchlichen Build führen, der sich als DEV ausgibt,
  aber Production verlinkt.
- **Folge:** `public/runtime-config.json` setzt explizit `environment=dev`.
  Badge, Body-Identität und alle absoluten Shell-Links werden daraus gemeinsam
  gebildet. Die Production-Abbildung ist automatisiert geprüft, aber nicht
  veröffentlicht.
- **Regression:** Unit-Test beider Linkkarten und E2E-Test für DEV-Badge,
  absolute Links sowie ausgeblendetes Badge in simulierter
  Production-Konfiguration.
- **Gültigkeitsgrenze:** Die geprüfte Production-Abbildung ist keine fachliche
  Production-Freigabe.
