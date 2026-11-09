
/* =========================================================
   Oberfläche
   ========================================================= */
const UI = { route: 'home', step: 0, maxStep: 0, viewId: null, q: '', fType: '', fGew: '', tab: 'firma' };
let CUR = null;            // aktuelles Protokoll in Bearbeitung (Entwurf)
let PROTS = [];            // abgeschlossene Protokolle

/* ---------- Entwurf ---------- */
let DRAFT_T = null;
function saveDraft(now) { clearTimeout(DRAFT_T); const go = () => (CUR ? DB.put('kv', clone(CUR), 'draft') : DB.del('kv', 'draft')); if (now) return go(); DRAFT_T = setTimeout(go, 300); }
function nextNumber(type, g) {
  const y = new Date().getFullYear(), key = `${TYPES[type].pre}-${g}-${y}`;
  S.numbers[key] = (S.numbers[key] || 0) + 1; saveSettings();
  return `${key}-${String(S.numbers[key]).padStart(4, '0')}`;
}
function newRecord(type, g) {
  const r = { id: uid('p'), type, gewerk: g, nr: nextNumber(type, g), created: Date.now(), updated: Date.now(), answers: {}, photos: [], sig: { monteur: { ort: '', datum: isoToday(), data: '' }, kunde: { ort: '', datum: isoToday(), data: '', absent: false } } };
  if (type === 'abnahme') r.answers.datum = isoToday();
  else r.answers.einsaetze = [{ id: uid('e'), datum: isoToday(), von: '', bis: '', pause: '' }];
  if (S.monteure.length === 1) r.answers.monteur = S.monteure[0];
  return r;
}

/* ---------- Sichtbare Schritte und Felder ---------- */
const visSteps = r => stepsOf(r).filter(s => !s.show || s.show(r.answers));
const visFields = (r, s) => s.fields.filter(f => !f.show || f.show(r.answers));
const EXTRA = [['fotos', 'Fotos'], ['sig_monteur', 'Unterschrift Monteur'], ['sig_kunde', 'Unterschrift Kunde'], ['summary', 'Zusammenfassung']];
const screens = r => visSteps(r).map(s => ['step', s.title, s]).concat(EXTRA.map(([k, t]) => [k, t]));
const optsOf = f => (typeof f.opts === 'function' ? f.opts() : f.opts || []);
const filled = v => (Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && String(v).trim() !== '');

/* Wert für Anzeige und PDF */
function fmtValue(r, f) {
  const v = r.answers[f.id];
  if (f.type === 'radio') return (optsOf(f).find(x => x[0] === v) || [v, v])[1];
  if (f.type === 'multiday') return (v || []).map(d => `${wdOf(d).slice(0, 2)}, ${deDate(d)}`).join('\n');
  if (f.type === 'items') return (v || []).map(x => `${x.q || 1} ${x.u || 'Stk'} × ${x.n}`).join('\n');
  if (f.type === 'einsaetze') return (v || []).map(e => { const z = zuschlag(e.datum, r.answers.notdienst === 'ja'); return `${wdOf(e.datum).slice(0, 2)}, ${deDate(e.datum)} · ${e.von || '?'}–${e.bis || '?'} Uhr${+e.pause ? ` (−${e.pause} Min. Pause)` : ''} · ${hrs(durH(e))} · ${z.typ}: ${z.label}`; }).join('\n');
  if (f.type === 'date') return v ? `${wdOf(v).slice(0, 2)}, ${deDate(v)}` : '';
  if (f.type === 'number') return v !== undefined && v !== '' ? `${v}${f.unit ? ' ' + f.unit : ''}` : '';
  return v ?? '';
}
function stepIssues(r, s) {
  const a = r.answers, bad = [];
  for (const f of visFields(r, s)) {
    if (!f.req) continue; const v = a[f.id];
    if (f.type === 'einsaetze') { if (!(v || []).length || v.some(e => !e.datum || !e.von || !e.bis)) bad.push(f.id); continue; }
    if (!filled(v)) bad.push(f.id);
  }
  return bad;
}
const serviceHours = r => (r.answers.einsaetze || []).reduce((s, e) => s + durH(e), 0);

/* ---------- Rahmen ---------- */
function logoMark(h = 34) {
  const l = S.company.logo;
  return l ? `<span class="inline-grid place-items-center rounded-[10px] bg-white px-2" style="height:${h}px"><img src="${esc(l)}" alt="" style="max-height:${h - 8}px;max-width:${h * 3.2}px"></span>` : `<span class="w-9 h-9 rounded-[10px] grid place-items-center text-white" style="background:rgb(var(--p-rgb))">${ic('check', 18, 2.4)}</span>`;
}
function shell(inner) {
  const nav = [['home', 'Start', 'grid', '#/'], ['list', 'Protokolle', 'file', '#/protokolle'], ['settings', 'Einstellungen', 'gear', '#/einstellungen']];
  return `<header class="sticky top-0 z-40 border-b border-line backdrop-blur-xl" style="background:color-mix(in srgb,var(--bg) 86%,transparent);padding-top:env(safe-area-inset-top)">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
      <a href="#/" class="flex items-center gap-3 min-w-0">${logoMark()}<span class="hidden sm:block leading-tight"><span class="block font-semibold text-[15px]">Abnahme &amp; Service</span><span class="block text-[12px] text-ink3">${esc(S.company.name)}</span></span></a>
      <nav class="ml-auto flex items-center gap-1">${nav.map(([k, l, i, h]) => `<a href="${h}" class="navl ${UI.route === k || (k === 'list' && UI.route === 'view') ? 'on' : ''}" aria-label="${l}">${ic(i, 17)}<span class="hidden md:inline">${l}</span></a>`).join('')}
      <button class="btn-p !h-10 !px-4 ml-1" data-a="new">${ic('plus', 17)}<span class="hidden sm:inline">Neues Protokoll</span></button></nav>
    </div></header>
    <main class="max-w-6xl mx-auto px-4 sm:px-6 pb-28">${inner}</main>
    <datalist id="dl-monteure">${S.monteure.map(m => `<option value="${esc(m)}">`).join('')}</datalist>`;
}

