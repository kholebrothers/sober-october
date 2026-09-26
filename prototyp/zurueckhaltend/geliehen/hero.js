/**
 * Ein Hero für persönlichen Stand, Vorsatz und gemeinsamen Verlauf.
 * Texte und fertige interaktive DOM-Inhalte gehören der App. Die übergebenen
 * Nodes werden verschoben, nicht kopiert: ihre Event-Listener bleiben erhalten.
 * Der Renderer berechnet keine Serien und schreibt keine Tracking-Daten.
 */
export function hero({ dokument = globalThis.document, titel, stand, vorsatz, gemeinsam }) {
  const element = (tag, klasse, text) => {
    const node = dokument.createElement(tag);
    node.className = klasse;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const root = element('section', 'kur-hero');
  root.setAttribute('aria-label', titel);
  root.setAttribute('data-katze', 'wand');

  const kopf = element('header', 'kur-hero__kopf');
  const botschaft = element('div', 'kur-hero__botschaft');
  botschaft.append(element('h2', 'kur-hero__titel', stand.titel),
    element('p', 'kur-hero__klein', stand.detail));

  const vergleich = element('div', 'kur-hero__vergleich');
  for (const wert of [stand, gemeinsam]) {
    const spalte = element('div', 'kur-hero__wert');
    spalte.append(element('strong', 'kur-hero__zahl', wert.zahl),
      element('span', 'kur-hero__klein', wert.einheit));
    vergleich.append(spalte);
  }
  kopf.append(vergleich.firstChild, botschaft, vergleich.lastChild);
  root.append(kopf);

  const vor = element('div', 'kur-hero__vorsatz');
  vor.dataset.stufe = vorsatz.stufe;
  const vorKopf = element('div', 'kur-hero__zeile');
  vorKopf.append(element('h3', 'kur-hero__rubrik', vorsatz.titel));
  if (vorsatz.status) vorKopf.append(element('span', 'kur-hero__klein', vorsatz.status));
  vor.append(vorKopf, vorsatz.inhalt);
  root.append(vor);

  const team = element('div', 'kur-hero__gemeinsam');
  team.append(gemeinsam.verlauf);
  root.append(team);
  return root;
}
