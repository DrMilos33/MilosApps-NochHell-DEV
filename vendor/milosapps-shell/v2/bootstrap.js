import { registerMilosAppShell } from "./milos-app-shell.js";

registerMilosAppShell({
  "appKey": "daylight",
  "environment": "dev",
  "productionApproved": false,
  "description": {
    "de": "Tageslichtzeiten für deinen Ort – lokal berechnet, ohne Konto.",
    "en": "Daylight times for your place – calculated locally, without an account."
  },
  "theme": {
    "accent": "var(--accent-deep)",
    "accentContrast": "#ffffff",
    "surface": "var(--paper)",
    "text": "var(--ink)",
    "muted": "var(--muted)",
    "border": "var(--line)",
    "focus": "var(--amber)"
  }
});
