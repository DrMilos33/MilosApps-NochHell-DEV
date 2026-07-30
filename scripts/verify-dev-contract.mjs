import { spawnSync } from "node:child_process";
import { preview } from "vite";

const baseUrl = "http://127.0.0.1:4319";
const server = await preview({
  preview: {
    host: "127.0.0.1",
    port: 4319,
    strictPort: true,
  },
});

try {
  const response = await fetch(`${baseUrl}/health.json`, {
    headers: { Accept: "application/json" },
  });
  const body = response.ok ? await response.json() : null;
  if (
    body?.status !== "ready" ||
    body?.appKey !== "daylight" ||
    body?.environment !== "dev"
  ) {
    throw new Error("DEV-Readiness gehört nicht zu App-Key daylight.");
  }

  if (!process.env.npm_execpath) {
    throw new Error("pnpm-Ausführungspfad fehlt; Portkollision konnte nicht geprüft werden.");
  }

  const collision = spawnSync(
    process.execPath,
    [process.env.npm_execpath, "dev"],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      timeout: 15_000,
      windowsHide: true,
    },
  );
  const output = `${collision.stdout ?? ""}\n${collision.stderr ?? ""}`;
  if (collision.error || collision.status === 0 || !output.includes("Port 4319 is already in use")) {
    throw new Error(
      `Zweiter DEV-Start brach nicht wie erwartet an Port 4319 ab.\n${output}`,
    );
  }

  console.log(
    `DEV-Vertrag bestätigt: ${body.appKey} ist bereit; Portkollision wird strikt abgebrochen.`,
  );
} finally {
  await server.close();
}