/* ---------- Startseite ---------- */
function gewerkCard(g, k) {
  return `<button class="card p-5 text-left flex items-start gap-4 hover:border-line2 transition-colors w-full" data-a="pick" data-g="${k}">
    <span class="w-12 h-12 rounded-[var(--rb)] grid place-items-center shrink-0" style="background:${rgba(g.color, 0.14)};color:${g.color}">${ic(g.icon, 24)}</span>
    <span class="min-w-0 flex-1"><span class="block font-semibold text-[17px]">${g.name}</span><span class="block text-[13px] text-ink3 mt-0.5">${g.desc}</span>
    <span class="flex gap-1.5 mt-3"><span class="badge bg-raised text-ink2">${ic('hard', 13)}Abnahme</span><span class="badge bg-raised text-ink2">${ic('wrench', 13)}Service</span></span></span>
    <span class="text-ink3 mt-1">${ic('arrowR', 18)}</span></button>`;
}
function protRow(p) {
  const g = GEWERKE[p.gewerk], t = TYPES[p.type], date = p.type === 'service' ? (p.answers.einsaetze || [])[0]?.datum : p.answers.datum;
  return `<div class="card p-4 flex items-center gap-3 sm:gap-4">
    <span class="w-11 h-11 rounded-[var(--rb)] grid place-items-center shrink-0" style="background:${rgba(g.color, 0.14)};color:${g.color}">${ic(t.icon, 20)}</span>
    <button class="min-w-0 flex-1 text-left" data-a="view" data-id="${p.id}"><span class="flex flex-wrap items-center gap-x-2 gap-y-1"><b class="font-semibold text-[15px] truncate">${esc(p.answers.kunde || 'Ohne Namen')}</b><span class="badge ${p.type === 'service' ? 'bg-tyel text-yel-ink' : 'bg-tgrn text-p'}">${t.short} · ${p.gewerk}</span>${p.type === 'service' && p.answers.notdienst === 'ja' ? '<span class="badge bg-tred text-red-ink">Notdienst</span>' : ''}</span>
      <span class="block text-[13px] text-ink3 truncate mt-0.5"><span class="mono">${esc(p.nr)}</span> · ${deDate(date)} · ${esc(p.answers.adresse || '')}</span></button>
    <button class="btn-g !px-2.5" data-a="pdf" data-id="${p.id}" title="PDF teilen">${ic('share', 17)}<span class="hidden sm:inline">PDF</span></button></div>`;
}
function viewHome() {
  const recent = PROTS.slice().sort((a, b) => b.updated - a.updated).slice(0, 5);
  const draft = CUR ? (() => { const sc = screens(CUR), i = Math.min(UI.maxStep || 0, sc.length - 1); return `<div class="card p-5 mt-6 flex flex-wrap items-center gap-4 border-p/40" style="background:rgb(var(--p-rgb)/.06)">
      <span class="w-11 h-11 rounded-[var(--rb)] grid place-items-center bg-p/15 text-p shrink-0">${ic('edit', 20)}</span>
      <div class="flex-1 min-w-[200px]"><div class="font-semibold">Weitermachen: ${TYPES[CUR.type].name} · ${GEWERKE[CUR.gewerk].name}</div><div class="text-[13px] text-ink3 mt-0.5">${esc(CUR.answers.kunde || 'Noch kein Kunde')} · <span class="mono">${esc(CUR.nr)}</span> · ${sc.length} Schritte</div></div>
      <div class="flex gap-2"><button class="btn-p" data-a="resume">Fortsetzen ${ic('arrowR', 16)}</button><button class="btn-g" data-a="discard">${ic('trash', 16)}</button></div></div>`; })() : '';
  return `<section class="pt-10 sm:pt-14">
      <span class="mono text-[12px] text-ink2 inline-flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-s"></span>${esc(S.company.name)}</span>
      <h1 class="h-font text-[44px] sm:text-[60px] leading-[1] mt-4">Abnahme &amp; Service.</h1>
      <p class="text-ink2 text-[16px] mt-4 max-w-xl">Baustellen sauber abnehmen und Serviceeinsätze dokumentieren – Schritt für Schritt, mit Fotos und Unterschrift, als PDF zum Teilen.</p>
      ${draft}
      <h2 class="sec-t mt-10 mb-4">Neues Protokoll – welches Gewerk?</h2>
      <div class="grid md:grid-cols-3 gap-3">${Object.entries(GEWERKE).map(([k, g]) => gewerkCard(g, k)).join('')}</div>
      <div class="flex items-end justify-between mt-10 mb-4"><h2 class="sec-t">Zuletzt</h2>${PROTS.length ? `<a href="#/protokolle" class="text-[14px] text-p font-medium">Alle ${PROTS.length} anzeigen →</a>` : ''}</div>
      ${recent.length ? `<div class="space-y-2">${recent.map(protRow).join('')}</div>` : `<div class="card p-8 text-center text-ink3 text-[14px]">Noch keine Protokolle – oben ein Gewerk wählen.</div>`}
    </section>`;
}
function pickDialog(g) {
  const G = GEWERKE[g];
  modal(`<div class="flex items-center gap-3 pr-8"><span class="w-11 h-11 rounded-[var(--rb)] grid place-items-center" style="background:${rgba(G.color, 0.14)};color:${G.color}">${ic(G.icon, 22)}</span><div><div class="text-[12px] text-ink3">${G.name}</div><h3 class="text-[20px] font-semibold leading-tight">Neue Baustelle oder Service?</h3></div></div>
    <div class="grid gap-3 mt-6">
      <button class="opt !min-h-[76px]" data-a="start" data-g="${g}" data-t="abnahme"><span class="w-10 h-10 rounded-[var(--rb)] grid place-items-center bg-p/15 text-p shrink-0">${ic('hard', 20)}</span><span><span class="block text-[16px] font-semibold">Neue Baustelle – Abnahme</span><span class="block text-[13px] text-ink3 font-normal">Montage abgeschlossen, alles dokumentieren</span></span></button>
      <button class="opt !min-h-[76px]" data-a="start" data-g="${g}" data-t="service"><span class="w-10 h-10 rounded-[var(--rb)] grid place-items-center shrink-0" style="background:rgb(var(--s-rgb)/.16);color:rgb(var(--s-rgb))">${ic('wrench', 20)}</span><span><span class="block text-[16px] font-semibold">Serviceauftrag</span><span class="block text-[13px] text-ink3 font-normal">Grund, Behebung, Material, Zeiten, Notdienst</span></span></button>
    </div>`);
}

