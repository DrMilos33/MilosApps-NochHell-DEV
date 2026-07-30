const url = process.argv[2] ?? "http://127.0.0.1:4319/health.json";

const response = await fetch(url, {
  headers: {
    Accept: "application/json",
  },
});

if (!response.ok) {
  throw new Error(`Readiness-Healthcheck antwortet mit HTTP ${response.status}.`);
}

const body = await response.json();
if (body?.status !== "ready" || body?.appKey !== "daylight") {
  throw new Error(
    `Falscher DEV-Dienst auf ${url}: erwartet status=ready und appKey=daylight.`,
  );
}

console.log(`Noch hell? DEV ist bereit (${body.appKey}, ${body.version}).`);
