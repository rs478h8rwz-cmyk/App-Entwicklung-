'use strict';
/* lumbra.desk – Angebots-Assistent (4.2): Schritt für Schritt statt Spracheingabe.
   PV oder WP wählen → je Schritt antippen → Menge → automatisch Anhänge (z. B. Unterkonstruktion je Modul),
   Gratis-Menge (z. B. erste Gerüstseite), Pauschalen. Alles einstellbar unter Mehr → Angebots-Assistent. */
const WZ_T = { pv: 'Photovoltaik', wp: 'Wärmepumpe', pvwp: 'PV + Wärmepumpe' };
const wzCfg = () => (OF.cat && OF.cat.wizard) || { pv: { steps: [] }, wp: { steps: [] }, systems: [] };
const wzItem = id => OF.cat.items.find(i => i.id === id);
/* Schritte der gewählten Angebotsart (PV + WP: erst PV, dann WP) */
const wzSteps = ot => (ot === 'pvwp' ? ['pv', 'wp'] : [ot]).flatMap(t => (wzCfg()[t] || { steps: [] }).steps.map(s => ({ ...s, key: t + ':' + s.id }))).filter(s => s.type !== 'auto');
const wzAll = ot => (ot === 'pvwp' ? ['pv', 'wp'] : [ot]).flatMap(t => (wzCfg()[t] || { steps: [] }).steps.map(s => ({ ...s, key: t + ':' + s.id, t })));
function wzOptions(s) {   // feste Positionen + alle Produkte der gewählten Kategorien
  const fixed = (s.items || []).map(wzItem).filter(Boolean), ids = new Set(fixed.map(i => i.id));
  return fixed.concat(OF.cat.items.filter(it => (s.cats || []).includes(it.cat) && it.kind === 'produkt' && !ids.has(it.id)));
}
/* System: Wechselrichter/Speicher – eigene Liste oder automatisch alle Produkte mit diesem Hersteller */
function wzSys(sys, cat) {
  const own = (sys[cat] || []).map(wzItem).filter(Boolean); if (own.length) return own;
  const n = sys.name.toLowerCase().replace(/[^a-z0-9äöü]/g, '');
  return OF.cat.items.filter(i => i.kind === 'produkt' && i.cat === cat && ((i.maker || '') + ' ' + i.name).toLowerCase().replace(/[^a-z0-9äöü ]/g, '').replace(/ /g, '').includes(n));
}
function wzStart(hint) { OF.wz = { ot: '', i: -1, sel: {}, sys: {}, hint: hint || '' }; }

