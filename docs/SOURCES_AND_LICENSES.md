# Berechnungsquellen, Ortsdaten und Lizenzen

Stand: 30. Juli 2026.

## Sonnenberechnung

Die Implementierung in `src/lib/astronomy.ts` berechnet die scheinbare
Sonnenposition lokal im Browser. Sie folgt den von NOAA veröffentlichten, auf
Jean Meeus basierenden Gleichungen für Julianisches Datum, Sonnenlänge,
Deklination und Zeitgleichung:

- [NOAA Solar Calculation Details](https://gml.noaa.gov/grad/solcalc/calcdetails.html)
- [NOAA Solar Calculator Glossary](https://gml.noaa.gov/grad/solcalc/glossary.html)
- [USNO Complete Sun and Moon Data API](https://aa.usno.navy.mil/data/api.html)

Schwellenwerte:

- Sonnenaufgang und Sonnenuntergang bei einer Sonnenhöhe von `-0,833°`;
- Ende der bürgerlichen Dämmerung beim fallenden Durchgang durch `-6°`.

Die Durchgänge werden innerhalb der echten Grenzen des lokalen Kalendertags
gesucht und anschließend numerisch verfeinert. USNO dient als unabhängige
Referenz, nicht als Laufzeit-API.

| Referenz | USNO Sonnenaufgang | USNO Sonnenuntergang | USNO bürgerliches Dämmerungsende | Testgrenze |
| --- | ---: | ---: | ---: | --- |
| Äquator/Nullmeridian, 01.05.2026, UTC | 05:54 | 18:00 | 18:22 | höchstens 2 Minuten |
| Berlin, 29.03.2026, CEST | 06:48 | 19:35 | 20:10 | höchstens 2 Minuten |
| Berlin, 25.10.2026, CET | 06:50 | 16:50 | 17:26 | höchstens 2 Minuten |

Zusätzliche Zustandsreferenzen sind Tromsø am 21. Juni und 21. Dezember 2026
sowie Longyearbyen am 21. Dezember 2026.

### Genauigkeitsgrenzen

NOAA beschreibt seine Ergebnisse als theoretisch auf etwa eine Minute genau
zwischen ±72° Breite und auf etwa zehn Minuten außerhalb dieses Bereichs.
Atmosphärische Refraktion, Höhe, Gelände, Bebauung und Wetter können die
tatsächlich wahrgenommene Helligkeit weiter verschieben. Die App kennzeichnet
Zeiten deshalb als Näherungen und macht keine Sicherheits- oder
Wetterzusage.

## Zeitzonen

`tz-lookup` 6.1.25 ordnet Koordinaten lokal einer IANA-Zeitzonen-ID zu. Das
Paket steht unter [CC0-1.0](https://github.com/darkskyapp/tz-lookup) und hält
den Browser-Bundle klein. Die eigentlichen UTC-Offsets, Sommerzeitregeln und
lokalen Datumsformatierungen stammen aus `Intl.DateTimeFormat` und den
IANA-Zeitzonendaten der Browserlaufzeit:

- [IANA Time Zone Database](https://www.iana.org/time-zones)
- [ECMAScript Internationalization API](https://tc39.es/ecma402/)

Grenze: Die Koordinaten-zu-Zone-Abbildung ist eine kompakte Approximation und
kann nahe politischen Zeitzonengrenzen oder nach Grenzänderungen falsch sein.
Die Oberfläche zeigt die gewählte Zone sichtbar an. Eine spätere
Produktversion sollte für solche Fälle eine manuelle Zonenkorrektur erwägen.

## Ortssuche

Die genauere manuelle Ortssuche verwendet standardmäßig die öffentliche
Nominatim-Instanz. Der Endpunkt ist über `public/runtime-config.json`
austauschbar. Die App:

- sendet an Nominatim nur ausdrücklich abgesendete Suchen und kein
  Nominatim-Autocomplete;
- begrenzt Anfragen auf höchstens eine pro 1,1 Sekunden;
- speichert maximal 20 Suchantworten für 30 Tage lokal;
- zeigt OpenStreetMap-Attribution;
- hält den Dienst austauschbar und sendet keine Gerätekoordinaten dorthin.

Verbindliche Quellen:

- [Nominatim Usage Policy](https://operations.osmfoundation.org/policies/nominatim/)
- [Nominatim Search API](https://nominatim.org/release-docs/develop/api/Search/)
- [OpenStreetMap Copyright and License](https://www.openstreetmap.org/copyright/en)

Die Suchdaten stehen unter ODbL; OpenStreetMap-Mitwirkende werden in der App
sichtbar genannt. Die Oberfläche und das Portal-Vorschaubild enthalten keine
übernommenen Kartenkacheln oder Drittanbieterbilder.

Dynamische Vorschläge ab drei Zeichen verwenden den getrennt konfigurierbaren
Open-Meteo-Geocoding-Endpunkt. Er ist für partielle und unscharfe Ortssuchen
dokumentiert und liefert unter anderem Name, administrative Ebenen, Land,
Ländercode, WGS84-Koordinaten und IANA-Zeitzone. Die App:

- wartet nach der Eingabe, verwirft abgebrochene oder veraltete Antworten und
  zeigt höchstens sechs Ergebnisse;
- hält höchstens 20 Antworten für sechs Stunden nur im flüchtigen
  Seitenspeicher;
- mischt lokale bekannte Orte und Providerergebnisse in genau eine
  zugängliche Combobox-/Listbox-Struktur;
- sendet keine Gerätekoordinaten, gespeicherten Orte oder App-URL-Daten an den
  Vorschlagsdienst;
- behält Endpoint und Providerintegration austauschbar.

Verbindliche Quellen:

- [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api)
- [Open-Meteo Terms](https://open-meteo.com/en/terms)
- [Open-Meteo Licence](https://open-meteo.com/en/licence)
- [GeoNames](https://www.geonames.org/)
- [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/)

Die Open-Meteo-Geocoding-Daten basieren auf GeoNames und stehen laut
Open-Meteo unter CC BY 4.0. Beide Namen und die Lizenz werden in der App
sichtbar genannt. Der öffentliche Dienst ist eine DEV-/nichtkommerzielle
Abhängigkeit mit dokumentierten Nutzungsgrenzen, kein garantiertes App-Backend.

## Softwarelizenzen

Der App-Quellcode ist derzeit nicht zur Weitergabe lizenziert (`UNLICENSED`).
Direkte Laufzeitabhängigkeit ist `tz-lookup` (CC0-1.0). Entwicklungswerkzeuge:
Vite und Vitest (MIT), TypeScript und Playwright (Apache-2.0) sowie
axe-core/Playwright (MPL-2.0). Maßgeblich bleiben die jeweiligen
Paket-Lizenzdateien im installierten Dependency-Baum.
