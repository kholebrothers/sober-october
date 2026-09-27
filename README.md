# sober-october

Sober October — freiwilliges Commitment: kein Kaffee, keine Kippe, kein Videokonsum. Bereitschaft genügt.

Live: https://sober-october.khole.workers.dev

## Was die App ist

Man wählt, was man im Oktober sein lässt: Kaffee, Kippe, Video (mit **Alles** alle drei auf einmal)
und beliebig viele **eigene Tracker** mit selbst geschriebenem Namen, etwa „Alkohol“ oder „Zucker“ —
jederzeit dazu, über ⋯ → „Tracker wählen oder hinzufügen“. Die Namen bleiben im Gerät; an kur-core
gingen nur die Schlüssel (`eigen`, `eigen-…`).

**Im Zentrum steht der Monat.** Oben in jeder Ansicht: der Oktober als Kalender und darunter
ein Knopf, **„Heute bin ich dabei“**. Ein Tippen, und das Feld des Tages füllt sich, die Zahl der
Tage dabei springt, das Telefon tippt kurz zurück; an den Stufen 5, 8, 13, 21 und 34 leuchtet der
Monat auf. Kurz vor dem Oktober zählen die Tage davor als Vorlauf. Ein vergangener Tag ohne Eintrag
ist ein leises graues Feld: nichts bekannt, kein Urteil.

Darunter die Tracker, je eine Kachel für „habe“ und darunter „würde gern“. **Notieren ist ein
Tippen:** es notiert sofort und zählt den Tag genauso; die Meldung danach bietet „Details“ (die
Fragen, freiwillig) und „Rückgängig“ (vertippt). Die Kacheln bleiben ruhig — Farbe nur als Streifen,
die Zahl in Tinte —, denn Beobachten soll sich nicht wie Belohnung anfühlen, und nicht wie Strafe.
Einen Knopf „heute ohne“ gibt es nicht. Alles Weitere ist ein **Baustein**, den man unter ⋯ dazunimmt:

| Baustein | Wo | Was |
|---|---|---|
| Leitgedanke *(an)* | oben | ein eigener Satz, anfangs „Bereitschaft genügt.“; gilt ab einem Tag, frühere bleiben |
| Lauf | im Monat | Tage am Stück, der längste Lauf und ein Satz zum Tag |
| Heatmap | unten | der Oktober als Kästchen, eine Spalte je Woche, ab der Woche des 1. September |
| Wissen und Rückblick | unten | Ebenen, die sich durch Benutzen öffnen; der Rückblick in Wochen |
| Abends ruhiger *(an)* | Darstellung | nach Sonnenuntergang eine Spur ruhiger |

Die Ansicht (Knopf, Blatt, Faden) ist davon unabhängig, ebenso die **Farbwelt**: drei helle auf Flexoki-Grund — Papier (Flexoki pur), Salbei, Flieder —, im Dunkeln immer das warme Braun. Ebenen öffnen sich auch, wenn ihr Baustein
aus ist — schaltet man ihn ein, ist da, was schon verdient ist. Vom Homescreen startet die App auch
**ohne Netz** (Manifest und Service Worker; Symbole: `node tools/icons-bauen.js`).

Die Haltung kommt aus lifetracker und smokefree: Ein Konsumereignis ist ein Ereignis, kein
Versagen. Ein leerer Kreis heißt *unbekannt*, nicht *nicht geschafft*. Kein Verhalten wird rot.

Drei Ansichten, umschaltbar in den Einstellungen (⋯): **Knopf** (Standard), **Blatt**, **Faden**.
Sie stammen aus dem Prototyp auf dem Branch `prototyp-zurueckhaltend`; dort steht in `NOTIZ.md`,
welche Fragen er beantwortet hat und welche offen sind.

## Wo die Daten liegen

**Nur im Browser** (localStorage, Schlüssel `sober-october`). Es gibt keinen Server, kein Konto und
keine Anfragen nach außen. In den Einstellungen lässt sich alles auf dem Gerät löschen.

