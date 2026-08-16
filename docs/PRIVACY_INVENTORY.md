# Datenschutz- und Endgerätezugriffs-Inventar

Stand: 16. August 2026. Dieses Inventar beschreibt den Production-Kandidaten
von `Noch hell?` (`appKey=daylight`). Die App besitzt kein Konto, keine
App-Datenbank, kein Tracking und keine optionalen Speicherzwecke.

## Notwendige lokale Zugriffe

| Technik / Schlüssel | Zweck | Lebensdauer | Löschweg |
| --- | --- | --- | --- |
| `localStorage:milosapps.daylight.language` | bewusst gewählte vollständige DE-/EN-Oberfläche nach Reload | bis Browserdaten gelöscht werden | Browserdaten |
| `localStorage:milosapps.daylight.location.v1` | bewusst gewählten oder vorher gerundeten Ort lokal berechnen und offline wieder öffnen | bis App- oder Browserlöschung | „Lokale Daten verwalten“ |
| `localStorage:milosapps.daylight.geocoding-cache.v1` | abgesendete Open‑Meteo-Antworten provider- und netzschonend wiederverwenden | höchstens 30 Tage, 20 Suchtexte | „Lokale Daten verwalten“ |
| `localStorage:milosapps.daylight.device-suggestion.v1` | freiwillig abgefragten, vorher gerundeten eigenen Ort lokal erneut anbieten | bis App- oder Browserlöschung | „Lokale Daten verwalten“ |
| `CacheStorage:milosapps.daylight.production-offline-shell.v2` | App-Shell nach erfolgreicher Erstladung offline wieder öffnen | bis Service-Worker-Upgrade oder Browserlöschung | Browserdaten; alte Daylight-Caches werden beim Upgrade entfernt |
| temporär `localStorage:milosapps.daylight.storage-probe` | lokale Speicherfähigkeit prüfen | nur im synchronen Prüfschritt | wird sofort entfernt |

Die Migration liest frühere Daylight-Orts- und Cache-Keys einmalig, übernimmt
valide Werte in den app-namensräumigen Bestand und entfernt danach die alten
Keys. Keiner dieser Werte ist eine Einwilligung.

## Nicht verwendet

- keine Cookies, `sessionStorage`, IndexedDB oder App-Datenbank;
- keine Werbung, Analyse, Fingerprinting oder Tracking-ID;
- keine optionale Speicherung und deshalb kein Einwilligungsbanner;
- keine Koordinaten, Ortsnamen oder Suchtexte in App- oder Teil-URLs;
- keine Nominatim-Anfrage im Production-Runtimepfad.

## Standort und externer Dienst

Der Browser fragt den Gerätestandort ausschließlich nach einem bewussten Tipp
auf „Meinen Ort verwenden“ ab. Erfolgreiche Koordinaten werden vor weiterer
Verwendung und Speicherung auf zwei Nachkommastellen gerundet (ungefähr ein
Kilometer). Dafür findet keine Reverse-Geocoding-Anfrage statt.

Ab drei Zeichen sendet die App den eingegebenen Suchtext nach einer kurzen
Pause an die Open‑Meteo Geocoding API. Eine bewusst per Enter oder „Suchen“
abgesendete Anfrage nutzt denselben Provider. Übertragen werden ausschließlich
Suchtext, Ergebnisanzahl, Oberflächensprache und JSON-Format. Gespeicherte oder
gerundete Gerätekoordinaten, ausgewählte Orte, Kontoangaben und App-URL werden
nicht mitgesendet.

Open‑Meteo verarbeitet dabei die technisch notwendige IP-Adresse und kann laut
eigener Erklärung IP-Adresse und angefragte URL bis zu 90 Tage protokollieren.
Die Antwort wird auf Name, Region, Land, Ländercode, Typ, Koordinaten und
IANA-Zeitzone minimiert. Dynamische Vorschläge bleiben höchstens sechs Stunden
in einem flüchtigen 20-Suchtexte-Cache; abgesendete Ergebnisse höchstens 30
Tage und 20 Suchtexte in `localStorage`. Die App zeigt
Open‑Meteo-/GeoNames-/CC-BY-4.0-Attribution dauerhaft an.

## Sichtbare Information und Readiness

Die dauerhafte DE-/EN-Zeile mit `data-milos-privacy-info` verweist exakt auf
`https://sinddielampenan.de/datenschutz`. Die Seite erklärt dieselben
Zwecke ohne Schein-Einwilligung. Die lokale Datenverwaltung löscht Ort,
abgesendeten Suchcache und den gerundeten Gerätevorschlag.

`/health.json` enthält nur App-Identität, Version, Umgebung,
`productionApproved`, `adsEnabled=false`, Datenbankgrenze und exakten
Build-Source-SHA. Der
Service Worker fängt Health niemals ab; Cloudflare `_headers` setzt
`Cache-Control: no-store`.
