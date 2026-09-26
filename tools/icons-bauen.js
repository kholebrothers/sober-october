#!/usr/bin/env node
/**
 * Baut die App-Symbole als PNG — ohne Abhängigkeit, nur zlib.
 * Nach lifetracker/tools/icons-bauen.js; statt des Eis der offene Kreis aus
 * dem Favicon: Moos auf Flexoki-Papier. Ein leerer Kreis heißt *unbekannt*,
 * nicht *nicht geschafft* — er ist das Zeichen dieser App.
 *
 * Gezeichnet wird vierfach überabgetastet, sonst franst die Kante aus.
 * Aufrufen nach jeder Änderung an Farben oder Form:
 *
 *     node tools/icons-bauen.js
 */
import zlib from "node:zlib";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PAPIER = [0xf2, 0xf0, 0xe5];   // --paper
const MOOS = [0x66, 0x80, 0x0b];     // --moss

function imRundeck(x, y, g, r) {
  const cx = Math.min(Math.max(x, r), g - r), cy = Math.min(Math.max(y, r), g - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

function zeichne(g, maskable) {
  const AA = 4;
  const radius = maskable ? g / 2 : g * 0.22;
  // maskable: der sichere Bereich ist der innere Kreis mit 40 % Halbmesser.
  const aussen = g * (maskable ? 0.27 : 0.33), staerke = g * (maskable ? 0.055 : 0.07);
  const pix = Buffer.alloc(g * g * 4);
  for (let y = 0; y < g; y++) for (let x = 0; x < g; x++) {
    let grund = 0, ring = 0;
    for (let sy = 0; sy < AA; sy++) for (let sx = 0; sx < AA; sx++) {
      const px = x + (sx + 0.5) / AA, py = y + (sy + 0.5) / AA;
      if (maskable || imRundeck(px, py, g, radius)) grund++;
      const d = Math.hypot(px - g / 2, py - g / 2);
      if (d <= aussen && d >= aussen - staerke) ring++;
    }
    const n = AA * AA, aGrund = grund / n, aRing = ring / n;
    const i = (y * g + x) * 4;
    for (let k = 0; k < 3; k++) pix[i + k] = Math.round(PAPIER[k] * (1 - aRing) + MOOS[k] * aRing);
    pix[i + 3] = Math.round(255 * aGrund);
  }
  return pix;
}

function png(g, pix) {
  const roh = Buffer.alloc(g * (g * 4 + 1));
  for (let y = 0; y < g; y++) {
    roh[y * (g * 4 + 1)] = 0;
    pix.copy(roh, y * (g * 4 + 1) + 1, y * g * 4, (y + 1) * g * 4);
  }
  const tab = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tab[n] = c >>> 0;
  }
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = tab[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (typ, daten) => {
    const l = Buffer.alloc(4); l.writeUInt32BE(daten.length);
    const k = Buffer.concat([Buffer.from(typ, "ascii"), daten]);
    const p = Buffer.alloc(4); p.writeUInt32BE(crc(k));
    return Buffer.concat([l, k, p]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(g, 0); ihdr.writeUInt32BE(g, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(roh, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

const ziel = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");
fs.mkdirSync(ziel, { recursive: true });
for (const [datei, g, maskable] of [["icon-192.png", 192, false], ["icon-512.png", 512, false],
  ["icon-maskable-512.png", 512, true], ["apple-touch-icon.png", 180, true]]) {
  const p = path.join(ziel, datei);
  fs.writeFileSync(p, png(g, zeichne(g, maskable)));
  console.log(p, fs.statSync(p).size + " Bytes");
}
