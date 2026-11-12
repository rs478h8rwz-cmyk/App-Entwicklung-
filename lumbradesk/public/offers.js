/* lumbra.desk – Angebote beim Kunden
   Ins Handy sprechen („20 Module, 10er Speicher und eine Wallbox“) → Positionen aus Artikeln und Produkten,
   Standardpakete (Gerüst, Montage je Modul, AC, Anmeldung …) kommen automatisch dazu, Mengen anpassbar, PDF. */
'use strict';
Object.assign(IC, {
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  offer: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/>',
  minus: '<path d="M5 12h14"/>', box: '<path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8"/>', produkte: '<path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8"/>'
});
const OF = { cat: null, edit: null, rec: null, listening: false, text: '', q: '' };
const eur2 = n => (Math.round((n || 0) * 100) / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
const numDe = n => (Math.round((n || 0) * 100) / 100).toLocaleString('de-DE', { maximumFractionDigits: 2 });
const parseNum = v => { const n = parseFloat(String(v).replace(/\./g, '').replace(',', '.')); return isFinite(n) ? n : 0; };
async function ofCatalog(force) { if (!OF.cat || force) OF.cat = await api('of-catalog'); return OF.cat; }

/* ---------- Sprache → Positionen ---------- */
const NUMW = { ein: 1, eins: 1, eine: 1, einen: 1, einem: 1, einer: 1, zwei: 2, zwo: 2, drei: 3, vier: 4, 'fünf': 5, fuenf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10, elf: 11, 'zwölf': 12, zwoelf: 12, dreizehn: 13, vierzehn: 14, 'fünfzehn': 15, sechzehn: 16, siebzehn: 17, achtzehn: 18, neunzehn: 19, zwanzig: 20, 'dreißig': 30, dreissig: 30, vierzig: 40, 'fünfzig': 50, sechzig: 60, siebzig: 70, achtzig: 80, neunzig: 90, hundert: 100, einhundert: 100 };
function wordNum(w) {
  w = w.toLowerCase(); if (NUMW[w] !== undefined) return NUMW[w];
  const m = /^(\w+?)und(zwanzig|dreißig|dreissig|vierzig|fünfzig|sechzig|siebzig|achtzig|neunzig)$/.exec(w); if (m && NUMW[m[1]] !== undefined) return NUMW[m[1]] + NUMW[m[2]];
  const e = /^(\w+?)er$/.exec(w); if (e && NUMW[e[1]] !== undefined) return NUMW[e[1]];   // „zehner“ Speicher
  return null;
}
const SYN = { mod: ['modul', 'module', 'modulen', 'panel', 'paneele', 'solarmodul', 'solarmodule', 'pv-module', 'platten'], bat: ['speicher', 'batterie', 'batteriespeicher', 'akku', 'stromspeicher'], inv: ['wechselrichter', 'inverter', 'hybridwechselrichter'], wb: ['wallbox', 'ladestation', 'ladebox', 'ladesäule'], wp: ['wärmepumpe', 'waermepumpe', 'heizung'] };
const tok = s => s.toLowerCase().replace(/[^\p{L}\p{N},.\- ]/gu, ' ').split(/\s+/).filter(Boolean);
function parseSpeech(text, items) {
  const t = ' ' + text.toLowerCase().replace(/(\d+)\s*er\b/g, '$1er') + ' ';
  const segs = t.split(/,(?!\d)|;|\.\s|\bund\b(?!\s*(?:\d|ein|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|zwanzig)\w*\s*(?:kwh|kw|wp)\b)|\bplus\b|\bsowie\b|\bdazu\b|\bmit\b|\bnoch\b/).map(s => s.trim()).filter(s => s.length > 1);
  const out = [];
  for (const seg of segs) {
    const words = tok(seg); if (!words.length) continue;
    let qty = null, pow = null, kwp = null;
    for (let i = 0; i < words.length; i++) {
      const w = words[i], nx = words[i + 1] || '';
      let n = /^\d+([.,]\d+)?(er)?$/.test(w) ? parseFloat(w.replace(',', '.')) : wordNum(w);
      if (n === null || isNaN(n)) continue;
      if (/er$/.test(w) && !/^\d+$/.test(w)) { pow = n; continue; }                       // „zehner“, „10er“
      if (/^kwp$/.test(nx)) { kwp = n; i++; continue; }
      if (/^(kwh|kw|wp|watt|kilowatt|kilowattstunden)$/.test(nx)) { pow = n; i++; continue; }
      if (qty === null) qty = n;
    }
    let cat = Object.keys(SYN).find(c => SYN[c].some(s => words.some(w => w.startsWith(s))));
    if (!cat && kwp) cat = 'mod';   // „8,8 kWp“ = PV-Module
    let best = null, bs = 0;
    for (const it of items) {
      const nameT = tok(it.name.replace(/[-/]/g, ' ')), kw = (it.words || '').split(',').map(x => x.trim()).filter(Boolean); let sc = 0;
      for (const w of words) {
        if (w.length < 3) continue;
        if (kw.some(k => w === k || (k.length >= 4 && w.startsWith(k)) || (w.length >= 5 && k.startsWith(w)))) sc += 4;          // Stichwort aus dem Artikelstamm
        else if (nameT.some(n => n.length > 3 && (n.startsWith(w) || w.startsWith(n)))) sc += w.length >= 6 ? 3 : 2;         // Wort aus dem Namen
      }
      if (cat && it.cat === cat) sc += 4;
      if (cat && it.cat !== cat && ['mod', 'bat', 'inv', 'wp', 'wb'].includes(it.cat)) sc -= 3;
      if (pow && it.power) sc += Math.max(0, 3 - Math.abs(it.power - pow) / Math.max(1, pow) * 6);
      if (it.kind === 'produkt' && it.price > 0) sc += 0.5;                                // echte Produkte bevorzugen
      if (sc > bs) { bs = sc; best = it; }
    }
    if (best && bs >= 3) {
      let q = qty || 1; if (kwp && best.cat === 'mod' && best.power) q = Math.ceil(kwp * 1000 / best.power);
      const ex = out.find(x => x.item === best.id); if (ex) ex.qty += q; else out.push(ofPos(best, q));
    } else out.push({ item: '', name: seg.replace(/^\w/, c => c.toUpperCase()), descr: 'Bitte prüfen – nicht im Artikelstamm gefunden', qty: qty || 1, unit: 'Stk', price: 0, tax: 19, cat: cat || 'sonst', check: true });
  }
  return out;
}
const ofPos = (it, qty) => ({ item: it.id, name: it.name, descr: it.descr || '', qty: it.pausch ? 1 : qty, unit: it.pausch ? 'pauschal' : it.unit || 'Stk', price: it.price || 0, tax: it.tax, cat: it.cat, power: it.power || null, pm: it.pm === 'brutto' ? 'brutto' : 'netto', pausch: !!it.pausch, img: it.img || '' });
/* Pakete: feste Positionen je Angebotsart („immer“) oder nur, wenn bestimmte Kategorien/Produkte im Angebot sind („wenn“) */
const OF_OTYPES = { pv: 'Photovoltaik', wp: 'Wärmepumpe', pvwp: 'PV + Wärmepumpe' };
const ofTypeFits = (pk, ot) => pk.otype === 'alle' || ot === pk.otype || (ot === 'pvwp' && (pk.otype === 'pv' || pk.otype === 'wp'));
function ofPkgHit(pk, base, ot) {
  if (!pk.active || !ofTypeFits(pk, ot)) return false;
  if (pk.mode === 'immer') return true;
  const c = pk.cond || { cats: [pk.trig], items: [] };
  return base.some(p => (c.cats || []).includes(p.cat) || (c.items || []).some(id => id === p.item || 'i' + id === p.item));
}
function ofApplyPackages(pos) {
  const C = OF.cat, ot = (OF.edit && OF.edit.data.otype) || 'pv', items = Object.fromEntries(C.items.map(i => [i.id.replace(/^i/, ''), i]).concat(C.items.map(i => [i.id, i])));
  const base = pos.filter(p => !p.pkg), mods = base.filter(p => p.cat === 'mod' && (p.power || 0) >= 100), nMod = mods.reduce((a, p) => a + p.qty, 0), kwp = mods.reduce((a, p) => a + p.qty * p.power, 0) / 1000;
  const kwWp = base.filter(p => p.cat === 'wp' && p.power).reduce((a, p) => a + p.qty * p.power, 0);
  const keep = pos.filter(p => p.pkg && p.man), next = [];
  for (const pk of C.packages) {
    if (!ofPkgHit(pk, base, ot)) continue;
    for (const l of pk.lines) {
      const it = items[String(l.item)] || items['i' + l.item]; if (!it) continue;
      const q = l.rule === 'perMod' ? nMod * l.qty : l.rule === 'perKwp' ? Math.round(kwp * l.qty * 100) / 100 : l.rule === 'perKw' ? Math.round(kwWp * l.qty * 100) / 100 : l.qty; if (!q) continue;
      if (keep.some(k => k.item === it.id) || base.some(b => b.item === it.id) || next.some(b => b.item === it.id)) continue;
      next.push({ ...ofPos(it, q), pkg: pk.name });
    }
  }
  return base.concat(keep, next);
}
/* Textbausteine: Standard je Art und Angebotsart */
const ofTx = (kind, ot) => ((OF.cat && OF.cat.texte) || []).filter(t => t.kind === kind && (t.otype === 'alle' || t.otype === ot || (ot === 'pvwp' && t.otype !== 'alle')));
const ofTxDef = (kind, ot) => { const l = ofTx(kind, ot); const sp = l.filter(t => t.def && t.otype !== 'alle'); return (ot === 'pvwp' && sp.length > 1) ? sp.map(t => t.text).join('\n') : ((sp[0] || l.find(t => t.def) || l[0] || {}).text || ''); };
/* Platzhalter in Texten: {Kunde} {Nummer} {Datum} {Betrag} {Fällig} {Gültig} */
const ofFill = (t, v) => String(t || '').replace(/\{(Kunde|Nummer|Datum|Betrag|Fällig|Gültig|Angebot)\}/g, (m, k) => v[k] !== undefined ? v[k] : m);

/* Preisart je Position (aus dem Produkt): netto (zzgl. USt., z. B. PV) oder brutto (inkl. USt., z. B. Wärmepumpe). Intern immer netto gespeichert. */
const ofBr = p => p.pm === 'brutto';
const ofUp = p => ofBr(p) ? Math.round(p.price * (1 + p.tax / 100) * 100) / 100 : p.price;
const ofLine = p => p.qty * ofUp(p);
function ofTotals(d) {
  const f = 1 - (d.discount || 0) / 100; let net = 0, sub = 0; const tax = {};
  for (const p of d.pos) {
    const t = p.tax / 100, l0 = ofBr(p) ? ofLine(p) / (1 + t) : ofLine(p), l = l0 * f;   // Nettobetrag der Position
    sub += l0; net += l; tax[p.tax] = (tax[p.tax] || 0) + l * t;
  }
  const gross = net + Object.values(tax).reduce((a, b) => a + b, 0);
  return { sub, disc: sub - net, net, tax, gross };
}

/* ---------- Kundenseite: Karte „Angebote“ ---------- */
function offerCard() {
  if (!(ST.features || {}).angebote) return '';
  const l = ST.offers; if (!l) return '';
  const c = ST.cd && ST.cd.customer;
  return `<div class="card sec"><div class="of-head"><h2>Angebote</h2><a class="btn sm" href="#/angebot/neu/${esc(c.id)}">${ic('mic', 16)}Neues Angebot</a></div>
    ${l.length ? `<div class="clist flat">${l.map(o => `<a class="crow" href="#/angebot/${esc(o.id)}"><span class="evi">${ic('offer', 18)}</span><div class="cmain"><b>${esc(o.nr)} · ${esc(o.title)}</b><span class="muted">${esc(ST.ofStatus[o.status] || o.status)} · ${utc(o.upd).toLocaleDateString('de-DE')} · ${esc(o.by)}</span></div><b class="small of-amt">${eur2(o.gross)}</b></a>`).join('')}</div>`
      : '<p class="muted">Noch kein Angebot. Tippe auf „Neues Angebot“ und sprich einfach, was der Kunde bekommt.</p>'}</div>`;
}
async function offLoad(view) {
  const h = location.hash.replace(/^#\/?/, '').split('/');
  if (!(ST.features || {}).angebote) return;
  if (view === 'kunde') { ST.offers = null; try { const [l, c] = await Promise.all([api('of-list&p=' + encodeURIComponent(h[1])), ofCatalog()]); ST.offers = l.offers; ST.ofStatus = c.status; } catch (e) { ST.offers = []; } }
  if (view === 'angebot') {
    await ofCatalog(); ST.ofStatus = OF.cat.status;
    if (h[1] === 'neu') {
      const pid = h[2]; ST.cd = await api('crm-p&id=' + encodeURIComponent(pid));
      const ot = OF_OTYPES[ST.cd.customer.type] ? ST.cd.customer.type : 'pv';
      if (!OF.edit || OF.edit.project !== pid || OF.edit.id) { OF.edit = { id: '', project: pid, nr: '', title: 'Angebot ' + OF_OTYPES[ot], status: 'entwurf', data: { otype: ot, pos: [], discount: 0, intro: ofTxDef('intro', ot), outro: ofTxDef('outro', ot), pay: ofTxDef('pay', ot), imgs: false, valid: ofIso(30), spoken: '' } }; OF.edit.data.pos = ofApplyPackages([]); }
      OF.text = '';
    } else if (!OF.edit || OF.edit.id !== h[1]) { const o = await api('of-get&id=' + encodeURIComponent(h[1])); OF.edit = o; ST.cd = await api('crm-p&id=' + encodeURIComponent(o.project)); OF.text = o.data.spoken || ''; }
  }
  if (view === 'artikel' || view === 'produkte') await ofCatalog(true);
}
const ofIso = d => { const x = new Date(); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 10); };

/* ---------- Editor ---------- */
function viewAngebot() {
  const E = OF.edit; if (!E || !ST.cd) return '<p class="muted" style="padding:30px 0">Angebot nicht gefunden.</p>';
  const c = ST.cd.customer, d = E.data, T = ofTotals(d), SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  return `<a class="backl" href="#/kunde/${esc(c.id)}">${ic('back', 18)}${esc(c.name)}</a>
    <section class="h-top" style="padding-top:8px"><div class="h-date"><i></i>${E.nr ? esc(E.nr) + ' · ' : ''}${esc(ST.ofStatus[E.status] || 'Entwurf')}</div><h1 class="h-title" style="font-size:32px">${E.id ? 'Angebot' : 'Neues Angebot'}</h1></section>
    <div class="cardx voice ${OF.listening ? 'on' : ''}">
      <div class="vrow">${SR ? `<button class="mic" data-a="of-mic" aria-label="${OF.listening ? 'Aufnahme beenden' : 'Sprechen'}">${ic('mic', 30)}</button>` : ''}
        <div class="vtx"><b>${OF.listening ? 'Ich höre zu …' : 'Was bekommt der Kunde?'}</b><span>${SR ? 'Tippen und sprechen, z. B. „20 Module, 10er Speicher, Wallbox“' : 'Ins Feld tippen und das Mikrofon der Tastatur nutzen'}</span></div></div>
      <textarea id="of-text" rows="3" placeholder="z. B. 22 Module, Hybrid-Wechselrichter 10 kW, 10er Speicher und eine Wallbox">${esc(OF.text)}</textarea>
      <div class="row" style="margin-top:10px;flex-wrap:wrap;gap:8px"><button class="btn" data-a="of-parse">${ic('check', 18)}${d.pos.length ? 'Positionen ergänzen' : 'Positionen erstellen'}</button>${d.pos.length ? `<button class="btn s" data-a="of-std">${ic('refresh', 16)}Standard neu berechnen</button>` : ''}</div>
    </div>
    <div class="ofmode"><span class="muted small">Angebotsart</span><div class="seg">${Object.entries(OF_OTYPES).map(([k, l]) => `<button data-a="of-otype" data-v="${k}" class="${(d.otype || 'pv') === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
    <section class="h-sec"><h2>Positionen</h2><span class="muted small">${d.pos.length} Position${d.pos.length === 1 ? '' : 'en'}</span></section>

    <div class="glist ofl">${d.pos.map((p, i) => `<div class="ofp ${p.check ? 'chk-me' : ''}">
        <div class="ofp-h"><span class="ofn">${i + 1}</span><input class="ofi-name" data-of="name" data-i="${i}" value="${esc(p.name)}"><button class="xbtn" data-a="of-del" data-i="${i}" aria-label="Position löschen">${ic('x', 14)}</button></div>
        ${p.descr || p.pkg ? `<div class="ofd">${p.pkg ? `<span class="tag t-a">Standard</span> ` : ''}${esc(p.descr || '')}</div>` : ''}
        <div class="ofp-r">${p.pausch ? `<span class="tag">pauschal</span>` : `<div class="qty"><button data-a="of-q" data-i="${i}" data-v="-1" aria-label="weniger">${ic('minus', 16)}</button><input inputmode="decimal" data-of="qty" data-i="${i}" value="${numDe(p.qty)}"><button data-a="of-q" data-i="${i}" data-v="1" aria-label="mehr">${ic('plus', 16)}</button></div>
          <span class="muted small">${esc(p.unit)} ×</span>`}<input class="ofi-pr" inputmode="decimal" data-of="price" data-i="${i}" value="${numDe(ofUp(p))}"><button class="pmb ${ofBr(p) ? 'br' : ''}" data-a="of-pm" data-i="${i}" title="Netto/Brutto umschalten">€ ${ofBr(p) ? 'brutto' : 'netto'}</button><b class="ofl-t">${eur2(ofLine(p))}</b></div>
      </div>`).join('') || '<div class="grow empty-g"><span class="gic">' + ic('mic', 16) + '</span><span class="gmain"><b>Noch keine Positionen</b><span>Sprechen oder unten aus dem Artikelstamm hinzufügen</span></span></div>'}
      <div class="ofadd"><div class="srch">${ic('search', 18)}<input id="of-q" placeholder="Artikel oder Leistung hinzufügen …" value="${esc(OF.q)}" autocomplete="off"></div><div id="of-sug">${ofSug()}</div></div>
    </div>
    <div class="cardx sec ofsum">
      <div class="sr"><span>Zwischensumme netto</span><span>${eur2(T.sub)}</span></div>
      <div class="sr"><span>Rabatt <input class="ofi-disc" inputmode="decimal" data-of="discount" value="${numDe(d.discount)}"> %</span><span>${T.disc ? '−' + eur2(T.disc) : '–'}</span></div>
      <div class="sr"><span>Netto</span><span>${eur2(T.net)}</span></div>
      ${Object.entries(T.tax).sort().map(([r, v]) => `<div class="sr muted"><span>USt. ${numDe(+r)} %${+r === 0 ? ' (§ 12 Abs. 3 UStG)' : ''}</span><span>${eur2(v)}</span></div>`).join('')}
      <div class="sr big2"><span>Gesamt brutto</span><span>${eur2(T.gross)}</span></div>
    </div>
    <section class="h-sec"><h2>Angaben</h2></section>
    <div class="cardx form-grid ofmeta"><label>Betreff<input data-of="title" value="${esc(E.title)}"></label><label>Gültig bis<input type="date" data-of="valid" value="${esc(d.valid)}"></label>
      <label>Status<select data-of="status">${Object.entries(ST.ofStatus).map(([k, l]) => `<option value="${k}" ${E.status === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      ${[['intro', 'Einleitung'], ['outro', 'Schlusstext'], ['pay', 'Zahlungsbedingungen']].map(([k, l]) => { const tl = ofTx(k, d.otype || 'pv'); return `<label style="grid-column:1/-1"><span class="flex-lbl">${l}${tl.length ? `<select class="txsel" data-a2="of-tx" data-k="${k}"><option value="">Textbaustein …</option>${tl.map(t => `<option value="${esc(t.id)}">${esc(t.name)}</option>`).join('')}</select>` : ''}</span><textarea rows="${k === 'outro' ? 3 : 2}" data-of="${k}">${esc(d[k] || '')}</textarea></label>`; }).join('')}
      <label class="sw" style="grid-column:1/-1"><input type="checkbox" data-of="imgs" ${d.imgs ? 'checked' : ''}>Produktbilder im PDF zeigen</label>
      <p class="muted small" style="grid-column:1/-1;margin:0">Platzhalter: {Kunde}, {Nummer}, {Gültig}, {Betrag} – werden im PDF ersetzt.</p></div>
    ${E.id ? `<div class="row" style="flex-wrap:wrap;gap:8px;margin-top:12px">${(ST.features || {}).rechnungen && ['admin', 'buero'].includes(ST.user.role) ? `<a class="btn s" href="#/rechnung/neu/${esc(E.id)}">${ic('offer', 16)}Rechnung erstellen</a>` : ''}<a class="btn s" href="rechner/?ldOffer=${esc(E.id)}#projekt/${esc(E.project)}/1">${ic('calc', 16)}In Wirtschaftlichkeit übernehmen</a></div>` : ''}
    <div class="ofbar"><button class="btn" data-a="of-save">${ic('check', 18)}Speichern</button><button class="btn s" data-a="of-prev" ${d.pos.length ? '' : 'disabled'}>${ic('offer', 18)}Vorschau</button><button class="btn s" data-a="of-pdf" ${d.pos.length ? '' : 'disabled'} aria-label="PDF teilen">PDF</button>${E.id ? `<button class="btn g danger" data-a="of-delete">${ic('x', 16)}</button>` : ''}</div>`;
}
function ofSug() {
  const q = OF.q.trim().toLowerCase(); if (!q || !OF.cat) return '';
  const l = OF.cat.items.filter(i => (i.name + ' ' + (i.words || '') + ' ' + (OF.cat.cats[i.cat] || '')).toLowerCase().includes(q)).slice(0, 8);
  return l.map(i => `<button class="grow" data-a="of-add" data-v="${esc(i.id)}"><span class="gmain"><b>${esc(i.name)}</b><span>${esc(OF.cat.cats[i.cat] || '')} · ${eur2(i.price)} / ${esc(i.unit)}${i.maker ? ' · ' + esc(i.maker) : ''}</span></span>${ic('plus', 16)}</button>`).join('') || '<div class="grow muted small">Nichts gefunden – unter Mehr → Produkte bzw. Leistungen & Pakete anlegen</div>';
}
window.addEventListener('hashchange', () => { if (OF.listening) ofMicReset(false); });
document.addEventListener('visibilitychange', () => { if (document.hidden && OF.listening) ofMicReset(false); });
const ofRender = () => { const y = scrollY; $('#app main').innerHTML = viewAngebot(); scrollTo(0, y); };
function ofSumPaint() { const s = $('.ofsum'); if (!s) return; const tmp = document.createElement('div'); tmp.innerHTML = viewAngebot(); const n = tmp.querySelector('.ofsum'); if (n) s.replaceWith(n); $$('.ofl-t').forEach((el, i) => { const p = OF.edit.data.pos[i]; if (p) el.textContent = eur2(ofLine(p)); }); }
const $$ = s => [...document.querySelectorAll(s)];

/* Spracherkennung (Safari/Chrome); sonst Tastatur-Diktat */
/* Spracheingabe – robust für iPhone: Wächter, sofortiges Stoppen, sonst Diktat der Tastatur */
const OF_IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function ofMicUI() {   // nur die Anzeige umschalten – kein Neuaufbau der Seite während der Aufnahme
  const v = $('.voice'); if (!v) return; v.classList.toggle('on', !!OF.listening);
  const b = v.querySelector('.vtx b'), m = v.querySelector('.mic'); if (b) b.textContent = OF.listening ? 'Ich höre zu … zum Beenden tippen' : 'Was bekommt der Kunde?';
  if (m) m.setAttribute('aria-label', OF.listening ? 'Aufnahme beenden' : 'Sprechen');
}
function ofMicReset(parse) {
  clearTimeout(OF.micWatch); clearTimeout(OF.micMax); const r = OF.rec; OF.rec = null; OF.listening = false;
  if (r) { r.onresult = r.onerror = r.onend = r.onstart = r.onaudiostart = null; try { r.abort(); } catch (e) {} }
  ofMicUI(); if (parse && OF.text.trim()) ofParse();
}
function ofDictate() {   // Ersatz: Diktat über das Mikrofon der Tastatur
  const ta = $('#of-text'); if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
  toast('Bitte das Mikrofon unten auf der Tastatur antippen und sprechen – danach „Positionen erstellen“.', 'ok', 6000);
}
function ofMic() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (OF.listening) return ofMicReset(true);                                  // zweiter Tipp: sofort beenden
  if (!SR || (OF_IOS && (navigator.standalone || matchMedia('(display-mode: standalone)').matches)) || OF.srBroken) return ofDictate();
  const r = new SR(); r.lang = 'de-DE'; r.interimResults = true; r.continuous = !OF_IOS;   // iPhone: ein Satz am Stück
  const start = OF.text ? OF.text.trim() + ', ' : ''; let alive = false;
  r.onstart = r.onaudiostart = () => { alive = true; };
  r.onresult = e => { alive = true; let s = ''; for (let i = 0; i < e.results.length; i++) s += e.results[i][0].transcript; OF.text = start + s; const ta = $('#of-text'); if (ta) ta.value = OF.text; };
  r.onerror = e => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { OF.srBroken = true; toast('Spracherkennung nicht erlaubt – bitte das Diktat der Tastatur nutzen.'); } };
  r.onend = () => ofMicReset(true);
  OF.rec = r; OF.listening = true; ofMicUI();
  try { r.start(); } catch (e) { ofMicReset(false); OF.srBroken = true; return ofDictate(); }
  /* Wächter: startet die Erkennung nicht innerhalb von 4 s, abbrechen und auf das Tastatur-Diktat wechseln */
  OF.micWatch = setTimeout(() => { if (OF.rec === r && !alive) { ofMicReset(false); OF.srBroken = true; ofDictate(); } }, 4000);
  OF.micMax = setTimeout(() => { if (OF.rec === r) ofMicReset(true); }, 90000);   // spätestens nach 90 s beenden
}
function ofParse() {
  const txt = ($('#of-text') || {}).value || OF.text; OF.text = txt; if (!txt.trim()) return toast('Bitte erst sprechen oder etwas eintippen.');
  const neu = parseSpeech(txt, OF.cat.items), d = OF.edit.data;
  for (const p of neu) { const ex = p.item && d.pos.find(x => x.item === p.item && !x.pkg); if (ex) ex.qty = p.qty; else d.pos.push(p); }
  d.pos = ofApplyPackages(d.pos); d.spoken = txt;
  const miss = neu.filter(p => p.check).length;
  toast(`${neu.length - miss} Position${neu.length - miss === 1 ? '' : 'en'} erkannt${miss ? ` · ${miss} bitte prüfen` : ''} – Standardleistungen ergänzt.`); ofRender();
}
async function ofBuild() {
  await loadJs('rechner/vendor/jspdf.umd.min.js');
  const { jsPDF } = window.jspdf, doc = new jsPDF({ unit: 'mm', format: 'a4' }), E = OF.edit, d = E.data, T = ofTotals(d), c = ST.cd.customer, co = OF.cat.company || {};
  const W = 210, M = 18, INK = [18, 23, 42], GR = [110, 116, 130], LN = [225, 228, 234];
  let logo = null; if (co.logoFile) { try { const b = await (await fetch('api/?r=cfg-file&id=' + encodeURIComponent(co.logoFile), { credentials: 'same-origin' })).blob(); logo = await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); }); } catch (e) {} }
  const head = () => { if (logo) { try { const p = doc.getImageProperties(logo), h = 14, w = Math.min(60, p.width / p.height * h); doc.addImage(logo, M, 12, w, w * p.height / p.width); } catch (e) {} } else { doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(...INK); doc.text(co.name || '', M, 20); }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...GR); doc.text([co.name, co.street, [co.zip, co.city].filter(Boolean).join(' '), co.phone, co.email].filter(Boolean), W - M, 14, { align: 'right' }); };
  head();
  doc.setFontSize(7); doc.setTextColor(...GR); doc.text([co.name, co.street, [co.zip, co.city].filter(Boolean).join(' ')].filter(Boolean).join(' · '), M, 46);
  doc.setFontSize(10.5); doc.setTextColor(...INK); doc.text([c.name, c.street, [c.zip, c.city].filter(Boolean).join(' ')].filter(Boolean), M, 52);
  doc.setFontSize(9); const meta = [['Angebot', E.nr || '(Entwurf)'], ['Datum', new Date().toLocaleDateString('de-DE')], ['Gültig bis', d.valid ? d.valid.split('-').reverse().join('.') : '–'], ['Ansprechpartner', ST.user.name]];
  meta.forEach(([k, v], i) => { doc.setTextColor(...GR); doc.text(k, 132, 52 + i * 5); doc.setTextColor(...INK); doc.text(String(v), W - M, 52 + i * 5, { align: 'right' }); });
  doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.text(E.title || 'Angebot', M, 84); doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  let y = 92; const salut = /^Familie/i.test(c.name) ? `Sehr geehrte ${c.name},` : /^Frau/i.test(c.name) ? `Sehr geehrte ${c.name},` : /^Herr/i.test(c.name) ? `Sehr geehrter ${c.name},` : 'Sehr geehrte Damen und Herren,';
  const para = t => { for (const ln of doc.splitTextToSize(t, W - 2 * M)) { if (y > 272) { doc.addPage(); head(); y = 40; } doc.text(ln, M, y); y += 4.6; } y += 3; };   // bricht vor der Fußzeile um
  const PH = { Kunde: c.name, Nummer: E.nr || '', Gültig: d.valid ? d.valid.split('-').reverse().join('.') : '', Betrag: eur2(T.gross), Datum: new Date().toLocaleDateString('de-DE') };
  const IMG = {}; if (d.imgs) for (const p of d.pos) if (p.img && !IMG[p.img]) { try { const b = await (await fetch('api/?r=cfg-file&id=' + encodeURIComponent(p.img), { credentials: 'same-origin' })).blob(); IMG[p.img] = await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); }); } catch (e) {} }
  para(salut); if (d.intro) para(ofFill(d.intro, PH));
  const mixed = d.pos.some(ofBr) && d.pos.some(p => !ofBr(p)), allBr = d.pos.length && d.pos.every(ofBr), wN = W - 2 * M - 62;
  const cols = [[M, 'Pos.'], [M + 12, 'Menge'], [M + 30, 'Bezeichnung'], [W - M - 30, 'Einzelpreis' + (mixed ? '' : allBr ? ' brutto' : ' netto')], [W - M, 'Gesamt']];
  const th = () => { doc.setFillColor(242, 243, 246); doc.rect(M, y - 4, W - 2 * M, 7, 'F'); doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...GR); cols.forEach(([x, l], i) => doc.text(l, x + (i >= 3 ? 0 : 1), y, { align: i >= 3 ? 'right' : 'left' })); y += 7; doc.setFont('helvetica', 'normal'); };
  th();
  d.pos.forEach((p, i) => {
    const im = d.imgs && p.img && IMG[p.img], iw = im ? 16 : 0, nl = doc.splitTextToSize(p.name, wN - iw), dl = p.descr && !p.check ? doc.splitTextToSize(p.descr, wN - iw) : [], h = Math.max(nl.length * 4.4 + dl.length * 3.6 + 3, im ? 18 : 0);
    if (y + h > 262) { doc.addPage(); head(); y = 40; th(); }
    if (im) { try { const pr = doc.getImageProperties(im), s0 = Math.min(14 / pr.width, 14 / pr.height); doc.addImage(im, M + 30, y - 3, pr.width * s0, pr.height * s0); } catch (e) {} }
    doc.setFontSize(9.5); doc.setTextColor(...INK); doc.text(String(i + 1), M + 1, y); doc.text(p.pausch ? 'pauschal' : `${numDe(p.qty)} ${p.unit}`, M + 12, y); doc.text(nl, M + 30 + iw, y);
    if (!p.pausch) doc.text(eur2(ofUp(p)), W - M - 30, y, { align: 'right' }); doc.text(eur2(ofLine(p)), W - M, y, { align: 'right' });
    if (mixed) { doc.setFontSize(7); doc.setTextColor(...GR); doc.text(ofBr(p) ? 'brutto' : 'netto', W - M, y + 3.4, { align: 'right' }); doc.setFontSize(9.5); doc.setTextColor(...INK); }
    if (dl.length) { doc.setFontSize(8); doc.setTextColor(...GR); doc.text(dl, M + 30 + iw, y + nl.length * 4.4); }
    y += h; doc.setDrawColor(...LN); doc.line(M, y - 2, W - M, y - 2); y += 2;
  });
  if (y > 230) { doc.addPage(); head(); y = 40; }
  const sr = (k, v, b) => { doc.setFont('helvetica', b ? 'bold' : 'normal'); doc.setFontSize(b ? 11 : 9.5); doc.setTextColor(...(b ? INK : GR)); doc.text(k, W - M - 60, y); doc.setTextColor(...INK); doc.text(v, W - M, y, { align: 'right' }); y += b ? 7 : 5; };
  y += 2; sr('Zwischensumme netto', eur2(T.sub)); if (T.disc) { sr(`Rabatt ${numDe(d.discount)} %`, '−' + eur2(T.disc)); sr('Netto', eur2(T.net)); }
  Object.entries(T.tax).sort().forEach(([r, v]) => sr(`USt. ${numDe(+r)} %`, eur2(v))); sr('Gesamt brutto', eur2(T.gross), true);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); y += 4;
  if (T.tax['0'] !== undefined) { doc.setFontSize(8.5); doc.setTextColor(...GR); para('Für Photovoltaikanlagen und Stromspeicher auf bzw. an Wohngebäuden gilt der Nullsteuersatz nach § 12 Abs. 3 UStG.'); doc.setFontSize(10); doc.setTextColor(...INK); }
  if (d.pay) { doc.setFont('helvetica', 'bold'); para('Zahlungsbedingungen'); y -= 2; doc.setFont('helvetica', 'normal'); para(ofFill(d.pay, PH)); }
  if (d.outro) para(ofFill(d.outro, PH)); para('Mit freundlichen Grüßen'); para(ST.user.name);
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) { doc.setPage(i); doc.setDrawColor(...LN); doc.line(M, 280, W - M, 280); doc.setFontSize(7); doc.setTextColor(...GR);
    doc.text([co.name, co.ceo ? 'Geschäftsführung: ' + co.ceo : '', co.register].filter(Boolean).join(' · '), M, 284); doc.text([co.bank, co.iban ? 'IBAN ' + co.iban : '', co.bic ? 'BIC ' + co.bic : ''].filter(Boolean).join(' · '), M, 288);
    doc.text([co.taxNo ? 'St.-Nr. ' + co.taxNo : '', co.vatId ? 'USt-IdNr. ' + co.vatId : ''].filter(Boolean).join(' · '), M, 292); doc.text(`Seite ${i} von ${pages}`, W - M, 292, { align: 'right' }); }
  const name = `Angebot_${(E.nr || 'Entwurf').replace(/[^\w-]/g, '_')}_${c.name.replace(/[^\wäöüÄÖÜß]+/g, '_')}.pdf`;
  return { blob: doc.output('blob'), name };
}
async function ofPdf(pre) {
  const { blob, name } = pre || await ofBuild(), file = new File([blob], name, { type: 'application/pdf' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: name }); return; } catch (e) { if (e.name === 'AbortError') return; } }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
}
/* Vorschau: Seiten als Bilder (pdf.js) – zuverlässig auch auf dem iPhone */
async function ofPreview() {
  const ov = document.createElement('div'); ov.id = 'of-prev'; ov.innerHTML = `<div class="pv-bar"><button class="btn g" data-pv="close">${ic('x', 18)}Schließen</button><b>Vorschau</b><button class="btn" data-pv="share">${ic('offer', 16)}Teilen</button></div><div class="pv-pages"><p class="muted" style="text-align:center;padding:40px 0">Vorschau wird erstellt …</p></div>`;
  document.body.appendChild(ov); document.documentElement.style.overflow = 'hidden';
  const close = () => { ov.remove(); document.documentElement.style.overflow = ''; };
  let built = null;
  ov.addEventListener('click', async e => { const b = e.target.closest('[data-pv]'); if (!b) return; if (b.dataset.pv === 'close') close(); if (b.dataset.pv === 'share' && built) ofPdf(built); });
  try {
    built = await ofBuild();
    await loadJs('rechner/vendor/pdf.min.js'); const lib = window.pdfjsLib; lib.GlobalWorkerOptions.workerSrc = 'rechner/vendor/pdf.worker.min.js';
    const pdf = await lib.getDocument({ data: new Uint8Array(await built.blob.arrayBuffer()) }).promise, box = ov.querySelector('.pv-pages'); box.innerHTML = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const pg = await pdf.getPage(i), w = Math.min(box.clientWidth - 24, 820), vp0 = pg.getViewport({ scale: 1 }), sc = w / vp0.width * (window.devicePixelRatio || 1), vp = pg.getViewport({ scale: sc });
      const cv = document.createElement('canvas'); cv.width = vp.width; cv.height = vp.height; cv.style.width = w + 'px'; cv.className = 'pv-page';
      box.appendChild(cv); await pg.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
    }
  } catch (err) { ov.querySelector('.pv-pages').innerHTML = `<p class="note err">Vorschau nicht möglich: ${esc(err.message)}</p>`; }
}
const loadJs = src => new Promise((res, rej) => { if (document.querySelector(`script[src="${src}"]`)) return res(); const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Bibliothek fehlt')); document.head.appendChild(s); });

/* ---------- Produktdatenbank & Leistungen (Admin/Büro) – nur fürs Angebot, getrennt von der Wirtschaftlichkeit ---------- */
const OF_PCATS = { mod: ['PV-Module', 'Wp'], inv: ['Wechselrichter', 'kW'], bat: ['Speicher', 'kWh'], wb: ['Wallbox', 'kW'], wp: ['Wärmepumpe', 'kW'], sonst: ['Sonstiges', ''] };
const ofTaxFor = cat => ['mod', 'inv', 'bat'].includes(cat) ? 0 : 19;
const ofRedraw = () => { const v = ST.view === 'produkte' ? viewProdukte() : viewArtikel(); $('#app main').innerHTML = v; };
function ofItemForm(it) {
  const C = OF.cat, prod = it.kind === 'produkt', cats = prod ? Object.fromEntries(Object.entries(OF_PCATS).map(([k, [l]]) => [k, l])) : C.cats, pu = (OF_PCATS[it.cat] || ['', ''])[1];
  return `<form id="f-of-item" class="form-grid" data-id="${esc(it.id || '')}"><input type="hidden" name="kind" value="${prod ? 'produkt' : 'leistung'}">
    <label style="grid-column:1/-1">Name<input name="name" value="${esc(it.name || '')}" required placeholder="${prod ? 'z. B. Glas-Glas-Modul 445 Wp' : 'z. B. Gerüst bis 2 Etagen'}"></label>
    ${prod ? `<label>Hersteller<input name="maker" value="${esc(it.maker || '')}"></label>` : ''}
    <label>${prod ? 'Art' : 'Bereich'}<select name="cat">${Object.entries(cats).map(([k, l]) => `<option value="${k}" ${it.cat === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    ${prod && pu ? `<label>Leistung (${pu})<input name="power" inputmode="decimal" value="${it.power === null || it.power === undefined ? '' : numDe(it.power)}"></label>` : ''}
    <label>Preis netto €<input name="price" inputmode="decimal" value="${numDe(it.price || 0)}"></label>
    <label>Preis brutto €<input name="pgross" inputmode="decimal" value="${numDe((it.price || 0) * (1 + (+it.tax || 0) / 100))}"></label>
    <label>Preisart im Angebot<select name="pm"><option value="netto" ${it.pm !== 'brutto' ? 'selected' : ''}>netto (zzgl. USt.)</option><option value="brutto" ${it.pm === 'brutto' ? 'selected' : ''}>brutto (inkl. USt.)</option></select></label>
    <label class="sw" style="align-self:end;min-height:44px"><input type="checkbox" name="pausch" value="1" ${it.pausch ? 'checked' : ''}>Pauschalpreis</label>
    <label>USt.<select name="tax">${[0, 7, 19].map(t => `<option value="${t}" ${+it.tax === t ? 'selected' : ''}>${t} %</option>`).join('')}</select></label>
    <label>Einheit<input name="unit" value="${esc(it.unit || 'Stk')}"></label>
    <div class="imgup" style="grid-column:1/-1"><input type="hidden" name="img" value="${esc(it.img || '')}"><span class="imgprev">${it.img ? `<img src="api/?r=cfg-file&id=${esc(it.img)}" alt="">` : ic('box', 22)}</span>
      <span class="gmain"><b>Bild</b><span>${it.img ? 'erscheint im Angebot, wenn „Produktbilder im PDF“ an ist' : 'optional – Foto oder Datenblatt-Bild'}</span></span>
      <label class="btn sm s" style="cursor:pointer">${it.img ? 'Ändern' : 'Hinzufügen'}<input type="file" accept="image/*" data-imgup="1" hidden></label>${it.img ? '<button type="button" class="btn sm g" data-pk="img-del">Entfernen</button>' : ''}</div>
    <label style="grid-column:1/-1">Beschreibung (steht im Angebot)<textarea name="descr" rows="2" placeholder="${prod ? 'z. B. Maße, Garantie, Besonderheiten' : ''}">${esc(it.descr || '')}</textarea></label>
    <label style="grid-column:1/-1">Stichwörter für die Spracheingabe (Komma)<input name="words" value="${esc(it.words || '')}" placeholder="${prod ? 'z. B. trina, glas glas' : 'z. B. gerüst, absturzsicherung'}"></label>
    ${prod ? '<p class="muted small" style="grid-column:1/-1;margin:0">PV-Module, Wechselrichter und Speicher: 0 % USt. (§ 12 Abs. 3 UStG).</p>' : ''}
    <div class="row" style="grid-column:1/-1;margin-top:12px"><button class="btn" type="submit">Speichern</button><button class="btn g" type="button" data-a="of-item-cancel">Abbrechen</button>${it.id ? `<button class="btn g danger" type="button" data-a="of-item-del" data-v="${esc(it.id)}">Löschen</button>` : ''}</div></form>`;
}
const ofRow = i => `<button class="grow" data-a="of-item-edit" data-v="${esc(i.id)}"><span class="gmain"><b>${esc(i.name)}</b><span>${[i.maker, i.kind === 'produkt' && i.power ? numDe(i.power) + ' ' + (OF_PCATS[i.cat] || ['', ''])[1] : '', i.pm === 'brutto' ? eur2(i.price * (1 + i.tax / 100)) + ' brutto' : eur2(i.price) + ' netto', i.pausch ? 'pauschal' : 'je ' + i.unit, i.tax + ' % USt.'].filter(Boolean).map(esc).join(' · ')}</span></span>${ic('next', 16)}</button>`;
const ofEditBox = id => OF.itemEdit && (OF.itemEdit.id || '') === id ? `<div class="cardx">${ofItemForm(OF.itemEdit)}</div>` : '';

function viewProdukte() {
  const C = OF.cat; if (!C) return ''; const q = (OF.pq || '').toLowerCase().trim();
  const all = C.items.filter(i => i.kind === 'produkt'), list = all.filter(i => !q || (i.name + ' ' + (i.maker || '') + ' ' + (i.words || '')).toLowerCase().includes(q));
  const groups = Object.keys(OF_PCATS).map(k => [k, list.filter(i => (OF_PCATS[i.cat] ? i.cat : 'sonst') === k)]).filter(([, l]) => l.length);
  return `<section class="hero"><h1>Produkte</h1><p class="muted">Module, Speicher, Wechselrichter, Wallboxen, Wärmepumpen – nur fürs Angebot. Die Wirtschaftlichkeit bleibt davon unberührt.</p></section>
    <div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:12px"><button class="btn" data-a="of-prod-new">${ic('plus', 16)}Neues Produkt</button><button class="btn g" data-a="of-import">Aus der Wirtschaftlichkeit übernehmen</button></div>
    ${ofEditBox('')}
    ${all.length > 6 ? `<input id="of-pq" class="search" type="search" placeholder="Produkt suchen …" value="${esc(OF.pq || '')}" style="width:100%;margin-bottom:8px">` : ''}
    <div id="of-plist">${groups.map(([k, l]) => `<section class="h-sec"><h2>${OF_PCATS[k][0]}</h2><span class="muted small">${l.length}</span></section><div class="glist">${l.map(i => ofRow(i) + ofEditBox(i.id)).join('')}</div>`).join('') || `<div class="cardx muted">${all.length ? 'Nichts gefunden.' : 'Noch keine Produkte. Lege eins an oder übernimm die Produkte einmalig aus der Wirtschaftlichkeit – danach sind beide Listen unabhängig.'}</div>`}</div>`;
}
const PK_RULES = { fix: 'feste Menge', perMod: 'je Modul', perKwp: 'je kWp', perKw: 'je kW Wärmepumpe' };
const PK_OT = { pv: 'Photovoltaik', wp: 'Wärmepumpe', alle: 'alle Angebote' };
function pkSummary(pk, C) {
  const c = pk.cond || {}, conds = (c.cats || []).map(k => C.cats[k]).concat((c.items || []).map(id => (C.items.find(i => i.id === id || i.id === 'i' + id) || {}).name).filter(Boolean));
  return `${PK_OT[pk.otype] || 'alle Angebote'} · ${pk.mode === 'immer' ? 'immer im Angebot' : 'nur wenn: ' + (conds.join(', ') || '–')}${pk.active ? '' : ' · aus'}`;
}
function pkForm(pk) {
  const C = OF.cat, c = pk.cond, it = id => C.items.find(i => i.id === id || i.id === 'i' + id);
  const opts = sel => `<option value="">– Position wählen –</option>${['produkt', 'leistung'].map(k => `<optgroup label="${k === 'produkt' ? 'Produkte' : 'Leistungen'}">${C.items.filter(i => (i.kind || 'leistung') === k).map(i => `<option value="${esc(i.id)}" ${sel && (sel === i.id || 'i' + sel === i.id) ? 'selected' : ''}>${esc(i.name)}</option>`).join('')}</optgroup>`).join('')}`;
  return `<div class="cardx pkf"><label>Name<input data-pkf="name" value="${esc(pk.name || '')}" placeholder="z. B. Standard Wärmepumpe"></label>
    <div class="pkrow"><span class="lbl2">Für</span><div class="seg">${Object.entries(PK_OT).map(([k, l]) => `<button type="button" data-pk="otype" data-v="${k}" class="${pk.otype === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
    <div class="pkrow"><span class="lbl2">Wann</span><div class="seg">${[['immer', 'Immer im Angebot'], ['wenn', 'Nur wenn …']].map(([k, l]) => `<button type="button" data-pk="mode" data-v="${k}" class="${pk.mode === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
    ${pk.mode === 'wenn' ? `<div class="pkcond"><div class="muted small">… eine dieser Kategorien im Angebot ist:</div><div class="chips2">${Object.entries(C.cats).map(([k, l]) => `<button type="button" class="chip ${c.cats.includes(k) ? 'on' : ''}" data-pk="cat" data-v="${k}">${l}</button>`).join('')}</div>
      <div class="muted small" style="margin-top:8px">… oder eines dieser Produkte:</div><div class="chips2">${c.items.map(id => `<span class="chip on">${esc((it(id) || {}).name || id)}<button type="button" data-pk="citem-del" data-v="${esc(id)}" aria-label="entfernen">×</button></span>`).join('')}<select data-pkf="citem" class="txsel">${opts('')}</select></div></div>` : ''}
    <div class="muted small" style="margin:12px 0 6px">Positionen, die dann ins Angebot kommen:</div>
    ${pk.lines.map((l, i) => `<div class="pkline"><select data-pkf="litem" data-i="${i}">${opts(l.item)}</select><input data-pkf="lqty" data-i="${i}" inputmode="decimal" value="${numDe(l.qty)}"><select data-pkf="lrule" data-i="${i}">${Object.entries(PK_RULES).map(([k, t]) => `<option value="${k}" ${l.rule === k ? 'selected' : ''}>${t}</option>`).join('')}</select><button type="button" class="xbtn" data-pk="line-del" data-v="${i}" aria-label="Position entfernen">${ic('x', 14)}</button></div>`).join('')}
    <button type="button" class="btn sm s" data-pk="line-add">${ic('plus', 14)}Position</button>
    <label class="sw" style="margin-top:12px"><input type="checkbox" data-pkf="active" ${pk.active ? 'checked' : ''}>Paket aktiv</label>
    <div class="row" style="margin-top:12px;flex-wrap:wrap;gap:8px"><button class="btn" type="button" data-pk="save">Speichern</button><button class="btn g" type="button" data-pk="cancel">Abbrechen</button>${pk.id ? '<button class="btn g danger" type="button" data-pk="del">Löschen</button>' : ''}</div></div>`;
}
function viewArtikel() {
  const C = OF.cat; if (!C) return ''; const own = C.items.filter(i => i.kind !== 'produkt'), E = OF.pk;
  return `<section class="hero"><h1>Leistungen &amp; Pakete</h1><p class="muted">Montage, Elektro, Gerüst & Co. – und welche Positionen automatisch ins Angebot kommen.</p></section>
    <section class="h-sec"><h2>Pakete</h2><button class="btn sm" data-pk="new">${ic('plus', 16)}Neu</button></section>
    ${E && !E.id ? pkForm(E) : ''}
    <div class="glist">${C.packages.map(pk => `<button class="grow" data-pk="edit" data-v="${pk.id}" style="align-items:flex-start"><span class="gic">${ic('box', 16)}</span><span class="gmain"><b>${esc(pk.name)}</b><span>${esc(pkSummary(pk, C))}</span>
      <span style="white-space:normal;margin-top:4px">${pk.lines.map(l => { const it = C.items.find(i => i.id === 'i' + l.item || i.id === l.item); return it ? `${esc(it.name)} (${l.rule === 'fix' ? numDe(l.qty) + ' ' + esc(it.unit) : numDe(l.qty) + ' ' + PK_RULES[l.rule]})` : ''; }).filter(Boolean).join(' · ')}</span></span>${ic('next', 16)}</button>${E && E.id === pk.id ? pkForm(E) : ''}`).join('') || '<div class="grow muted small">Noch keine Pakete</div>'}</div>
    <p class="muted small" style="margin:8px 4px 0">„Immer“: feste Positionen in jedem Angebot dieser Art (z. B. Inbetriebnahme). „Nur wenn“: kommt dazu, sobald z. B. ein Speicher oder ein bestimmtes Produkt im Angebot ist.</p>
    <section class="h-sec"><h2>Leistungen</h2><button class="btn sm" data-a="of-item-new">${ic('plus', 16)}Neu</button></section>
    ${ofEditBox('')}
    <div class="glist">${own.map(i => ofRow(i) + ofEditBox(i.id)).join('')}</div>
    <p class="muted small" style="margin:8px 4px 0">Produkte (Module, Speicher …) pflegst du unter Mehr → Produkte.</p>`;
}
document.addEventListener('click', async e => {
  const a = e.target.closest('[data-pk]'); if (!a || !OF.cat) return; e.preventDefault();
  const k = a.dataset.pk, v = a.dataset.v, P = OF.pk;
  try {
    if (k === 'img-del') { const f = $('#f-of-item'); if (f) { f.img.value = ''; OF.itemEdit = { ...OF.itemEdit, ...Object.fromEntries(new FormData(f)), img: '' }; ofRedraw(); } return; }
    if (k === 'new') { OF.pk = { id: 0, name: '', otype: 'pv', mode: 'immer', cond: { cats: [], items: [] }, lines: [{ item: '', rule: 'fix', qty: 1 }], active: true }; return ofRedraw(); }
    if (k === 'edit') { const pk = OF.cat.packages.find(x => String(x.id) === v); OF.pk = OF.pk && OF.pk.id === pk.id ? null : JSON.parse(JSON.stringify(pk)); ofRedraw(); const f = $('.pkf'); if (f) f.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return; }
    if (!P) return;
    if (k === 'cancel') { OF.pk = null; return ofRedraw(); }
    if (k === 'otype') P.otype = v; if (k === 'mode') P.mode = v;
    if (k === 'cat') P.cond.cats = P.cond.cats.includes(v) ? P.cond.cats.filter(x => x !== v) : P.cond.cats.concat(v);
    if (k === 'citem-del') P.cond.items = P.cond.items.filter(x => x !== v);
    if (k === 'line-add') P.lines.push({ item: '', rule: 'fix', qty: 1 });
    if (k === 'line-del') P.lines.splice(+v, 1);
    if (k === 'save') { await api('of-package', { id: P.id, name: P.name, otype: P.otype, mode: P.mode, cond: P.cond, lines: P.lines.filter(l => l.item).map(l => ({ ...l, item: String(l.item).replace(/^i/, '') })), off: !P.active }); OF.pk = null; await ofCatalog(true); toast('Paket gespeichert.'); }
    if (k === 'del') { if (!confirm('Paket löschen?')) return; await api('of-package-del', { id: P.id }); OF.pk = null; await ofCatalog(true); toast('Paket gelöscht.'); }
    ofRedraw();
  } catch (err) { toast(err.message); }
});
document.addEventListener('input', e => { const el = e.target, P = OF.pk; if (!P || !el.dataset || !el.dataset.pkf) return; const k = el.dataset.pkf, i = +el.dataset.i;
  if (k === 'name') P.name = el.value; if (k === 'lqty') P.lines[i].qty = parseNum(el.value); });
document.addEventListener('change', async e => { const el = e.target;
  if (el.dataset && el.dataset.imgup) {   // Produktbild: verkleinern und hochladen
    const file = el.files && el.files[0]; if (!file) return; const f = el.closest('form');
    try {
      const img = await new Promise((r, j) => { const i = new Image(); i.onload = () => r(i); i.onerror = j; i.src = URL.createObjectURL(file); });
      const k = Math.min(1, 900 / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
      const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.86)), id = 'oi' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const res = await fetch('api/?r=of-file', { method: 'POST', credentials: 'same-origin', headers: { 'X-Lumbra': '1', 'X-File-Id': id, 'Content-Type': 'image/jpeg' }, body: blob });
      if (!res.ok) throw new Error(((await res.json().catch(() => ({}))).error) || 'Hochladen fehlgeschlagen');
      OF.itemEdit = { ...OF.itemEdit, ...Object.fromEntries(new FormData(f)), img: id }; ofRedraw(); toast('Bild hinzugefügt – „Speichern“ nicht vergessen.');
    } catch (err) { toast(err.message || 'Bild konnte nicht geladen werden.'); }
    return;
  }
  const P = OF.pk; if (!P || !el.dataset || !el.dataset.pkf) return; const k = el.dataset.pkf, i = +el.dataset.i;
  if (k === 'litem') P.lines[i].item = el.value; if (k === 'lrule') P.lines[i].rule = el.value; if (k === 'active') P.active = el.checked;
  if (k === 'citem' && el.value) { if (!P.cond.items.includes(el.value)) P.cond.items.push(el.value); ofRedraw(); }
});

/* ---------- Bedienung ---------- */
document.addEventListener('click', async e => {
  const a = e.target.closest('[data-a^="of-"]'); if (!a) return; e.preventDefault();
  const E = OF.edit, d = E && E.data, i = +a.dataset.i;
  try {
    switch (a.dataset.a) {
      case 'of-mic': return ofMic();
      case 'of-parse': return ofParse();
      case 'of-std': d.pos = ofApplyPackages(d.pos.filter(p => !p.pkg || p.man)); toast('Standardleistungen neu berechnet.'); return ofRender();
      case 'of-del': d.pos.splice(i, 1); return ofRender();
      case 'of-otype': { const old = d.otype || 'pv', nt = a.dataset.v; if (nt === old) return;
        for (const k of ['intro', 'outro', 'pay']) if (!d[k] || d[k] === ofTxDef(k, old)) d[k] = ofTxDef(k, nt);   // nur unveränderte Standardtexte tauschen
        d.otype = nt; if (/^Angebot (Photovoltaik|Wärmepumpe|PV \+ Wärmepumpe)$/.test(E.title)) E.title = 'Angebot ' + OF_OTYPES[nt];
        d.pos = ofApplyPackages(d.pos.filter(p => !p.pkg || p.man)); toast('Angebotsart: ' + OF_OTYPES[nt] + ' – feste Positionen angepasst.'); return ofRender(); }
      case 'of-pm': { const p = d.pos[i]; p.pm = ofBr(p) ? 'netto' : 'brutto'; return ofRender(); }
      case 'of-q': { const p = d.pos[i]; p.qty = Math.max(0, Math.round((p.qty + +a.dataset.v) * 100) / 100); if (p.pkg) p.man = true; const inp = $(`[data-of="qty"][data-i="${i}"]`); if (inp) inp.value = numDe(p.qty);
        if (p.cat === 'mod' && !p.pkg) d.pos = ofApplyPackages(d.pos), ofRender(); else ofSumPaint(); return; }
      case 'of-add': { const it = OF.cat.items.find(x => x.id === a.dataset.v); if (!it) return; d.pos.push(ofPos(it, 1)); d.pos = ofApplyPackages(d.pos); OF.q = ''; return ofRender(); }
      case 'of-save': { a.disabled = true; const j = await api('of-save', { id: E.id, project: E.project, title: E.title, status: E.status, data: d }); OF.edit = j; toast(`Angebot ${j.nr} gespeichert · ${eur2(j.gross)}`); if (!location.hash.includes(j.id)) { history.replaceState(null, '', '#/angebot/' + j.id); } return ofRender(); }
      case 'of-prev': return ofPreview();
      case 'of-pdf': { if (!E.id) { const j = await api('of-save', { id: E.id, project: E.project, title: E.title, status: E.status, data: d }); OF.edit = j; history.replaceState(null, '', '#/angebot/' + j.id); ofRender(); } return ofPdf(); }
      case 'of-delete': if (!confirm('Angebot löschen?')) return; await api('of-del', { id: E.id }); toast('Angebot gelöscht.'); OF.edit = null; location.hash = '#/kunde/' + E.project; return;
      case 'of-prod-new': OF.itemEdit = { kind: 'produkt', cat: 'mod', unit: 'Stk', tax: 0, price: 0, pm: 'netto' }; return ofRedraw();
      case 'of-import': { a.disabled = true; const j = await api('of-import', {}); await ofCatalog(true); toast(j.n ? `${j.n} Produkte übernommen – ab jetzt unabhängig von der Wirtschaftlichkeit.` : 'Nichts Neues – alle Produkte sind schon da.'); return ofRedraw(); }
      case 'of-item-new': OF.itemEdit = { kind: 'leistung', unit: 'Stk', tax: 19, cat: 'sonst', price: 0 }; return ofRedraw();
      case 'of-item-edit': { const it = OF.cat.items.find(x => x.id === a.dataset.v); OF.itemEdit = OF.itemEdit && OF.itemEdit.id === a.dataset.v ? null : it ? { ...it } : null; ofRedraw(); const f = $('#f-of-item'); if (f) f.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
      case 'of-item-cancel': OF.itemEdit = null; return ofRedraw();
      case 'of-item-del': if (!confirm('Wirklich löschen? Bestehende Angebote behalten ihre Positionen.')) return; await api('of-item-del', { id: a.dataset.v }); OF.itemEdit = null; await ofCatalog(true); toast('Gelöscht.'); return ofRedraw();
    }
  } catch (err) { toast(err.message); a.disabled = false; }
});
document.addEventListener('input', e => {
  const el = e.target;
  if (el.id === 'of-q') { OF.q = el.value; const s = $('#of-sug'); if (s) s.innerHTML = ofSug(); return; }
  if (el.id === 'of-text') { OF.text = el.value; return; }
  const fi = el.closest && el.closest('#f-of-item');
  if (fi && ['price', 'pgross', 'tax'].includes(el.name)) {
    const t = +fi.tax.value / 100; if (el.name === 'pgross') fi.dataset.last = 'g'; else if (el.name === 'price') fi.dataset.last = 'n';
    if (fi.dataset.last === 'g') fi.price.value = numDe(parseNum(fi.pgross.value) / (1 + t)); else fi.pgross.value = numDe(parseNum(fi.price.value) * (1 + t));
    return;
  }
  if (el.id === 'of-pq') { OF.pq = el.value; const t = document.createElement('div'); t.innerHTML = viewProdukte(); const n = t.querySelector('#of-plist'), o = $('#of-plist'); if (n && o) o.replaceWith(n); return; }
  const k = el.dataset && el.dataset.of; if (!k || !OF.edit) return; const d = OF.edit.data, i = +el.dataset.i;
  if (k === 'price' && ofBr(d.pos[i])) { const p = d.pos[i]; p.price = Math.round(parseNum(el.value) / (1 + p.tax / 100) * 10000) / 10000; ofSumPaint(); }
  else if (k === 'qty' || k === 'price') { d.pos[i][k] = parseNum(el.value); if (k === 'qty' && d.pos[i].pkg) d.pos[i].man = true; ofSumPaint(); }
  else if (k === 'name') d.pos[i].name = el.value;
  else if (k === 'imgs') d.imgs = el.checked;
  else if (k === 'discount') { d.discount = Math.max(0, Math.min(100, parseNum(el.value))); ofSumPaint(); }
  else if (k === 'title' || k === 'status') OF.edit[k] = el.value;
  else d[k] = el.value;
});
document.addEventListener('change', e => { const el = e.target; if (el.dataset && el.dataset.a2 === 'of-tx' && OF.edit && el.value) { const t = ((OF.cat || {}).texte || []).find(x => x.id === el.value); if (t) { OF.edit.data[el.dataset.k] = t.text; const ta = $(`textarea[data-of="${el.dataset.k}"]`); if (ta) ta.value = t.text; } el.value = ''; return; } if (el.name === 'cat' && el.closest('#f-of-item') && OF.itemEdit && OF.itemEdit.kind === 'produkt') { const d = Object.fromEntries(new FormData(el.closest('form'))); OF.itemEdit = { ...OF.itemEdit, ...d, power: d.power === '' || d.power === undefined ? null : parseNum(d.power), price: parseNum(d.price), tax: ofTaxFor(d.cat), pm: d.cat === 'wp' ? 'brutto' : 'netto', pausch: !!d.pausch }; ofRedraw(); return; } if (el.dataset && el.dataset.of === 'status' && OF.edit) OF.edit.status = el.value; if (el.dataset && el.dataset.of === 'qty' && OF.edit) { const p = OF.edit.data.pos[+el.dataset.i]; if (p && p.cat === 'mod' && !p.pkg) { OF.edit.data.pos = ofApplyPackages(OF.edit.data.pos); ofRender(); } } });
document.addEventListener('submit', async e => {
  if (e.target.id !== 'f-of-item') return; e.preventDefault(); e.stopImmediatePropagation();
  const f = e.target, d = Object.fromEntries(new FormData(f)); d.id = f.dataset.id; d.tax = +d.tax; d.price = f.dataset.last === 'g' ? Math.round(parseNum(d.pgross) / (1 + d.tax / 100) * 10000) / 10000 : parseNum(d.price); delete d.pgross; d.pausch = !!d.pausch; if (d.power !== undefined) d.power = d.power === '' ? '' : parseNum(d.power);
  try { await api('of-item', d); OF.itemEdit = null; await ofCatalog(true); ofRedraw(); toast('Gespeichert.'); } catch (err) { toast(err.message); }
}, true);
