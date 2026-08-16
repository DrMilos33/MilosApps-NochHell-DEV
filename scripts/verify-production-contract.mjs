import { spawnSync } from "node:child_process";
import { preview } from "vite";

const baseUrl = "http://127.0.0.1:4319";
const server = await preview({
  preview: { host: "127.0.0.1", port: 4319, strictPort: true },
});

try {
  const response = await fetch(`${baseUrl}/health.json`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
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
    throw new Error("Production readiness does not match the Daylight release contract.");
  }

  if (!process.env.npm_execpath) {
    throw new Error("pnpm execution path is unavailable for the collision gate.");
  }
  const collision = spawnSync(process.execPath, [process.env.npm_execpath, "preview"], {
    cwd: process.cwd(),
    encoding: "utf8",
    timeout: 15_000,
    windowsHide: true,
  });
  const output = `${collision.stdout ?? ""}\n${collision.stderr ?? ""}`;
  if (collision.error || collision.status === 0 || !output.includes("Port 4319 is already in use")) {
    throw new Error(`A second production preview did not fail closed on port 4319.\n${output}`);
  }

  console.log(`Production contract: PASS (${body.appKey}, ${body.version}, ${body.sourceCommit})`);
} finally {
  await server.close();
}
