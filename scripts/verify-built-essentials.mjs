import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

const appRoot = path.resolve(import.meta.dirname, "..");
const vendorPath = "vendor/milosapps-essentials/v1";
const browserArtifacts = [
  "milos-app-essentials.css",
  "milos-app-essentials-theme.css",
  "milos-app-essentials.js",
  "bootstrap.js",
];

const html = await readFile(path.join(appRoot, "dist/index.html"), "utf8");
const manifest = JSON.parse(
  await readFile(path.join(appRoot, "milos-essentials.json"), "utf8"),
);
for (const stylesheet of browserArtifacts.filter((file) => file.endsWith(".css"))) {
  const expected = `./${vendorPath}/${stylesheet}`;
  assert.ok(
    html.includes(`href="${expected}"`),
    `${stylesheet} must remain an external stylesheet in built HTML.`,
  );
}
assert.ok(
  html.includes(`src="./${vendorPath}/bootstrap.js"`),
  "The Essentials bootstrap must remain an external module in built HTML.",
);
assert.doesNotMatch(
  html,
  /data:(?:text\/css|text\/javascript)/i,
  "Essentials runtime must never be re-inlined as data URLs.",
);
assert.ok(
  html.includes(`src="${manifest.loading.iconRuntimePath}"`),
  "The loader icon must keep its exact stable public runtime URL.",
);

const sourceIcon = await readFile(path.join(appRoot, manifest.loading.iconPath));
const builtIcon = await readFile(
  path.join(appRoot, "dist", manifest.loading.iconRuntimePath.replace(/^\.\//, "")),
);
assert.equal(
  createHash("sha256").update(builtIcon).digest("hex"),
  createHash("sha256").update(sourceIcon).digest("hex"),
  "The built loader icon must be byte-identical to its physical source SVG.",
);

const lock = JSON.parse(
  await readFile(path.join(appRoot, vendorPath, "essentials-lock.json"), "utf8"),
);
for (const artifact of browserArtifacts) {
  const built = await readFile(path.join(appRoot, "dist", vendorPath, artifact));
  const digest = `sha256:${createHash("sha256").update(built).digest("hex")}`;
  assert.equal(
    digest,
    lock.artifacts[artifact],
    `${artifact} in dist must match the locked Shared artifact.`,
  );
}

console.log(
  "Built Essentials runtime: PASS (external CSS/JS, loader SVG, locked SHA-256)",
);