/* ---------- Anzeige ---------- */
function ofWizHTML() {
  const W = OF.wz, d = OF.edit.data;
  if (!W) return `<div class="cardx wzbar"><div><b>Angebots-Assistent</b><span class="muted small">Schritt für Schritt: Module, Gerüst, System, Zusätze …</span></div><button class="btn sm s" data-wz="restart">${d.pos.length ? 'Neu aufbauen' : 'Starten'}</button></div>`;
  if (W.i < 0 || !W.ot) return `<div class="cardx wz"><div class="wzh"><b>Was wird angeboten?</b><span class="muted small">Danach geht es Schritt für Schritt durch die Positionen.</span></div>
    <div class="wzgrid">${Object.entries(WZ_T).map(([k, l]) => `<button class="wzopt big ${W.hint === k ? 'on' : ''}" data-wz="type" data-v="${k}"><b>${l}</b><span>${wzSteps(k).length} Schritte</span></button>`).join('')}</div>
    <div class="wzfoot"><button class="btn g sm" data-wz="close">Ohne Assistent</button></div></div>`;
  const S = wzSteps(W.ot), s = S[W.i]; if (!s) return '';
  const head = `<div class="wzprog"><i style="width:${Math.round((W.i + 1) / S.length * 100)}%"></i></div><div class="wzh"><span class="muted small">Schritt ${W.i + 1} von ${S.length} · ${WZ_T[W.ot]}</span><b>${esc(s.title)}</b></div>`;
  const sel = W.sel[s.key] || [], qtyOf = id => (sel.find(x => x.item === id) || {}).qty;
  const tile = (it, act, extra = '') => `<button class="wzopt ${act ? 'on' : ''}" data-wz="pick" data-v="${esc(it.id)}" ${extra}>${it.img ? `<img src="api/?r=cfg-file&id=${esc(it.img)}" alt="">` : ''}<b>${esc(it.name)}</b><span>${[it.maker, it.power ? numDe(it.power) + ' ' + ({ mod: 'Wp', bat: 'kWh', inv: 'kW', wp: 'kW' }[it.cat] || '') : '', eur2(it.pm === 'brutto' ? it.price * (1 + it.tax / 100) : it.price) + ' / ' + it.unit].filter(Boolean).map(esc).join(' · ')}</span>${act && qtyOf(it.id) ? `<em>${numDe(qtyOf(it.id))} ${esc(it.unit)}</em>` : ''}</button>`;
  let body = '';
  if (s.type === 'system') {
    const Y = W.sys[s.key] || {}, sys = wzCfg().systems || [], cur = sys.find(x => x.id === Y.sys);
    if (!cur) body = `<div class="muted small wzq">Welches System?</div><div class="wzgrid">${sys.map(x => `<button class="wzopt big" data-wz="sys" data-v="${esc(x.id)}"><b>${esc(x.name)}</b><span>${wzSys(x, 'inv').length} Wechselrichter · ${wzSys(x, 'bat').length} Speicher</span></button>`).join('') || '<p class="muted">Noch keine Systeme – unter Mehr → Angebots-Assistent anlegen.</p>'}</div>`;
    else {
      const part = !Y.inv ? 'inv' : Y.bat === undefined ? 'bat' : null, list = part ? wzSys(cur, part) : [];
      body = `<div class="wzchips"><button class="chip on" data-wz="sysreset">${esc(cur.name)} ✕</button>${Y.inv ? `<button class="chip on" data-wz="sysinv">${esc((wzItem(Y.inv.item) || {}).name || '')} ✕</button>` : ''}</div>`
        + (part ? `<div class="muted small wzq">${part === 'inv' ? 'Wechselrichter-Größe' : 'Speichergröße'}</div><div class="wzgrid">${list.map(it => tile(it, false, `data-part="${part}"`)).join('')}${part === 'bat' ? '<button class="wzopt" data-wz="nobat"><b>Ohne Speicher</b><span>nur Wechselrichter</span></button>' : ''}${!list.length ? `<p class="muted small">Keine ${part === 'inv' ? 'Wechselrichter' : 'Speicher'} von ${esc(cur.name)} in der Produktdatenbank – unter Mehr → Produkte mit Hersteller „${esc(cur.name)}“ anlegen.</p>` : ''}</div>`
          : `<p class="muted">Fertig: ${esc(cur.name)} · ${esc((wzItem(Y.inv.item) || {}).name || '')}${Y.bat ? ' · ' + esc((wzItem(Y.bat.item) || {}).name || '') + (Y.bat.qty > 1 ? ' × ' + numDe(Y.bat.qty) : '') : ' · ohne Speicher'}</p>`);
    }
  } else {
    const opts = wzOptions(s);
    body = `${s.type === 'multi' ? '<div class="muted small wzq">Mehrere möglich – antippen zum Auswählen</div>' : ''}<div class="wzgrid">${opts.map(it => tile(it, sel.some(x => x.item === it.id))).join('') || '<p class="muted">Keine Positionen für diesen Schritt – unter Mehr → Angebots-Assistent einstellen.</p>'}</div>`;
  }
  const done = s.type === 'system' ? !!((W.sys[s.key] || {}).inv && (W.sys[s.key] || {}).bat !== undefined) : sel.length > 0;
  return `<div class="cardx wz">${head}${body}
    <div class="wzfoot"><button class="btn g sm" data-wz="back">${ic('back', 16)}Zurück</button><span style="flex:1"></span>${!done && (s.optional || s.type === 'multi') ? '<button class="btn g sm" data-wz="next">Überspringen</button>' : ''}${done || s.type === 'multi' ? `<button class="btn sm" data-wz="next">${W.i === S.length - 1 ? 'Fertig' : 'Weiter'}</button>` : ''}</div></div>
    ${OF.wzQty ? wzQtyHTML() : ''}`;
}
function wzQtyHTML() {
  const Q = OF.wzQty, it = wzItem(Q.item);
  return `<div class="wzsheet" data-wz="qclose"><div class="wzbox" data-stop="1"><b>${esc(it ? it.name : '')}</b><span class="muted small">Menge in ${esc(it ? it.unit : 'Stk')}</span>
    <div class="qty big"><button data-wz="qstep" data-v="-1">${ic('minus', 20)}</button><input id="wz-q" inputmode="decimal" value="${numDe(Q.qty)}"><button data-wz="qstep" data-v="1">${ic('plus', 20)}</button></div>
    ${(Q.quick || []).length ? `<div class="wzchips">${Q.quick.map(n => `<button class="chip" data-wz="qset" data-v="${n}">${numDe(n)}</button>`).join('')}</div>` : ''}
    <div class="row" style="gap:8px;margin-top:14px">${Q.remove ? '<button class="btn g danger" data-wz="qdel">Entfernen</button>' : ''}<span style="flex:1"></span><button class="btn g" data-wz="qclose">Abbrechen</button><button class="btn" data-wz="qok">OK</button></div></div></div>`;
}

