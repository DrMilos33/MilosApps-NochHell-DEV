import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const appRoot = path.resolve(import.meta.dirname, "..");
const healthPath = path.join(appRoot, "dist", "health.json");
const sourceCommit = (
  process.env.DAYLIGHT_SOURCE_COMMIT ||
  execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: appRoot,
    encoding: "utf8",
  })
).trim();

assert.match(
  sourceCommit,
  /^[0-9a-f]{40}$/,
  "Production health requires an exact 40-character source commit.",
);

const health = JSON.parse(await readFile(healthPath, "utf8"));
health.sourceCommit = sourceCommit;
await writeFile(healthPath, `${JSON.stringify(health, null, 2)}\n`, "utf8");

console.log(`Production health finalized for source ${sourceCommit}.`);
