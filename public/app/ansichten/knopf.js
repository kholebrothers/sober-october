/* Ansicht „Knopf" — der Standard.
   Oben das Commitment, darunter der Tag (bausteine/heute.js): die Tracker
   zum Antippen, ein Satz, und was man sonst festhalten mag. */

import { el, kopf } from "./teile.js";
import { oben } from "../bausteine/index.js";

export function render(api) {
  const s = el("section", "ansicht-knopf");
  s.append(kopf(api), oben(api));
  return s;
}