/* ---------- Positionen aus den Antworten bauen ---------- */
function wzBuild(W) {
  const out = [], pend = {}, add = (arr, it, q, extra = {}) => { if (it && q) arr.push({ ...ofPos(it, q), ...extra }); };
  for (const s of wzAll(W.ot)) {
    const blk = [], sel = W.sel[s.key] || [];
    if (s.type === 'auto') (s.items || []).forEach(id => add(blk, wzItem(id), 1));
    if (s.type === 'one' || s.type === 'multi') for (const x of sel) {
      const it = wzItem(x.item); add(blk, it, x.qty);
      if (s.free && s.free.item === x.item && it) { const n = Math.min(s.free.n, x.qty); blk.push({ ...ofPos(it, n), name: s.free.text || `Rabatt: ${it.name}`, descr: '100 % Rabatt', price: -it.price, rab: true, pausch: false, unit: it.unit, qty: n }); }
    }
    if (s.type === 'system') { const Y = W.sys[s.key] || {}; if (Y.inv) add(blk, wzItem(Y.inv.item), Y.inv.qty || 1); if (Y.bat) add(blk, wzItem(Y.bat.item), Y.bat.qty || 1); }
    const total = sel.reduce((a, x) => a + x.qty, 0);
    if (total || s.type === 'auto') for (const l of s.links || []) { const q = l.qty === 'same' ? total : +l.qty; if (!q) continue; const tgt = l.place && l.place !== 'after' ? s.key.split(':')[0] + ':' + l.place : null; if (tgt && tgt !== s.key) (pend[tgt] = pend[tgt] || []).push([wzItem(l.item), q]); else add(blk, wzItem(l.item), q); }
    for (const [it, q] of pend[s.key] || []) add(blk, it, q); delete pend[s.key];
    out.push(...blk);
  }
  for (const k in pend) for (const [it, q] of pend[k]) add(out, it, q);   // Ziel-Schritt fehlt: ans Ende
  return out;
}
function wzFinish() {
  const W = OF.wz, d = OF.edit.data, pos = wzBuild(W);
  d.otype = W.ot; for (const k of ['intro', 'outro', 'pay']) if (!d[k] || ['pv', 'wp', 'pvwp'].some(t => d[k] === ofTxDef(k, t))) d[k] = ofTxDef(k, W.ot);
  if (/^Angebot (Photovoltaik|Wärmepumpe|PV \+ Wärmepumpe)$/.test(OF.edit.title) || !OF.edit.title) OF.edit.title = 'Angebot ' + WZ_T[W.ot];
  d.pos = ofApplyPackages(pos); d.wz = { ot: W.ot, sel: W.sel, sys: W.sys }; OF.wz = null;
  toast(`${d.pos.length} Positionen erstellt – Mengen, Preise und Texte unten anpassen.`, 'ok', 4500); ofRender();
}