Später soll die **Teilnahme** — und nur sie — auf einen Server nach dem Muster von kur-core, für die
Community-Erfahrung der Vier-Wochen-Kur (ein Link, kein Login, eigene und kollektive Tage). Gemeint
sind Name, Commitment und die Tage, an denen etwas notiert wurde. Einträge, Gefühle und Reflexionen
bleiben im Gerät. `fuerKern()` in `public/app/logik.js` liefert diese Teilnahme schon heute. Die Tests
prüfen sie gegen den Wertevertrag von kur-core.

## Aufbau

Kein Bundler, kein Build-Schritt (Regel aus kur-core): native ES-Module, `public/` wird so
ausgeliefert, wie es im Repo steht.

    public/index.html          die Seite
    public/app.css             Palette und Stil (mahlzeit/docs/GESTALT.md)
    public/app/logik.js        Zustand, Bausteine, Oktober, Lauf, Freischalten, fuerKern() — ohne DOM, getestet
    public/app/speicher.js     localStorage
    public/app/haupt.js        Verdrahtung: Wahl, Bogen, Einstellungen, render()
    public/app/ebenen.js       Inhalte der Ebenen (Texte ungeprüft, siehe dort)
    public/app/ansichten/      knopf.js, blatt.js, faden.js und teile.js (Kopfzeile, Helfer)
    public/app/bausteine/      oben.js (Leitgedanke), monat.js (Kalender, „Heute bin ich dabei“, Lauf), unten.js, heatmap.js
    public/kern/               aus kur-core kopiert: datum.js, uhr.js (Dev-Uhr); sonne.js aus lifetracker
    public/sw.js               Service Worker; SCHALE muss jede Datei nennen (test/pwa.test.js)
    test/                      node --test; kur-core-wertevertrag.js ist eine Kopie

UX-Bewertung und gemeinsame Gestaltungsregeln: [docs/DESIGNSPRACHE.md](docs/DESIGNSPRACHE.md).

Woher was stammt: [docs/HERKUNFT.md](docs/HERKUNFT.md).

## Lokal

    npm install
    npm test
    npm run dev                # http://localhost:8787, mit Dev-Uhr unten links

Die **Dev-Uhr** schaltet den Tag vor und zurück, damit sich der Oktober ansehen lässt, ohne zu warten.
Sie läuft auf localhost und auf den Vorschau-Adressen, nie live.

## Ausliefern

Cloudflare Workers, nur statische Dateien (`wrangler.jsonc`), Konto z3e.

| Was | Wohin | Wie |
|---|---|---|
| `main` | https://sober-october.khole.workers.dev | Push → GitHub Actions, oder `npm run deploy` |
| jeder andere Branch | `https://<branch>-sober-october.khole.workers.dev` | Push → GitHub Actions, oder `npm run vorschau -- <alias>` |

Der Workflow `.github/workflows/ausliefern.yml` testet bei jedem Push. Auf `main` schaltet er live.
Auf jedem anderen Branch lädt er eine **Vorschau** hoch: eine Worker-Version, die nicht live
geschaltet wird, mit dem Branchnamen als Alias. Zu einem offenen PR schreibt er die Adresse als
Kommentar. Schlagen die Tests fehl, wird nichts hochgeladen.

**Einmal einrichten:** Im Cloudflare-Dashboard (Konto z3e) unter *My Profile → API Tokens* einen
Token anlegen mit *Account · Workers Scripts · Edit*, *Account · Account Settings · Read* und
*User · User Details · Read* (dieselben Rechte wie bei Andreas Webseite), beschränkt auf das Konto
z3e. Danach:

    gh secret set CLOUDFLARE_API_TOKEN -R kholebrothers/sober-october

Solange das Secret fehlt, scheitert der Schritt „Live“ bzw. „Vorschau“. Die Tests laufen trotzdem.
