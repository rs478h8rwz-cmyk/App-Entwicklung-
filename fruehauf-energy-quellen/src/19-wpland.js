/* ---------- Wärmepumpe: Aufstellort & Abstand zur Grundstücksgrenze je Bundesland ----------
   Rechtsstand: Übersicht der Landesbauordnungen, Stand 24.09.2026 (Rechtsstand 10.11.2026), u. a. genehmigungscheck.de.
   Bei Gesetzesänderungen hier anpassen (WP_LAND_STAND). Ohne Gewähr – Bebauungsplan und Bauamt gehen vor. */
const WP_LAND_STAND = 'November 2026';
const WP_LAND = {
  BW: ['Baden-Württemberg', '0 m', 'An der Grenze möglich: Keine eigene Abstandsfläche, wenn die Außeneinheit höchstens 2,5 m hoch ist bzw. die Wandfläche bis 25 m² beträgt (Auskunft des Ministeriums).', '§ 6 Abs. 1 Satz 1 Nr. 3 LBO BW'],
  BY: ['Bayern', '0 m', 'Bis 2 m Höhe (inkl. Einhausung) keine Abstandsfläche – an der Grenze möglich, keine Längengrenze. Das Gebot der Rücksichtnahme gilt weiter.', 'Art. 6 Abs. 1 Satz 3 Nr. 4 BayBO (seit 01.01.2025)'],
  BE: ['Berlin', '0 m', 'An der Grenze bzw. in der Abstandsfläche zulässig bis 3 m Höhe und 9 m Länge je Grenze; wird auf die Grenzbebauung angerechnet.', '§ 6 Abs. 8 Satz 1 Nr. 2 BauO Bln (seit 23.07.2026)'],
  BB: ['Brandenburg', '0 m', 'An der Grenze zulässig bis 2 m Höhe und 3 m Länge je Grenze.', '§ 6 Abs. 8 Satz 1 Nr. 4 BbgBO'],
  HB: ['Bremen', '0 m', 'An der Grenze zulässig bis 2 m Höhe und 3 m Länge je Grenze; wird auf die Grenzbebauung angerechnet.', '§ 6 Abs. 8 Satz 1 Nr. 4 BremLBO'],
  HH: ['Hamburg', '0 m', 'Bis 2 m Höhe und 3 m Länge je Grenze ohne Abstandsfläche – aber nur so nah am Haus, wie technisch nötig (Mindestabstand zur Außenwand).', '§ 6 Abs. 8 Satz 1 Nr. 4 HBauO'],
  HE: ['Hessen', '0 m oder ab 1 m', 'Bis 2 m Höhe (inkl. Fundament und Einhausung) und 3 m Gesamtlänge: entweder direkt an der Grenze oder mindestens 1 m Abstand – dazwischen (z. B. 50 cm) nicht.', '§ 6 Abs. 9 Nr. 4 und Abs. 10 Satz 1 Nr. 11 HBO'],
  MV: ['Mecklenburg-Vorpommern', '0 m', 'An der Grenze zulässig bis 2 m Höhe und 3 m Länge je Grenze.', '§ 6 Abs. 8 Satz 1 Nr. 3 LBauO M-V'],
  NI: ['Niedersachsen', 'mind. 3 m', 'Grundsätzlich gilt der normale Grenzabstand von mindestens 3 m. Ausnahme: eine freistehende Wärmepumpe bis 2 m Höhe und 3 m Länge darf an die Grenze oder bis 1 m heran – aber nur, wenn auf dem Grundstück kein anderer Standort möglich ist und beim Nachbarn keine unzumutbaren Beeinträchtigungen durch Eisbildung, Geräusche oder Abluft entstehen. Wird auf die Grenzbebauung angerechnet.', '§ 5 NBauO, Ausnahme § 5 Abs. 8 Satz 4 Nr. 4 und Satz 5'],
  NW: ['Nordrhein-Westfalen', '0 m', 'Keine eigene Abstandsfläche – an der Grenze zulässig, ohne Höhengrenze. Wird auf die Grenzbebauung angerechnet (max. 9 m je Grenze, 18 m je Grundstück inkl. Garagen).', '§ 6 Abs. 8 Satz 1 Nr. 6 BauO NRW (seit 01.01.2024)'],
  RP: ['Rheinland-Pfalz', 'im Einzelfall', 'Keine ausdrückliche Regel. Nach VG Mainz (30.09.2020) wirkt eine kleine Luft-Wärmepumpe nicht wie ein Gebäude – meist ist kein Grenzabstand nötig. Im Zweifel das Bauamt fragen.', '§ 8 LBauO RP'],
  SL: ['Saarland', '0 m', 'An der Grenze zulässig bis 2 m Höhe und 3 m Länge je Grenze.', '§ 8 Abs. 2 Satz 1 Nr. 7 LBO Saarland'],
  SN: ['Sachsen', '0 m bis 2 m Höhe', 'Keine eigene Regel. Laut Ministerium (Hinweis vom 21.12.2023) wirkt eine Wärmepumpe erst ab mehr als 2 m Höhe wie ein Gebäude – bis 2 m ist meist kein Grenzabstand nötig.', '§ 6 Abs. 1 Satz 2 SächsBO'],
  ST: ['Sachsen-Anhalt', '0 m', 'An der Grenze zulässig bis 2 m Höhe und 3 m Länge je Grenze; wird auf die Grenzbebauung angerechnet.', '§ 6 Abs. 9 Satz 1 Nr. 4 BauO LSA (seit 14.01.2026)'],
  SH: ['Schleswig-Holstein', '0 m', 'An der Grenze zulässig bis 2 m Höhe und 3 m Gesamtlänge je Grenze (auch mehrere Geräte); wird auf die Grenzbebauung angerechnet.', '§ 6 Abs. 8 Satz 1 Nr. 4 LBO SH'],
  TH: ['Thüringen', '0 m', 'An der Grenze zulässig bis 2 m Höhe und 3 m Länge je Grenze; wird auf die Grenzbebauung angerechnet.', '§ 6 Abs. 7 Satz 1 Nr. 4 ThürBO']
};
/* Bundesland grob aus der PLZ (Leitregion, einige Grenzfälle per 3 Ziffern) – wird online über die Adresse präzisiert */
function wpLandFromPlz(z) {
  z = String(z || '').trim(); if (!/^\d{5}$/.test(z)) return '';
  const t3 = { 210: 'HH', 211: 'HH', 220: 'HH', 221: 'HH', 222: 'HH', 223: 'HH', 224: 'HH', 225: 'HH', 226: 'HH', 227: 'HH', 228: 'SH', 229: 'SH', 275: 'HB', 276: 'HB', 281: 'HB', 282: 'HB', 283: 'HB', 284: 'HB', 285: 'HB', 286: 'HB', 287: 'HB', 372: 'HE', 373: 'TH', 383: 'NI', 388: 'ST', 389: 'ST', 484: 'NI', 485: 'NI', 535: 'RP', 536: 'RP', 575: 'RP', 576: 'RP', 637: 'BY', 638: 'BY', 639: 'BY', 655: 'RP', 656: 'RP', 660: 'SL', 661: 'SL', 662: 'SL', 663: 'SL', 664: 'SL', 665: 'SL', 666: 'SL', 667: 'SL', 668: 'RP', 669: 'RP', 683: 'HE', 684: 'HE', 685: 'HE', 686: 'HE', 687: 'HE', 768: 'RP', 769: 'RP', 880: 'BW', 881: 'BW', 882: 'BW', 883: 'BW', 884: 'BW', 885: 'BW', 886: 'BW', 887: 'BW', 891: 'BW', 961: 'TH', 965: 'TH', 966: 'TH', 975: 'TH' };
  const t2 = { '01': 'SN', '02': 'SN', '03': 'BB', '04': 'SN', '06': 'ST', '07': 'TH', '08': 'SN', '09': 'SN', 10: 'BE', 12: 'BE', 13: 'BE', 14: 'BB', 15: 'BB', 16: 'BB', 17: 'MV', 18: 'MV', 19: 'MV', 20: 'HH', 21: 'NI', 22: 'SH', 23: 'SH', 24: 'SH', 25: 'SH', 26: 'NI', 27: 'NI', 28: 'NI', 29: 'NI', 30: 'NI', 31: 'NI', 32: 'NW', 33: 'NW', 34: 'HE', 35: 'HE', 36: 'HE', 37: 'NI', 38: 'NI', 39: 'ST', 40: 'NW', 41: 'NW', 42: 'NW', 44: 'NW', 45: 'NW', 46: 'NW', 47: 'NW', 48: 'NW', 49: 'NI', 50: 'NW', 51: 'NW', 52: 'NW', 53: 'NW', 54: 'RP', 55: 'RP', 56: 'RP', 57: 'NW', 58: 'NW', 59: 'NW', 60: 'HE', 61: 'HE', 63: 'HE', 64: 'HE', 65: 'HE', 66: 'RP', 67: 'RP', 68: 'BW', 69: 'BW', 70: 'BW', 71: 'BW', 72: 'BW', 73: 'BW', 74: 'BW', 75: 'BW', 76: 'BW', 77: 'BW', 78: 'BW', 79: 'BW', 80: 'BY', 81: 'BY', 82: 'BY', 83: 'BY', 84: 'BY', 85: 'BY', 86: 'BY', 87: 'BY', 88: 'BY', 89: 'BY', 90: 'BY', 91: 'BY', 92: 'BY', 93: 'BY', 94: 'BY', 95: 'BY', 96: 'BY', 97: 'BY', 98: 'TH', 99: 'TH' };
  const t4 = { 4950: 'NW', 4951: 'NW', 4952: 'NW', 4953: 'NW', 4954: 'NW', 4955: 'NW', 4847: 'NW', 4849: 'NW' };
  return t4[+z.slice(0, 4)] || t3[+z.slice(0, 3)] || t2[z.slice(0, 2)] || t2[+z.slice(0, 2)] || '';
}
const WP_STATE = { 'Baden-Württemberg': 'BW', Bayern: 'BY', Berlin: 'BE', Brandenburg: 'BB', Bremen: 'HB', Hamburg: 'HH', Hessen: 'HE', 'Mecklenburg-Vorpommern': 'MV', Niedersachsen: 'NI', 'Nordrhein-Westfalen': 'NW', 'Rheinland-Pfalz': 'RP', Saarland: 'SL', Sachsen: 'SN', 'Sachsen-Anhalt': 'ST', 'Schleswig-Holstein': 'SH', 'Thüringen': 'TH' };
/* online: Bundesland genau über die Adresse (lumbra.desk), einmal je Adresse */
async function wpLandOnline(p) {
  const c = p.customer || {}, key = [c.street, c.zip, c.city].join('|'); if (!c.zip || !c.city || !(typeof LD === 'object' && LD.on)) return;
  if (p.hp.landKey === key) return; p.hp.landKey = key;
  try { const r = await ldApi('land&q=' + encodeURIComponent([c.street, c.zip, c.city].filter(Boolean).join(', '))); const code = r.ok && r.j && WP_STATE[r.j.state]; if (code && code !== p.hp.landAuto) { p.hp.landAuto = code; saveProject(p); if (typeof render === 'function') render(); } else saveProject(p); } catch (e) {}
}