/* ---------- Bedienung ---------- */
function wzAsk(item, qty, quick, remove, cb) { OF.wzQty = { item, qty, quick, remove, cb }; ofRender(); setTimeout(() => { const q = $('#wz-q'); if (q) { q.focus(); q.select(); } }, 60); }
document.addEventListener('click', e => {
  const a = e.target.closest('[data-wz]'); if (!a || !OF.edit) return;
  if (a.dataset.wz === 'qclose' && e.target.closest('[data-stop]') && !e.target.closest('button')) return;   // Klick in die Box schließt nicht
  e.preventDefault(); const W = OF.wz, k = a.dataset.wz, v = a.dataset.v;
  if (k === 'restart') { if (OF.edit.data.pos.length && !confirm('Positionen mit dem Assistenten neu aufbauen? Die jetzigen Positionen werden ersetzt.')) return; const old = OF.edit.data.wz; wzStart(''); if (old) { OF.wz.ot = old.ot; OF.wz.i = 0; OF.wz.sel = old.sel || {}; OF.wz.sys = old.sys || {}; } return ofRender(); }
  if (k === 'close') { OF.wz = null; return ofRender(); }
  if (!W) return;
  const S = wzSteps(W.ot), s = S[W.i];
  if (k === 'type') { W.ot = v; W.i = 0; return ofRender(); }
  if (k === 'back') { if (W.i <= 0) { W.i = -1; W.ot = ''; } else W.i--; return ofRender(); }
  if (k === 'next') { if (W.i >= S.length - 1) return wzFinish(); W.i++; ofRender(); const z = $('.wz'); if (z) z.scrollIntoView({ block: 'start', behavior: 'smooth' }); return; }
  if (k === 'pick' && s) {
    const it = wzItem(v); if (!it) return; const part = a.dataset.part;
    if (s.type === 'system') { const Y = W.sys[s.key] = W.sys[s.key] || {};
      if (part === 'inv') { Y.inv = { item: v, qty: 1 }; return ofRender(); }
      return s.askQty ? wzAsk(v, 1, s.quick, false, q => { Y.bat = { item: v, qty: q }; }) : (Y.bat = { item: v, qty: 1 }, ofRender()); }
    const sel = W.sel[s.key] = W.sel[s.key] || [], ex = sel.find(x => x.item === v);
    const set = q => { if (s.type === 'one') W.sel[s.key] = [{ item: v, qty: q }]; else if (ex) ex.qty = q; else sel.push({ item: v, qty: q }); };
    if (!s.askQty || it.pausch) { if (s.type === 'multi' && ex) W.sel[s.key] = sel.filter(x => x !== ex); else set(1); if (s.type === 'one') { if (W.i === S.length - 1) return wzFinish(); W.i++; } return ofRender(); }
    return wzAsk(v, ex ? ex.qty : (s.quick || [])[0] || 1, s.quick, !!ex, q => { set(q); if (s.type === 'one' && W.i < S.length - 1) W.i++; });
  }
  if (k === 'sys') { W.sys[s.key] = { sys: v }; return ofRender(); }
  if (k === 'sysreset') { W.sys[s.key] = {}; return ofRender(); }
  if (k === 'sysinv') { const Y = W.sys[s.key]; delete Y.inv; delete Y.bat; return ofRender(); }
  if (k === 'nobat') { W.sys[s.key].bat = null; return ofRender(); }
  const Q = OF.wzQty; if (!Q) return;
  const qi = $('#wz-q'), cur = parseNum(qi ? qi.value : Q.qty);
  if (k === 'qstep') { if (qi) qi.value = numDe(Math.max(0, cur + +v)); return; }
  if (k === 'qset') { if (qi) qi.value = numDe(+v); return; }
  if (k === 'qclose') { OF.wzQty = null; return ofRender(); }
  if (k === 'qdel') { W.sel[s.key] = (W.sel[s.key] || []).filter(x => x.item !== Q.item); OF.wzQty = null; return ofRender(); }
  if (k === 'qok') { if (!(cur > 0)) return toast('Bitte eine Menge größer 0 eingeben.'); OF.wzQty = null; Q.cb(cur); return ofRender(); }
});
document.addEventListener('keydown', e => { if (OF.wzQty && e.key === 'Enter') { const b = $('[data-wz="qok"]'); if (b) { e.preventDefault(); b.click(); } } });
/* Neues Angebot: Assistent startet automatisch */
const _offLoadWz = offLoad;
offLoad = async function (view) {
  const wasNew = location.hash.includes('/angebot/neu/') && !(OF.edit && !OF.edit.id && OF.edit.project === location.hash.split('/').pop());
  await _offLoadWz(view);
  if (view === 'angebot' && wasNew && OF.edit && !OF.edit.id) { const t = (ST.cd && ST.cd.customer.type) || ''; wzStart(WZ_T[t] ? t : ''); OF.wzQty = null; }
};
/* Während des Assistenten nur Kopf + Assistent zeigen (keine Positionsliste, keine untere Leiste) */
const _viewAngebotWz = viewAngebot;
viewAngebot = function () {
  const h = _viewAngebotWz(); if (!OF.wz) return h;
  const i = h.indexOf('<div class="ofmode">'); return i > 0 ? h.slice(0, i) : h;
};

