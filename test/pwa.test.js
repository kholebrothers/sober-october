import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const PUBLIC = path.join(import.meta.dirname, "..", "public");
const sw = fs.readFileSync(path.join(PUBLIC, "sw.js"), "utf8");
const schale = JSON.parse(sw.match(/const SCHALE = (\[[\s\S]*?\]);/)[1].replace(/,\s*\]/, "]"));

function alle(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? alle(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}

test("jede Datei im Vorrat gibt es", () => {
  for (const p of schale) if (p !== "/") assert.ok(fs.existsSync(path.join(PUBLIC, p)), p);
});

test("jedes Modul, jedes Stylesheet und jedes Symbol ist im Vorrat — sonst startet die App offline nicht", () => {
  const noetig = alle(PUBLIC).map((f) => "/" + path.relative(PUBLIC, f).split(path.sep).join("/"))
    .filter((p) => /\.(js|css|png|webmanifest|html)$/.test(p) && p !== "/sw.js");
  for (const p of noetig) assert.ok(schale.includes(p), `${p} fehlt in SCHALE (public/sw.js)`);
});

test("das Manifest verweist auf vorhandene Symbole", () => {
  const m = JSON.parse(fs.readFileSync(path.join(PUBLIC, "manifest.webmanifest"), "utf8"));
  assert.equal(m.display, "standalone");
  for (const i of m.icons) assert.ok(fs.existsSync(path.join(PUBLIC, i.src)), i.src);
});
