/* Wärmepumpen-Schnellauslegung (überschlägig, ersetzt keine raumweise Heizlastberechnung nach DIN EN 12831).
   Aufbau: Gebäude → Heizlast (direkt oder per Verfahren: Verbrauch, Baujahr, spezifische Heizleistung)
   → Warmwasser & System → empfohlene Geräteleistung und JAZ. „Neue Berechnung“ fragt vorher, ob ausgelegt werden soll. */
const QH = {
  insul: [['nie', 'Niedrigenergiehaus', 10], ['neu', 'Neubau', 12], ['alt', 'Altbau', 15]],         // Heizgrenztemperatur °C
  hgt: { 10: 1400, 12: 1700, 15: 2160 },                                                             // Heizgradtage ab Heizgrenze (abgeglichen auf Wolf-Auslegung)
  fuels: [['oil_bw', 'Öl-Brennwert-Heizung', 0.95, 'oil'], ['oil_nt', 'Öl-Niedertemperatur-Heizung', 0.87, 'oil'], ['gas_bw', 'Gas-Brennwert-Heizung', 0.96, 'gas'], ['gas_nt', 'Gas-Niedertemperatur-Heizung', 0.88, 'gas']],
  years: [['1918', 'vor 1919', 120], ['1948', '1919–1948', 130], ['1957', '1949–1957', 125], ['1968', '1958–1968', 115], ['1978', '1969–1978', 105], ['1983', '1979–1983', 85], ['1994', '1984–1994', 75], ['2001', '1995–2001', 60], ['2009', '2002–2009', 45], ['2015', '2010–2015', 38], ['2099', 'ab 2016', 30]], // W/m² bei −12 °C
  /* Nutzungsgrad nach Kesselart und Alter der Heizung (vor 1980 / 1980–1995 / seit 1995) */
  ages: [['old', 'vor 1980'], ['mid', '1980–1995'], ['new', 'seit 1995']],
  eta: { oil_bw: { old: 0.80, mid: 0.88, new: 0.95 }, oil_nt: { old: 0.72, mid: 0.80, new: 0.87 }, gas_bw: { old: 0.82, mid: 0.90, new: 0.96 }, gas_nt: { old: 0.74, mid: 0.82, new: 0.88 } },
  reno: [['win', 'Fenster', 0.10], ['roof', 'Dach', 0.12], ['wall', 'Fassade', 0.20], ['cellar', 'Kellerdecke', 0.06]],
  spec: [[35, 'Neubau / KfW 55 / 40'], [60, 'Saniert / neuerer Bestand'], [90, 'Altbau ungedämmt'], [120, 'Altbau, hoher Bedarf']],
  comfort: [[20, 'Gering'], [30, 'Standard'], [40, 'Erhöht'], [50, 'Premium']],
  flow: [[35, 'Fußbodenheizung', '35 °C'], [45, 'Gemischt / neue Heizkörper', '45 °C'], [55, 'Alte Heizkörper', '55 °C+']],
  sperr: [[0, 'Keine'], [2, '2 h'], [4, '4 h'], [6, '6 h']]
};
const QD = { build: 'bestand', art: 'efh', zip: '', city: '', teH: null, te: null, teAuto: null, insul: 'alt', load: null, calcOpen: false, method: 'verbrauch',
  fuel: 'oil_bw', heatAge: 'mid', c1: null, c2: null, c3: null, unit: 'l', wwSys: true, area: 160, year: '1983', reno: [], spec: 60,
  persons: 4, comfort: 30, circ: false, flow: 45, sperr: 0 };
let QS = null, QPID = null;

