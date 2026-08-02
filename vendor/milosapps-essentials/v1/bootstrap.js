import { initMilosAppEssentials } from "./milos-app-essentials.js";

document.body?.setAttribute("data-milos-essentials-app", "daylight");
export const milosAppEssentials = initMilosAppEssentials({
  "appKey": "daylight",
  "environment": "dev",
  "productionApproved": false,
  "loading": {
    "appName": "Noch hell?",
    "iconPath": "daylight-icon.svg",
    "message": {
      "de": "App wird geöffnet …",
      "en": "Opening app …"
    }
  },
  "privacy": {
    "mode": "no-cookies",
    "usesLocalStorage": true,
    "optionalTracking": false,
    "privacyUrl": "https://dev.milos-apps.de/datenschutz"
  },
  "features": {
    "startup": true,
    "privacyNotice": true,
    "share": true,
    "datePicker": false,
    "placeSearch": true
  }
});
globalThis.milosAppEssentials = milosAppEssentials;
