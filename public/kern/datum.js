/* =====================================================================
   Datum

   Ein Tag ist hier eine Zeichenkette "JJJJ-MM-TT" in **lokaler** Zeit.
   Nicht UTC: `new Date().toISOString()` liefert zwischen Mitternacht und
   zwei Uhr nachts in Berlin noch den Vortag — genau in der Stunde, in der
   jemand vor dem Schlafen etwas abhakt. Die App rechnet seit jeher lokal;
   der Kern tut es auch.

   Herkunft: iso(), parse(), shift(), today(), dayNumber() in
   lifetracker/public/app.js.
   ===================================================================== */

const zwei = (n) => (n < 10 ? "0" : "") + n;

/** Ein Date-Objekt als lokaler Tag. */
export function tagVon(d) {
  return d.getFullYear() + "-" + zwei(d.getMonth() + 1) + "-" + zwei(d.getDate());
}

/** Ein Tag als Date-Objekt, Mitternacht lokal. */
export function alsDatum(tag) {
  const a = tag.split("-");
  return new Date(+a[0], +a[1] - 1, +a[2]);
}

/** Heute, lokal. `jetzt` ist für Tests da. */
export function heute(jetzt) {
  return tagVon(jetzt ? new Date(jetzt) : new Date());
}

/** `n` Tage weiter (negativ: zurück). Über setDate, damit die Umstellung auf
    Sommerzeit keinen Tag verschluckt. */
export function verschiebe(tag, n) {
  const d = alsDatum(tag);
  d.setDate(d.getDate() + n);
  return tagVon(d);
}

/** Wie viele Tage liegen zwischen zwei Tagen? Gerundet, aus demselben Grund. */
export function tageZwischen(von, bis) {
  return Math.round((alsDatum(bis) - alsDatum(von)) / 86400000);
}

/** Der wievielte Tag seit dem Start? Der Starttag selbst ist Tag 1. */
export function tagNummer(start, tag) {
  return tageZwischen(start, tag) + 1;
}
