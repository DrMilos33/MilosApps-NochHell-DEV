import { preview } from "vite";

const server = await preview({
  preview: {
    host: "127.0.0.1",
    port: 4319,
    strictPort: true,
  },
});

const response = await fetch("http://127.0.0.1:4319/health.json", {
  headers: {
    Accept: "application/json",
  },
});
const body = response.ok ? await response.json() : null;
if (
  body?.status !== "ready" ||
  body?.appKey !== "daylight" ||
  body?.version !== "1.0.1" ||
  body?.environment !== "production" ||
  body?.productionApproved !== true ||
  body?.adsEnabled !== false ||
  !/^[0-9a-f]{40}$/.test(body?.sourceCommit ?? "")
) {
  await server.close();
  throw new Error("E2E-Readiness gehört nicht zu App-Key daylight.");
}

console.log(`E2E-Readiness bestätigt: ${body.appKey}`);

const close = async () => {
  await server.close();
  process.exit(0);
};

process.once("SIGINT", close);
process.once("SIGTERM", close);
await new Promise(() => {});
