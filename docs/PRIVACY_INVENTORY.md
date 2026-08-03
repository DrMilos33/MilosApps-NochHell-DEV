# Datenschutz- und Endgerätezugriffs-Inventar

Stand: 3. August 2026. Dieses Inventar beschreibt den DEV-Stand von
`Noch hell?` (`appKey=daylight`). Die App besitzt kein Konto, keine
App-Datenbank, kein Tracking und keine optionalen Speicherzwecke.

## Dauerhafte und begrenzte Zugriffe

| Technik / Schlüssel | Zweck | Lebensdauer | Erforderlichkeit | Löschweg |
| --- | --- | --- | --- | --- |
| `localStorage:milosapps.daylight.language` | Die ausdrücklich gewählte vollständige DE-/EN-Oberfläche nach Reload beibehalten. | bis der Nutzer Browserdaten löscht | notwendig für die gewählte Spracheinstellung | Browserdaten; nicht Teil der Ortsdaten-Löschung |
| `localStorage:milosapps.daylight.location.v1` | Den bewusst gewählten Ort oder den freiwillig abgefragten, vorher gerundeten Gerätestandort für lokale Berechnung und Offline-Wiederöffnung beibehalten. | bis zur App-Schaltfläche oder Browserlöschung | notwendig für gespeicherte Tageslichtberechnung und Offline-Wiederöffnung | „Lokale Daten verwalten“ → „Lokale Ortsdaten löschen“ |
| `localStorage:milosapps.daylight.geocoding-cache.v1` | Bereits ausdrücklich abgesendete Nominatim-Antworten wiederverwenden, öffentliche Providerlast begrenzen und zuletzt genutzte Orte ohne neuen Netzaufruf anbieten. | höchstens 30 Tage; maximal 20 Suchanfragen | notwendig für providerverträgliche Wiederverwendung und die lokale Vorschlagsfunktion | „Lokale Daten verwalten“ → „Lokale Ortsdaten löschen“ |
| `localStorage:milosapps.daylight.device-suggestion.v1` | Den ausschließlich freiwillig abgefragten und vor der Speicherung gerundeten eigenen Ort auch nach der Wahl eines anderen Ortes erneut lokal anbieten. | bis zur App-Schaltfläche oder Browserlöschung | notwendig für die ausdrücklich beauftragte lokale Vorschlagsfunktion ohne Reverse-Geocoding oder erneute Permission-Abfrage | „Lokale Daten verwalten“ → „Lokale Ortsdaten löschen“ |
| `CacheStorage:milosapps.daylight.offline-shell.v3` | Die App-Shell nach einer erfolgreichen Ladung für die ausdrücklich angebotene Offline-Wiederöffnung bereitstellen. | bis zum nächsten Cache-Lifecycle oder zur Browserlöschung | notwendig für die Offline-Wiederöffnung | Browserdaten; alte App-Caches werden beim Service-Worker-Upgrade entfernt |
| temporär `localStorage:milosapps.daylight.storage-probe` | Prüfen, ob der Browser lokale Speicherung zulässt. | innerhalb desselben synchronen Prüfschritts | notwendig, damit die App Speicherung nicht fälschlich verspricht | wird unmittelbar nach dem Schreiben entfernt |

Die Migration liest die früheren Keys `daylight.location.v1` und
`daylight.geocoding-cache.v1` einmalig, schreibt valide Daten in den neuen
app-namensräumigen Key und entfernt anschließend den alten Key. Die vendorte
Essentials-Runtime entfernt außerdem ausschließlich den früheren
Informationszustand `milosapps.daylight.privacyNotice.v1`. Keiner dieser
Migrationswerte war eine Einwilligung.

## Nicht verwendet

- keine Cookies;
- kein `sessionStorage`;
- kein IndexedDB;
- keine Werbe-, Analyse-, Fingerprinting- oder sonstigen Tracking-IDs;
- keine optionale Speicherung und deshalb kein Einwilligungsbanner;
- keine Koordinaten, Ortsnamen oder Suchtexte in App- oder Teil-URLs.

## Standort und externe Dienste

Der Browser fragt den Gerätestandort ausschließlich nach einem bewussten Tipp
auf „Meinen Ort verwenden“ ab. Die App fordert die Berechtigung weder beim
Start noch während der Texteingabe an. Erfolgreiche Gerätekoordinaten werden
vor weiterer Verwendung und Speicherung auf zwei Nachkommastellen gerundet
(ungefähr ein Kilometer); eine Reverse-Geocoding-Anfrage findet dafür nicht
statt.

Ab drei eingegebenen Zeichen sendet die App den Suchtext nach einer kurzen
Eingabepause an den austauschbaren Open-Meteo-Geocoding-Endpunkt. Die Antwort
wird auf Name, Region, Land, Ländercode, Typ, Koordinaten und IANA-Zeitzone
minimiert. Der flüchtige Vorschlagscache bleibt nur in der aktuellen
Seitensitzung und enthält höchstens 20 Suchtexte für sechs Stunden. Er wird
nicht in `localStorage` geschrieben. Nach den Open-Meteo-Nutzungsbedingungen
können IP-Adresse und angefragte URL beim Dienst bis zu 90 Tage protokolliert
werden. Die App zeigt Open-Meteo-/GeoNames-/CC-BY-4.0-Attribution dauerhaft an.

Eine genauere manuelle Suche sendet weiterhin erst nach Enter oder „Suchen“
den Suchtext an den konfigurierten Nominatim-Endpunkt. Der öffentliche
Standardendpunkt ist `https://nominatim.openstreetmap.org/search`; die Antwort
wird auf dasselbe minimierte Ortsschema normalisiert und die IANA-Zeitzone
app-eigen ermittelt. Der Client hält mindestens 1,1 Sekunden Abstand zwischen
diesen Anfragen, verwendet einen begrenzten persistenten Cache und zeigt die
OpenStreetMap-/ODbL-Attribution dauerhaft an.

Bereits bekannte Cachetreffer und der erst nach freiwilliger Freigabe gerundete
Geräteort werden in dieselbe Vorschlagsliste wie neue Providerergebnisse
eingefügt. Ihre Auswahl erzeugt keine neue Standortabfrage; dynamische
Provideranfragen enthalten ausschließlich den eingegebenen Suchtext, niemals
den gespeicherten oder genauen Gerätestandort.

## Sichtbare Information

Da ausschließlich die oben belegten notwendigen Zugriffe stattfinden, zeigt
die App kein Schein-Cookiebanner. Eine kurze dauerhafte Zeile erklärt die
lokale Verarbeitung und verlinkt mit `data-milos-privacy-info` auf
`https://dev.milos-apps.de/datenschutz`. Die aufklappbare Datenverwaltung
erklärt die Grenzen und löscht Ort sowie Geocoding-Cache. Production ist nicht
freigegeben.