/* Normaußentemperatur grob aus Lage geschätzt (Nordwest mild, Osten/Süden kälter) – überschreibbar */
const teFromCoords = c => Math.max(-18, Math.min(-5, Math.round((-8.5 - 0.75 * (c[1] - 6) - 0.55 * Math.max(0, 51 - c[0])) * 10) / 10));
const qInsul = k => QH.insul.find(x => x[0] === k) || QH.insul[2];
const qTe = () => (isNum(QS.te) ? QS.te : isNum(QS.teAuto) ? QS.teAuto : -12);
const qWwDay = () => QS.persons * QS.comfort * 1.163 * 50 / 1000;               // kWh Warmwasser pro Tag (10 → 60 °C)
const qCirc = () => (QS.circ ? 1.3 : 1);
const qEta = () => ((QH.eta[QS.fuel] || QH.eta.oil_bw)[QS.heatAge] || 0.88);
const qGas = () => (QH.fuels.find(f => f[0] === QS.fuel) || [])[3] === 'gas';
function qAvgText() {
  const vals = [QS.c1, QS.c2, QS.c3].filter(v => isNum(v) && v > 0); if (!vals.length) return 'Leere Felder werden nicht mitgerechnet.';
  const u = QS.unit === 'kwh' ? 'kWh' : qGas() ? 'm³' : 'Liter';
  return `Mittelwert = <b>${num(vals.reduce((a, b) => a + b, 0) / vals.length, 0)} ${u}</b> pro Jahr`;
}
function qMethodLoad() {
  const te = qTe(), dT = 20 - te;
  if (QS.method === 'verbrauch') {
    const vals = [QS.c1, QS.c2, QS.c3].filter(v => isNum(v) && v > 0); if (!vals.length) return null;
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length, f = QH.fuels.find(x => x[0] === QS.fuel) || QH.fuels[0];
    const kwh = QS.unit === 'kwh' ? avg : avg * 10;                              // 1 l Heizöl bzw. 1 m³ Erdgas ≈ 10 kWh
    const ww = QS.wwSys ? qWwDay() * 365 * (QS.circ ? 1.73 : 1) : 0;          // Zirkulation ≈ +73 % Warmwasser-Verluste
    const heat = kwh * qEta() - ww;
    return Math.max(0, heat * dT / (24 * QH.hgt[qInsul(QS.insul)[2]]));
  }
  if (QS.method === 'baujahr') {
    const y = QH.years.find(x => x[0] === QS.year) || QH.years[5];
    const f = QH.reno.filter(r => QS.reno.includes(r[0])).reduce((a, r) => a * (1 - r[2]), 1);
    return (QS.area || 0) * y[2] * f * (dT / 32) / 1000;
  }
  return (QS.area || 0) * (QS.spec || 0) / 1000;
}
function qResult() {
  const m = !(isNum(QS.load) && QS.load > 0) && QS.calcOpen ? qMethodLoad() : null;
  const load = isNum(QS.load) && QS.load > 0 ? QS.load : isNum(m) ? m : 0;
  const ww = QS.persons * 0.25 * (QS.comfort / 30) * qCirc();                 // Standard 30 l ≈ 0,25 kW je Person
  const sperrF = 24 / (24 - QS.sperr);
  const total = (load + ww * 0.5) * sperrF;                                      // Warmwasser hat Vorrang – nur halb addiert
  let jaz = QS.flow === 35 ? 4.3 : QS.flow === 45 ? 3.8 : 3.2;
  if (QS.insul === 'alt') jaz -= 0.2; if (qTe() < -12) jaz -= 0.1;
  return { load, ww, sperrF, total, jaz: Math.max(2.5, Math.round(jaz * 100) / 100) };
}