/* ---------- Assistent ---------- */
function fieldHTML(r, f, bad) {
  const a = r.answers, v = a[f.id], err = bad.includes(f.id), lab = f.label ? `<span class="lbl">${esc(f.label)}${f.req ? ' <span class="text-ember">*</span>' : ''}</span>` : '';
  const hint = f.hint ? `<p class="hint">${esc(typeof f.hint === 'function' ? f.hint() : f.hint)}</p>` : '';
  const base = `class="inp ${err ? 'inp-req' : ''}" data-f="${f.id}"`;
  switch (f.type) {
    case 'text': case 'phone': return `<label class="block">${lab}<input ${base} type="${f.type === 'phone' ? 'tel' : 'text'}" value="${esc(v || '')}" placeholder="${esc(f.ph || '')}" ${f.list ? 'list="dl-monteure"' : ''} autocomplete="off">${hint}</label>`;
    case 'number': return `<label class="block">${lab}<div class="relative"><input ${base} inputmode="decimal" value="${esc(v ?? '')}" placeholder="${esc(f.ph || '0')}">${f.unit ? `<span class="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-ink3">${f.unit}</span>` : ''}</div>${hint}</label>`;
    case 'date': return `<label class="block">${lab}<input ${base} type="date" value="${esc(v || '')}">${hint}</label>`;
    case 'textarea': return `<label class="block">${lab}<textarea ${base} rows="3" placeholder="${esc(f.ph || '')}">${esc(v || '')}</textarea></label>${f.chips ? `<div class="flex flex-wrap gap-1.5 mt-2">${f.chips().map(c => `<button type="button" class="chip" data-a="chip" data-f="${f.id}" data-v="${esc(c)}">${ic('plus', 13)}${esc(c)}</button>`).join('')}</div>` : ''}${hint}`;
    case 'radio': return `<div>${lab}<div class="grid ${optsOf(f).length > 3 ? 'sm:grid-cols-2' : ''} gap-2 ${err ? 'rounded-[var(--rb)] ring-4 ring-[rgba(217,72,43,0.18)]' : ''}">${optsOf(f).map(([k, l]) => `<button type="button" class="opt ${v === k ? 'on' : ''}" data-a="opt" data-f="${f.id}" data-v="${esc(k)}"><span class="dot"></span>${esc(l)}</button>`).join('')}</div>${hint}</div>`;
    case 'thumbs': return `<div class="thumbs">${ic('thumb', 40, 1.6)}<div class="font-semibold mt-2">Super – alles erledigt.</div></div>`;
    case 'multiday': return `<div>${lab}<div class="flex flex-wrap gap-1.5 mb-2">${(v || []).map((d, i) => `<span class="chip !h-9">${wdOf(d).slice(0, 2)}, ${deDate(d)}<button class="text-ink3 hover:text-ember -mr-1" data-a="day-del" data-f="${f.id}" data-i="${i}" aria-label="Entfernen">${ic('x', 14)}</button></span>`).join('')}</div>
      <div class="flex gap-2"><input type="date" class="inp ${err ? 'inp-req' : ''}" id="day-${f.id}" value="${isoToday()}"><button type="button" class="btn-s shrink-0" data-a="day-add" data-f="${f.id}">${ic('plus', 16)}Tag</button></div><p class="hint">Mehrere Tage nacheinander hinzufügen.</p></div>`;
    case 'items': return `<div>${lab}<div class="space-y-1.5 mb-2">${(v || []).map((x, i) => `<div class="flex items-center gap-2 rounded-[var(--rb)] bg-raised px-3 py-2 text-[14px]"><b class="mono">${esc(x.q)} ${esc(x.u)}</b><span class="flex-1 min-w-0">${esc(x.n)}</span><button class="text-ink3 hover:text-ember" data-a="item-del" data-f="${f.id}" data-i="${i}" aria-label="Entfernen">${ic('trash', 15)}</button></div>`).join('')}</div>
      <div class="grid grid-cols-[1fr_80px_86px] sm:grid-cols-[1fr_90px_96px_auto] gap-2"><input class="inp ${err ? 'inp-req' : ''}" id="it-n-${f.id}" placeholder="${esc(f.ph || 'Bezeichnung')}"><input class="inp" id="it-q-${f.id}" inputmode="decimal" value="1"><select class="inp appearance-none" id="it-u-${f.id}">${['Stk', 'm', 'l', 'kg', 'Set', 'Pkg'].map(u => `<option>${u}</option>`).join('')}</select><button type="button" class="btn-s col-span-3 sm:col-span-1" data-a="item-add" data-f="${f.id}">${ic('plus', 16)}Hinzufügen</button></div></div>`;
    case 'einsaetze': {
      const nd = a.notdienst === 'ja';
      return `<div>${lab}<div class="space-y-3">${(v || []).map((e, i) => { const z = zuschlag(e.datum, nd); return `<div class="rounded-[var(--r)] border ${err && (!e.datum || !e.von || !e.bis) ? 'border-ember' : 'border-line2'} p-3 sm:p-4" data-row="${i}">
        <div class="flex items-center justify-between mb-2"><b class="text-[14px]">Einsatz ${i + 1}</b>${v.length > 1 ? `<button class="btn-g !h-8 !px-2" data-a="ein-del" data-i="${i}">${ic('trash', 15)}</button>` : ''}</div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <label class="col-span-2 sm:col-span-1"><span class="text-[12px] text-ink3">Datum</span><input type="date" class="inp" data-e="${i}" data-k="datum" value="${esc(e.datum || '')}"></label>
          <label><span class="text-[12px] text-ink3">Ankunft</span><input type="time" class="inp" data-e="${i}" data-k="von" value="${esc(e.von || '')}"></label>
          <label><span class="text-[12px] text-ink3">Abfahrt</span><input type="time" class="inp" data-e="${i}" data-k="bis" value="${esc(e.bis || '')}"></label>
          <label class="col-span-2 sm:col-span-1"><span class="text-[12px] text-ink3">Pause (Min.)</span><input class="inp" inputmode="numeric" data-e="${i}" data-k="pause" value="${esc(e.pause || '')}" placeholder="0"></label>
        </div>
        <div class="mt-3 flex flex-wrap items-center gap-2 text-[13px]" id="ein-info-${i}">${einInfo(e, z)}</div></div>`; }).join('')}</div>
        <button type="button" class="btn-s mt-3" data-a="ein-add">${ic('plus', 16)}Weiteren Einsatz</button>
        <div class="kpi mt-4 flex flex-wrap items-center justify-between gap-2"><span class="text-[13px] text-ink3">Gesamtzeit vor Ort</span><b class="text-[20px]" id="ein-total">${hrs(serviceHours(r))}</b></div></div>`;
    }
  }
  return '';
}
function einInfo(e, z) {
  const col = z.total > 100 ? 'bg-tyel text-yel-ink' : 'bg-raised text-ink2';
  return `${e.datum ? `<span class="badge bg-raised text-ink2">${ic('cal', 13)}${wdOf(e.datum)}</span><span class="badge ${col}">${esc(z.typ)}: ${esc(z.label)}${z.nd || z.base !== 100 ? ` = ${z.total} %` : ''}</span>` : ''}<span class="badge bg-raised text-ink2">${ic('clock', 13)}${hrs(durH(e))}</span>`;
}

