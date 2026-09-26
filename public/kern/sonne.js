/* Sonne und Tageszeit — aus lifetracker/public/app.js (sonne, phase).

   Grobe Sonnenzeiten für Berlin (NOAA-Näherung, auf die Minute genau
   genug). Danach richtet sich, wann die App abends ruhiger wird. Ohne DOM,
   läuft mit `node --test`. */

import { alsDatum } from "./datum.js";

const LAT = 52.52, LON = 13.405;

/** Auf- und Untergang als Minuten seit Mitternacht, Ortszeit. */
export function sonne(tag) {
  const d = alsDatum(tag);
  // Runden, nicht abschneiden: über die Zeitumstellung fehlt bzw. kommt eine
  // Stunde dazu, und floor macht daraus einen ganzen Tag Fehler.
  const tagImJahr = Math.round((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
  const rad = Math.PI / 180;
  const g = 2 * Math.PI / 365 * (tagImJahr - 1);
  const eqtime = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g)
    - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g)
    - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g)
    - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const cosH = Math.cos(90.833 * rad) / (Math.cos(LAT * rad) * Math.cos(decl)) - Math.tan(LAT * rad) * Math.tan(decl);
  if (cosH > 1 || cosH < -1) return { auf: 6 * 60, unter: 20 * 60 };   // Polartag/-nacht
  const ha = Math.acos(cosH) / rad;
  const versatz = -d.getTimezoneOffset();
  return { auf: Math.round(720 + 4 * (-LON - ha) - eqtime + versatz), unter: Math.round(720 + 4 * (-LON + ha) - eqtime + versatz) };
}

/** "tag" | "abend" (ab Sonnenuntergang) | "nacht" (ab 22 Uhr bis kurz vor Sonnenaufgang). */
export function tageszeit(tag, minute) {
  const s = sonne(tag);
  if (minute >= 22 * 60 || minute < s.auf - 45) return "nacht";
  if (minute >= s.unter) return "abend";
  return "tag";
}
