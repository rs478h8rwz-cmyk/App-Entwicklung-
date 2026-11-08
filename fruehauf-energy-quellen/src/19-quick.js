/* Wärmepumpen-Schnellauslegung nach Kennwerten (überschlägig, ersetzt keine Heizlastberechnung nach DIN/TS 12831).
   Ablauf: „Neue Berechnung“ fragt zuerst, ob eine Schnellauslegung gemacht werden soll. */
const QUICK_STD = [[35, 'Neubau (KfW 55/40)', '35 W/m²'], [60, 'Saniert / neuerer Bestand', '60 W/m²'], [90, 'Altbau ungedämmt', '90 W/m²'], [120, 'Altbau, hoher Bedarf', '120 W/m²']];
const QUICK_FLOW = [[35, 'Fußbodenheizung', '35 °C'], [45, 'Gemischt / neue Heizkörper', '45 °C'], [55, 'Alte Heizkörper', '55 °C+']];
const QUICK_DEF = { area: 160, spec: 60, flow: 45, persons: 4 };

function quickCalc(q) {
  const area = +q.area || 0, spec = +q.spec || 50, flow = +q.flow || 45, persons = +q.persons || 3;
  const heatLoad = area * spec / 1000;                 // Gebäude-Heizlast in kW
  const ww = persons * 0.25;                           // Warmwasser-Zuschlag ca. 0,25 kW je Person
  const total = heatLoad + ww * 0.5;                   // Warmwasser hat Vorrang (3-Wege-Ventil) – nur halb addiert
  let jaz = flow === 35 ? 4.3 : flow === 45 ? 3.8 : 3.2;
  if (spec > 90) jaz -= 0.4;
  return { area, spec, flow, persons, heatLoad, ww, total, jaz };
}
const qStd = v => (QUICK_STD.find(x => x[0] === +v) || QUICK_STD[1]);
const qFlow = v => (QUICK_FLOW.find(x => x[0] === +v) || QUICK_FLOW[1]);

/* Schritt 1: Frage vor jeder neuen Berechnung */
const _newDialogQ = newDialog;
newDialog = function () {
  modal(`<h3 class="text-[21px] font-semibold pr-8">Neue Berechnung</h3>
  <div class="mt-4 rounded-[calc(var(--r)-4px)] p-4 flex gap-4 items-start" style="background:var(--t-red);color:var(--red-ink)"><div class="shrink-0 mt-0.5">${ic('fan', 26)}</div><div><div class="font-semibold text-[16px]">Zuerst eine Schnellauslegung für die Wärmepumpe?</div><div class="text-[13px] mt-1 opacity-90">In einer Minute: Heizlast, passende Geräteleistung und erwartete JAZ aus Wohnfläche, Gebäudestandard, Heizsystem und Personen. Die Werte werden in die Berechnung übernommen.</div></div></div>
  <div class="flex flex-col sm:flex-row gap-3 mt-5"><button class="btn-p w-full sm:w-auto sm:flex-1" data-a="quick-start">${ic('fan', 17)}Ja, Schnellauslegung</button><button class="btn-s w-full sm:w-auto sm:flex-1" data-a="quick-skip">Nein, direkt starten</button></div>`);
};