function sigHTML(r, who) {
  const s = r.sig[who], kunde = who === 'kunde';
  return `<div class="grid sm:grid-cols-2 gap-3"><label class="block"><span class="lbl">Ort</span><input class="inp" data-sig="${who}" data-k="ort" value="${esc(s.ort || '')}" placeholder="Ort"></label><label class="block"><span class="lbl">Datum</span><input class="inp" type="date" data-sig="${who}" data-k="datum" value="${esc(s.datum || '')}"></label></div>
    ${kunde ? `<label class="flex items-center gap-2.5 text-[14px] text-ink2 mt-4"><input type="checkbox" data-a="absent" ${s.absent ? 'checked' : ''}>Kunde nicht anwesend – ohne Unterschrift</label>` : ''}
    <div class="${kunde && s.absent ? 'hidden' : ''} mt-4"><div class="flex items-center justify-between mb-2"><span class="lbl !mb-0">Unterschrift ${kunde ? 'Kunde' : 'Monteur'} <span class="text-ember">*</span></span><button class="btn-g !h-8" data-a="sig-clear" data-w="${who}">${ic('trash', 15)}Löschen</button></div>
    <div class="sig-wrap"><canvas id="sig-cv" data-w="${who}"></canvas><div class="base"></div>${s.data ? '' : '<div class="ph" id="sig-ph">Hier mit Finger oder Stift unterschreiben</div>'}</div></div>`;
}
function photosHTML(r) {
  return `${r.gewerk === 'AC' && r.type === 'abnahme' ? `<div class="rounded-[var(--rb)] bg-tyel text-yel-ink text-[13px] p-3 mb-4">Bitte das Foto vom Stromzähler (Zählernummer + Stand) mit hinzufügen.</div>` : ''}
    <div class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">${r.photos.map((p, i) => `<div class="relative aspect-square rounded-[var(--rb)] overflow-hidden bg-raised"><img src="${p.data}" class="w-full h-full object-cover" alt=""><button class="absolute top-1.5 right-1.5 w-8 h-8 rounded-full bg-black/60 text-white grid place-items-center" data-a="photo-del" data-i="${i}" aria-label="Foto löschen">${ic('x', 15)}</button></div>`).join('')}</div>
    <div class="grid grid-cols-2 gap-2 mt-4"><label class="btn-p cursor-pointer">${ic('camera', 18)}Kamera<input type="file" accept="image/*" capture="environment" class="hidden" data-photo multiple></label><label class="btn-s cursor-pointer">${ic('image', 18)}Galerie<input type="file" accept="image/*" class="hidden" data-photo multiple></label></div>
    <p class="hint">${r.photos.length} Foto${r.photos.length === 1 ? '' : 's'} · Fotos werden verkleinert und mit dem Protokoll gespeichert.</p>`;
}
function summaryHTML(r, ro) {
  const parts = visSteps(r).map((s, si) => {
    const rows = visFields(r, s).filter(f => f.type !== 'thumbs' && filled(r.answers[f.id])).map(f => `<div class="grid sm:grid-cols-[minmax(0,240px)_1fr] gap-x-4 gap-y-0.5 py-2 border-b border-line last:border-0"><span class="text-[13px] text-ink3">${esc(f.label)}</span><span class="text-[14px] whitespace-pre-line">${esc(fmtValue(r, f))}</span></div>`).join('');
    return `<div class="card p-4 sm:p-5"><div class="flex items-center justify-between mb-1"><b class="text-[15px]">${esc(s.title)}</b>${ro ? '' : `<button class="btn-g !h-8" data-a="goto" data-i="${si}">${ic('edit', 14)}Ändern</button>`}</div>${rows || '<div class="text-[13px] text-ink3 py-2">–</div>'}</div>`;
  }).join('');
  const sig = w => { const s = r.sig[w]; return `<div class="card p-4"><div class="text-[13px] text-ink3">Unterschrift ${w === 'kunde' ? 'Kunde' : 'Monteur'}</div>${w === 'kunde' && s.absent ? '<div class="text-[14px] mt-2">Kunde nicht anwesend</div>' : s.data ? `<div class="rounded-lg bg-white mt-2 p-2"><img src="${s.data}" class="h-16" alt=""></div>` : '<div class="text-ember text-[14px] mt-2">fehlt</div>'}<div class="text-[12px] text-ink3 mt-1">${esc(s.ort || '')}${s.ort ? ', ' : ''}${deDate(s.datum)}</div></div>`; };
  const svc = r.type === 'service' ? `<div class="grid grid-cols-2 sm:grid-cols-3 gap-2">${[['Zeit vor Ort', hrs(serviceHours(r))], ['Notdienst', r.answers.notdienst === 'ja' ? 'Ja' : 'Nein'], ['Einsätze', (r.answers.einsaetze || []).length]].map(([k, v]) => `<div class="kpi"><div class="text-[12px] text-ink3">${k}</div><div class="text-[20px] font-semibold mt-1">${v}</div></div>`).join('')}</div>` : '';
  return `<div class="space-y-3">${svc}${parts}
    <div class="card p-4 sm:p-5"><div class="flex items-center justify-between"><b class="text-[15px]">Fotos (${r.photos.length})</b>${ro ? '' : `<button class="btn-g !h-8" data-a="goto-x" data-k="fotos">${ic('edit', 14)}Ändern</button>`}</div>${r.photos.length ? `<div class="grid grid-cols-4 sm:grid-cols-6 gap-1.5 mt-3">${r.photos.map(p => `<img src="${p.data}" class="aspect-square object-cover rounded-lg w-full" alt="">`).join('')}</div>` : ''}</div>
    <div class="grid sm:grid-cols-2 gap-3">${sig('monteur')}${sig('kunde')}</div></div>`;
}
function viewWizard() {
  const r = CUR; if (!r) return viewHome();
  const sc = screens(r), i = Math.min(UI.step, sc.length - 1), [kind, title, step] = sc[i], g = GEWERKE[r.gewerk];
  const bad = UI.bad || [];
  let body = '';
  if (kind === 'step') body = `${step.sub ? `<p class="text-ink3 text-[14px] -mt-1 mb-5">${esc(step.sub)}</p>` : '<div class="mb-4"></div>'}<div class="space-y-5">${visFields(r, step).map(f => fieldHTML(r, f, bad)).join('')}</div>`;
  else if (kind === 'fotos') body = `<p class="text-ink3 text-[14px] -mt-1 mb-5">Fotos von der Baustelle – Kamera oder Galerie.</p>${photosHTML(r)}`;
  else if (kind === 'sig_monteur') body = `<p class="text-ink3 text-[14px] -mt-1 mb-5">Ort, Datum und Unterschrift des Monteurs.</p>${sigHTML(r, 'monteur')}`;
  else if (kind === 'sig_kunde') body = `<p class="text-ink3 text-[14px] -mt-1 mb-5">Der Kunde bestätigt die ${r.type === 'service' ? 'Arbeiten' : 'Abnahme'}.</p>${sigHTML(r, 'kunde')}`;
  else body = `<p class="text-ink3 text-[14px] -mt-1 mb-5">Bitte alles prüfen – dann abschließen und als PDF teilen.</p>${summaryHTML(r)}`;
  const pct = Math.round((i / (sc.length - 1)) * 100), last = kind === 'summary';
  const side = `<aside class="hidden lg:block w-64 shrink-0"><div class="sticky top-24 card p-2 max-h-[calc(100vh-120px)] overflow-y-auto no-scrollbar">${sc.map(([k, t], j) => `<button class="w-full text-left flex items-center gap-2.5 px-3 h-9 rounded-[var(--rb)] text-[13px] ${j === i ? 'bg-raised text-ink font-medium' : j <= UI.maxStep ? 'text-ink2 hover:bg-raised' : 'text-ink3 opacity-60'}" data-a="jump" data-i="${j}" ${j > UI.maxStep ? 'disabled' : ''}><span class="w-5 h-5 rounded-full grid place-items-center text-[10px] shrink-0 ${j < i ? 'bg-p text-white' : j === i ? 'border-2 border-p' : 'border border-line2'}">${j < i ? ic('check', 11, 3) : j + 1}</span><span class="truncate">${esc(t)}</span></button>`).join('')}</div></aside>`;
  return `<div class="pt-5 sm:pt-8">
    <div class="flex items-center gap-3"><button class="btn-g !px-2" data-a="home" aria-label="Zur Startseite">${ic('arrowL', 18)}</button>
      <span class="w-9 h-9 rounded-[var(--rb)] grid place-items-center shrink-0" style="background:${rgba(g.color, 0.14)};color:${g.color}">${ic(TYPES[r.type].icon, 18)}</span>
      <div class="min-w-0 flex-1"><div class="font-semibold text-[15px] truncate">${TYPES[r.type].name} · ${g.name}</div><div class="text-[12px] text-ink3 mono">${esc(r.nr)}</div></div>
      <span class="text-[12px] text-ink3 whitespace-nowrap">Schritt ${i + 1}/${sc.length}</span></div>
    <div class="prog mt-4"><i style="width:${pct}%"></i></div>
    <div class="flex gap-6 mt-6">${side}
      <section class="flex-1 min-w-0 max-w-3xl"><div class="card p-5 sm:p-7 fade-in"><h2 class="h-font text-[30px] sm:text-[34px] leading-tight mb-3">${esc(title)}</h2>${body}</div>
        <div class="fixed lg:static left-0 right-0 bottom-0 z-30 lg:z-auto border-t lg:border-0 border-line lg:mt-4" style="background:color-mix(in srgb,var(--bg) 92%,transparent);padding-bottom:env(safe-area-inset-bottom)">
          <div class="max-w-3xl mx-auto px-4 lg:px-0 py-3 flex gap-2"><button class="btn-s" data-a="back">${ic('arrowL', 16)}Zurück</button>
          ${last ? `<button class="btn-p flex-1" data-a="finish">${ic('check', 17)}Abschließen &amp; PDF</button>` : `<button class="btn-p flex-1" data-a="next">Weiter ${ic('arrowR', 16)}</button>`}</div></div></section></div></div>`;
}