function wpLandCard(p, R) {
  const auto = p.hp.landAuto || wpLandFromPlz((p.customer || {}).zip), code = p.hp.land || auto, L = WP_LAND[code];
  setTimeout(() => wpLandOnline(p), 0);
  const opts = [['', auto ? `Automatisch: ${WP_LAND[auto][0]}` : 'Bitte wählen']].concat(Object.entries(WP_LAND).map(([k, v]) => [k, v[0]]));
  /* Schall: welcher Abstand zum Nachbarfenster reicht nachts? (Freifeld, −6 dB je Abstandsverdopplung) */
  const spl = +p.hp.spl, d0 = +p.hp.splDist, need = lim => spl > 0 && d0 > 0 ? d0 * Math.pow(10, (spl - lim) / 20) : null;
  const n35 = need(35), n40 = need(40), n45 = need(45);
  return `<div class="card p-5 sm:p-6">${cardHead('home', 'Aufstellort & Abstand zum Nachbarn', 'Landesbauordnung je Bundesland – aus der Adresse des Kunden')}
    <div class="grid sm:grid-cols-2 gap-4 items-end">${sel('Bundesland des Aufstellorts', 'p:hp.land', opts)}
      ${L ? `<div class="rounded-[calc(var(--r)-4px)] bg-p/10 px-4 py-3"><div class="text-[12px] text-ink3">Abstand zur Grundstücksgrenze</div><div class="text-[22px] font-semibold leading-tight">${esc(L[1])}</div></div>` : ''}</div>
    ${L ? `<p class="text-[14px] text-ink mt-4 leading-relaxed">${esc(L[2])}</p><p class="hint">${esc(L[3])} · Rechtsstand ${WP_LAND_STAND}${!p.hp.land && !p.hp.landAuto ? ' · Bundesland aus der PLZ geschätzt – bitte prüfen' : ''}</p>` : '<p class="hint mt-3">Bitte beim Kunden die PLZ eintragen oder das Bundesland wählen.</p>'}
    <div class="mt-4 rounded-[calc(var(--r)-4px)] border border-line p-4 text-[13px] leading-relaxed">
      <div class="font-semibold text-[14px] mb-1">Immer zusätzlich: Schallschutz (TA Lärm, bundesweit)</div>
      Am nächsten Fenster des Nachbarn nachts höchstens <b>35 dB(A)</b> im reinen Wohngebiet, <b>40 dB(A)</b> im allgemeinen Wohngebiet, <b>45 dB(A)</b> im Misch- oder Dorfgebiet (tagsüber 50 / 55 / 60 dB(A)).
      ${n35 ? `<div class="mt-2">Mit ${num(spl, 1)} dB(A) in ${num(d0, 1)} m reichen frei aufgestellt etwa <b>${num(n35, 1)} m</b> Abstand zum Nachbarfenster für 35 dB(A), <b>${num(n40, 1)} m</b> für 40 dB(A) und <b>${num(n45, 1)} m</b> für 45 dB(A). Vor einer Wand oder in einer Ecke wird es lauter (+3 bis +9 dB).</div>` : '<div class="mt-2 text-ink3">Mit Schalldruck und Abstand aus dem Datenblatt (unter „Weitere Angaben“) rechnet die App hier den nötigen Abstand zum Nachbarfenster aus.</div>'}
    </div>
    <p class="hint">Ohne Gewähr. Ein Bebauungsplan oder eine Gemeindesatzung kann anderes festlegen – im Zweifel beim Bauamt nachfragen. Die Grenzbebauung zählt mit Garage und Carport zusammen.</p></div>`;
}
const _step3Land = step3;
step3 = function (p, R) { const h = _step3Land(p, R); return hasWP(p) ? h + wpLandCard(p, R) : h; };
document.addEventListener('change', e => { const el = e.target; if (el && el.dataset && el.dataset.b === 'p:hp.land') setTimeout(() => { if (typeof render === 'function') render(); }, 0); });
