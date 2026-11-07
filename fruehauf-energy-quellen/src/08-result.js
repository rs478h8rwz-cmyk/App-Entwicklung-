
/* ---------- Schritt 4: Ergebnis ---------- */
const withChart = fn => fn();
const dayMonth = p => clamp(+(p.docOpts.dayMonth || 4), 1, 12);
function dayChartHtml(p, R) {
  const m = dayMonth(p), D = simulateDay(R, m, p);
  const note = rodPause(R, m) ? `<div class="rounded-[calc(var(--r)-4px)] bg-tyel ring-1 ring-s/30 p-3.5 mb-3 text-[13.5px] text-ink flex gap-3">${ic('sun', 18, 'shrink-0 mt-0.5')}<div><b class="font-semibold">Sommerpause der Wärmepumpe.</b> ${esc(rodPauseText(R))}</div></div>` : '';
  return { svg: note + dayProfileSVG(R, { D, w: appW(), h: appW() < 640 ? 220 : 250 }), info: dayInfo(D) };
}
function dayCard(p, R) {
  const m = dayMonth(p), d = dayChartHtml(p, R);
  return `<div class="card p-5 sm:p-6">${cardHead('sun', 'Ein typischer Tag – 6 Uhr bis 6 Uhr', `Ertrag, Verbrauch${R.W ? ' (inkl. Wärmepumpe)' : ''}${R.bat ? ` und Ihr ${num(R.bat, 1)}-kWh-Speicher` : ''} im Tagesverlauf, Leistung in kW`)}
    <div class="rounded-[calc(var(--r)-4px)] bg-raised border border-line p-4 mb-4"><div class="flex items-baseline justify-between gap-3"><span class="text-[13px] text-ink2">Monat wählen</span><span class="h-font text-[24px]" id="day-month">${MONTH_NAMES[m - 1]}</span></div>
      <input type="range" min="1" max="12" step="1" value="${m}" class="w-full mt-3" data-daymonth aria-label="Monat">
      <div class="flex justify-between mono text-[11px] text-ink3 mt-1">${['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'].map((x, i) => `<span class="${i % 2 ? 'hidden sm:inline' : ''}">${x}</span>`).join('')}</div></div>
    <div id="day-chart">${d.svg}</div><div class="text-[12px] text-ink3 mt-2 leading-6">${dayLegend(R, true)}</div>
    <div class="mt-3 text-[13px] text-ink2" id="day-info">${d.info}</div><p class="hint">Der gewählte Monat erscheint auch im Kundendokument.</p></div>`;
}
const appW = () => (window.innerWidth < 640 ? 380 : 640);
const MONTH_YEARS = R => [R.startYear, 2030, 2035, 2040, 2045].filter((y, i, a) => (i === 0 || y > R.startYear) && y <= R.startYear + R.N - 1 && a.indexOf(y) === i);
const rowOfYear = (R, y) => R.rows.find(r => r.year === y) || R.rows[0];
function monthlyGroups(R) {
  const c = C();
  return MONTH_YEARS(R).map((y, i) => { const r = rowOfYear(R, y); return { label: i === 0 ? 'Heute' : String(y), vals: [{ v: r.monthOld, c: c.red2 }, { v: r.monthNew, c: c.p }] }; });
}
function step4(p, R) {
  const opt = R.scen === 'opt';
  const scen = `<div class="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"><div><div class="font-semibold text-[15px]">Rechenszenario</div><div class="text-[13px] text-ink3">${opt ? `${esc(S.optimistic.label)} aktiv · realistisch wären es <b>${amortTxt(R.real.amortRise)} Jahre</b> (steigende Preise)` : 'Standardannahmen aus den Einstellungen'}</div></div>
    <div class="seg self-start sm:self-auto"><button class="${!opt ? 'on' : ''}" data-a="scen" data-v="real">Realistisch</button><button class="${opt ? 'on' : ''}" data-a="scen" data-v="opt">${ic('rocket', 14, 'inline -mt-0.5')} Hochpushen</button></div></div>`;
  const tabs = `<div class="seg">${[['overview', 'Übersicht'], ['doc', 'Dokument-Vorschau']].map(([k, l]) => `<button class="${UI.resultTab === k ? 'on' : ''}" data-a="rtab" data-v="${k}">${l}</button>`).join('')}</div>`;
  return scen + tabs + (UI.resultTab === 'doc' ? docPreview(p, R) : overview(p, R));
}
function overview(p, R) {
  const c = C(), r1 = R.rows[0], last = R.rows[R.rows.length - 1], comps = comparisonsOf(R);
  const miss = R.missing.length ? `<div class="rounded-[calc(var(--r)-4px)] bg-tyel ring-1 ring-s/30 p-4 text-[14px] text-ink flex gap-3">${ic('alert', 18, 'shrink-0 mt-0.5')}<div><b>Noch offen:</b> ${R.missing.map(esc).join(', ')}.</div></div>` : '';
  const kpi = (k, v, sub, cls = '') => `<div class="kpi ${cls}"><div class="kpi-k">${k}</div><div class="kpi-v">${v}</div>${sub ? `<div class="text-[12px] text-ink3 mt-1">${sub}</div>` : ''}</div>`;
  let h = miss + plausibilityCard(p, R) + `<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
    ${kpi('Ihre schlussendlichen Kosten', eur(R.sowieso ? R.invest : R.net), R.sowieso ? 'Mehrkosten nach Sowieso-Kosten' : 'nach Förderung und Rabatt')}
    ${kpi('Ø Ersparnis pro Jahr', `<span class="text-p">${eur(R.avg)}</span>`, `1. Jahr: ${eur(R.saving1)}`)}
    ${kpi('Amortisation', `${amortTxt(R.amortStatic)} <span class="text-ink4">|</span> <span class="text-p">${amortTxt(R.amortRise)}</span> <span class="text-[15px]">J.</span>`, `gleichbleibende | steigende Preise${R.scen === 'opt' ? ' (optimistisch)' : ''}`)}
    ${kpi('CO₂-Einsparung', num(R.co2Save / 1000, 1) + ' t', 'pro Jahr')}</div>`;
  h += `<div class="card overflow-hidden"><div class="p-5 sm:p-6 text-white" style="background:var(--hl)"><div class="text-[13px] font-semibold opacity-90">Was Sie sich in ${R.N} Jahren leisten können</div><div class="text-[34px] sm:text-[40px] font-semibold leading-tight mt-1" style="color:var(--hl-num)">${eur(S.comparisons.basis === 'total' ? R.total : R.surplus)}</div><div class="text-[13px] opacity-90">${S.comparisons.basis === 'total' ? 'Gesamtersparnis' : 'Überschuss nach Abzug der Investition'}</div></div>
    ${comps.length ? `<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4">${comps.slice(0, 4).map(i => `<div class="kpi text-center"><div class="w-10 h-10 rounded-full bg-p/10 text-p grid place-items-center mx-auto">${ic(i.icon, 20)}</div><div class="text-[22px] font-semibold mt-2">${num(Math.floor(i.times))}×</div><div class="text-[12.5px] text-ink3 font-semibold">${esc(i.label)}</div></div>`).join('')}</div>` : '<p class="p-4 text-[13px] text-ink3">Für Vergleiche reicht der Betrag noch nicht.</p>'}</div>`;
  h += `<div class="card p-5 sm:p-6">${cardHead('calc', 'Ihre monatlichen Energiekosten')}
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3"><div class="rounded-[calc(var(--r)-4px)] p-4 bg-tred"><div class="kpi-k">Heute</div><div class="kpi-v">${eur(R.monthOld1)}</div><div class="text-[12px] text-ink3">pro Monat</div></div><div class="rounded-[calc(var(--r)-4px)] p-4 bg-pl"><div class="kpi-k">Künftig</div><div class="kpi-v">${eur(R.monthNew1)}</div><div class="text-[12px] text-ink3">pro Monat</div></div><div class="rounded-[calc(var(--r)-4px)] p-4 bg-tyel"><div class="kpi-k">Ersparnis</div><div class="kpi-v">${eur(R.monthOld1 - R.monthNew1)}</div><div class="text-[12px] text-ink3">in ${R.N} Jahren: ${eur(last.monthSave)} pro Monat</div></div></div>
    <div class="mt-4">${groupBars(monthlyGroups(R), { w: appW(), h: appW() < 640 ? 220 : 230 })}</div><div class="text-[12px] text-ink3 mt-1">${legendHtml([[c.red2, 'Heute-System'], [c.p, 'Neues System']])} Prognose mit ${R.scen === 'opt' ? 'optimistischen' : 'Standard'}-Annahmen: Öl/Gas +${num(R.scen === 'opt' ? S.optimistic.fuelInc : S.calc.fuelInc, 1)} % p. a. zzgl. CO₂-Preis, Strom +${num(R.scen === 'opt' ? S.optimistic.elecInc : S.calc.elecInc, 1)} % p. a.</div></div>`;
  if (R.W) h += `<div class="card p-5 sm:p-6">${cardHead('flame', 'Heizkostenvergleich', 'Kosten im 1. Jahr inkl. Grundpreis und Wartung')}${hBars([{ label: R.fuel === 'oil' ? 'Ölheizung' : 'Gasheizung', sub: 'bisher', v: R.costOld1, c: c.red, txt: eur(R.costOld1) }, { label: 'Wärmepumpe', sub: 'künftig', v: R.costNew1, c: c.p, txt: eur(R.costNew1) }], { w: appW(), lw: appW() < 640 ? 100 : 130 })}</div>`;
  if (R.V) h += `<div class="card p-5 sm:p-6">${cardHead('sun', 'Photovoltaik', `${num(R.kwp, 2)} kWp · ${num(R.yield)} kWh Ertrag pro Jahr`)}<div class="flex flex-wrap justify-around gap-4">${ring(R.autarky, 'Autarkie', c.p, 140)}${ring(R.selfShare, 'Eigenverbrauch', S.design.secondary, 140)}</div><div class="grid grid-cols-3 gap-2 mt-4 text-center">${[['Selbst genutzt', num(R.self) + ' kWh'], ['Eingespeist', num(R.feed) + ' kWh'], ['PV-Nutzen 1. Jahr', eur(R.pvBenefit1)]].map(([k, v]) => `<div class="kpi !p-3"><div class="kpi-k !text-[11.5px]">${k}</div><div class="font-semibold text-[15px] mt-0.5">${v}</div></div>`).join('')}</div></div>`;
  h += `<div class="card p-5 sm:p-6">${cardHead('chart', 'Amortisation', 'Kumulierter Saldo nach Abzug der Investition')}${amortChart(R, { w: appW(), h: appW() < 640 ? 240 : 250 })}<div class="text-[12px] text-ink3 mt-1">${legendHtml([[c.p, 'Saldo mit steigenden Preisen'], [c.blue, 'gleichbleibende Preise', true]])}</div>
    <div class="overflow-x-auto mt-4 -mx-1"><table class="w-full text-[13px] min-w-[520px]"><thead><tr class="text-ink3 text-[12px]"><th class="text-left font-semibold py-2 px-1">Jahr</th><th class="text-right font-semibold">Kosten alt</th><th class="text-right font-semibold">Kosten neu</th>${R.V ? '<th class="text-right font-semibold">PV-Nutzen</th>' : ''}<th class="text-right font-semibold">Ersparnis</th><th class="text-right font-semibold px-1">Saldo</th>${R.zins > 0 ? '<th class="text-right font-semibold px-1">Barwert-Saldo</th>' : ''}</tr></thead><tbody>${R.rows.filter(r => [1, 2, 3, 5, 10, 15, 20, R.N].includes(r.t)).filter((r, i, a) => a.indexOf(r) === i).map(r => `<tr class="border-t border-line ${R.amortRise && Math.ceil(R.amortRise) === r.t ? 'bg-tyel' : ''}"><td class="py-2 px-1 font-semibold">${r.t} <span class="text-ink4">(${r.year})</span></td><td class="text-right">${eur(r.costOld + (R.V ? (R.hhCons + R.carKWh) * r.hhPrice : 0))}</td><td class="text-right">${eur(r.costNew + (R.V ? (R.hhCons + R.carKWh) * r.hhPrice : 0))}</td>${R.V ? `<td class="text-right">${eur(r.pv)}</td>` : ''}<td class="text-right font-semibold text-p">${eur(r.saving)}</td><td class="text-right font-bold px-1 ${r.saldo < 0 ? 'text-ember2' : ''}">${eur(r.saldo)}</td>${R.zins > 0 ? `<td class="text-right px-1">${eur(r.saldoNpv)}</td>` : ''}</tr>`).join('')}</tbody></table></div>
    ${R.zins > 0 ? `<p class="hint">Barwert mit Kalkulationszins ${num(R.zins, 1)} %: Überschuss ${eur(R.npvSurplus)} (nur als Hinweis).</p>` : ''}</div>`;
  if (R.W) { const F = R.fund; h += `<div class="card p-5 sm:p-6">${cardHead('gift', 'Förderung im Detail', F.stand ? `Stand ${deDate(F.stand.from)}${F.stand.to ? ' bis ' + deDate(F.stand.to) : ''}` : '')}<div class="divide-y divide-line text-[14px]">${F.parts.map(([k, v]) => `<div class="flex justify-between py-2"><span class="text-ink2">${esc(k)}</span><b>${pct(v)}</b></div>`).join('')}<div class="flex justify-between py-2"><span class="font-bold">Fördersatz${F.capped ? ` (Höchstsatz ${F.max} %)` : ''}</span><b class="text-p">${pct(F.rate)}</b></div><div class="flex justify-between py-2"><span class="text-ink2">Förderfähige Kosten (max. ${eur(F.cap)})</span><b>${eur(F.base)}</b></div><div class="flex justify-between py-2 text-[16px]"><span class="font-semibold">Förderung</span><b class="text-p">${eur(F.amount)}</b></div></div></div>`; }
  if (R.W ? R.hpPower > 0 : R.yield > 0) {
    const A = annualProfile(p, R), hp = A.mode === 'hp';
    h += `<div class="card p-5 sm:p-6">${cardHead('sun', 'Ihr Strom übers Jahr', hp ? (A.pot ? `Wärmepumpen-Strom gegenüber einer möglichen PV-Anlage mit ${num(A.kwp, 1)} kWp` : 'Wann die Wärmepumpe Strom braucht – und wann Ihre PV-Anlage ihn liefert') : 'Haushaltsstrom und Solarerzeugung je Monat')}
      ${annualChart(A, { w: appW(), h: appW() < 640 ? 230 : 260 })}<div class="text-[12px] text-ink3 mt-2 leading-6">${annualLegend(A, true)}</div>
      <div class="grid grid-cols-3 gap-3 mt-4">${[[hp ? 'Solaranteil am WP-Strom' : 'Solaranteil', pct(A.share * 100)], ['Vom eigenen Dach', num(A.covered) + ' kWh'], ['Wert pro Jahr', eur(A.value)]].map(([k, v]) => `<div class="kpi !p-3"><div class="kpi-k !text-[12px]">${k}</div><div class="text-[18px] font-semibold mt-1">${v}</div></div>`).join('')}</div>
      ${A.pot ? `<p class="hint">Die PV-Anlage ist nur ein Vorschlag (Schritt 3 → Potenzielle PV-Anlage) und nicht Teil der Berechnung.</p>` : ''}</div>`;
  }
  if (R.V && R.kwp > 0) h += dayCard(p, R);
  if (R.rod) h += `<div class="card p-5 sm:p-6">${cardHead('fan', 'Sommerbetrieb mit Heizstab', `${esc(R.rodName)} · ${num(R.rodKw, 1)} kW`)}<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">${[['Wärmepumpe pausiert', `${R.rodMonths} Monate`, 'im Sommer nahezu aus'], ['Warmwasser per Solarstrom', num(R.rodHeat) + ' kWh', 'pro Jahr über den Heizstab'], ['WP-Strom, der entfällt', num(R.rodHpSaved) + ' kWh', 'weniger Laufzeit und Starts']].map(([k, v, u]) => `<div class="kpi"><div class="kpi-k">${k}</div><div class="kpi-v !text-[22px]">${v}</div><div class="text-[12px] text-ink3 mt-1">${u}</div></div>`).join('')}</div><p class="hint">Der Heizstab nutzt Solarstrom, der sonst für ${num(S.calc.feedIn, 2)} ct/kWh ins Netz ginge. Finanziell ist das etwa neutral – der Vorteil liegt in der geschonten Wärmepumpe und einer längeren Lebensdauer.</p></div>`;
  h += `<div class="card p-5 sm:p-6">${cardHead('arrowR', 'So geht es nach der Unterschrift weiter', p.type === 'pvwp' ? 'Photovoltaik und Wärmepumpe laufen parallel' : p.type === 'pv' ? 'Ablauf Photovoltaik' : 'Ablauf Wärmepumpe')}<div class="overflow-x-auto -mx-1 px-1"><div class="${p.type === 'pvwp' ? 'min-w-[540px]' : ''}">${roadmapHtml(p, false)}</div></div><p class="hint">Schritte und Texte ändern Sie unter Einstellungen → Roadmap.</p></div>`;
  h += finCard(p, R) + variantsCard(p) + signCard(p) + docCreateCard(p, R) + docOptionsCard(p, R);
  return h;
}
const legendHtml = items => items.map(([col, t, dashed]) => `<span class="inline-flex items-center gap-1.5 mr-3"><span class="inline-block ${dashed ? 'w-5 border-t-2 border-dashed' : 'w-3 h-3 rounded'}" style="${dashed ? 'border-color:' + col : 'background:' + col}"></span>${t}</span>`).join('');
function docCreateCard(p, R) {
  const pages = visiblePages(p, R), n = pages.reduce((a, x) => a + x.count, 0);
  return `<div class="card p-5 sm:p-6">${cardHead('file', 'Kundendokument erstellen', `${n} Seiten · A4`)}<div class="mb-4"><span class="lbl">Layout</span>${seg('p:docOpts.layout', [['full', 'Komplette PDF'], ['sales', 'Vertriebs-PDF']], { cls: 'flex-wrap' })}<div class="hint">Vorschau und Seitenauswahl zeigen das gewählte Layout.</div></div><div class="flex flex-wrap gap-2"><button class="btn-p" data-a="pdf">${ic('download', 17)}PDF erstellen</button><button class="btn-s" data-a="rtab" data-v="doc">${ic('eye', 17)}Vorschau</button></div></div>`;
}
function docOptionsCard(p, R) {
  const all = docPageDefs(p, R);
  let n = 0;
  const rows = all.filter(d => d.applies).map(d => { const on = d.on; const from = on ? n + 1 : null; if (on) n += d.count; return `<div class="flex items-center gap-3 py-2.5"><span class="w-12 text-[12px] font-bold text-ink4">${on ? (d.count > 1 ? `${from}–${from + d.count - 1}` : from) : '–'}</span><div class="flex-1 min-w-0"><div class="text-[14px] font-semibold ${on ? '' : 'text-ink4'}">${esc(d.label)}</div>${d.note ? `<div class="hint !mt-0">${esc(d.note)}</div>` : ''}</div>${tgl('', on, `data-a="page-tg" data-k="${d.key}"`)}</div>`; }).join('');
  const assumptionsOn = showAssumptions(p, R);
  return `<div class="card p-5 sm:p-6">${cardHead('eye', 'Was sieht der Kunde?', 'Seiten einzeln ein- und ausschalten – die Seitenzahlen passen sich an.')}<div class="divide-y divide-line">${rows}</div>
    <div class="mt-4 rounded-[calc(var(--r)-4px)] bg-bg px-4 divide-y divide-line">${toggleRow('Berechnungsannahmen zeigen', '', R.scen === 'opt' ? 'Beim optimistischen Szenario werden die Annahmen immer gedruckt.' : '', { on: assumptionsOn, action: 'opt-assump' })}${toggleRow('Sonderrabatt anbieten', 'p:discount.on')}
    ${p.discount.on ? `<div class="grid sm:grid-cols-2 gap-3 py-3">${field('Rabatt', 'p:discount.amount', { t: 'n', unit: '€' })}${field('Gültig bis', 'p:discount.until', { t: 'date' })}</div>` : ''}</div></div>`;
}
function docPreview(p, R) {
  return `<div class="grid xl:grid-cols-[minmax(0,1fr)_320px] gap-5 items-start"><div class="min-w-0" id="docwrap"><div class="docpv" id="docpv" style="zoom:1">${buildDocHtml(p, R)}</div></div>
    <div class="space-y-4 xl:sticky xl:top-24">${docCreateCard(p, R).replace('Vorschau', 'Vorschau').replace(`<button class="btn-s" data-a="rtab" data-v="doc">${ic('eye', 17)}Vorschau</button>`, `<button class="btn-g" data-a="print">${ic('printer', 16)}Alternativ über den Druckdialog</button>`)}${docOptionsCard(p, R)}</div></div>`;
}
function fitPreview() {
  const w = $('#docwrap'), d = $('#docpv'); if (!w || !d) return;
  d.style.zoom = 1; fitPages(d);
  const z = Math.min(1, w.clientWidth / 794); d.style.zoom = z;
}
window.addEventListener('resize', debounce(fitPreview, 100));