/* ---------- Protokolle ---------- */
function viewList() {
  const q = UI.q.trim().toLowerCase();
  const list = PROTS.slice().sort((a, b) => b.updated - a.updated).filter(p => (!UI.fType || p.type === UI.fType) && (!UI.fGew || p.gewerk === UI.fGew) && (!q || [p.nr, p.answers.kunde, p.answers.adresse, p.answers.monteur].join(' ').toLowerCase().includes(q)));
  const seg = (k, opts) => `<div class="seg flex-wrap">${opts.map(([v, l]) => `<button class="${UI[k] === v ? 'on' : ''}" data-a="filter" data-k="${k}" data-v="${v}">${l}</button>`).join('')}</div>`;
  return `<section class="pt-8 sm:pt-12"><h1 class="h-font text-[38px] sm:text-[48px] leading-none">Protokolle</h1><p class="text-ink3 text-[14px] mt-2">${PROTS.length} gespeichert – auf diesem Gerät.</p>
    <div class="flex flex-col lg:flex-row gap-3 mt-6"><div class="relative flex-1"><span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink3">${ic('search', 17)}</span><input class="inp !pl-11" id="q" placeholder="Kunde, Adresse, Nummer, Monteur …" value="${esc(UI.q)}" autocomplete="off"></div>
      <div class="flex flex-wrap gap-2">${seg('fType', [['', 'Alle'], ['abnahme', 'Abnahme'], ['service', 'Service']])}${seg('fGew', [['', 'Alle Gewerke'], ['DC', 'DC'], ['AC', 'AC'], ['SHK', 'SHK']])}</div></div>
    <div class="space-y-2 mt-5" id="plist">${list.length ? list.map(protRow).join('') : '<div class="card p-8 text-center text-ink3 text-[14px]">Keine Protokolle gefunden.</div>'}</div></section>`;
}
function viewProt() {
  const p = PROTS.find(x => x.id === UI.viewId); if (!p) return viewList();
  const g = GEWERKE[p.gewerk];
  return `<section class="pt-6 sm:pt-10 max-w-3xl"><a href="#/protokolle" class="btn-g -ml-3">${ic('arrowL', 16)}Alle Protokolle</a>
    <div class="flex flex-wrap items-start gap-4 mt-4"><span class="w-12 h-12 rounded-[var(--rb)] grid place-items-center shrink-0" style="background:${rgba(g.color, 0.14)};color:${g.color}">${ic(TYPES[p.type].icon, 22)}</span>
      <div class="flex-1 min-w-[200px]"><h1 class="h-font text-[34px] leading-tight">${esc(p.answers.kunde || 'Ohne Namen')}</h1><div class="text-[13px] text-ink3 mt-1">${TYPES[p.type].name} · ${g.name} · <span class="mono">${esc(p.nr)}</span> · abgeschlossen ${new Date(p.done || p.updated).toLocaleDateString('de-DE')}</div></div></div>
    <div class="flex flex-wrap gap-2 mt-5"><button class="btn-p" data-a="pdf" data-id="${p.id}">${ic('share', 17)}PDF teilen</button><button class="btn-s" data-a="edit" data-id="${p.id}">${ic('edit', 16)}Bearbeiten</button><button class="btn-g hover:!text-ember" data-a="del" data-id="${p.id}">${ic('trash', 16)}Löschen</button></div>
    <div class="mt-6">${summaryHTML(p, true)}</div></section>`;
}

