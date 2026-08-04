# Ortssuche: Production-Providernachweis

Stand: 4. August 2026. Dieser Nachweis gilt für den Production-Kandidaten von
`Noch hell?` (`appKey=daylight`).

## Gewählter Provider und Endpunkt

- Endpunkt: `https://geocoding-api.open-meteo.com/v1/search`
- API: https://open-meteo.com/en/docs/geocoding-api
- Nutzungsbedingungen: https://open-meteo.com/en/terms
- Lizenz und Attribution: https://open-meteo.com/en/licence
- Datengrundlage: GeoNames, CC BY 4.0
- Runtimekonfiguration: `geocodingEndpoint` und `suggestionsEndpoint` in
  `public/runtime-config.json`; ausschließlich credential-freies HTTPS.

Die API dokumentiert partielle und unscharfe Treffer ab drei Zeichen und
liefert die von Daylight benötigte IANA-Zeitzone. Ein Browseraufruf mit Origin
`https://sinddielampenan.de` wurde am 4. August 2026 mit
`Access-Control-Allow-Origin: *` bestätigt. Die sichtbare App nennt
Open‑Meteo, GeoNames und CC BY 4.0 unmittelbar bei den Ortsdaten.

## Production-Bewertung

Die kostenfreie Open‑Meteo-API ist nur für nichtkommerzielle Nutzung bestimmt.
Noch hell? ist kostenlos, werbefrei, ohne Konto, Abonnement, Verkauf oder
Monetarisierung und fällt damit im freigegebenen Stand unter diesen Zweck. Die
zum Prüfzeitpunkt dokumentierten Grenzen sind 10.000 Aufrufe pro Tag, 5.000 pro
Stunde, 600 pro Minute und 300.000 pro Monat. Das ist keine
Verfügbarkeitsgarantie. Vor Werbung, Bezahlfunktion, starkem Wachstum oder
geändertem Providervertrag muss Production erneut bewertet oder auf einen
eigenen beziehungsweise kommerziellen Endpunkt umgestellt werden.

Open‑Meteo beschreibt die technisch notwendige Verarbeitung der IP-Adresse und
eine mögliche Protokollierung von IP-Adresse und angefragter URL bis zu 90
Tage. Daylight sendet ausschließlich den eingegebenen Suchtext; keine
Gerätekoordinaten, gespeicherten Orte, Kontoangaben oder App-URL-Daten.

## Anfrage-, Cache- und UI-Grenzen

- dynamische Vorschläge erst ab drei Zeichen nach 350 ms Debounce, höchstens
  sechs Ergebnisse;
- ausdrücklich abgesendete Suche ab zwei Zeichen, höchstens sieben Ergebnisse;
- Vorschlagscache nur flüchtig: höchstens 20 Suchtexte, höchstens sechs Stunden;
- abgesendete Antworten lokal: höchstens 20 Suchtexte, höchstens 30 Tage;
- genau eine Shared-Combobox/Listbox; Abschluss bei Außenklick, Escape,
  Auswahl, Sprachwechsel und Disconnect;
- Abort- und Generationsschutz verhindert verspätete Altantworten;
- keine automatische Standortberechtigung und keine Ortsdaten in der URL;
- offline funktionieren gespeicherter Ort und bekannte Cachetreffer, aber keine
  neue Netzsuche.

Der Interaktionsvertrag folgt dem WAI-ARIA-APG-Combobox-Muster:
https://www.w3.org/WAI/ARIA/apg/patterns/combobox/

## Bewusst verworfener Production-Pfad

Die öffentliche Nominatim-Instanz erlaubt moderate, nutzerinitiierte Suche,
verbietet Autocomplete und begrenzt die gesamte Anwendung auf höchstens eine
Anfrage pro Sekunde:
https://operations.osmfoundation.org/policies/nominatim/

Der bisherige 1,1-Sekunden-Takt war nur pro Browserinstanz und konnte die
globale Anwendungsgrenze einer statischen öffentlichen Production nicht
erzwingen. Deshalb enthält der Production-Runtimepfad keine Nominatim-Anfrage,
keine Nominatim-CSP-Freigabe und keine OSM/ODbL-Attribution. Ein späterer
Providerwechsel bleibt über die Runtimekonfiguration möglich und benötigt eine
neue Datenschutz-, Lizenz-, Quota- und CSP-Prüfung.
