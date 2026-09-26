/* =====================================================================
   Speicher — nur dieses Gerät

   Ein Schlüssel im localStorage. Er ist ein Datenschlüssel und wird nicht
   umbenannt. Was sich nicht lesen lässt (fremde Version, kaputtes JSON),
   wird vor dem ersten Überschreiben unter `…alt` beiseitegelegt statt
   stillschweigend verloren. Wo localStorage fehlt oder wirft (privates
   Fenster, gesperrte Website-Daten), läuft die App im Speicher weiter.
   ===================================================================== */

import { aus, neuerZustand, VERSION } from "./logik.js";

const SCHLUESSEL = "sober-october";

export function laden() {
  let text = null;
  try { text = localStorage.getItem(SCHLUESSEL); } catch { return neuerZustand(); }
  if (text === null) return neuerZustand();
  const z = aus(text);
  let lesbar = false;
  try { lesbar = JSON.parse(text).v === VERSION; } catch {}
  if (!lesbar) try { localStorage.setItem(SCHLUESSEL + ".alt", text); } catch {}
  return z;
}

export function sichern(z) {
  try { localStorage.setItem(SCHLUESSEL, JSON.stringify(z)); return true; } catch { return false; }
}

export function loeschen() {
  try { localStorage.removeItem(SCHLUESSEL); localStorage.removeItem(SCHLUESSEL + ".alt"); } catch {}
}
