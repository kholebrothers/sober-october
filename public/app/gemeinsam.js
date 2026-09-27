/* =====================================================================
   Gemeinsam — ohne DOM, ohne Netz

   Eine Selbsterfahrung, die mehrere zugleich gehen. Wer mitgeht, teilt mit
   der Gruppe genau das, was `fuerKern()` hergibt: den Namen, was er sein
   lässt (nur Schlüssel), und an welchen Tagen er dabei war. Einträge,
   Gefühle und Notizen bleiben im Gerät.

   Hier stehen der Abgleich (was muss an den Server?) und die Aufbereitung
   des Server-Stands für die Anzeige. Beides ist reine Funktion.
   ===================================================================== */

import { fuerKern, gewaehlt, verzichte, FEST } from "./logik.js";
import { verschiebe } from "../kern/datum.js";

/* Jede Person bekommt eine Flexoki-Farbe, in der Reihenfolge, in der sie
   dazugekommen ist. Rot gibt es nicht (app.css), Moos ist „dabei". */
export const FARBEN = ["var(--teal)", "var(--clay)", "var(--blau)", "var(--magenta)", "var(--gelb)", "var(--lila)",
  "color-mix(in oklab, var(--teal) 55%, var(--blau))", "color-mix(in oklab, var(--clay) 55%, var(--gelb))",
  "color-mix(in oklab, var(--magenta) 55%, var(--lila))", "color-mix(in oklab, var(--blau) 50%, var(--lila))"];

const FENSTER = 89;   // der Server hält 90 Tage

const dabeiLaut = (stand, id) =>
  new Set(Object.entries((stand && stand.log) || {}).filter(([, p]) => p[id] && p[id].dabei).map(([d]) => d));

/**
 * Was an den Server muss, damit er zu diesem Gerät passt.
 *
 * Tage kommen nur dazu, sie verschwinden nie — mit einer Ausnahme: heute.
 * Wer auf einem zweiten Gerät mitgeht, hat dort nicht dieselben Tage; ein
 * genauer Abgleich würde die des ersten löschen. Zurücknehmen lässt sich
 * in der App ohnehin nur der heutige Tag.
 *
 * @returns {tage: [{date, value}], commitment: string[]|null}
 */
export function abgleich(z, stand, heute) {
  const ich = z.gemeinsam && z.gemeinsam.id;
  if (!ich || !stand) return { tage: [], commitment: null };
  const ab = verschiebe(heute, -FENSTER);
  const lokal = new Set(fuerKern(z, heute).eintraege.map((e) => e.date).filter((d) => d >= ab && d <= heute));
  const dort = dabeiLaut(stand, ich);
  const tage = [...lokal].filter((d) => !dort.has(d)).sort().map((date) => ({ date, value: true }));
  if (dort.has(heute) && !lokal.has(heute)) tage.push({ date: heute, value: null });
  const jetzt = gewaehlt(z);
  const vorher = stand.settings && stand.settings[ich] && stand.settings[ich].commitment;
  const gleich = vorher && [...vorher.wert].sort().join() === [...jetzt].sort().join();
  return { tage, commitment: gleich || !jetzt.length ? null : jetzt };
}

/** Bin ich (noch) in der Gruppe? Nach einem Abschied auf einem anderen
    Gerät steht die Person nicht mehr im Stand. */
export const binDabei = (z, stand) => !!(z.gemeinsam && stand && stand.people.some((p) => p.id === z.gemeinsam.id));

/** Was jemand sein lässt, in Worten. Eigene Tracker bleiben namenlos. */
function commitmentText(z, stand, id) {
  const w = stand.settings && stand.settings[id] && stand.settings[id].commitment;
  if (!w || !Array.isArray(w.wert)) return "";
  const V = verzichte(z);
  const fest = w.wert.filter((k) => FEST.includes(k)).map((k) => V[k].name);
  const eigen = w.wert.filter((k) => !FEST.includes(k)).length;
  if (eigen) fest.push(eigen === 1 ? "Eigenes" : `${eigen}× Eigenes`);
  return fest.join(" · ");
}

/**
 * Die Gruppe für die Anzeige, über dieselben Tage wie der eigene Monat.
 * Die eigene Zeile nimmt die Tage dieses Geräts — sie ist nie hinter dem
 * Server zurück, auch wenn der Abgleich noch unterwegs ist.
 * @param tage  die Tage, über die gezeigt wird (aus monat().zellen)
 * @returns {heute: [{name, farbe, du}], leute: [{id, name, farbe, du, commitment, tage: [bool], anzahl}]}
 */
export function gruppe(z, stand, heute, tage) {
  const ich = z.gemeinsam && z.gemeinsam.id;
  const lokal = new Set(fuerKern(z, heute).eintraege.map((e) => e.date));
  const leute = stand.people.map((p, i) => {
    const du = p.id === ich;
    const dabei = du ? lokal : dabeiLaut(stand, p.id);
    const reihe = tage.map((t) => t <= heute && dabei.has(t));
    return { id: p.id, name: p.name, farbe: FARBEN[i % FARBEN.length], du, commitment: commitmentText(z, stand, p.id),
      tage: reihe, anzahl: reihe.filter(Boolean).length, heute: dabei.has(heute) };
  });
  return { heute: leute.filter((p) => p.heute), leute };
}

/** „Anna, Ben und du" */
export function namenListe(leute) {
  const n = leute.map((p) => (p.du ? "du" : p.name)).sort((a, b) => (a === "du") - (b === "du"));
  return n.length > 1 ? `${n.slice(0, -1).join(", ")} und ${n.at(-1)}` : n[0] || "";
}
