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
  modes: [['mono', 'monovalent', 'Die Wärmepumpe deckt die gesamte Heizlast inklusive Warmwasser allein – ohne Zusatzheizung. Bei Luft-Wasser-Wärmepumpen eher unüblich.', 99.5],
    ['monoen', 'monoenergetisch', 'Die Wärmepumpe deckt den Großteil; nur bei Bedarfsspitzen hilft der elektrische Heizstab der Wärmepumpe. Der Standard bei Luft-Wasser-Wärmepumpen.', 97],
    ['bipar', 'bivalent parallel', 'Die Wärmepumpe deckt den Großteil; nur bei Bedarfsspitzen trägt Öl, Gas o. Ä. mit bei.', 90],
    ['bialt', 'bivalent alternativ', 'Oberhalb des Bivalenzpunkts heizt nur die Wärmepumpe, darunter übernimmt Öl, Gas o. Ä. vollständig.', 75],
    ['biteil', 'bivalent teilparallel', 'Bis zum Abschaltpunkt arbeiten beide zusammen, darunter übernimmt der Zusatzwärmeerzeuger vollständig (Abschaltpunkt −5 °C).', 80]],
  hsys: [['hk', 'Heizkörper'], ['fbh', 'Fußbodenheizung'], ['both', 'Beides']],
  flowHK: [[45, '45 °C'], [50, '50 °C'], [55, '55 °C'], [60, '60 °C']],
  flowFBH: [[30, '30 °C'], [35, '35 °C'], [40, '40 °C']],
  /* Typische Leistungskurve Luft/Wasser je kW Nennleistung (aus Wolf-Diagramm CHA-10 abgelesen) – max. und min. (Modulation) */
  capMax: [[-22, 0.55], [-15, 0.72], [-10, 0.84], [-7, 0.9], [-3, 0.96], [0, 1.0], [2, 1.02], [40, 1.02]],
  capMin: [[-22, 0.55], [-15, 0.3], [-10, 0.26], [-5, 0.25], [0, 0.27], [10, 0.3], [20, 0.34], [40, 0.45]],
  /* Stunden je Außentemperatur, mittleres Klima nach EN 14825 (−10 … +15 °C) */
  bins: { '-10': 1, '-9': 25, '-8': 23, '-7': 24, '-6': 27, '-5': 68, '-4': 91, '-3': 89, '-2': 165, '-1': 173, 0: 240, 1: 280, 2: 320, 3: 357, 4: 356, 5: 303, 6: 330, 7: 326, 8: 348, 9: 335, 10: 315, 11: 215, 12: 169, 13: 151, 14: 105, 15: 74 }
};
const QD = { build: 'bestand', art: 'efh', zip: '', city: '', teH: null, te: null, teAuto: null, insul: 'alt', load: null, calcOpen: false, method: 'verbrauch',
  fuel: 'oil_bw', heatAge: 'mid', c1: null, c2: null, c3: null, unit: 'l', wwSys: true, area: 160, year: '1983', reno: [], spec: 60,
  persons: 4, comfort: 30, circ: false, solar: false, mode: 'monoen', hsys: 'hk', flowHK: 55, flowFBH: 35, sperr: 0, prodId: null, modeInfo: false };
let QS = null, QPID = null;

/* Normaußentemperatur grob aus Lage geschätzt (Nordwest mild, Osten/Süden kälter) – überschreibbar */
const teFromCoords = c => Math.max(-18, Math.min(-5, Math.round((-8.5 - 0.75 * (c[1] - 6) - 0.55 * Math.max(0, 51 - c[0])) * 10) / 10));
const qInsul = k => QH.insul.find(x => x[0] === k) || QH.insul[2];
const qTe = () => (isNum(QS.te) ? QS.te : isNum(QS.teAuto) ? QS.teAuto : -12);
const qWwDay = () => QS.persons * QS.comfort * 1.163 * 50 / 1000;               // kWh Warmwasser pro Tag (10 → 60 °C)
const qCirc = () => (QS.circ ? 1.755 : 1);                                      // Zirkulation ≈ +75 % Warmwasser-Wärme (abgeglichen auf Wolf)
const qFlowT = () => (QS.hsys === 'fbh' ? +QS.flowFBH : +QS.flowHK);
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
    const ww = QS.wwSys ? qWwDay() * 365 * qCirc() : 0;
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
  const ww = QS.persons * 0.25 * (QS.comfort / 30) * 0.5;                    // Warmwasser-Zuschlag (Vorrang über 3-Wege-Ventil – halb angesetzt)
  const sperrF = 24 / (24 - (QS.sperr || 0));
  const evu = (load + ww) * (sperrF - 1);
  const total = load + ww + evu;
  const sim = qPick();
  return { load, ww, evu, sperrF, total, sim, jaz: sim ? sim.jazGB : 3.5 };
}

