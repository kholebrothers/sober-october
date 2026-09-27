/* =====================================================================
   Werkzeuge — Schicht 2, „Formen"

   Kurze Werkzeuge für den Moment, in dem der Drang kommt: Anker, Swish und
   Reframing aus dem NLP, dazu die Wenn-dann-Pläne (aus lifetracker; die
   stammen eigentlich aus der Psychologie). Jedes passt in eine Minute.

   Die Anleitungen sind Übungen, keine Therapie, und fachlich ungeprüft wie
   die Texte in ebenen.js. Was sich die App merkt, steht in logik.js
   (werkzeug); was bei einem Drang herauskommt, hängt an dessen Notiz.

   Das Modul kennt keinen Zustand: es bekommt, was es braucht, hinein.
   ===================================================================== */

/**
 * @param k {el, knopf, zeige, schliessen, aendern, melde, zustand, setzeAnker,
 *           setzeSwish, planHinzu, planWeg, ergaenze}
 */
export function werkzeuge(k) {
  const { el, knopf } = k;

  function bogen(titel, rubrik = "Werkzeug") {
    const f = el("form", "bogen-inhalt werkzeug");
    f.append(el("p", "rubrik", rubrik), el("h2", null, titel));
    f.addEventListener("submit", (e) => e.preventDefault());
    return f;
  }
  const feld = (name, text, wert, platz) => {
    const l = el("label", "frage");
    const i = Object.assign(document.createElement("input"), { name, value: wert || "", placeholder: platz || "", autocomplete: "off", maxLength: 140 });
    l.append(el("span", "serif", text), i);
    return [l, i];
  };
  const schritt = (n, text) => {
    const p = el("p", "werkzeug-schritt");
    p.append(el("span", "werkzeug-nr", String(n)), el("span", null, text));
    return p;
  };
  const unten = (...knoepfe) => { const r = el("div", "wahlreihe"); r.append(...knoepfe); return r; };

  /* ---- Die Auswahl ------------------------------------------------- */
  function menue(drangId) {
    const w = k.zustand().werkzeug;
    const f = bogen(drangId ? "Der Drang ist da. Was hilft jetzt?" : "Werkzeuge", drangId ? "Werkzeug · jetzt" : "Werkzeuge");
    if (w.plaene.length) {
      const p = el("div", "werkzeug-plaene");
      p.append(el("p", "rubrik", "Deine Wenn-dann-Pläne"));
      for (const x of w.plaene.slice(0, 3)) p.append(el("p", "werkzeug-plan", `Wenn ${x.wenn}, dann ${x.dann}.`));
      f.append(p);
    }
    const liste = el("div", "werkzeug-liste");
    const eintrag = (name, text, tun, farbe) => {
      const b = knopf("", "werkzeug-knopf", tun);
      b.style.setProperty("--c", farbe);
      b.append(el("strong", null, name), el("span", "leise klein", text));
      liste.append(b);
    };
    eintrag(w.anker ? "Anker abrufen" : "Anker setzen", w.anker ? `${w.anker.geste} — und du bist wieder dort.` : "Einen ruhigen Zustand an eine Geste binden.", () => (w.anker ? ankerAbrufen() : ankerSetzen()), "var(--moss)");
    eintrag("Swish", "Das Bild vor dem Drang gegen das Bild von dir tauschen.", () => swish(), "var(--teal)");
    eintrag("Reframing", "Welche gute Absicht hat der Drang? Wie ginge das anders?", () => reframing(drangId), "var(--lila)");
    eintrag("Wenn-dann", w.plaene.length ? `${w.plaene.length} ${w.plaene.length === 1 ? "Plan" : "Pläne"} — ansehen, ergänzen.` : "Einen Plan für den nächsten Moment fassen.", () => plaene(), "var(--gelb)");
    f.append(liste, unten(knopf("schließen", "text leise", () => k.schliessen())));
    k.zeige(f);
  }

  /* ---- Anker ------------------------------------------------------- */
  function ankerSetzen() {
    const w = k.zustand().werkzeug;
    const f = bogen("Einen Anker setzen", "Werkzeug · Anker");
    const [lm, moment] = feld("moment", "Ein Moment, in dem du ruhig, klar und bei dir warst.", w.anker?.moment, "Am See, früh am Morgen …");
    const [lg, geste] = feld("geste", "Deine Geste", w.anker?.geste || "Daumen und Zeigefinger", "Daumen und Zeigefinger");
    let n = 0;
    const zaehler = knopf("Durchgang 1 von 5", "gross leise", () => {
      n = Math.min(5, n + 1);
      zaehler.textContent = n < 5 ? `Durchgang ${n + 1} von 5` : "Fünf Durchgänge — fertig";
      zaehler.disabled = n >= 5;
    });
    f.append(lm,
      schritt(1, "Geh in den Moment hinein: Was siehst du? Was hörst du? Wie fühlt es sich im Körper an?"),
      schritt(2, "Wenn das Gefühl am stärksten ist: die Geste, fest. Halten, bis es nachlässt. Loslassen."),
      schritt(3, "Kurz abschütteln, an etwas anderes denken. Dann noch einmal."),
      zaehler, lg,
      unten(knopf("Anker speichern", "gross", () => {
        if (!moment.value.trim()) { moment.focus(); return; }
        k.aendern(() => k.setzeAnker(k.zustand(), moment.value, geste.value));
        k.schliessen();
        k.melde("Dein Anker ist gesetzt. Im Drang-Moment: die Geste, und du bist wieder dort.");
      }), knopf("abbrechen", "text leise", () => k.schliessen())));
    k.zeige(f);
    moment.focus();
  }

  function ankerAbrufen() {
    const a = k.zustand().werkzeug.anker;
    const f = bogen("Den Anker abrufen", "Werkzeug · Anker");
    f.classList.add("werkzeug-ruhe");
    f.append(el("p", "werkzeug-gross serif", `${a.geste}.`),
      el("p", "serif", "Langsam ausatmen. Länger aus als ein."),
      el("p", "serif", `Du warst schon einmal hier: ${a.moment}.`),
      el("p", "leise", "Bleib, solange es gut tut. Der Drang steigt, und er fällt auch wieder."),
      unten(knopf("gut so", "gross", () => { k.schliessen(); k.melde("Gut so."); }),
        knopf("neu setzen", "text leise", () => ankerSetzen())));
    k.zeige(f);
  }

  /* ---- Swish -------------------------------------------------------- */
  function swish() {
    const w = k.zustand().werkzeug;
    const f = bogen("Swish", "Werkzeug · Swish");
    const [la, ausloeser] = feld("ausloeser", "Das Bild kurz vor dem Drang: Was siehst du?", w.swish?.ausloeser, "Die Kaffeemaschine im Büro …");
    const [lz, ziel] = feld("ziel", "Das Bild von dir, wie du sein willst", w.swish?.ziel, "Ich, wach und klar, mit einer Tasse Tee …");
    f.append(la, lz, unten(knopf("weiter", "gross", () => {
      if (!ausloeser.value.trim() || !ziel.value.trim()) { (ausloeser.value.trim() ? ziel : ausloeser).focus(); return; }
      k.aendern(() => k.setzeSwish(k.zustand(), ausloeser.value, ziel.value));
      swishBuehne();
    }), knopf("abbrechen", "text leise", () => k.schliessen())));
    k.zeige(f);
  }

  /* Die Bühne: groß und hell das Auslöserbild, klein und dunkel unten links
     das Zielbild. Ein Tipp, und in einer Sekunde tauschen sie — dann kurz
     leer. Fünfmal, jedes Mal schneller. */
  function swishBuehne() {
    const s = k.zustand().werkzeug.swish;
    const f = bogen("Swish", "Werkzeug · Swish");
    const b = el("div", "swish");
    const gross = el("div", "swish-bild swish-ausloeser", s.ausloeser);
    const klein = el("div", "swish-bild swish-ziel", s.ziel);
    b.append(gross, klein);
    let n = 0;
    const text = el("p", "leise", "Sieh das Auslöserbild groß und hell. Unten links, klein und dunkel: du. Dann: Swish.");
    const los = knopf("Swish", "gross", () => {
      if (b.dataset.lauf) return;
      n++;
      const dauer = Math.max(350, 1000 - n * 130);
      b.style.setProperty("--dauer", `${dauer}ms`);
      b.dataset.lauf = "";
      setTimeout(() => {
        b.dataset.leer = "";
        setTimeout(() => delete b.dataset.lauf, 450);
        setTimeout(() => {
          delete b.dataset.leer;
          if (n < 5) { los.textContent = `Swish ${n + 1} von 5`; text.textContent = "Und noch einmal, etwas schneller."; }
          else {
            los.remove();
            text.textContent = "Denk jetzt an das Auslöserbild. Was taucht auf? Wenn es sofort zum Bild von dir springt, sitzt es.";
          }
        }, 800);
      }, dauer);
    });
    f.append(b, text, unten(los, knopf("fertig", "text leise", () => { k.schliessen(); k.melde("Swish gemacht."); })));
    k.zeige(f);
  }

  /* ---- Reframing ---------------------------------------------------- */
  const ABSICHTEN = ["Pause", "Ruhe", "Belohnung", "Wachheit", "Verbindung", "Trost", "Ablenkung"];
  function reframing(drangId) {
    const f = bogen("Welche gute Absicht hat der Drang?", "Werkzeug · Reframing");
    f.append(el("p", "leise", "Hinter jedem Drang steht etwas, das du brauchst. Wenn du es kennst, gibt es mehr als einen Weg dorthin."));
    const [la, absicht] = feld("absicht", "Was will er für dich?", "", "Eine Pause, Ruhe, …");
    const chips = el("div", "chips-reihe");
    for (const a of ABSICHTEN) chips.append(knopf(a, "chip-knopf", () => { absicht.value = a; wege[0].focus(); }));
    const wege = [];
    const lw = el("div", "frage");
    lw.append(el("span", "serif", "Drei andere Wege zu derselben Absicht"));
    for (let i = 0; i < 3; i++) {
      const w = Object.assign(document.createElement("input"), { name: `weg${i}`, autocomplete: "off", maxLength: 140, placeholder: ["Fünf Minuten raus", "Jemandem schreiben", "Ein Glas Wasser"][i] });
      w.setAttribute("aria-label", `Weg ${i + 1}`);
      wege.push(w);
      lw.append(w);
    }
    const speichern = (alsPlan) => {
      const a = absicht.value.trim(), ws = wege.map((w) => w.value.trim()).filter(Boolean);
      if (!a || !ws.length) { (a ? wege[0] : absicht).focus(); return; }
      k.aendern(() => {
        if (drangId) k.ergaenze(k.zustand(), drangId, { antworten: { absicht: a, statt: ws.join(", ") } });
        if (alsPlan) k.planHinzu(k.zustand(), `der Drang nach ${a} kommt`, ws[0]);
      });
      k.schliessen();
      k.melde(alsPlan ? `Gemerkt: Wenn der Drang nach ${a} kommt, dann ${ws[0]}.` : `Probier einen davon: ${ws[0]}.`);
    };
    f.append(la, chips, lw, unten(knopf("gut", "gross", () => speichern(false)), knopf("als Wenn-dann merken", "text", () => speichern(true)),
      knopf("abbrechen", "text leise", () => k.schliessen())));
    k.zeige(f);
    absicht.focus();
  }

  /* ---- Wenn-dann ---------------------------------------------------- */
  function plaene() {
    const z = k.zustand();
    const f = bogen("Wenn-dann-Pläne", "Werkzeug · Wenn-dann");
    f.append(el("p", "leise", "Ein Moment und eine kleine Handlung. Je konkreter, desto eher greift er: ein Ort, eine Uhrzeit, ein Gefühl."));
    const l = el("ul", "werkzeug-liste-plaene");
    z.werkzeug.plaene.forEach((p, i) => {
      const li = el("li");
      const weg = knopf("×", "rund klein", () => { k.aendern(() => k.planWeg(k.zustand(), i)); plaene(); });
      weg.setAttribute("aria-label", "Plan entfernen");
      li.append(el("span", "werkzeug-plan", `Wenn ${p.wenn}, dann ${p.dann}.`), weg);
      l.append(li);
    });
    if (!z.werkzeug.plaene.length) l.append(el("li", "leise", "Noch keiner."));
    const [lw, wenn] = feld("wenn", "Wenn …", "", "ich ins Büro komme");
    const [ld, dann] = feld("dann", "dann …", "", "trinke ich zuerst ein Glas Wasser");
    f.append(l, lw, ld, unten(knopf("hinzufügen", "gross", () => {
      let ok = false;
      k.aendern(() => { ok = k.planHinzu(k.zustand(), wenn.value, dann.value); });
      if (!ok) { (wenn.value.trim() ? dann : wenn).focus(); return; }
      plaene();
    }), knopf("fertig", "text leise", () => k.schliessen())));
    k.zeige(f);
  }

  return { menue, ankerSetzen, ankerAbrufen, swish, reframing, plaene };
}