/* ---------- Einstellungen: Mehr → Angebots-Assistent ---------- */
const AS = { tab: 'pv', cfg: null, ed: null };
const AS_TYPES = { one: 'Eine Auswahl', multi: 'Mehrere', system: 'System', auto: 'Automatisch' };
function asOpts(sel, blank) {
  const g = k => OF.cat.items.filter(i => (i.kind || 'leistung') === k).map(i => `<option value="${esc(i.id)}" ${sel === i.id ? 'selected' : ''}>${esc(i.name)}</option>`).join('');
  return `<option value="">${blank || '– wählen –'}</option><optgroup label="Leistungen">${g('leistung')}</optgroup><optgroup label="Produkte">${g('produkt')}</optgroup>`;
}
function viewAssistent() {
  if (!OF.cat) return ''; if (!AS.cfg) AS.cfg = JSON.parse(JSON.stringify(wzCfg()));
  const C = AS.cfg, tabs = [['pv', 'Photovoltaik'], ['wp', 'Wärmepumpe'], ['sys', 'Systeme']];
  let body = '';
  if (AS.tab === 'sys') body = `${C.systems.map((x, i) => `<div class="cardx asx"><div class="pkline" style="grid-template-columns:minmax(0,1fr) 32px"><input data-as="sysname" data-i="${i}" value="${esc(x.name)}" placeholder="z. B. EcoFlow"><button class="xbtn" data-asb="sysdel" data-v="${i}" aria-label="System löschen">${ic('x', 14)}</button></div>
      ${['inv', 'bat'].map(c => { const own = (x[c] || []), auto = wzSys({ name: x.name, [c]: [] }, c); return `<div class="muted small" style="margin-top:8px">${c === 'inv' ? 'Wechselrichter' : 'Speicher'}: ${own.length ? 'eigene Auswahl' : `automatisch alle Produkte mit Hersteller „${esc(x.name)}“ (${auto.length})`}</div>
        <div class="chips2">${own.map(id => `<span class="chip on">${esc((wzItem(id) || {}).name || id)}<button type="button" data-asb="sysrm" data-i="${i}" data-c="${c}" data-v="${esc(id)}" aria-label="entfernen">×</button></span>`).join('')}<select class="txsel" data-as="sysadd" data-i="${i}" data-c="${c}">${asOpts('', '+ ' + (c === 'inv' ? 'Wechselrichter' : 'Speicher') + ' festlegen')}</select></div>`; }).join('')}</div>`).join('')}
    <button class="btn sm s" data-asb="sysnew">${ic('plus', 14)}System</button>`;
  else {
    const S = C[AS.tab].steps;
    body = S.map((s, i) => `<div class="cardx asx"><div class="asrow"><span class="ofn">${i + 1}</span><div class="gmain"><b>${esc(s.title)}</b><span>${AS_TYPES[s.type]}${s.type === 'system' ? '' : ' · ' + ((s.items || []).length + ((s.cats || []).length ? ' + alle ' + s.cats.map(k => OF.cat.cats[k]).join(', ') : '')) + ' Positionen'}${s.askQty ? ' · Menge abfragen' : ''}${(s.links || []).length ? ' · ' + s.links.length + ' Anhänge' : ''}${s.free ? ' · Gratis-Menge' : ''}</span></div>
        <button class="xbtn" data-asb="up" data-v="${i}" aria-label="nach oben">↑</button><button class="xbtn" data-asb="down" data-v="${i}" aria-label="nach unten">↓</button><button class="btn sm g" data-asb="edit" data-v="${i}">${AS.ed === i ? 'Zu' : 'Bearbeiten'}</button></div>${AS.ed === i ? asForm(s, i, S) : ''}</div>`).join('')
      + `<button class="btn sm s" data-asb="new">${ic('plus', 14)}Schritt</button>`;
  }
  return `<section class="hero"><h1>Angebots-Assistent</h1><p class="muted">Welche Fragen der Assistent stellt, in welcher Reihenfolge – und was automatisch dazukommt.</p></section>
    <div class="seg" style="margin-bottom:12px;flex-wrap:wrap;max-width:100%">${tabs.map(([k, l]) => `<button class="${AS.tab === k ? 'on' : ''}" data-asb="tab" data-v="${k}">${l}</button>`).join('')}</div>
    ${body}
    <div class="ofbar"><button class="btn" data-asb="save">${ic('check', 18)}Speichern</button><button class="btn g" data-asb="reset">Verwerfen</button></div>
    <p class="muted small" style="margin:8px 4px 0">Neue Positionen (z. B. „Zählerschrank erneuern“) legst du unter Mehr → Leistungen &amp; Pakete an, Produkte unter Mehr → Produkte – danach hier auswählen.</p>`;
}
function asForm(s, i, S) {
  const items = s.items || [], places = S.filter(x => x.id !== s.id).map(x => [x.id, x.title]);
  return `<div class="asf">
    <label>Titel<input data-as="title" data-i="${i}" value="${esc(s.title)}"></label>
    <div class="pkrow"><span class="lbl2">Art</span><div class="seg">${Object.entries(AS_TYPES).map(([k, l]) => `<button type="button" data-asb="type" data-i="${i}" data-v="${k}" class="${s.type === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
    ${s.type === 'system' ? '<p class="muted small">Fragt System → Wechselrichter → Speicher. Systeme pflegst du im Reiter „Systeme“.</p>' : `
    <div class="muted small">${s.type === 'auto' ? 'Diese Positionen kommen immer dazu (Menge 1):' : 'Zur Auswahl stehen:'}</div>
    <div class="chips2">${items.map(id => `<span class="chip on">${esc((wzItem(id) || {}).name || id)}<button type="button" data-asb="itemrm" data-i="${i}" data-v="${esc(id)}" aria-label="entfernen">×</button></span>`).join('')}<select class="txsel" data-as="itemadd" data-i="${i}">${asOpts('', '+ Position')}</select></div>
    ${s.type === 'auto' ? '' : `<div class="muted small" style="margin-top:6px">… und automatisch alle Produkte dieser Arten:</div><div class="chips2">${Object.entries(OF.cat.cats).filter(([k]) => ['mod', 'inv', 'bat', 'wb', 'wp', 'sonst'].includes(k)).map(([k, l]) => `<button type="button" class="chip ${(s.cats || []).includes(k) ? 'on' : ''}" data-asb="cat" data-i="${i}" data-v="${k}">${l}</button>`).join('')}</div>`}`}
    ${s.type === 'auto' ? '' : `<label class="sw"><input type="checkbox" data-as="askQty" data-i="${i}" ${s.askQty ? 'checked' : ''}>Nach der Menge fragen</label>
    ${s.askQty ? `<label>Schnellwahl-Mengen<input data-as="quick" data-i="${i}" value="${esc((s.quick || []).join(', '))}" placeholder="z. B. 10, 16, 20"></label>` : ''}
    <label class="sw"><input type="checkbox" data-as="optional" data-i="${i}" ${s.optional ? 'checked' : ''}>Darf übersprungen werden</label>`}
    ${s.type === 'one' || s.type === 'multi' ? `<div class="muted small" style="margin-top:6px">Gratis (100 % Rabatt) – die ersten … Einheiten von:</div>
      <div class="pkline" style="grid-template-columns:minmax(0,1fr) 64px"><select data-as="freeitem" data-i="${i}">${asOpts(s.free ? s.free.item : '', 'kein Gratis-Anteil')}</select><input data-as="freen" data-i="${i}" inputmode="decimal" value="${s.free ? numDe(s.free.n) : '1'}"></div>
      ${s.free ? `<label>Text der Rabattzeile<input data-as="freetext" data-i="${i}" value="${esc(s.free.text || '')}"></label>` : ''}` : ''}
    <div class="muted small" style="margin-top:6px">Anhängen – kommt automatisch mit (z. B. Unterkonstruktion je Modul):</div>
    ${(s.links || []).map((l, j) => `<div class="pkline aslink"><select data-as="litem" data-i="${i}" data-j="${j}">${asOpts(l.item)}</select><select data-as="lqty" data-i="${i}" data-j="${j}"><option value="same" ${l.qty === 'same' ? 'selected' : ''}>gleiche Anzahl</option>${[1, 2, 3, 4].map(n => `<option value="${n}" ${l.qty === n ? 'selected' : ''}>${n}× fest</option>`).join('')}</select><select data-as="lplace" data-i="${i}" data-j="${j}"><option value="after" ${l.place === 'after' ? 'selected' : ''}>direkt darunter</option>${places.map(([k, t]) => `<option value="${esc(k)}" ${l.place === k ? 'selected' : ''}>bei „${esc(t)}“</option>`).join('')}</select><button type="button" class="xbtn" data-asb="ldel" data-i="${i}" data-v="${j}" aria-label="Anhang entfernen">${ic('x', 14)}</button></div>`).join('')}
    <div class="row" style="gap:8px;flex-wrap:wrap"><button type="button" class="btn sm s" data-asb="ladd" data-i="${i}">${ic('plus', 14)}Anhang</button><span style="flex:1"></span><button type="button" class="btn sm g danger" data-asb="del" data-v="${i}">Schritt löschen</button></div></div>`;
}
const asRender = () => { const y = scrollY; $('#app main').innerHTML = viewAssistent(); scrollTo(0, y); };
document.addEventListener('click', async e => {
  const a = e.target.closest('[data-asb]'); if (!a || !AS.cfg) return; e.preventDefault();
  const k = a.dataset.asb, v = a.dataset.v, C = AS.cfg, S = AS.tab === 'sys' ? null : C[AS.tab].steps, i = +a.dataset.i, s = S && S[i];
  try {
    if (k === 'tab') { AS.tab = v; AS.ed = null; }
    if (k === 'edit') AS.ed = AS.ed === +v ? null : +v;
    if (k === 'up' && +v > 0) { [S[+v - 1], S[+v]] = [S[+v], S[+v - 1]]; AS.ed = null; }
    if (k === 'down' && +v < S.length - 1) { [S[+v + 1], S[+v]] = [S[+v], S[+v + 1]]; AS.ed = null; }
    if (k === 'new') { S.push({ id: 's' + Date.now().toString(36), title: 'Neuer Schritt', type: 'multi', items: [], cats: [], askQty: true, quick: [1], optional: true, links: [] }); AS.ed = S.length - 1; }
    if (k === 'del') { if (!confirm('Schritt löschen?')) return; S.splice(+v, 1); AS.ed = null; }
    if (k === 'type') s.type = v;
    if (k === 'cat') s.cats = (s.cats || []).includes(v) ? s.cats.filter(x => x !== v) : (s.cats || []).concat(v);
    if (k === 'itemrm') s.items = s.items.filter(x => x !== v);
    if (k === 'ladd') (s.links = s.links || []).push({ item: '', qty: 'same', place: 'after' });
    if (k === 'ldel') s.links.splice(+v, 1);
    if (k === 'sysnew') C.systems.push({ id: 's' + Date.now().toString(36), name: '', inv: [], bat: [] });
    if (k === 'sysdel') { if (!confirm('System löschen?')) return; C.systems.splice(+v, 1); }
    if (k === 'sysrm') C.systems[i][a.dataset.c] = (C.systems[i][a.dataset.c] || []).filter(x => x !== v);
    if (k === 'reset') { AS.cfg = null; AS.ed = null; toast('Änderungen verworfen.'); }
    if (k === 'save') { for (const t of ['pv', 'wp']) for (const st of C[t].steps) st.links = (st.links || []).filter(l => l.item); C.systems = C.systems.filter(x => x.name.trim());
      const j = await api('of-wizard', C); OF.cat.wizard = j.wizard; AS.cfg = null; toast('Assistent gespeichert – gilt sofort für neue Angebote.'); }
    asRender();
  } catch (err) { toast(err.message); }
});
document.addEventListener('input', e => {
  const el = e.target, k = el.dataset && el.dataset.as; if (!k || !AS.cfg) return; const i = +el.dataset.i, C = AS.cfg, s = AS.tab === 'sys' ? null : C[AS.tab].steps[i];
  if (k === 'title') s.title = el.value; if (k === 'quick') s.quick = el.value.split(/[,; ]+/).map(parseNum).filter(n => n > 0);
  if (k === 'freen' && s.free) s.free.n = parseNum(el.value); if (k === 'freetext' && s.free) s.free.text = el.value;
  if (k === 'sysname') C.systems[i].name = el.value;
});
document.addEventListener('change', e => {
  const el = e.target, k = el.dataset && el.dataset.as; if (!k || !AS.cfg) return; const i = +el.dataset.i, j = +el.dataset.j, C = AS.cfg, s = AS.tab === 'sys' ? null : C[AS.tab].steps[i];
  if (k === 'askQty' || k === 'optional') s[k] = el.checked;
  else if (k === 'itemadd' && el.value) { if (!(s.items || []).includes(el.value)) (s.items = s.items || []).push(el.value); }
  else if (k === 'freeitem') s.free = el.value ? { item: el.value, n: s.free ? s.free.n : 1, text: s.free && s.free.text ? s.free.text : 'Rabatt: ' + ((wzItem(el.value) || {}).name || '') + ' (100 %)' } : null;
  else if (k === 'litem') s.links[j].item = el.value; else if (k === 'lqty') s.links[j].qty = el.value === 'same' ? 'same' : +el.value; else if (k === 'lplace') s.links[j].place = el.value;
  else if (k === 'sysadd' && el.value) { const x = C.systems[i], c = el.dataset.c; if (!(x[c] = x[c] || []).includes(el.value)) x[c].push(el.value); }
  else return;
  asRender();
});