/* ---------- Oberfläche ---------- */
const qTile = (key, val, label, icon, on) => `<button type="button" class="rounded-[calc(var(--r)-4px)] border ${on ? 'border-p ring-2 ring-p/30 bg-p/5' : 'border-line bg-field'} p-3 flex flex-col items-center justify-center gap-1.5 text-[13px] font-medium text-center leading-tight ${on ? 'text-ink' : 'text-ink2'} transition" data-qs="${key}" data-v="${val}">${icon ? `<span class="${on ? 'text-p' : 'text-ink3'}">${icon}</span>` : ''}${label}</button>`;
const qSeg = (key, opts) => `<div class="inline-flex rounded-full border border-line bg-field p-1 gap-1">${opts.map(([v, l]) => { const on = String(QS[key]) === String(v); return `<button type="button" class="h-9 px-4 rounded-full text-[14px] font-semibold whitespace-nowrap transition ${on ? 'text-white shadow' : 'text-ink3'}" style="${on ? 'background:rgb(var(--p-rgb))' : ''}" data-qs="${key}" data-v="${v}" aria-pressed="${on}">${on ? '✓ ' : ''}${l}</button>`; }).join('')}</div>`;
const qIn = (key, unit, o = {}) => `<div class="relative"><input class="inp ${unit ? 'pr-14' : ''} ${o.cls || ''}" type="text" inputmode="${o.im || 'decimal'}" data-qi="${key}" value="${isNum(QS[key]) ? inputFmt(QS[key], 'n') : esc(QS[key] || '')}" placeholder="${o.ph || ''}">${unit ? `<span class="absolute ${o.unitCls || 'right-4 text-[13px]'} top-1/2 -translate-y-1/2 font-semibold text-ink4 pointer-events-none">${unit}</span>` : ''}</div>`;
const qSel = (key, opts) => `<select class="inp appearance-none" data-qi="${key}" data-sel="1">${opts.map(([v, l]) => `<option value="${v}" ${String(QS[key]) === String(v) ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
const qLbl = (t, extra = '') => `<div class="lbl flex items-center justify-between gap-2"><span>${t}</span>${extra}</div>`;
const QI = {
  crane: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 21V3M3 6h16M6 3l4 3M15 6v4M13 10h4v3h-4zM3 21h9M14 21v-5l3-2 3 2v5"/></svg>',
  house: ic('home', 26), multi: ic('building', 26),
  win: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="5" y="4" width="14" height="16" rx="1"/><path d="M12 4v16M5 12h14"/></svg>',
  roof: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 18l3-10h12l3 10z"/><path d="M8 8l-1.5 10M12 8v10M16 8l1.5 10M4.5 13h15"/></svg>',
  wall: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 6h18v12H3zM3 10h18M3 14h18M9 6v4M15 6v4M6 10v4M12 10v4M18 10v4M9 14v4M15 14v4"/></svg>',
  hk: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 5v14M8.5 5v14M12 5v14M15.5 5v14M19 7v.5M19 16v.5"/></svg>',
  fbh: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 8V3M12 8V3M17 8V3M5 5l2-2 2 2M10 5l2-2 2 2M15 5l2-2 2 2M3 11h18M4 14h14a2 2 0 0 1 0 4H6a2 2 0 0 1 0-4"/></svg>',
  both: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 3v8M5.5 3v8M8 3v8M15 4v4M13 6h4M11 14h10M12 17h8a1.5 1.5 0 0 1 0 3h-8a1.5 1.5 0 0 1 0-3"/></svg>',
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
    <div class="mt-4 rounded-[calc(var(--r)-4px)] border-2 border-p overflow-hidden ${QS.calcOpen ? 'bg-raised' : ''}" style="box-shadow:0 8px 24px -12px rgb(var(--p-rgb)/.6)">
      <button type="button" class="w-full flex items-center gap-3 p-4 text-left text-white" style="background:rgb(var(--p-rgb))" data-qs="calcOpen" data-v="${QS.calcOpen ? 'false' : 'true'}"><span class="w-11 h-11 rounded-xl grid place-items-center shrink-0" style="background:rgba(255,255,255,.18)">${ic('calc', 22)}</span><span class="flex-1"><span class="block font-semibold text-[17px]">Heizlast berechnen</span><span class="block text-[13px] opacity-90 mt-0.5">Heizlast unbekannt? Aus Verbrauch, Baujahr oder W/m² ermitteln.</span></span><span class="transition ${QS.calcOpen ? 'rotate-180' : ''}">${ic('chevD', 20)}</span></button>
      ${QS.calcOpen ? `<div class="px-4 pb-4 pt-4"><div class="flex flex-wrap gap-2 mb-4">${methods.map(([k, l]) => `<button type="button" class="chip ${QS.method === k ? '!border-p !text-ink' : ''}" data-qs="method" data-v="${k}">${l}</button>`).join('')}</div>${method}
        <div class="mt-4 rounded-[calc(var(--r)-4px)] p-4 flex flex-wrap items-center justify-between gap-3" style="background:rgb(var(--p-rgb)/.10)"><div class="text-[15px]">Ermittelte Heizlast: <b id="q-mload" class="text-[18px]">${isNum(mLoad) ? num(mLoad, 2) + ' kW' : '–'}</b></div><button type="button" class="btn-p !h-10" data-a="quick-take">Übernehmen</button></div></div>` : ''}
    </div>`)}
  ${sec(2, 'Warmwasser', `
    <div>${qLbl('Personen im Haushalt', `<span class="font-semibold text-ink text-[15px]" id="q-pers">${QS.persons}</span>`)}<input type="range" min="1" max="12" step="1" value="${QS.persons}" data-qi="persons" data-range="1" class="w-full accent-[rgb(var(--p-rgb))]"><div class="flex justify-between text-[12px] text-ink3"><span>1</span><span>12</span></div></div>
    <div class="mt-4"><span class="lbl">Warmwasser-Komfort (Liter pro Person und Tag)</span><div class="grid grid-cols-4 gap-2">${QH.comfort.map(([v, l]) => qTile('comfort', v, `${l}<span class="text-ink3 text-[12px]">${v} l</span>`, '', +QS.comfort === v)).join('')}</div></div>
    <div class="mt-4 flex flex-wrap items-center justify-between gap-2"><span class="text-[14px]">Zirkulationspumpe vorhanden?</span>${qSeg('circ', [['false', 'Nein'], ['true', 'Ja']])}</div>`)}
  ${sec(3, 'Heizsystem', `
    ${qLbl('Betriebsweise', `<button type="button" class="text-[12px] text-p font-medium" data-qs="modeInfo" data-v="${QS.modeInfo ? 'false' : 'true'}">${QS.modeInfo ? 'Weniger' : 'Mehr Infos'}</button>`)}
    <div class="flex flex-wrap gap-2">${QH.modes.map(([k, l]) => `<button type="button" class="chip ${QS.mode === k ? '!border-p !text-ink !bg-p/10' : ''}" data-qs="mode" data-v="${k}">${l}</button>`).join('')}</div>
    <p class="hint">${QS.modeInfo ? QH.modes.map(([k, l, d]) => `<b>${l}:</b> ${d}`).join('<br>') : (QH.modes.find(m => m[0] === QS.mode) || [])[2]}</p>
    <div class="mt-4 flex flex-wrap items-center justify-between gap-2"><span class="text-[14px]">Kombiniert mit Solarthermie?</span>${qSeg('solar', [['false', 'Nein'], ['true', 'Ja']])}</div>
    <div class="mt-4">${qLbl('Sperrzeiten des Netzbetreibers (EVU)', `<span class="font-semibold text-ink text-[15px]" id="q-sperr">${QS.sperr || 0} Std.</span>`)}<input type="range" min="0" max="6" step="1" value="${QS.sperr || 0}" data-qi="sperr" data-range="1" class="w-full accent-[rgb(var(--p-rgb))]"><div class="flex justify-between text-[12px] text-ink3"><span>0</span><span>6 Std. pro Tag</span></div></div>
    <div class="mt-4"><span class="lbl">Wärmeübertragungssystem</span><div class="grid grid-cols-3 gap-2">${QH.hsys.map(([k, l]) => qTile('hsys', k, l, QI[k], QS.hsys === k)).join('')}</div></div>
    <div class="grid ${QS.hsys === 'both' ? 'grid-cols-2' : 'grid-cols-1 sm:w-1/2'} gap-3 mt-3">
      ${QS.hsys !== 'fbh' ? `<div class="rounded-[calc(var(--r)-4px)] border border-line p-3"><div class="text-[12px] text-ink3">Heizkreis 1 · Heizkörper</div><span class="lbl !mt-2">Vorlauftemperatur</span>${qSel('flowHK', QH.flowHK)}</div>` : ''}
      ${QS.hsys !== 'hk' ? `<div class="rounded-[calc(var(--r)-4px)] border border-line p-3"><div class="text-[12px] text-ink3">Heizkreis ${QS.hsys === 'both' ? 2 : 1} · Fußbodenheizung</div><span class="lbl !mt-2">Vorlauftemperatur</span>${qSel('flowFBH', QH.flowFBH)}</div>` : ''}
    </div>`)}
  ${sec(4, 'Ergebnis & Wärmepumpe', `<div id="q-result">${qResultHTML(r)}</div>`)}
  </div>
  <div class="flex flex-col sm:flex-row gap-3 mt-6">${QPID
    ? `<button class="btn-p w-full sm:w-auto sm:flex-1" data-a="quick-apply">${ic('check', 17)}Werte übernehmen</button>`
    : `<button class="btn-p w-full sm:w-auto sm:flex-1" data-a="quick-create" data-type="wp">${ic('fan', 17)}Als Wärmepumpe anlegen</button><button class="btn-s w-full sm:w-auto sm:flex-1" data-a="quick-create" data-type="pvwp">${ic('sun', 17)}Als PV + Wärmepumpe anlegen</button>`}</div>`;
}
function qLoadFrom() { return isNum(QS.load) && QS.load > 0 ? '' : QS.calcOpen && isNum(qMethodLoad()) ? '(aus „Heizlast berechnen“)' : ''; }
function quickRender() { const r = $('#quick-root'); if (r) r.innerHTML = quickHTML(); }
function quickLive() {
  const r = qResult(), m = qMethodLoad(), set = (id, t) => { const el = $('#' + id); if (el) el.textContent = t; };
  const box = $('#q-result'); if (box) box.innerHTML = qResultHTML(r);
  set('q-mload', isNum(m) ? num(m, 2) + ' kW' : '–'); set('q-pers', QS.persons); set('q-sperr', (QS.sperr || 0) + ' Std.');
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
  if (!(isNum(QS.load) && QS.load > 0)) QS.calcOpen = true;                    // ohne Heizlast gleich das Berechnen öffnen
  modal(`<div id="quick-root">${quickHTML()}</div>`, { wide: true });
  quickZip();
  /* Bilder aller Wärmepumpen laden, damit jede Auswahl ihr Bild zeigt */
  loadFiles(PRODUCTS.filter(x => x.cat === 'wp').map(x => x.img)).then(() => quickLive()).catch(() => {});
}
function quickApplyTo(p) {
  const r = qResult(), pr = r.sim && r.sim.prod;
  if (pr && pr.id && PRODUCTS.find(x => x.id === pr.id)) {
    p.components = (p.components || []).filter(c => { const x = PRODUCTS.find(y => y.id === c.id); return !x || x.cat !== 'wp'; }).concat({ id: pr.id, qty: 1 });
    try { applyComponents(p); } catch (e) {}
  }
  p.quick = { v: 2, state: clone(QS), load: Math.round(r.load * 100) / 100, total: Math.round(r.total * 100) / 100, jaz: Math.round(r.jaz * 100) / 100, te: qTe(), date: isoToday() };
  p.quick.prod = pr ? pr.name : ''; p.quick.bv = r.sim ? r.sim.bv : null; p.quick.deck = r.sim ? r.sim.deck : null;
  p.hp.kw = pr ? pr.power : p.quick.total; p.hp.jaz = p.quick.jaz;
}
/* Karte im Bereich „Neue Wärmepumpe“ */
function quickCard(p) {
  if (!p.quick) return `<div class="mb-4 flex flex-wrap items-center gap-2 text-[13px] text-ink3">Leistung noch unklar?<button class="btn-g !h-8 !px-2.5 text-[13px] text-p" data-a="quick-redo" data-id="${p.id}">${ic('fan', 15)}Schnellauslegung</button></div>`;
  const q = p.quick, st = q.state || {};
  const facts = q.v === 2 ? [st.build === 'neu' ? 'Neubau' : 'Bestand', st.art === 'mfh' ? 'Mehrfamilienhaus' : 'Einfamilienhaus', qInsul(st.insul)[1], `Normaußentemp. ${num(q.te, 1)} °C`, `${st.persons} Personen`, (QH.flow.find(f => f[0] === +st.flow) || [0, ''])[1]].join(' · ') : `${num(q.area)} m² · ${num(q.persons)} Personen`;
  return `<div class="mb-5 rounded-[calc(var(--r)-4px)] border border-p/30 p-4" style="background:rgb(var(--p-rgb)/.06)"><div class="flex flex-wrap items-center justify-between gap-2"><div class="text-[14px] font-semibold flex items-center gap-2"><span class="text-p">${ic('fan', 17)}</span>Schnellauslegung vom ${deDate(q.date)}</div><button class="btn-g !h-8 !px-2.5 text-[13px]" data-a="quick-redo" data-id="${p.id}">${ic('refresh', 14)}Neu auslegen</button></div>
  <div class="text-[13px] text-ink2 mt-1.5">${esc(facts)}</div><div class="text-[12px] mt-1.5 font-medium" style="color:#C7792F">Grobe Schätzung – die tatsächliche Heizlast ergibt erst eine vollständige Heizlastberechnung (DIN EN 12831).</div>
  <div class="text-[14px] mt-1.5">Heizlast <b>${num(q.total ?? q.load, 2)} kW</b>${q.prod ? ` · Wärmepumpe <b class="text-p">${esc(q.prod)}</b>` : ` · empfohlen <b class="text-p">${num(q.total, 1)} kW</b>`}${isNum(q.bv) ? ` · Bivalenzpunkt ${num(q.bv, 1)} °C · Deckung ${num(q.deck, 1)} %` : ''} · JAZ ca. <b>${num(q.jaz, 2)}</b></div></div>`;
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
  if (k === 'sperr') QS.sperr = Math.max(0, Math.min(6, Math.round(QS.sperr || 0)));
  if (k === 'load') { $$('#quick-root [data-qi="load"]').forEach(o => { if (o !== el) o.value = o.dataset.range ? (QS.load || 0) : (isNum(QS.load) ? inputFmt(Math.round(QS.load * 10) / 10, 'n') : ''); }); }
  quickLive();
});
document.addEventListener('change', e => {
  const el = e.target.closest && e.target.closest('#quick-root [data-qi]'); if (!el || !QS || !el.dataset.sel) return;
  const k = el.dataset.qi; QS[k] = ['flowHK', 'flowFBH'].includes(k) ? +el.value : el.value;
  if (k === 'fuel') QS.unit = QS.fuel.startsWith('oil') ? 'l' : 'kwh';
  if (k === 'prodId') { QS.prodManual = true; quickLive(); return; }
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

/* ---------- Auslegung mit Jahressimulation (Temperatur-Klassen nach EN 14825) ---------- */
const qLerp = (pts, t) => { if (t <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) { const [a, b] = pts[i - 1], [c, d] = pts[i]; return b + (d - b) * (t - a) / (c - a); } return pts[pts.length - 1][1]; };
/* Leistung je Vorlauftemperatur (Bezug 55 °C wie im Wolf-Diagramm) */
const qFlowCap = f => 1 + (55 - f) * 0.008;
function qSimulate(Pn, base) {
  const te = qTe(), HG = qInsul(QS.insul)[2], Fd = qFlowT(), mode = QS.mode;
  const L = t => Math.max(0, base.load * (HG - t) / (HG - te));                // Gebäude-Heizlast bei Außentemperatur t
  const need = t => (L(t) + base.ww) * base.sperrF;
  const cap = t => Pn * qLerp(QH.capMax, t) * qFlowCap(Fd), cmin = t => Pn * qLerp(QH.capMin, t) * qFlowCap(Fd);
  let bv = null; for (let t = te; t <= HG; t += 0.1) { if (cap(t) >= need(t)) { bv = Math.round(t * 10) / 10; break; } }
  if (bv === null) bv = HG;
  let inv = null; for (let t = -10; t <= HG; t += 0.1) { if (L(t) <= cmin(t)) { inv = Math.round(t * 10) / 10; break; } }
  /* Jahr durchrechnen */
  const K = 1.0225, sc = t => HG - (HG - t) * (HG - te) / (HG + 10);         // Temperaturklassen auf den Standort strecken
  const cop = (t, fl) => 0.58 * (fl + 5 + 273.15) / Math.max(8, (fl + 5) - (t - 5));
  let qB = 0, qWP = 0, eWP = 0, rod = 0;
  const cut = mode === 'biteil' ? -5 : null;
  for (const k in QH.bins) {
    const t = sc(+k), h = QH.bins[k] * K, l = L(t); if (l <= 0) continue;
    qB += l * h;
    let wp = Math.min(l, cap(t));
    if (mode === 'bialt' && t < bv) wp = 0;
    if (cut !== null && t < cut) wp = 0;
    if (mode === 'mono') wp = l;
    const fl = 20 + (Fd - 20) * Math.pow((HG - t) / (HG - te), 0.77);
    qWP += wp * h; eWP += wp * h / cop(t, fl); rod += (l - wp) * h;
  }
  const qW = qWwDay() * 365 * qCirc() * (QS.solar ? 0.45 : 1);                // Solarthermie deckt gut die Hälfte des Warmwassers
  const copW = 0.66 * (60 + 273.15) / (60 - 5);                                  // Warmwasser 55 °C, Jahresmittel der Außenluft ≈ 10 °C
  const eW = qW / copW;
  const elec = rod;                                                              // Zusatzheizung: Heizstab 1:1 bzw. Kessel
  const jazH = qWP > 0 ? qWP / eWP : 0, jazW = copW, total = qB + qW;
  const isEl = mode === 'monoen' || mode === 'mono';
  const jazHB = isEl ? qB / (eWP + rod) : jazH, jazG = (qWP + qW) / (eWP + eW), jazGB = isEl ? total / (eWP + eW + rod) : jazG;
  const deck = total > 0 ? 100 * (1 - rod / total) : 100;
  return { Pn, bv, inv, te, HG, L, need, cap, cmin, qB, qW, total, rod, eWP: eWP + eW, jazH, jazW, jazHB, jazWB: jazW, jazG, jazGB, deck, isEl, elec };
}
function qCandidates() {
  const list = PRODUCTS.filter(p => p.cat === 'wp' && isNum(+p.power) && +p.power > 0).map(p => ({ id: p.id, name: p.name, power: +p.power, pr: p }));
  if (list.length) return list.sort((a, b) => a.power - b.power);
  return [5, 7, 9, 12, 14, 16, 20, 25].map(k => ({ id: '', name: `Wärmepumpe ${k} kW (typisch)`, power: k, generic: true }));
}
function qPick() {
  const base = { load: 0, ww: 0, sperrF: 24 / (24 - (QS.sperr || 0)) };
  const m = !(isNum(QS.load) && QS.load > 0) && QS.calcOpen ? qMethodLoad() : null;
  base.load = isNum(QS.load) && QS.load > 0 ? QS.load : isNum(m) ? m : 0;
  base.ww = QS.persons * 0.25 * (QS.comfort / 30) * 0.5;
  if (!(base.load > 0)) return null;
  const need = (QH.modes.find(x => x[0] === QS.mode) || [0, 0, 0, 97])[3];
  const cands = qCandidates().map(c => ({ ...c, s: qSimulate(c.power, base) }));
  const ok = cands.filter(c => c.s.deck >= need && (QS.mode !== 'mono' || c.s.bv <= c.s.te + 0.05));
  const rec = ok[0] || cands[cands.length - 1];
  let sel = QS.prodManual && cands.find(c => (c.id || c.name) === QS.prodId) || rec;
  QS.prodId = sel.id || sel.name;
  const smaller = ok.length && sel !== rec && sel.power > rec.power;
  const status = sel.s.deck < need ? { cls: 'warn', t: `Die Wärmepumpe ist für „${(QH.modes.find(x => x[0] === QS.mode) || [])[1]}“ eher zu klein – Deckungsanteil ${num(sel.s.deck, 1)} %, Ziel mind. ${need} %.` }
    : smaller ? { cls: 'warn', t: `Die Wärmepumpe ist größer als nötig – ${esc(rec.name)} würde reichen. Zu große Geräte takten häufiger.` }
    : { cls: 'ok', t: 'Die ausgewählte Wärmepumpe ist richtig abgestimmt.' };
  return { ...sel.s, prod: sel.generic ? null : sel.pr, name: sel.name, power: sel.power, rec, cands, status, generic: !!sel.generic };
}
function qChart(sim, o = {}) {
  const W = o.W || 560, H = o.H || 300, pl = 40, pr = 12, pt = 14, pb = 34, x0 = -22, x1 = 40;
  const yMax = Math.max(8, Math.ceil(Math.max(sim.need(sim.te), sim.cap(40)) / 4) * 4 + 4);
  const X = t => pl + (t - x0) / (x1 - x0) * (W - pl - pr), Y = v => pt + (1 - v / yMax) * (H - pt - pb);
  const c = C(), path = (f, a = x0, b = x1) => { let d = ''; for (let t = a; t <= b + 0.01; t += 1) d += (d ? 'L' : 'M') + X(t).toFixed(1) + ' ' + Y(f(t)).toFixed(1); return d; };
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:100%">`;
  for (let v = 0; v <= yMax; v += 4) s += `<line x1="${pl}" x2="${W - pr}" y1="${Y(v)}" y2="${Y(v)}" stroke="${c.grid}"/>` + T(pl - 6, Y(v) + 4, String(v), { a: 'end', fs: 10 });
  for (let t = -20; t <= 40; t += 10) s += `<line x1="${X(t)}" x2="${X(t)}" y1="${pt}" y2="${H - pb}" stroke="${c.grid}"/>` + T(X(t), H - pb + 16, String(t), { a: 'middle', fs: 10 });
  s += T(W - pr, H - 4, 'Außentemperatur °C', { a: 'end', fs: 10 }) + T(pl, pt - 2 + 10, 'kW', { fs: 10 });
  /* Fläche Wärmepumpe (bis Bedarf) */
  const fill = (f, col, a, b) => `<path d="${path(f, a, b)} L${X(b)} ${Y(0)} L${X(a)} ${Y(0)} Z" fill="${col}"/>`;
  s += fill(t => Math.min(sim.need(t), sim.cap(t)), 'rgba(63,169,140,.22)', Math.ceil(sim.te), Math.floor(sim.HG));
  s += `<path d="${path(sim.cap)}" fill="none" stroke="#E5484D" stroke-width="2.4"/>`;
  s += `<path d="${path(sim.cmin)}" fill="none" stroke="#6E9FD6" stroke-width="2"/>`;
  s += `<path d="M${X(sim.te)} ${Y(sim.need(sim.te))} L${X(sim.HG)} ${Y(sim.need(sim.HG))}" stroke="${c.ink2 || '#888'}" stroke-width="2.2"/>`;
  s += `<circle cx="${X(sim.te)}" cy="${Y(sim.need(sim.te))}" r="4.5" fill="${c.ink2 || '#888'}"/>`;
  s += `<circle cx="${X(sim.bv)}" cy="${Y(sim.cap(sim.bv))}" r="5.5" fill="#E5484D" stroke="#fff" stroke-width="1.5"/>`;
  if (isNum(sim.inv)) s += `<circle cx="${X(sim.inv)}" cy="${Y(sim.cmin(sim.inv))}" r="5" fill="#6E9FD6" stroke="#fff" stroke-width="1.5"/>`;
  return s + '</svg>';
}
function qResultHTML(r) {
  const sim = r.sim;
  const row = (l, v, sub) => `<div class="card !rounded-[calc(var(--r)-4px)] p-4"><div class="text-[13px] text-ink3">${l}</div><div class="text-[22px] font-semibold mt-1 whitespace-nowrap">${v}</div>${sub ? `<div class="text-[12px] text-ink3 mt-1 leading-snug">${sub}</div>` : ''}</div>`;
  const head = `<div class="grid grid-cols-2 gap-3">${row('Heizlast', `${num(r.total, 2)} kW`, `Gebäude ${num(r.load, 2)} kW · Warmwasser ${num(r.ww, 2)} kW · EVU ${num(r.evu, 2)} kW`)}`;
  if (!sim) return head + row('Wärmepumpe', '–', 'Bitte eine Heizlast eingeben oder über „Heizlast berechnen“ ermitteln.') + '</div>';
  const st = sim.status, mode = (QH.modes.find(x => x[0] === QS.mode) || [])[1];
  const sel = `<select class="inp appearance-none !h-11" data-qi="prodId" data-sel="1">${sim.cands.map(c => `<option value="${esc(c.id || c.name)}" ${(c.id || c.name) === QS.prodId ? 'selected' : ''}>${esc(c.name)} · ${num(c.power, 1)} kW${c === sim.rec ? ' – empfohlen' : ''}</option>`).join('')}</select>`;
  const img = sim.prod && typeof prodThumb === 'function' ? prodThumb(sim.prod, 84) : `<div class="w-[84px] h-[84px] rounded-xl bg-raised grid place-items-center text-ink3">${ic('fan', 34)}</div>`;
  const jt = (a, b, c) => `<tr><td class="py-1 text-ink3">${a}</td><td class="py-1 text-right">${num(b, 2)}</td><td class="py-1 text-right">${num(c, 2)}</td></tr>`;
  return `<div class="rounded-[calc(var(--r)-4px)] px-4 py-3 text-[14px] font-medium mb-3" style="background:${st.cls === 'ok' ? 'rgb(var(--p-rgb)/.14)' : 'rgba(229,154,92,.16)'}">${st.cls === 'ok' ? '✓ ' : '! '}${st.t}</div>
  <div class="card !rounded-[calc(var(--r)-4px)] p-4"><div class="grid sm:grid-cols-[1fr_190px] gap-3 items-center">${qChart(sim)}
    <div class="grid grid-cols-2 sm:grid-cols-1 gap-2 text-[13px]">
      <div><div class="text-ink3">Normaußentemperatur</div><b class="text-[15px]">${num(sim.te, 1)} °C</b></div>
      <div><div class="text-ink3">Bivalenzpunkt</div><b class="text-[15px]" style="color:#E5484D">${num(sim.bv, 1)} °C</b></div>
      <div><div class="text-ink3">Inverterpunkt</div><b class="text-[15px]" style="color:#6E9FD6">${isNum(sim.inv) ? num(sim.inv, 1) + ' °C' : '–'}</b></div>
      <div><div class="text-ink3">Deckungsanteil</div><b class="text-[15px]">${num(sim.deck, 2)} %</b></div>
      <div class="col-span-2 sm:col-span-1"><div class="text-ink3">Betriebsweise</div><b class="text-[15px]">${mode}</b></div>
    </div></div>
    <div class="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink3 mt-2"><span><b style="color:#E5484D">—</b> max. Leistung WP</span><span><b style="color:#6E9FD6">—</b> min. Leistung (Modulation)</span><span><b>—</b> Heizlast</span></div>
    <p class="hint !mt-1">Bivalenzpunkt: ab hier hilft ${sim.isEl ? 'der Heizstab' : 'der Zusatzwärmeerzeuger'}. Inverterpunkt: darüber kann die Wärmepumpe nicht weiter herunterregeln und taktet.</p></div>
  <div class="card !rounded-[calc(var(--r)-4px)] p-4 mt-3"><div class="flex gap-4 items-center"><div class="shrink-0">${img}</div><div class="flex-1 min-w-0"><span class="lbl">Wärmepumpe ${sim.generic ? '(keine Wärmepumpen in „Produkte“ – typische Größen)' : 'aus Ihren Produkten'}</span>${sel}</div></div></div>
  <div class="grid sm:grid-cols-2 gap-3 mt-3">
    <div class="card !rounded-[calc(var(--r)-4px)] p-4"><div class="text-[13px] text-ink3">JAZ Wärmepumpe (Schätzung)</div><table class="w-full text-[13px] mt-2"><tr class="text-ink3 text-[12px]"><td></td><td class="text-right">nur WP</td><td class="text-right">${sim.isEl ? 'mit Heizstab' : 'mit Zusatz'}</td></tr>${jt('Heizung', sim.jazH, sim.jazHB)}${jt('Warmwasser', sim.jazW, sim.jazWB)}<tr class="font-semibold"><td class="py-1">gesamt</td><td class="py-1 text-right">${num(sim.jazG, 2)}</td><td class="py-1 text-right">${num(sim.jazGB, 2)}</td></tr></table></div>
    ${row('Heizlast', `${num(r.total, 2)} kW`, `Gebäude ${num(r.load, 2)} kW<br>Zuschlag Warmwasser ${num(r.ww, 2)} kW<br>Zuschlag EVU ${num(r.evu, 2)} kW`)}
    ${row('Jahreswärmebedarf', `${num(sim.total)} kWh`, `Gebäude ${num(sim.qB)} kWh<br>Warmwasser ${num(sim.qW)} kWh`)}
    ${row(sim.isEl ? 'Strombedarf (gesamt)' : 'Energiebedarf', `${num(sim.eWP + (sim.isEl ? sim.rod : 0))} kWh`, `Wärmepumpe ${num(sim.eWP)} kWh<br>${sim.isEl ? `E-Heizstab ${num(sim.rod)} kWh` : `Zusatzwärmeerzeuger ${num(sim.rod)} kWh Wärme`}`)}
  </div>
  <div class="card !rounded-[calc(var(--r)-4px)] p-4 mt-3 flex flex-wrap items-center gap-4"><div class="text-[26px] font-semibold text-p whitespace-nowrap">${num(sim.total - sim.eWP - (sim.isEl ? sim.rod : sim.rod))} kWh</div><div class="text-[13px] text-ink2 flex-1 min-w-[200px]">Umweltwärme pro Jahr – kostenlos aus der Außenluft. Das entspricht rund <b>${num((sim.total - sim.eWP - sim.rod) * 0.4 / 1000, 1)} t CO₂</b> weniger als mit fossiler Wärme (0,4 kg je kWh).</div></div>
  <p class="hint">Überschlägige Simulation mit typischer Leistungskurve und Klimadaten nach EN 14825 – Herstellerdaten können abweichen.</p>`;
}

/* ---------- Auslegung für eine Berechnung ohne Fenster (z. B. nach dem Angebots-Upload) ---------- */
function qWith(state, fn) { const keep = QS; QS = { ...QD, reno: [], ...clone(state) }; try { return fn(); } finally { QS = keep; } }
async function quickAuto(p, o = {}) {
  if (!hasWP(p)) return false;
  if ((p.docs || []).some(d => d.role === 'tech')) return false;                // eigene Auslegung (z. B. Wolf) hat Vorrang
  const h = p.heating, st = p.quick && p.quick.v === 2 ? clone(p.quick.state) : { ...QD, reno: [] };
  if (!(p.quick && p.quick.v === 2)) {
    if (!(isNum(h.cons) && h.cons > 0)) return false;                           // ohne Verbrauch keine automatische Auslegung
    st.method = 'verbrauch'; st.calcOpen = true; st.load = null;
    st.fuel = h.fuel === 'oil' ? 'oil_bw' : 'gas_bw'; st.c1 = h.cons; st.c2 = null; st.c3 = null; st.unit = h.fuel === 'oil' ? 'l' : 'kwh';
    if (isNum(h.year)) st.heatAge = h.year < 1980 ? 'old' : h.year < 1995 ? 'mid' : 'new';
  }
  if (p.customer.zip) { st.zip = p.customer.zip; st.city = p.customer.city || st.city; }
  const pi = st.zip && typeof plzInfo === 'function' ? await plzInfo(st.zip) : null;
  if (pi) { st.teAuto = pi.te; st.teH = pi.h; }
  const wp = (p.components || []).map(c => PRODUCTS.find(x => x.id === c.id)).find(x => x && x.cat === 'wp');
  if (wp) { st.prodId = wp.id; st.prodManual = true; }
  const keepHp = { model: p.hp.model, kw: p.hp.kw, jaz: p.hp.jaz };
  qWith(st, () => {
    if (st.calcOpen && !(isNum(QS.load) && QS.load > 0)) { const m = qMethodLoad(); if (isNum(m) && m > 0) QS.load = Math.round(m * 100) / 100; }
    if (!(isNum(QS.load) && QS.load > 0)) return;
    const comps = p.components; quickApplyTo(p); p.components = comps;          // Angebot bleibt maßgeblich: Gerät nicht austauschen
  });
  if (!(p.quick && p.quick.v === 2)) return false;
  if (o.keepHp !== false) { if (keepHp.model) p.hp.model = keepHp.model; if (isNum(keepHp.kw)) p.hp.kw = keepHp.kw; if (isNum(keepHp.jaz)) p.hp.jaz = keepHp.jaz; }
  p.quick.auto = true;
  return true;
}
/* Nach dem Hochladen eines Angebots automatisch auslegen */
{
  const _ar = applyRecognition;
  applyRecognition = function (p, doc, r) {
    const out = _ar.apply(this, arguments);
    setTimeout(async () => { try { if (await quickAuto(p)) { saveProject(p); toast(`Wärmepumpe automatisch ausgelegt: Bivalenzpunkt ${num(p.quick.bv, 1)} °C, Deckung ${num(p.quick.deck, 1)} %.`); if (UI.route === 'projekt') render(); } } catch (e) { console.warn('Auslegung', e); } }, 300);
    return out;
  };
}

/* ---------- PDF-Seite „Technische Auslegung“ (beide Layouts) ---------- */
DOC_TEXT.wpdesign = { label: 'Erste Einschätzung Wärmepumpe', badge: 'Erste Einschätzung', title: 'Erste *Einschätzung* zur Wärmepumpe', lead: 'Eine grobe Schätzung als Orientierung – noch keine Heizlastberechnung.' };
{ const i = PAGE_KEYS.indexOf('products'); PAGE_KEYS.splice(i >= 0 ? i + 1 : PAGE_KEYS.indexOf('situation') + 1, 0, 'wpdesign'); }
{ const i = SALES_KEYS.indexOf('products'); SALES_KEYS.splice(i >= 0 ? i + 1 : SALES_KEYS.indexOf('sSystem') + 1, 0, 'wpdesign'); }
const qDocOk = p => hasWP(p) && p.quick && p.quick.v === 2 && !(p.docs || []).some(d => d.role === 'tech');
DOC.wpdesign = function (p, R) {
  const sales = CUR_LAYOUT === 'sales', q = p.quick;
  const r = qWith(q.state, () => qResult()), sim = r.sim; if (!sim) return { title: 'Technische Auslegung', body: '' };
  const st = q.state, mode = (QH.modes.find(x => x[0] === st.mode) || [])[1], hs = (QH.hsys.find(x => x[0] === st.hsys) || [])[1];
  const flow = st.hsys === 'fbh' ? st.flowFBH : st.hsys === 'both' ? `${st.flowHK} / ${st.flowFBH}` : st.flowHK;
  const meth = st.method === 'verbrauch' && st.calcOpen ? `aus Verbrauch (${num([st.c1, st.c2, st.c3].filter(v => isNum(v) && v > 0).reduce((a, b, _, x) => a + b / x.length, 0))} ${st.unit === 'kwh' ? 'kWh' : st.fuel && st.fuel.startsWith('gas') ? 'm³' : 'l'}/Jahr)` : st.method === 'XX' ? `(${(QH.fuels.find(f => f[0] === st.fuel) || [])[1] || ''}, ${num([st.c1, st.c2, st.c3].filter(v => isNum(v) && v > 0).reduce((a, b, _, x) => a + b / x.length, 0))} ${st.unit === 'kwh' ? 'kWh' : st.fuel && st.fuel.startsWith('gas') ? 'm³' : 'l'} pro Jahr)` : st.method === 'baujahr' && st.calcOpen ? 'aus Baujahr und Sanierungen' : st.method === 'spez' && st.calcOpen ? 'aus Wohnfläche und spezifischer Heizleistung' : 'vorgegeben';
  const chart = svgDataUri(qWith(st, () => qChart(sim, { W: 760, H: 300 })).replace(/<svg [^>]*>/, '<svg xmlns="http://www.w3.org/2000/svg" width="760" height="300" viewBox="0 0 760 300">'));
  const tile = (l, v, sub, col) => `<div style="background:var(--tile);border-radius:var(--dr);padding:3mm 3.6mm"><div style="font-size:7.4pt;color:var(--ink3)">${l}</div><div style="font-size:12.5pt;font-weight:700;margin-top:0.6mm;${col ? 'color:' + col : ''}">${v}</div>${sub ? `<div style="font-size:7.2pt;color:var(--ink3);margin-top:0.6mm;line-height:1.35">${sub}</div>` : ''}</div>`;
  const kv = (k, v) => `<div style="display:flex;justify-content:space-between;gap:3mm;padding:1mm 0;border-bottom:0.2mm solid var(--line)"><span style="color:var(--ink3)">${k}</span><b style="text-align:right">${v}</b></div>`;
  const pr = sim.prod, pu = pr ? (fileUrl(pr.img) || pr.imgUrl) : '';
  let b = sales ? sChap('wpdesign', p, R) : chap(String(txt('wpdesign', 'title')).replace(/\*/g, ''), txt('wpdesign', 'lead'));
  b += `<div style="border:0.5mm solid #E59A5C;border-radius:var(--dr);padding:4mm 5mm;background:rgba(229,154,92,.10)">
      <div style="font-size:10.5pt;font-weight:700;color:#C7792F">Grobe Schätzung – keine Heizlastberechnung</div>
      <div style="font-size:8.6pt;line-height:1.5;margin-top:1.2mm">Diese Werte sind eine überschlägige Einschätzung auf Basis Ihrer Angaben und typischer Kennwerte. Welche Heizlast Ihr Haus tatsächlich hat und welche Wärmepumpe genau passt, ermitteln wir vor der Bestellung mit einer vollständigen Heizlastberechnung nach DIN EN 12831.</div></div>
    <div style="display:grid;grid-template-columns:1fr 1.5fr;gap:3mm;margin-top:4mm;align-items:stretch">
      <div style="background:var(--tile);border-radius:var(--dr);overflow:hidden;display:flex;flex-direction:column">
        <div style="height:46mm;position:relative;background-image:url('${stageBg()}');background-size:100% 100%;display:flex;align-items:flex-end;justify-content:center;padding:4mm 5mm 3mm">
          <img src="${shadowBg()}" style="position:absolute;left:18%;width:64%;bottom:2mm;height:4mm;display:block">
          ${pu ? `<img src="${esc(pu)}" style="position:relative;max-height:38mm;max-width:100%;width:auto;height:auto;display:block">` : `<div style="position:relative;margin-bottom:6mm">${sImg(prodIcon('wp'), 18, S.design.primary)}</div>`}</div>
        <div style="padding:3mm 4mm"><div style="font-size:7.4pt;font-weight:600;color:var(--p)">Passende Wärmepumpe (Vorschlag)</div><div style="font-size:11pt;font-weight:700;margin-top:0.6mm">${esc(sim.name)}</div><div class="small">${num(sim.power, 1)} kW Nennleistung${pr && pr.maker ? ' · ' + esc(pr.maker) : ''}</div></div></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:3mm">
        ${tile('Heizlast (geschätzt)', `ca. ${num(r.total, 1)} kW`, '')}
        ${tile('Bivalenzpunkt', `ca. ${num(sim.bv, 0)} °C`, sim.isEl ? 'darunter hilft der Heizstab' : 'darunter hilft der Zusatzerzeuger')}
        ${tile('Deckungsanteil', `ca. ${num(sim.deck, 0)} %`, 'Anteil der Wärmepumpe am Jahresbedarf')}
        ${tile('Jahresarbeitszahl', `ca. ${num(sim.jazGB, 1)}`, mode)}
      </div>
    </div>
    <div class="small" style="margin-top:3mm;line-height:1.5;color:var(--ink3)">Grundlagen: ${st.build === 'neu' ? 'Neubau' : 'Bestand'}, ${qInsul(st.insul)[1]}, Heizlast ${meth}, ${st.persons} Personen, ${hs} ${flow} °C, Normaußentemperatur ca. ${num(sim.te, 1)} °C${st.zip ? ` (${esc(st.zip)} ${esc(st.city || '')})` : ''}. Stand ${deDate(q.date)}.</div>`;
  return { title: 'Erste Einschätzung Wärmepumpe', body: b };
};
{
  const _dpd = docPageDefs;
  docPageDefs = function (p, R) {
    return _dpd(p, R).map(d => (d.key === 'wpdesign' ? { ...d, applies: qDocOk(p), on: qDocOk(p) && p.pages.wpdesign !== false, note: qDocOk(p) ? 'Kurze Einschätzung, klar als grobe Schätzung gekennzeichnet' : (p.docs || []).some(d => d.role === 'tech') ? 'Entfällt – es liegt bereits eine technische Unterlage (z. B. Wolf-Auslegung) bei' : 'Erst nach einer Schnellauslegung verfügbar' } : d));
  };
}

/* Karte im Schritt „Angebot“ (statt Upload technischer Unterlagen) */
function quickTechCard(p) {
  const q = p.quick;
  if (!q || q.v !== 2) return `<div class="rounded-[calc(var(--r)-4px)] border border-dashed border-line2 p-4 flex flex-wrap items-center gap-3">
    <div class="w-11 h-11 rounded-xl bg-raised grid place-items-center text-p shrink-0">${ic('fan', 22)}</div>
    <div class="flex-1 min-w-[200px]"><div class="font-semibold text-[15px]">Schnellauslegung</div><div class="text-[13px] text-ink3">Grobe Schätzung von Heizlast und passender Wärmepumpe. Wird nach dem Angebots-Upload automatisch erstellt, wenn der Verbrauch bekannt ist.</div></div>
    <button class="btn-s !h-10" data-a="quick-redo" data-id="${p.id}">${ic('fan', 16)}Jetzt auslegen</button></div>`;
  const st = q.state || {};
  return `<div class="rounded-[calc(var(--r)-4px)] border border-p/30 p-4" style="background:rgb(var(--p-rgb)/.06)">
    <div class="flex flex-wrap items-center justify-between gap-2"><div class="font-semibold text-[15px] flex items-center gap-2"><span class="text-p">${ic('fan', 18)}</span>Schnellauslegung vom ${deDate(q.date)}${q.auto ? ' <span class="badge bg-p/10 text-p !py-0 !text-[11px] font-medium">automatisch</span>' : ''}</div><button class="btn-g !h-9 !px-3 text-[13px]" data-a="quick-redo" data-id="${p.id}">${ic('refresh', 14)}Ansehen / ändern</button></div>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-[13px]">
      <div><div class="text-ink3">Heizlast</div><b class="text-[16px]">ca. ${num(q.total, 1)} kW</b></div>
      <div><div class="text-ink3">Wärmepumpe</div><b class="text-[16px]">${esc(q.prod || '–')}</b></div>
      <div><div class="text-ink3">Bivalenzpunkt</div><b class="text-[16px]">${isNum(q.bv) ? 'ca. ' + num(q.bv, 0) + ' °C' : '–'}</b></div>
      <div><div class="text-ink3">JAZ</div><b class="text-[16px]">ca. ${num(q.jaz, 1)}</b></div>
    </div>
    <div class="text-[12px] mt-3 font-medium" style="color:#C7792F">Grobe Schätzung – die tatsächliche Heizlast ergibt erst eine vollständige Heizlastberechnung (DIN EN 12831). Im PDF als kurze Seite „Erste Einschätzung Wärmepumpe“ mit diesem Hinweis.</div></div>`;
}

/* PDF: Bild der vorgeschlagenen Wärmepumpe auch dann laden, wenn sie (noch) nicht in den Komponenten steht */
{
  const _ppr = preparePrintRoot;
  preparePrintRoot = async function () { try { await loadFiles(PRODUCTS.filter(x => x.cat === 'wp').map(x => x.img)); } catch (e) {} return _ppr.apply(this, arguments); };
}
