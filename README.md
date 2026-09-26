# sober-october

Sober October — freiwilliges Commitment: kein Kaffee, keine Kippe, kein Videokonsum. Bereitschaft genügt.

Live: https://sober-october.khole.workers.dev

## Was die App ist

Man wählt, was man im Oktober sein lässt (eins bis drei). Danach zeigt die Oberfläche nur dieses
Commitment. Man notiert, wenn etwas geschehen ist („habe“) und, wenn man will, auch den Moment,
in dem man gern würde („würde gern“, beim Rauchen „will rauchen“). Danach folgt eine kurze,
überspringbare Reflexion mit den vier Grundgefühlen. Einen Drang kann man begleiten lassen.
Alles Weitere ist eine **Ebene**, die sich erst öffnet: Wissen zu Nervensystem und Routinen,
neue Verhaltensweisen, der Verlauf des Monats.

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
    public/app/logik.js        Zustand, Oktober, Freischalten, fuerKern() — ohne DOM, getestet
    public/app/speicher.js     localStorage
    public/app/haupt.js        Verdrahtung: Wahl, Bogen, Einstellungen, render()
    public/app/ebenen.js       Inhalte der Ebenen (Texte ungeprüft, siehe dort)
    public/app/ansichten/      knopf.js, blatt.js, faden.js
    public/kern/               aus kur-core kopiert: datum.js, uhr.js (Dev-Uhr)
    public/knopf/              aus smokefree kopiert: der Zählknopf
    test/                      node --test; kur-core-wertevertrag.js ist eine Kopie

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
Token anlegen, Vorlage „Edit Cloudflare Workers“ oder mindestens *Workers Scripts:Edit* und
*Account Settings:Read*. Danach:

    gh secret set CLOUDFLARE_API_TOKEN -R kholebrothers/sober-october

Solange das Secret fehlt, scheitert der Schritt „Live“ bzw. „Vorschau“. Die Tests laufen trotzdem.