/* Schritt 2: Auslegung */
function quickDialog(pid) {
  const p = pid ? findProject(pid) : null, q = { ...QUICK_DEF, ...(p && p.quick || {}) };
  const sel = (k, list) => `<select class="inp appearance-none" data-q="${k}">${list.map(([v, l, x]) => `<option value="${v}" ${+q[k] === v ? 'selected' : ''}>${l} · ${x}</option>`).join('')}</select>`;
  const numIn = (k, unit) => `<div class="relative"><input class="inp pr-16" type="text" inputmode="numeric" data-q="${k}" value="${q[k]}"><span class="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-ink4 pointer-events-none">${unit}</span></div>`;
  const row = (l, id, cls = '') => `<div class="flex justify-between gap-3 py-1.5 ${cls}"><span class="text-ink3">${l}</span><span id="${id}" class="font-semibold text-right">–</span></div>`;
  modal(`<h3 class="text-[21px] font-semibold pr-8 flex items-center gap-2"><span class="text-p">${ic('fan', 22)}</span>Wärmepumpen-Schnellauslegung</h3>
  <div class="grid md:grid-cols-2 gap-5 mt-5">
    <div class="space-y-4">
      <label class="block"><span class="lbl">Beheizte Wohnfläche</span>${numIn('area', 'm²')}</label>
      <label class="block"><span class="lbl">Gebäudestandard / Baujahr</span>${sel('spec', QUICK_STD)}</label>
      <label class="block"><span class="lbl">Heizsystem / Vorlauftemperatur</span>${sel('flow', QUICK_FLOW)}</label>
      <label class="block"><span class="lbl">Personen im Haushalt (Warmwasser)</span>${numIn('persons', 'Pers.')}</label>
    </div>
    <div class="rounded-[calc(var(--r)-4px)] bg-raised p-5 flex flex-col">
      <div class="font-semibold text-[15px] pb-2 mb-2 border-b border-line">Ergebnis & Auslegung</div>
      <div class="text-[14px]">${row('Gebäude-Heizlast', 'q-heat')}${row('Warmwasser-Zuschlag', 'q-ww')}
        <div class="flex justify-between gap-3 py-2 mt-1 border-t border-line"><span class="text-p font-semibold">Empfohlene Geräteleistung</span><span id="q-total" class="font-bold text-p text-[18px] text-right">–</span></div>
        ${row('Erwartete JAZ (Schätzung)', 'q-jaz')}</div>
      <p class="hint mt-auto pt-4">Überschlägige Auslegung nach Kennwerten – ersetzt keine raumweise Heizlastberechnung nach DIN/TS 12831.</p>
    </div>
  </div>
  <div class="flex flex-col sm:flex-row gap-3 mt-6">${p
    ? `<button class="btn-p w-full sm:w-auto sm:flex-1" data-a="quick-apply" data-id="${p.id}">${ic('check', 17)}Werte übernehmen</button>`
    : `<button class="btn-p w-full sm:w-auto sm:flex-1" data-a="quick-create" data-type="wp">${ic('fan', 17)}Als Wärmepumpe anlegen</button><button class="btn-s w-full sm:w-auto sm:flex-1" data-a="quick-create" data-type="pvwp">${ic('sun', 17)}Als PV + Wärmepumpe anlegen</button>`}</div>`, { wide: true });
  quickUpdate();
}
function quickRead() { const q = {}; $$('#modal [data-q]').forEach(el => { q[el.dataset.q] = el.tagName === 'SELECT' ? +el.value : pnum(el.value); }); return q; }
function quickUpdate() {
  const r = quickCalc(quickRead()), set = (id, t) => { const el = $('#' + id); if (el) el.textContent = t; };
  set('q-heat', num(r.heatLoad, 1) + ' kW'); set('q-ww', num(r.ww, 1) + ' kW'); set('q-total', num(r.total, 1) + ' kW'); set('q-jaz', num(r.jaz, 2));
}
/* Ergebnis in die Berechnung schreiben */
function quickApplyTo(p, r) {
  p.quick = { area: r.area, spec: r.spec, flow: r.flow, persons: r.persons, heatLoad: Math.round(r.heatLoad * 10) / 10, total: Math.round(r.total * 10) / 10, jaz: Math.round(r.jaz * 100) / 100, date: isoToday() };
  p.hp.kw = p.quick.total; p.hp.jaz = p.quick.jaz;
}
/* Hinweis-Karte im Wärmepumpen-Bereich der Berechnung */
function quickCard(p) {
  if (!p.quick) return `<div class="mb-4 flex flex-wrap items-center gap-2 text-[13px] text-ink3">Leistung noch unklar?<button class="btn-g !h-8 !px-2.5 text-[13px] text-p" data-a="quick-redo" data-id="${p.id}">${ic('fan', 15)}Schnellauslegung</button></div>`;
  const q = p.quick;
  return `<div class="mb-5 rounded-[calc(var(--r)-4px)] border border-p/30 p-4" style="background:rgb(var(--p-rgb)/.06)"><div class="flex flex-wrap items-center justify-between gap-2"><div class="text-[14px] font-semibold flex items-center gap-2"><span class="text-p">${ic('fan', 17)}</span>Schnellauslegung vom ${deDate(q.date)}</div><button class="btn-g !h-8 !px-2.5 text-[13px]" data-a="quick-redo" data-id="${p.id}">${ic('refresh', 14)}Neu auslegen</button></div>
  <div class="text-[13px] text-ink2 mt-1.5">${num(q.area)} m² · ${esc(qStd(q.spec)[1])} (${qStd(q.spec)[2]}) · ${esc(qFlow(q.flow)[1])} (${qFlow(q.flow)[2]} Vorlauf) · ${num(q.persons)} Personen</div>
  <div class="text-[14px] mt-1.5">Heizlast <b>${num(q.heatLoad, 1)} kW</b> · empfohlen <b class="text-p">${num(q.total, 1)} kW</b> · JAZ ca. <b>${num(q.jaz, 2)}</b></div></div>`;
}

document.addEventListener('input', e => { if (e.target.closest && e.target.closest('#modal [data-q]')) quickUpdate(); });
document.addEventListener('change', e => { if (e.target.closest && e.target.closest('#modal [data-q]')) quickUpdate(); });
document.addEventListener('click', async e => {
  const a = e.target.closest('[data-a^="quick-"]'); if (!a) return;
  const act = a.dataset.a;
  if (act === 'quick-skip') { closeModal(); _newDialogQ(); }
  else if (act === 'quick-start') quickDialog();
  else if (act === 'quick-redo') quickDialog(a.dataset.id);
  else if (act === 'quick-create') {
    const r = quickCalc(quickRead()), np = newProject(a.dataset.type);
    quickApplyTo(np, r); PROJECTS.push(np); await DB.put('projects', clone(np)); closeModal(); go(`projekt/${np.id}/1`);
    toast(`Schnellauslegung übernommen: ${num(np.hp.kw, 1)} kW, JAZ ${num(np.hp.jaz, 2)}.`);
  } else if (act === 'quick-apply') {
    const p = findProject(a.dataset.id); if (!p) return;
    quickApplyTo(p, quickCalc(quickRead())); saveProject(p); closeModal(); render();
    toast(`Übernommen: ${num(p.hp.kw, 1)} kW, JAZ ${num(p.hp.jaz, 2)}.`);
  }
});
