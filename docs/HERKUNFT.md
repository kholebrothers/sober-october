# Herkunft

Was aus den Nachbar-Repos übernommen ist. Alles davon ist **kopiert**, nicht importiert: kur-core
hat kein Remote, und eine Abhängigkeit über einen relativen Pfad würde im Deployment brechen. Die
Nachbar-Repos sind dafür nicht verändert worden.

| Hier | Quelle | Stand | Verändert? |
|---|---|---|---|
| `public/kern/datum.js` | `kur-core/domaene/datum.js` | `f9e139a` | nein |
| `public/kern/uhr.js` | `kur-core/dev/uhr.js` | `f9e139a` | `lokal()` erkennt auch die Vorschau-Adressen `<alias>-sober-october.…workers.dev` |
| `public/knopf/knopf.js`, `knopf.css` | `smokefree/knopf/` | `90321b8` | nein |
| `test/kur-core-wertevertrag.js` | `kur-core/server/api.js` (`leer`, `normalisiere`, Muster) | `f9e139a` | nur herausgelöst |

Nicht als Datei, aber inhaltlich übernommen:

- **Fragen** „Was war kurz davor?“ und „Was hätte auch gepasst?“: `smokefree/modul.js`
  (`FRAGEN_ZIGARETTE`), dort aus lifetracker `RUECK`.
- **Palette, offener Kreis, Microcopy, kein Rot**: `mahlzeit/docs/GESTALT.md`, Werte für hell und
  dunkel über `smokefree/index.html`.
- **Haltung und Event-Denken** („Module interpretieren Events“, Häkchen heißt nur *Beobachtung
  liegt vor*): `mahlzeit/docs/PLATTFORM.md`.
- **Kein Build-Schritt, Datenschlüssel sind unantastbar**: kur-core README.
- **Das Muster „main live, Branch Vorschau per GitHub Actions nach khole.workers.dev“**: die
  Webseite von Andrea (`ndre_og_webseite`, `.github/workflows/vorschau.yml`), vereinfacht auf
  Worker-Versionen mit Alias statt eines zweiten Workers.

## Richtung kur-core

Die App soll kur-core später als Unterbau nutzen können, statt ihm zu widersprechen:

- Der Tag ist ein lokaler Tag `JJJJ-MM-TT` (kur-core `datum.js`), nicht UTC.
- Was auf einen Server darf, erzeugt `fuerKern()`: die Einstellung `commitment` und je Tag
  `dabei: true`. Beides besteht den Wertevertrag von kur-core (Test in `test/logik.test.js`).
  Damit passt es in dessen Tabellen `people`, `settings` und `entries`, ohne neues Schema.
- Offen: kur-core begrenzt auf 20 Personen je Datenbank und hält Namen eindeutig. Das passt zu
  einer Gruppe, die sich kennt, nicht zu einer offenen Community. Wie Gruppen entstehen (ein Link
  je Gruppe, also eine D1 je Gruppe oder eine Gruppenspalte), ist noch zu entscheiden.
- Kommt der Server, braucht die Vorschau eine eigene D1. Worker-Versionen teilen sich ihre
  Bindungen mit live.
