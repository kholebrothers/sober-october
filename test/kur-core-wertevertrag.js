/* Kopie des Wertevertrags aus kur-core/server/api.js (Stand f9e139a):
   leer(), normalisiere() und die Muster für Tag und Schlüssel. Nur für die
   Tests — sie prüfen, dass fuerKern() schon heute Werte liefert, die ein
   kur-core-Server annehmen würde. Nicht verändern, sondern bei Bedarf neu
   kopieren. */

export const TAG = /^\d{4}-\d{2}-\d{2}$/;
export const SCHLUESSEL = /^[a-z0-9-]{1,32}$/;
const STEUERZEICHEN = /[\u0000-\u001f\u007f]/g;

function fehler(schluessel, status) {
  const e = new Error(schluessel);
  e.schluessel = schluessel;
  e.status = status || 400;
  return e;
}

/** Zählt als "weg". */
export function leer(v) {
  if (v === null || v === undefined || v === false || v === 0) return true;
  if (Array.isArray(v)) return !v.length;
  if (typeof v === "string") return !v.trim();
  return false;
}

/**
 * Erlaubt sind: true, eine kleine Zahl, eine Liste kleiner Zahlen, ein
 * kurzer Text, ein kleines Mess-Objekt aus ganzen Zahlen — und, neu im Kern,
 * ein Ort: {lat, lon}. Den brauchte die App nicht, weil ihr Ort fest
 * eingebaut war.
 */
export function normalisiere(v) {
  if (v === true) return true;
  if (typeof v === "number" && Number.isInteger(v) && v > 0 && v <= 99) return v;
  if (Array.isArray(v)) {
    /* Erst messen, dann filtern. */
    if (v.length > 64) throw fehler("wert-ungueltig");
    const liste = v.filter((n) => Number.isInteger(n) && n >= 0 && n < 64);
    if (!liste.length) throw fehler("wert-ungueltig");
    return [...new Set(liste)].sort((a, b) => a - b);
  }
  if (typeof v === "string") {
    const t = v.replace(STEUERZEICHEN, " ").trim().slice(0, 280);
    if (!t) throw fehler("wert-ungueltig");
    return t;
  }
  if (v && typeof v === "object") {
    const k = Object.keys(v).sort();
    if (k.length === 2 && k[0] === "lat" && k[1] === "lon") {
      const lat = +v.lat, lon = +v.lon;
      if (!isFinite(lat) || !isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180)
        throw fehler("wert-ungueltig");
      /* Drei Stellen sind gut hundert Meter — für den Sonnenstand mehr als
         genug, für eine Adresse zu grob. Mit Absicht. */
      return {lat: Math.round(lat * 1000) / 1000, lon: Math.round(lon * 1000) / 1000};
    }
    if (!k.length || k.length > 8) throw fehler("wert-ungueltig");
    const out = {};
    for (const s of k) {
      if (!/^[a-z]{1,4}$/.test(s)) throw fehler("wert-ungueltig");
      const n = v[s];
      if (!Number.isInteger(n) || n < 0 || n > 100000) throw fehler("wert-ungueltig");
      out[s] = n;
    }
    return out;
  }
  throw fehler("wert-ungueltig");
}
