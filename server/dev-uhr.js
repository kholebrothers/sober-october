/* =====================================================================
   Die Dev-Uhr, auf der Seite des Workers

   Lokal lässt sich der "aktuelle Tag" verschieben (siehe dev/uhr.js). Damit
   der Server mitspielt — Einträge für "morgen" annimmt und das 90-Tage-
   Fenster mitschiebt —, glaubt er dem Kopf `x-dev-tage`.

   **Nur, wenn DEV_UHR="an" gesetzt ist.** Das steht in `.dev.vars`, die
   `wrangler dev` liest und `wrangler deploy` nicht. Ein ausgelieferter
   Worker lässt sich von keinem Kopf in der Zeit verschieben.
   ===================================================================== */

const TAG_MS = 86400000;
const GRENZE = 400;

/** Die Zeit, mit der diese Anfrage rechnen soll. */
export function jetztFuer(anfrage, umgebung, echt) {
  const jetzt = echt === undefined ? Date.now() : echt;
  if (!umgebung || umgebung.DEV_UHR !== "an") return jetzt;
  const kopf = anfrage.headers.get("x-dev-tage");
  if (!kopf || !/^-?\d{1,3}$/.test(kopf)) return jetzt;
  const tage = +kopf;
  return Math.abs(tage) > GRENZE ? jetzt : jetzt + tage * TAG_MS;
}