/* ---------- Oberfläche ---------- */
const qTile = (key, val, label, icon, on) => `<button type="button" class="rounded-[calc(var(--r)-4px)] border ${on ? 'border-p ring-2 ring-p/30 bg-p/5' : 'border-line bg-field'} p-3 flex flex-col items-center justify-center gap-1.5 text-[13px] font-medium text-center leading-tight ${on ? 'text-ink' : 'text-ink2'} transition" data-qs="${key}" data-v="${val}">${icon ? `<span class="${on ? 'text-p' : 'text-ink3'}">${icon}</span>` : ''}${label}</button>`;
const qSeg = (key, opts) => `<div class="seg">${opts.map(([v, l]) => `<button type="button" class="${String(QS[key]) === String(v) ? 'on' : ''}" data-qs="${key}" data-v="${v}">${l}</button>`).join('')}</div>`;
const qIn = (key, unit, o = {}) => `<div class="relative"><input class="inp ${unit ? 'pr-14' : ''} ${o.cls || ''}" type="text" inputmode="${o.im || 'decimal'}" data-qi="${key}" value="${isNum(QS[key]) ? inputFmt(QS[key], 'n') : esc(QS[key] || '')}" placeholder="${o.ph || ''}">${unit ? `<span class="absolute ${o.unitCls || 'right-4 text-[13px]'} top-1/2 -translate-y-1/2 font-semibold text-ink4 pointer-events-none">${unit}</span>` : ''}</div>`;
const qSel = (key, opts) => `<select class="inp appearance-none" data-qi="${key}" data-sel="1">${opts.map(([v, l]) => `<option value="${v}" ${String(QS[key]) === String(v) ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
const qLbl = (t, extra = '') => `<div class="lbl flex items-center justify-between gap-2"><span>${t}</span>${extra}</div>`;
const QI = {
  crane: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 21V3M3 6h16M6 3l4 3M15 6v4M13 10h4v3h-4zM3 21h9M14 21v-5l3-2 3 2v5"/></svg>',
  house: ic('home', 26), multi: ic('building', 26),
  win: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="5" y="4" width="14" height="16" rx="1"/><path d="M12 4v16M5 12h14"/></svg>',
  roof: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 18l3-10h12l3 10z"/><path d="M8 8l-1.5 10M12 8v10M16 8l1.5 10M4.5 13h15"/></svg>',
  wall: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 6h18v12H3zM3 10h18M3 14h18M9 6v4M15 6v4M6 10v4M12 10v4M18 10v4M9 14v4M15 14v4"/></svg>',
  cellar: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 11l8-6 8 6v9H4z"/><path d="M4 15h16M9 20v-3h6v3"/></svg>'
};
function quickHTML() {
  const ins = qInsul(QS.insul), r = qResult(), mLoad = qMethodLoad(), neu = QS.build === 'neu';
  const maxLoad = QS.art === 'mfh' ? 300 : 50;
  const methods = [['verbrauch', 'Verbrauch', !neu], ['baujahr', 'Baujahr', !neu], ['spez', 'Spezifische Heizleistung', true]].filter(m => m[2]);
  if (!methods.find(m => m[0] === QS.method)) QS.method = 'spez';
  const unitL = qGas() ? 'm³' : 'Liter';
  const sec = (n, t, body) => `<section class="mt-7 first:mt-0"><div class="flex items-center gap-2.5 mb-3"><span class="w-7 h-7 rounded-full grid place-items-center text-[13px] font-semibold bg-p/10 text-p">${n}</span><h4 class="text-[17px] font-semibold">${t}</h4></div>${body}</section>`;
  const method = QS.method === 'verbrauch' ? `
      <p class="hint !mt-0">Heizlast aus dem tatsächlichen Verbrauch der bisherigen Heizung – nicht geeignet, wenn größere Teile des Hauses ungenutzt sind.</p>
      <div class="grid sm:grid-cols-[1fr_170px] gap-3 mt-3"><div><span class="lbl">Heizungsart</span>${qSel('fuel', QH.fuels.map(f => [f[0], f[1]]))}</div><div><span class="lbl">Baujahr der Heizung</span>${qSel('heatAge', QH.ages)}</div></div>
      <div class="hint">Nutzungsgrad der bisherigen Heizung ca. <b>${Math.round(qEta() * 100)} %</b> – ältere Kessel nutzen weniger vom Brennstoff.</div>
      <div class="mt-3">${qLbl('Verbrauch der letzten drei Jahre', qSeg('unit', [['l', unitL], ['kwh', 'kWh']]))}
        <div class="grid grid-cols-3 gap-2">${['c1', 'c2', 'c3'].map((k, i) => qIn(k, '', { im: 'numeric', cls: '!px-3 text-center', ph: ['Jahr 1', 'Jahr 2', 'Jahr 3'][i] })).join('')}</div><div class="hint" id="q-avg">${qAvgText()}</div></div>
      <div class="mt-3 flex flex-wrap items-center justify-between gap-2"><span class="text-[14px]">Warmwasser über diese Heizung?</span>${qSeg('wwSys', [['false', 'Nein'], ['true', 'Ja']])}</div>
      <p class="hint">Personen, Warmwasser-Komfort und Zirkulation (Abschnitt 2) fließen hier mit ein.</p>`
    : QS.method === 'baujahr' ? `
      <p class="hint !mt-0">Überschlägig aus Baujahr und durchgeführten Sanierungen – typische Kennwerte deutscher Wohngebäude.</p>
      <div class="grid grid-cols-2 gap-3 mt-3"><div><span class="lbl">Wohnfläche</span>${qIn('area', 'm²', { im: 'numeric' })}</div><div><span class="lbl">Baujahr</span>${qSel('year', QH.years.map(y => [y[0], y[1]]))}</div></div>
      <div class="mt-4"><span class="lbl">Welche Sanierungen wurden seit dem Bau durchgeführt?</span><div class="grid grid-cols-2 sm:grid-cols-4 gap-2">${QH.reno.map(([k, l]) => qTile('reno', k, l, QI[k], QS.reno.includes(k))).join('')}</div></div>`
    : `
      <p class="hint !mt-0">Wohnfläche × spezifische Heizleistung nach Gebäudestandard.</p>
      <div class="grid grid-cols-2 gap-3 mt-3"><div><span class="lbl">Wohnfläche</span>${qIn('area', 'm²', { im: 'numeric' })}</div><div><span class="lbl">Spez. Heizleistung</span>${qIn('spec', 'W/m²', { im: 'numeric' })}</div></div>
      <div class="flex flex-wrap gap-2 mt-3">${QH.spec.map(([v, l]) => `<button type="button" class="chip ${+QS.spec === v ? '!border-p !text-ink' : ''}" data-qs="spec" data-v="${v}">${l} · ${v} W/m²</button>`).join('')}</div>`;
  return `<h3 class="text-[21px] font-semibold pr-8 flex items-center gap-2"><span class="text-p">${ic('fan', 22)}</span>Wärmepumpen-Schnellauslegung</h3>
  <p class="text-[13px] text-ink3 mt-1">Überschlägige Auslegung nach Kennwerten – ersetzt keine raumweise Heizlastberechnung nach DIN EN 12831.</p>
  <div class="mt-5">
  ${sec(1, 'Gebäude', `
    <div class="grid sm:grid-cols-2 gap-4"><div><span class="lbl">Bauvorhaben</span><div class="grid grid-cols-2 gap-2">${qTile('build', 'neu', 'Neubau', QI.crane, neu)}${qTile('build', 'bestand', 'Bestand', QI.house, !neu)}</div></div>
      <div><span class="lbl">Art</span><div class="grid grid-cols-2 gap-2">${qTile('art', 'efh', 'Einfamilienhaus', QI.house, QS.art === 'efh')}${qTile('art', 'mfh', 'Mehrfamilienhaus', QI.multi, QS.art === 'mfh')}</div></div></div>
    <div class="grid grid-cols-[110px_1fr] sm:grid-cols-[120px_1fr_160px] gap-3 mt-4">
      <div><span class="lbl">PLZ</span>${qIn('zip', '', { im: 'numeric', ph: 'PLZ' })}</div>
      <div><span class="lbl">Ort</span><input class="inp" type="text" data-qi="city" value="${esc(QS.city || '')}" placeholder="Ort" autocomplete="off"></div>
      <div class="col-span-2 sm:col-span-1"><span class="lbl">Normaußentemp.</span>${qIn('te', '°C', { ph: isNum(QS.teAuto) ? inputFmt(QS.teAuto, 'n') : '-12' })}</div>
    </div>
    <div class="hint" id="q-te-info">${qTeInfo()}</div>
    <div class="grid sm:grid-cols-2 gap-4 mt-4"><div><span class="lbl">Dämmstandard</span>${qSel('insul', QH.insul.map(x => [x[0], x[1]]))}<div class="hint">Heizgrenztemperatur: <b>${ins[2]} °C</b></div></div>
      <div>${qLbl('Heizlast', `<span class="text-ink3 text-[12px]">0–${maxLoad} kW</span>`)}${qIn('load', 'kW', { cls: '!text-[18px] font-semibold' })}<input type="range" min="0" max="${maxLoad}" step="0.1" value="${isNum(QS.load) ? QS.load : 0}" data-qi="load" data-range="1" class="w-full mt-3 accent-[rgb(var(--p-rgb))]"></div></div>
    <div class="mt-4 rounded-[calc(var(--r)-4px)] border ${QS.calcOpen ? 'border-p/40 bg-raised' : 'border-line'}">
      <button type="button" class="w-full flex items-center justify-between gap-3 p-4 text-left" data-qs="calcOpen" data-v="${QS.calcOpen ? 'false' : 'true'}"><span><span class="font-semibold text-[15px] text-p">Heizlast berechnen</span><span class="block text-[12px] text-ink3 mt-0.5">Heizlast unbekannt? Aus Verbrauch, Baujahr oder W/m² ermitteln.</span></span><span class="text-ink3 transition ${QS.calcOpen ? 'rotate-180' : ''}">${ic('chevD', 18)}</span></button>
      ${QS.calcOpen ? `<div class="px-4 pb-4"><div class="flex flex-wrap gap-2 mb-4">${methods.map(([k, l]) => `<button type="button" class="chip ${QS.method === k ? '!border-p !text-ink' : ''}" data-qs="method" data-v="${k}">${l}</button>`).join('')}</div>${method}
        <div class="mt-4 rounded-[calc(var(--r)-4px)] p-4 flex flex-wrap items-center justify-between gap-3" style="background:rgb(var(--p-rgb)/.10)"><div class="text-[15px]">Ermittelte Heizlast: <b id="q-mload" class="text-[18px]">${isNum(mLoad) ? num(mLoad, 2) + ' kW' : '–'}</b></div><button type="button" class="btn-p !h-10" data-a="quick-take">Übernehmen</button></div></div>` : ''}
    </div>`)}
  ${sec(2, 'Warmwasser & Heizsystem', `
    <div>${qLbl('Personen im Haushalt', `<span class="font-semibold text-ink text-[15px]" id="q-pers">${QS.persons}</span>`)}<input type="range" min="1" max="12" step="1" value="${QS.persons}" data-qi="persons" data-range="1" class="w-full accent-[rgb(var(--p-rgb))]"><div class="flex justify-between text-[12px] text-ink3"><span>1</span><span>12</span></div></div>
    <div class="mt-4"><span class="lbl">Warmwasser-Komfort (Liter pro Person und Tag)</span><div class="grid grid-cols-4 gap-2">${QH.comfort.map(([v, l]) => qTile('comfort', v, `${l}<span class="text-ink3 text-[12px]">${v} l</span>`, '', +QS.comfort === v)).join('')}</div></div>
    <div class="mt-4 flex flex-wrap items-center justify-between gap-2"><span class="text-[14px]">Zirkulationspumpe</span>${qSeg('circ', [['false', 'Nein'], ['true', 'Ja']])}</div>
    <div class="grid sm:grid-cols-2 gap-4 mt-4"><div><span class="lbl">Heizsystem / Vorlauftemperatur</span>${qSel('flow', QH.flow.map(([v, l, x]) => [v, `${l} · ${x}`]))}</div>
      <div><span class="lbl">Sperrzeit Netzbetreiber pro Tag</span>${qSeg('sperr', QH.sperr)}</div></div>`)}
  ${sec(3, 'Ergebnis', `
    <div class="rounded-[calc(var(--r)-4px)] bg-raised p-5 text-[14px]">
      <div class="flex justify-between gap-3 py-1.5"><span class="text-ink3">Gebäude-Heizlast <span id="q-r-from" class="text-[12px]">${qLoadFrom()}</span></span><b id="q-r-load">${num(r.load, 1)} kW</b></div>
      <div class="flex justify-between gap-3 py-1.5"><span class="text-ink3">Warmwasser-Zuschlag</span><b id="q-r-ww">${num(r.ww, 1)} kW</b></div>
      <div class="flex justify-between gap-3 py-1.5"><span class="text-ink3">Sperrzeit-Faktor</span><b id="q-r-sp">× ${num(r.sperrF, 2)}</b></div>
      <div class="flex justify-between gap-3 py-2 mt-1 border-t border-line"><span class="text-p font-semibold">Empfohlene Geräteleistung</span><b id="q-r-total" class="text-p text-[20px] whitespace-nowrap">${num(r.total, 1)} kW</b></div>
      <div class="flex justify-between gap-3 py-1.5"><span class="text-ink3">Erwartete JAZ (Schätzung)</span><b id="q-r-jaz">${num(r.jaz, 2)}</b></div>
    </div>`)}
  </div>
  <div class="flex flex-col sm:flex-row gap-3 mt-6">${QPID
    ? `<button class="btn-p w-full sm:w-auto sm:flex-1" data-a="quick-apply">${ic('check', 17)}Werte übernehmen</button>`
    : `<button class="btn-p w-full sm:w-auto sm:flex-1" data-a="quick-create" data-type="wp">${ic('fan', 17)}Als Wärmepumpe anlegen</button><button class="btn-s w-full sm:w-auto sm:flex-1" data-a="quick-create" data-type="pvwp">${ic('sun', 17)}Als PV + Wärmepumpe anlegen</button>`}</div>`;
}
function qLoadFrom() { return isNum(QS.load) && QS.load > 0 ? '' : QS.calcOpen && isNum(qMethodLoad()) ? '(aus „Heizlast berechnen“)' : ''; }
function quickRender() { const r = $('#quick-root'); if (r) r.innerHTML = quickHTML(); }
function quickLive() {
  const r = qResult(), m = qMethodLoad(), set = (id, t) => { const el = $('#' + id); if (el) el.textContent = t; };
  set('q-r-load', num(r.load, 1) + ' kW'); set('q-r-ww', num(r.ww, 1) + ' kW'); set('q-r-sp', '× ' + num(r.sperrF, 2)); set('q-r-total', num(r.total, 1) + ' kW'); set('q-r-jaz', num(r.jaz, 2));
  set('q-mload', isNum(m) ? num(m, 2) + ' kW' : '–'); set('q-pers', QS.persons);
  const av = $('#q-avg'); if (av) av.innerHTML = qAvgText();
  const hint = $('#q-r-from'); if (hint) hint.textContent = qLoadFrom();
}
function qTeInfo() {
  if (isNum(QS.teAuto)) return `Normaußentemperatur ca. <b>${num(QS.teAuto, 1)} °C</b>${isNum(QS.teH) ? ` (geschätzt aus Lage und ${num(QS.teH)} m Höhe)` : ' (geschätzt)'}. Feld leer lassen = dieser Wert; genauer Wert nach DIN/TS 12831-1.`;
  return /^\d{5}$/.test(String(QS.zip || '')) ? 'PLZ nicht gefunden – bitte Normaußentemperatur eintragen.' : 'PLZ oder Ort eingeben – Ort bzw. PLZ und Normaußentemperatur werden ergänzt.';
}
async function quickZip() {
  const z = String(QS.zip || '').trim(); if (!/^\d{5}$/.test(z)) return;
  const pi = typeof plzInfo === 'function' ? await plzInfo(z) : null;
  if (pi) { QS.teAuto = pi.te; QS.teH = pi.h; }
  else { QS.teH = null; try { const c = await plzCoords(z); QS.teAuto = c ? teFromCoords(c) : null; } catch (e) { QS.teAuto = null; } }
  const info = $('#q-te-info'); if (info) info.innerHTML = qTeInfo();
  const te = $('#modal [data-qi="te"]'); if (te && isNum(QS.teAuto)) te.placeholder = inputFmt(QS.teAuto, 'n');
  quickLive();
}

/* Start: mit Werten aus einer vorhandenen Berechnung bzw. der letzten Auslegung */
function quickDialog(pid) {
  const p = pid ? findProject(pid) : null; QPID = p ? p.id : null;
  QS = { ...QD, reno: [], ...(p && p.quick && p.quick.v === 2 ? clone(p.quick.state) : {}) };
  if (p && !(p.quick && p.quick.v === 2)) {
    if (p.customer.zip) { QS.zip = p.customer.zip; QS.city = p.customer.city || ''; }
    const h = p.heating;
    if (isNum(h.year)) QS.heatAge = h.year < 1980 ? 'old' : h.year < 1995 ? 'mid' : 'new';
    if (isNum(h.cons) && h.cons > 0) { QS.fuel = h.fuel === 'oil' ? 'oil_bw' : 'gas_bw'; QS.c1 = h.cons; QS.unit = h.fuel === 'oil' ? 'l' : 'kwh'; QS.method = 'verbrauch'; }
    if (p.quick && isNum(p.quick.area)) QS.area = p.quick.area;
  }
  if (!QS.zip && S.company.zip) { QS.zip = S.company.zip; QS.city = S.company.city || ''; }
  modal(`<div id="quick-root">${quickHTML()}</div>`, { wide: true });
  quickZip();
}
function quickApplyTo(p) {
  const r = qResult();
  p.quick = { v: 2, state: clone(QS), load: Math.round(r.load * 10) / 10, total: Math.round(r.total * 10) / 10, jaz: r.jaz, te: qTe(), date: isoToday() };
  p.hp.kw = p.quick.total; p.hp.jaz = p.quick.jaz;
}
/* Karte im Bereich „Neue Wärmepumpe“ */
function quickCard(p) {
  if (!p.quick) return `<div class="mb-4 flex flex-wrap items-center gap-2 text-[13px] text-ink3">Leistung noch unklar?<button class="btn-g !h-8 !px-2.5 text-[13px] text-p" data-a="quick-redo" data-id="${p.id}">${ic('fan', 15)}Schnellauslegung</button></div>`;
  const q = p.quick, st = q.state || {};
  const facts = q.v === 2 ? [st.build === 'neu' ? 'Neubau' : 'Bestand', st.art === 'mfh' ? 'Mehrfamilienhaus' : 'Einfamilienhaus', qInsul(st.insul)[1], `Normaußentemp. ${num(q.te, 1)} °C`, `${st.persons} Personen`, (QH.flow.find(f => f[0] === +st.flow) || [0, ''])[1]].join(' · ') : `${num(q.area)} m² · ${num(q.persons)} Personen`;
  return `<div class="mb-5 rounded-[calc(var(--r)-4px)] border border-p/30 p-4" style="background:rgb(var(--p-rgb)/.06)"><div class="flex flex-wrap items-center justify-between gap-2"><div class="text-[14px] font-semibold flex items-center gap-2"><span class="text-p">${ic('fan', 17)}</span>Schnellauslegung vom ${deDate(q.date)}</div><button class="btn-g !h-8 !px-2.5 text-[13px]" data-a="quick-redo" data-id="${p.id}">${ic('refresh', 14)}Neu auslegen</button></div>
  <div class="text-[13px] text-ink2 mt-1.5">${esc(facts)}</div>
  <div class="text-[14px] mt-1.5">Heizlast <b>${num(q.load ?? q.heatLoad, 1)} kW</b> · empfohlen <b class="text-p">${num(q.total, 1)} kW</b> · JAZ ca. <b>${num(q.jaz, 2)}</b></div></div>`;
}

/* Frage vor jeder neuen Berechnung */
const _newDialogQ = newDialog;
newDialog = function () {
  modal(`<h3 class="text-[21px] font-semibold pr-8">Neue Berechnung</h3>
  <div class="mt-4 rounded-[calc(var(--r)-4px)] p-4 flex gap-4 items-start" style="background:var(--t-red);color:var(--red-ink)"><div class="shrink-0 mt-0.5">${ic('fan', 26)}</div><div><div class="font-semibold text-[16px]">Zuerst eine Schnellauslegung für die Wärmepumpe?</div><div class="text-[13px] mt-1 opacity-90">Gebäude, Heizlast (auch aus Verbrauch oder Baujahr), Warmwasser und Heizsystem – daraus ergeben sich passende Geräteleistung und erwartete JAZ. Die Werte werden in die Berechnung übernommen.</div></div></div>
  <div class="flex flex-col sm:flex-row gap-3 mt-5"><button class="btn-p w-full sm:w-auto sm:flex-1" data-a="quick-start">${ic('fan', 17)}Ja, Schnellauslegung</button><button class="btn-s w-full sm:w-auto sm:flex-1" data-a="quick-skip">Nein, direkt starten</button></div>`);
};

/* ---------- Ereignisse ---------- */
document.addEventListener('input', e => {
  const el = e.target.closest && e.target.closest('#quick-root [data-qi]'); if (!el || !QS) return;
  const k = el.dataset.qi;
  if (el.dataset.sel) return;                                   // Auswahlfelder: über „change“
  if (k === 'zip') { QS.zip = el.value.replace(/\D/g, '').slice(0, 5); quickZip(); return; }
  if (k === 'city') { QS.city = el.value; return; }
  const v = el.dataset.range ? parseFloat(el.value) : pnum(el.value);
  QS[k] = isFinite(v) ? v : null;
  if (k === 'persons') QS.persons = Math.max(1, Math.min(12, Math.round(QS.persons || 1)));
  if (k === 'load') { $$('#quick-root [data-qi="load"]').forEach(o => { if (o !== el) o.value = o.dataset.range ? (QS.load || 0) : (isNum(QS.load) ? inputFmt(Math.round(QS.load * 10) / 10, 'n') : ''); }); }
  quickLive();
});
document.addEventListener('change', e => {
  const el = e.target.closest && e.target.closest('#quick-root [data-qi]'); if (!el || !QS || !el.dataset.sel) return;
  const k = el.dataset.qi; QS[k] = k === 'flow' ? +el.value : el.value;
  if (k === 'fuel') QS.unit = QS.fuel.startsWith('oil') ? 'l' : 'kwh';
  quickRender();
});
document.addEventListener('click', async e => {
  const t = e.target.closest && e.target.closest('#quick-root [data-qs]');
  if (t && QS) {
    const k = t.dataset.qs, raw = t.dataset.v, v = raw === 'true' ? true : raw === 'false' ? false : /^-?\d+(\.\d+)?$/.test(raw) && k !== 'year' ? +raw : raw;
    if (k === 'reno') QS.reno = QS.reno.includes(v) ? QS.reno.filter(x => x !== v) : QS.reno.concat(v);
    else QS[k] = v;
    if (k === 'build' && v === 'neu') { QS.insul = 'neu'; QS.method = 'spez'; QS.spec = 35; }
    if (k === 'build' && v === 'bestand' && QS.insul === 'neu') QS.insul = 'alt';
    if (k === 'art') QS.persons = v === 'mfh' ? Math.max(QS.persons, 8) : Math.min(QS.persons, 6);
    quickRender(); return;
  }
  const a = e.target.closest && e.target.closest('[data-a^="quick-"]'); if (!a) return;
  const act = a.dataset.a;
  if (act === 'quick-skip') { closeModal(); _newDialogQ(); }
  else if (act === 'quick-start') quickDialog();
  else if (act === 'quick-redo') quickDialog(a.dataset.id);
  else if (act === 'quick-take') { const m = qMethodLoad(); if (!isNum(m) || m <= 0) { toast('Bitte zuerst die Angaben für das Verfahren ausfüllen.'); return; } QS.load = Math.round(m * 100) / 100; QS.calcOpen = false; quickRender(); }
  else if (act === 'quick-create' || act === 'quick-apply') {
    if (!(isNum(QS.load) && QS.load > 0) && QS.calcOpen && isNum(qMethodLoad()) && qMethodLoad() > 0) QS.load = Math.round(qMethodLoad() * 100) / 100;
    if (!isNum(QS.load) || QS.load <= 0) { toast('Bitte eine Heizlast eingeben oder über „Heizlast berechnen“ ermitteln.'); return; }
    if (act === 'quick-create') {
      const np = newProject(a.dataset.type); if (QS.zip) np.customer.zip = QS.zip; if (QS.city) np.customer.city = QS.city;
      quickApplyTo(np); PROJECTS.push(np); await DB.put('projects', clone(np)); closeModal(); go(`projekt/${np.id}/1`);
      toast(`Schnellauslegung übernommen: ${num(np.hp.kw, 1)} kW, JAZ ${num(np.hp.jaz, 2)}.`);
    } else {
      const p = findProject(QPID); if (!p) return; quickApplyTo(p); saveProject(p); closeModal(); render();
      toast(`Übernommen: ${num(p.hp.kw, 1)} kW, JAZ ${num(p.hp.jaz, 2)}.`);
    }
  }
});
