import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const output = new URL("../docs/", import.meta.url);
const clientBuild = new URL("../dist/client/", import.meta.url);
const workerUrl = new URL("../dist/server/index.js", import.meta.url);

await mkdir(output, { recursive: true });

workerUrl.searchParams.set("pages-export", `${Date.now()}`);
const { default: worker } = await import(workerUrl.href);
const response = await worker.fetch(
  new Request("http://localhost/", {
    headers: { accept: "text/html" },
  }),
  {
    ASSETS: {
      fetch: async () => new Response("Not found", { status: 404 }),
    },
  },
  {
    waitUntil() {},
    passThroughOnException() {},
  },
);

if (!response.ok) {
  throw new Error(
    `Static export failed: renderer returned HTTP ${response.status}.`,
  );
}

const rendered = await response.text();
const portable = rendered
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
  .replace(/<link\b[^>]*\brel=["'](?:modulepreload|preload)["'][^>]*>/gi, "")
  .replace(/href="\/assets\/[^"]+\.css"/, 'href="./styles.css"')
  .replaceAll('href="/', 'href="./')
  .replaceAll('src="/', 'src="./');

const assetNames = await readdir(new URL("assets/", clientBuild));
const stylesheetName = assetNames.find((name) => /^index-.+\.css$/.test(name));
if (stylesheetName === undefined) {
  throw new Error("Static export failed: compiled stylesheet was not found.");
}

await Promise.all([
  writeFile(new URL("index.html", output), portable, "utf8"),
  writeFile(new URL(".nojekyll", output), "", "utf8"),
  copyFile(
    new URL(`assets/${stylesheetName}`, clientBuild),
    new URL("styles.css", output),
  ),
  copyFile(new URL("favicon.svg", clientBuild), new URL("favicon.svg", output)),
]);

const exportedFiles = await readdir(output, { recursive: true });
if (!exportedFiles.includes("index.html")) {
  throw new Error("Static export failed: docs/index.html was not created.");
}

const packageJson = JSON.parse(
  await readFile(new URL("package.json", root), "utf8"),
);
console.log(
  `Exported ${packageJson.name} to docs/ (${exportedFiles.length} files).`,
);
