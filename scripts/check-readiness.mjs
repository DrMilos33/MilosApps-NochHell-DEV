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
if (
  body?.status !== "ready" ||
  body?.appKey !== "daylight" ||
  body?.version !== "1.0.1" ||
  body?.environment !== "production" ||
  body?.productionApproved !== true ||
  body?.adsEnabled !== false ||
  !/^[0-9a-f]{40}$/.test(body?.sourceCommit ?? "")
) {
  throw new Error(
    `Wrong production service on ${url}: expected ready/daylight/1.0.1/production with ads disabled and an approved source SHA.`,
  );
}

console.log(`Noch hell? production is ready (${body.appKey}, ${body.version}, ${body.sourceCommit}).`);
