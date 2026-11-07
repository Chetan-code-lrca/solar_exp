import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

test("HTML entry points to the existing TypeScript React entry module", () => {
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<title>Solaris Expedition/);
  assert.match(html, /<script type="module" src="\/src\/main\.tsx"><\/script>/);
  assert.equal(existsSync(new URL("../src/main.tsx", import.meta.url)), true);
  assert.equal(html.includes("/src/main.jsx"), false);
});

test("HTML does not depend on the removed sandbox theme or error-reporting bridge", () => {
  assert.equal(html.includes("sandbox-runtime-error"), false);
  assert.equal(html.includes("window.parent.postMessage"), false);
  assert.equal(html.includes("cdnjs.cloudflare.com"), false);
});
