import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
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
}

test("server-renders the complete Semaglutide dossier snapshot", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Semaglutide Evidence Dossier<\/title>/i);
  assert.match(html, /Awaiting human review/);
  assert.match(html, /Executive summary/);
  assert.match(html, />20<\/[^>]+><[^>]*>Sources</);
  assert.match(html, />25<\/[^>]+><[^>]*>Claims</);
  assert.match(html, />15<\/[^>]+><[^>]*>Perspectives</);
  assert.match(html, />18<\/[^>]+><[^>]*>Story angles</);
  assert.match(html, />5<\/[^>]+><[^>]*>Contradictions</);
  assert.match(html, />8<\/[^>]+><[^>]*>Evidence gaps</);
  assert.match(html, /Ranked story angles/);
  assert.match(html, /Semaglutide as a Chronic Tool, Not a Cure/);
  assert.match(html, /Editorial score<\/[^>]+><[^>]*>91/);
  assert.match(html, /Evidence claims/);
  assert.match(html, /Attributed perspectives/);
  assert.match(html, /Contradictions to resolve/);
  assert.match(html, /Source register/);
  assert.match(html, /not medical advice/i);
  assert.doesNotMatch(html, /22e72403-a1a9-44b0-a84c-db072c5fc717/);
});

test("exports a portable GitHub Pages document", async () => {
  const html = await readFile(
    new URL("../docs/index.html", import.meta.url),
    "utf8",
  );

  assert.match(html, /<title>Semaglutide Evidence Dossier<\/title>/i);
  assert.match(html, /href="\.\/styles\.css"/);
  assert.match(html, /href="\.\/favicon\.svg"/);
  assert.doesNotMatch(html, /(?:href|src)="\/assets\//);
  assert.doesNotMatch(html, /<script\b/i);
  assert.doesNotMatch(html, /22e72403-a1a9-44b0-a84c-db072c5fc717/);
});