/* ---------- Einstellungen ---------- */
const SET_TABS = [['firma', 'Firma & Logo', 'building'], ['design', 'Design', 'sun'], ['monteure', 'Monteure', 'users'], ['zuschlag', 'Zuschläge', 'clock'], ['listen', 'Auswahllisten', 'list'], ['daten', 'Daten', 'download']];
const LISTS = [['wpWolf', 'Wärmepumpen Wolf (SHK-Abnahme)'], ['wpBuderus', 'Wärmepumpen Buderus (SHK-Abnahme)'], ['systeme', 'Systeme (AC-Abnahme)'], ['grundDC', 'Service-Gründe DC'], ['grundAC', 'Service-Gründe AC'], ['grundSHK', 'Service-Gründe SHK'], ['fixDC', 'Behebung DC'], ['fixAC', 'Behebung AC'], ['fixSHK', 'Behebung SHK']];
const sIn = (path, label, ph = '', type = 'text') => { const v = path.split('.').reduce((o, k) => (o || {})[k], S); return `<label class="block"><span class="lbl">${label}</span><input class="inp" data-s="${path}" type="${type}" value="${esc(v ?? '')}" placeholder="${esc(ph)}" ${type === 'number' ? 'inputmode="decimal"' : ''}></label>`; };
function setBody() {
  switch (UI.tab) {
    case 'firma': return `<div class="grid sm:grid-cols-2 gap-4">${sIn('company.name', 'Firmenname')}${sIn('company.phone', 'Telefon')}${sIn('company.street', 'Straße')}${sIn('company.city', 'PLZ und Ort')}${sIn('company.email', 'E-Mail')}${sIn('company.web', 'Website')}</div>
      <div class="mt-6"><span class="lbl">Logo (App und PDF)</span><div class="flex flex-wrap items-center gap-3">${S.company.logo ? `<span class="rounded-[var(--rb)] bg-white p-3 border border-line"><img src="${esc(S.company.logo)}" class="h-14" alt=""></span>` : '<span class="text-ink3 text-[14px]">Kein Logo</span>'}
        <label class="btn-s cursor-pointer">${ic('upload', 16)}Logo wählen<input type="file" accept="image/*" class="hidden" data-logo></label>${S.company.logo !== 'logo.png' ? '<button class="btn-g" data-a="logo-reset">Standard-Logo</button>' : ''}${S.company.logo ? '<button class="btn-g" data-a="logo-none">Ohne Logo</button>' : ''}</div></div>`;
    case 'design': return `<div><span class="lbl">Ansicht</span><div class="seg">${[['system', 'Wie Gerät'], ['light', 'Hell'], ['dark', 'Dunkel']].map(([k, l]) => `<button class="${S.design.mode === k ? 'on' : ''}" data-a="mode" data-v="${k}">${l}</button>`).join('')}</div></div>
      <div class="grid grid-cols-2 gap-4 mt-6">${[['primary', 'Hauptfarbe'], ['secondary', 'Akzentfarbe']].map(([k, l]) => `<label class="block"><span class="lbl">${l}</span><div class="flex items-center gap-2"><input type="color" class="w-12 h-11 rounded-[var(--rb)] border border-line2 bg-field p-1" data-s="design.${k}" value="${esc(S.design[k])}"><span class="mono text-[13px] text-ink3">${esc(S.design[k])}</span></div></label>`).join('')}</div>
      <label class="block mt-6"><span class="lbl">Ecken-Rundung: ${S.design.radius} px</span><input type="range" min="4" max="24" step="1" class="w-full" data-s="design.radius" value="${S.design.radius}"></label>
      <div class="grid grid-cols-2 gap-4 mt-6">${[['fontHead', 'Schrift Überschriften', ['Instrument Serif', 'DM Serif Display', 'Fraunces', 'Geist', 'Inter']], ['fontBody', 'Schrift Text', ['Geist', 'Inter', 'DM Sans', 'Figtree', 'IBM Plex Sans', 'Instrument Sans']]].map(([k, l, fs]) => `<label class="block"><span class="lbl">${l}</span><select class="inp" data-s="design.${k}">${fs.map(f => `<option ${S.design[k] === f ? 'selected' : ''}>${f}</option>`).join('')}</select></label>`).join('')}</div>
      <button class="btn-g mt-6" data-a="design-reset">${ic('refresh', 15)}Design zurücksetzen</button>`;
    case 'monteure': return `<p class="text-ink3 text-[14px] mb-4">Monteure erscheinen als Vorschlag im Feld „Monteur“. Ist nur einer eingetragen, wird er automatisch eingesetzt.</p>
      <div class="space-y-1.5">${S.monteure.map((m, i) => `<div class="flex items-center gap-2 rounded-[var(--rb)] bg-raised px-3 h-11"><span class="text-ink3">${ic('users', 16)}</span><span class="flex-1">${esc(m)}</span><button class="text-ink3 hover:text-ember" data-a="mont-del" data-i="${i}">${ic('trash', 15)}</button></div>`).join('') || '<div class="text-ink3 text-[14px]">Noch keine Monteure.</div>'}</div>
      <div class="flex gap-2 mt-3"><input class="inp" id="mont-new" placeholder="Name"><button class="btn-s shrink-0" data-a="mont-add">${ic('plus', 16)}Hinzufügen</button></div>`;
    case 'zuschlag': {
      const ex = [['Werktag', '2026-11-10'], ['Samstag', '2026-11-14'], ['Sonntag', '2026-11-15']];
      return `<p class="text-ink3 text-[14px] mb-4">Die App erfasst Stunden und Zuschlag in Prozent – abgerechnet wird im Büro. Sonntag und Feiertage werden am Datum automatisch erkannt.</p>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">${sIn('zuschlag.sat', 'Samstag %', '', 'number')}${sIn('zuschlag.sun', 'Sonntag %', '', 'number')}${sIn('zuschlag.hol', 'Feiertag %', '', 'number')}${sIn('zuschlag.not', 'Notdienst + %', '', 'number')}</div>
      <label class="block mt-5"><span class="lbl">Bundesland (für Feiertage)</span><select class="inp" data-s="state">${STATES.map(([k, l]) => `<option value="${k}" ${S.state === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <div class="kpi mt-5 text-[14px] space-y-1.5"><div class="text-[12px] text-ink3 mb-1">Beispiele</div>${ex.map(([l, d]) => `<div class="flex justify-between gap-3"><span>${l}</span><span>${zuschlag(d, false).total} % · im Notdienst <b>${zuschlag(d, true).total} %</b></span></div>`).join('')}</div>`;
    }
    case 'listen': return `<p class="text-ink3 text-[14px] mb-4">Je Zeile ein Eintrag. Diese Listen erscheinen als Auswahl bzw. als Schnell-Knöpfe in den Protokollen.</p>
      <div class="grid md:grid-cols-2 gap-4">${LISTS.map(([k, l]) => `<label class="block"><span class="lbl">${l}</span><textarea class="inp" rows="5" data-list="${k}">${esc(S.lists[k].join('\n'))}</textarea></label>`).join('')}</div>
      <button class="btn-g mt-4" data-a="lists-reset">${ic('refresh', 15)}Listen zurücksetzen</button>`;
    case 'daten': return `<p class="text-ink3 text-[14px] mb-4">Alle Daten liegen nur auf diesem Gerät. Bitte regelmäßig eine Sicherung speichern – damit lassen sich Protokolle auch auf ein anderes Gerät übertragen.</p>
      <div class="flex flex-wrap gap-2"><button class="btn-p" data-a="backup">${ic('download', 16)}Sicherung speichern</button><label class="btn-s cursor-pointer">${ic('upload', 16)}Sicherung einspielen<input type="file" accept="application/json,.json" class="hidden" data-restore></label></div>
      <div class="kpi mt-5 text-[14px]">${PROTS.length} Protokolle gespeichert${CUR ? ' · 1 Entwurf' : ''}</div>
      <p class="hint mt-6">Version ${APP_VERSION}</p>`;
  }
  return '';
}
function viewSettings() {
  return `<section class="pt-8 sm:pt-12"><h1 class="h-font text-[38px] sm:text-[48px] leading-none">Einstellungen</h1>
    <div class="flex flex-col md:flex-row gap-5 mt-6"><nav class="flex md:flex-col gap-1 overflow-x-auto no-scrollbar md:w-56 shrink-0">${SET_TABS.map(([k, l, i]) => `<a href="#/einstellungen/${k}" class="navl ${UI.tab === k ? 'on' : ''} md:w-full">${ic(i, 16)}${l}</a>`).join('')}</nav>
    <div class="card p-5 sm:p-7 flex-1 min-w-0"><h2 class="sec-t mb-5">${SET_TABS.find(t => t[0] === UI.tab)[1]}</h2>${setBody()}</div></div></section>`;
}

/* ---------- Rendern und Navigation ---------- */
function render() {
  const inner = UI.route === 'wizard' ? viewWizard() : UI.route === 'list' ? viewList() : UI.route === 'view' ? viewProt() : UI.route === 'settings' ? viewSettings() : viewHome();
  $('#app').innerHTML = shell(inner);
  if (UI.route === 'wizard') initSig();
}
function route() {
  const h = location.hash.replace(/^#\/?/, '').split('/');
  if (h[0] === 'protokolle') UI.route = 'list';
  else if (h[0] === 'p' && h[1]) { UI.route = 'view'; UI.viewId = h[1]; }
  else if (h[0] === 'einstellungen') { UI.route = 'settings'; UI.tab = SET_TABS.some(t => t[0] === h[1]) ? h[1] : 'firma'; }
  else if (h[0] === 'protokoll' && CUR) UI.route = 'wizard';
  else UI.route = 'home';
  render(); window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
const go = h => { if (location.hash === h) route(); else location.hash = h; };
function setStep(i) {
  const n = screens(CUR).length; UI.step = Math.max(0, Math.min(n - 1, i)); UI.maxStep = Math.max(UI.maxStep, UI.step); UI.bad = []; CUR.step = UI.step; CUR.maxStep = UI.maxStep; saveDraft();
  render(); window.scrollTo(0, 0);
}
function startRecord(r) { CUR = r; UI.step = r.step || 0; UI.maxStep = r.maxStep || 0; UI.bad = []; saveDraft(true); go('#/protokoll'); }
