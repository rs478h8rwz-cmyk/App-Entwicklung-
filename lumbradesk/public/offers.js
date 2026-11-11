/* lumbra.desk – Angebote beim Kunden
   Ins Handy sprechen („20 Module, 10er Speicher und eine Wallbox“) → Positionen aus Artikeln und Produkten,
   Standardpakete (Gerüst, Montage je Modul, AC, Anmeldung …) kommen automatisch dazu, Mengen anpassbar, PDF. */
'use strict';
Object.assign(IC, {
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  offer: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/>',
  minus: '<path d="M5 12h14"/>', box: '<path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8"/>'
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
      if (!it.own && it.price > 0) sc += 0.5;                                               // echte Produkte bevorzugen
      if (sc > bs) { bs = sc; best = it; }
    }
    if (best && bs >= 3) {
      let q = qty || 1; if (kwp && best.cat === 'mod' && best.power) q = Math.ceil(kwp * 1000 / best.power);
      const ex = out.find(x => x.item === best.id); if (ex) ex.qty += q; else out.push(ofPos(best, q));
    } else out.push({ item: '', name: seg.replace(/^\w/, c => c.toUpperCase()), descr: 'Bitte prüfen – nicht im Artikelstamm gefunden', qty: qty || 1, unit: 'Stk', price: 0, tax: 19, cat: cat || 'sonst', check: true });
  }
  return out;
}
const ofPos = (it, qty) => ({ item: it.id, name: it.name, descr: it.descr || '', qty, unit: it.unit || 'Stk', price: it.price || 0, tax: it.tax, cat: it.cat, power: it.power || null });
/* Standardpakete anhand der Positionen ergänzen bzw. Mengen nachziehen */
function ofApplyPackages(pos) {
  const C = OF.cat, items = Object.fromEntries(C.items.map(i => [i.id.replace(/^i/, ''), i]).concat(C.items.map(i => [i.id, i])));
  const base = pos.filter(p => !p.pkg), mods = base.filter(p => p.cat === 'mod' && (p.power || 0) >= 100), nMod = mods.reduce((a, p) => a + p.qty, 0), kwp = mods.reduce((a, p) => a + p.qty * p.power, 0) / 1000;
  const keep = pos.filter(p => p.pkg && p.man), next = [];
  for (const pk of C.packages.filter(p => p.active)) {
    if (!base.some(p => p.cat === pk.trig)) continue;
    for (const l of pk.lines) {
      const it = items[String(l.item)] || items['i' + l.item]; if (!it) continue;
      const q = l.rule === 'perMod' ? nMod * l.qty : l.rule === 'perKwp' ? Math.round(kwp * l.qty * 100) / 100 : l.qty; if (!q) continue;
      if (keep.some(k => k.item === it.id) || base.some(b => b.item === it.id)) continue;
      next.push({ ...ofPos(it, q), pkg: pk.name });
    }
  }
  return base.concat(keep, next);
}
function ofTotals(d) {
  const f = 1 - (d.discount || 0) / 100; let net = 0; const tax = {};
  for (const p of d.pos) { const l = p.qty * p.price * f; net += l; tax[p.tax] = (tax[p.tax] || 0) + l * p.tax / 100; }
  const gross = net + Object.values(tax).reduce((a, b) => a + b, 0), sub = d.pos.reduce((a, p) => a + p.qty * p.price, 0);
  return { sub, disc: sub - net, net, tax, gross };
}

/* ---------- Kundenseite: Karte „Angebote“ ---------- */
function offerCard() {
  const l = ST.offers; if (!l) return '';
  const c = ST.cd && ST.cd.customer;
  return `<div class="card sec"><div class="row" style="justify-content:space-between"><h2>Angebote</h2><a class="btn sm" href="#/angebot/neu/${esc(c.id)}">${ic('mic', 16)}Neues Angebot</a></div>
    ${l.length ? `<div class="clist flat">${l.map(o => `<a class="crow" href="#/angebot/${esc(o.id)}"><span class="evi">${ic('offer', 18)}</span><div class="cmain"><b>${esc(o.nr)} · ${esc(o.title)}</b><span class="muted">${esc(ST.ofStatus[o.status] || o.status)} · ${utc(o.upd).toLocaleDateString('de-DE')} · ${esc(o.by)}</span></div><b class="small" style="white-space:nowrap">${eur2(o.gross)}</b></a>`).join('')}</div>`
      : '<p class="muted">Noch kein Angebot. Tippe auf „Neues Angebot“ und sprich einfach, was der Kunde bekommt.</p>'}</div>`;
}
async function offLoad(view) {
  const h = location.hash.replace(/^#\/?/, '').split('/');
  if (view === 'kunde') { ST.offers = null; try { const [l, c] = await Promise.all([api('of-list&p=' + encodeURIComponent(h[1])), ofCatalog()]); ST.offers = l.offers; ST.ofStatus = c.status; } catch (e) { ST.offers = []; } }
  if (view === 'angebot') {
    await ofCatalog(); ST.ofStatus = OF.cat.status;
    if (h[1] === 'neu') {
      const pid = h[2]; ST.cd = await api('crm-p&id=' + encodeURIComponent(pid));
      if (!OF.edit || OF.edit.project !== pid || OF.edit.id) OF.edit = { id: '', project: pid, nr: '', title: 'Angebot ' + (ST.cd.customer.type === 'wp' ? 'Wärmepumpe' : 'Photovoltaik'), status: 'entwurf', data: { pos: [], discount: 0, intro: 'vielen Dank für Ihr Interesse. Gerne bieten wir Ihnen folgende Leistungen an:', outro: 'Wir freuen uns auf Ihren Auftrag. Bei Fragen sind wir jederzeit für Sie da.', valid: ofIso(30), spoken: '' } };
      OF.text = '';
    } else if (!OF.edit || OF.edit.id !== h[1]) { const o = await api('of-get&id=' + encodeURIComponent(h[1])); OF.edit = o; ST.cd = await api('crm-p&id=' + encodeURIComponent(o.project)); OF.text = o.data.spoken || ''; }
  }
  if (view === 'artikel') await ofCatalog(true);
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
      <div class="row" style="margin-top:10px"><button class="btn" data-a="of-parse">${ic('check', 18)}${d.pos.length ? 'Positionen ergänzen' : 'Positionen erstellen'}</button>${d.pos.length ? `<button class="btn s" data-a="of-std">${ic('refresh', 16)}Standard neu berechnen</button>` : ''}</div>
    </div>
    <section class="h-sec"><h2>Positionen</h2><span class="muted small">${d.pos.length} Position${d.pos.length === 1 ? '' : 'en'}</span></section>
    <div class="glist ofl">${d.pos.map((p, i) => `<div class="ofp ${p.check ? 'chk-me' : ''}">
        <div class="ofp-h"><span class="ofn">${i + 1}</span><input class="ofi-name" data-of="name" data-i="${i}" value="${esc(p.name)}"><button class="xbtn" data-a="of-del" data-i="${i}" aria-label="Position löschen">${ic('x', 14)}</button></div>
        ${p.descr || p.pkg ? `<div class="ofd">${p.pkg ? `<span class="tag t-a">Standard</span> ` : ''}${esc(p.descr || '')}</div>` : ''}
        <div class="ofp-r"><div class="qty"><button data-a="of-q" data-i="${i}" data-v="-1" aria-label="weniger">${ic('minus', 16)}</button><input inputmode="decimal" data-of="qty" data-i="${i}" value="${numDe(p.qty)}"><button data-a="of-q" data-i="${i}" data-v="1" aria-label="mehr">${ic('plus', 16)}</button></div>
          <span class="muted small">${esc(p.unit)} ×</span><input class="ofi-pr" inputmode="decimal" data-of="price" data-i="${i}" value="${numDe(p.price)}"><span class="muted small">€</span><b class="ofl-t">${eur2(p.qty * p.price)}</b></div>
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
      <label style="grid-column:1/-1">Einleitung<textarea rows="2" data-of="intro">${esc(d.intro)}</textarea></label><label style="grid-column:1/-1">Schlusstext<textarea rows="2" data-of="outro">${esc(d.outro)}</textarea></label></div>
    <div class="ofbar"><button class="btn" data-a="of-save">${ic('check', 18)}Speichern</button><button class="btn s" data-a="of-pdf" ${d.pos.length ? '' : 'disabled'}>${ic('offer', 18)}PDF</button>${E.id ? `<button class="btn g danger" data-a="of-delete">${ic('x', 16)}</button>` : ''}</div>`;
}
function ofSug() {
  const q = OF.q.trim().toLowerCase(); if (!q || !OF.cat) return '';
  const l = OF.cat.items.filter(i => (i.name + ' ' + (i.words || '') + ' ' + (OF.cat.cats[i.cat] || '')).toLowerCase().includes(q)).slice(0, 8);
  return l.map(i => `<button class="grow" data-a="of-add" data-v="${esc(i.id)}"><span class="gmain"><b>${esc(i.name)}</b><span>${esc(OF.cat.cats[i.cat] || '')} · ${eur2(i.price)} / ${esc(i.unit)}${i.own ? '' : ' · aus Produkten'}</span></span>${ic('plus', 16)}</button>`).join('') || '<div class="grow muted small">Nichts gefunden – unter Mehr → Artikel & Pakete anlegen</div>';
}
const ofRender = () => { const y = scrollY; $('#app main').innerHTML = viewAngebot(); scrollTo(0, y); };
function ofSumPaint() { const s = $('.ofsum'); if (!s) return; const tmp = document.createElement('div'); tmp.innerHTML = viewAngebot(); const n = tmp.querySelector('.ofsum'); if (n) s.replaceWith(n); $$('.ofl-t').forEach((el, i) => { const p = OF.edit.data.pos[i]; if (p) el.textContent = eur2(p.qty * p.price); }); }
const $$ = s => [...document.querySelectorAll(s)];

/* Spracherkennung (Safari/Chrome); sonst Tastatur-Diktat */
function ofMic() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return;
  if (OF.listening && OF.rec) { OF.rec.stop(); return; }
  const r = new SR(); r.lang = 'de-DE'; r.continuous = true; r.interimResults = true; const start = OF.text ? OF.text.trim() + ', ' : '';
  r.onresult = e => { let s = ''; for (let i = 0; i < e.results.length; i++) s += e.results[i][0].transcript; OF.text = start + s; const ta = $('#of-text'); if (ta) ta.value = OF.text; };
  r.onerror = e => { if (e.error === 'not-allowed') toast('Mikrofon nicht erlaubt – in den Einstellungen freigeben oder das Diktat der Tastatur nutzen.'); };
  r.onend = () => { OF.listening = false; OF.rec = null; ofRender(); if (OF.text.trim()) ofParse(); };
  OF.rec = r; OF.listening = true; ofRender(); try { r.start(); } catch (e) { OF.listening = false; ofRender(); }
}
function ofParse() {
  const txt = ($('#of-text') || {}).value || OF.text; OF.text = txt; if (!txt.trim()) return toast('Bitte erst sprechen oder etwas eintippen.');
  const neu = parseSpeech(txt, OF.cat.items), d = OF.edit.data;
  for (const p of neu) { const ex = p.item && d.pos.find(x => x.item === p.item && !x.pkg); if (ex) ex.qty = p.qty; else d.pos.push(p); }
  d.pos = ofApplyPackages(d.pos); d.spoken = txt;
  const miss = neu.filter(p => p.check).length;
  toast(`${neu.length - miss} Position${neu.length - miss === 1 ? '' : 'en'} erkannt${miss ? ` · ${miss} bitte prüfen` : ''} – Standardleistungen ergänzt.`); ofRender();
}
async function ofPdf() {
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
  const para = t => { const l = doc.splitTextToSize(t, W - 2 * M); doc.text(l, M, y); y += l.length * 4.6 + 3; };
  para(salut); if (d.intro) para(d.intro);
  const cols = [[M, 'Pos.'], [M + 12, 'Menge'], [M + 30, 'Bezeichnung'], [W - M - 30, 'Einzelpreis'], [W - M, 'Gesamt']];
  const th = () => { doc.setFillColor(242, 243, 246); doc.rect(M, y - 4, W - 2 * M, 7, 'F'); doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...GR); cols.forEach(([x, l], i) => doc.text(l, x + (i >= 3 ? 0 : 1), y, { align: i >= 3 ? 'right' : 'left' })); y += 7; doc.setFont('helvetica', 'normal'); };
  th();
  d.pos.forEach((p, i) => {
    const nl = doc.splitTextToSize(p.name, W - 2 * M - 62), dl = p.descr && !p.check ? doc.splitTextToSize(p.descr, W - 2 * M - 62) : [], h = nl.length * 4.4 + dl.length * 3.6 + 3;
    if (y + h > 262) { doc.addPage(); head(); y = 40; th(); }
    doc.setFontSize(9.5); doc.setTextColor(...INK); doc.text(String(i + 1), M + 1, y); doc.text(`${numDe(p.qty)} ${p.unit}`, M + 12, y); doc.text(nl, M + 30, y);
    doc.text(eur2(p.price), W - M - 30, y, { align: 'right' }); doc.text(eur2(p.qty * p.price), W - M, y, { align: 'right' });
    if (dl.length) { doc.setFontSize(8); doc.setTextColor(...GR); doc.text(dl, M + 30, y + nl.length * 4.4); }
    y += h; doc.setDrawColor(...LN); doc.line(M, y - 2, W - M, y - 2); y += 2;
  });
  if (y > 230) { doc.addPage(); head(); y = 40; }
  const sr = (k, v, b) => { doc.setFont('helvetica', b ? 'bold' : 'normal'); doc.setFontSize(b ? 11 : 9.5); doc.setTextColor(...(b ? INK : GR)); doc.text(k, W - M - 60, y); doc.setTextColor(...INK); doc.text(v, W - M, y, { align: 'right' }); y += b ? 7 : 5; };
  y += 2; sr('Zwischensumme netto', eur2(T.sub)); if (T.disc) sr(`Rabatt ${numDe(d.discount)} %`, '−' + eur2(T.disc)); sr('Netto', eur2(T.net));
  Object.entries(T.tax).sort().forEach(([r, v]) => sr(`USt. ${numDe(+r)} %`, eur2(v))); sr('Gesamt brutto', eur2(T.gross), true);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); y += 4;
  if (T.tax['0'] !== undefined) { doc.setFontSize(8.5); doc.setTextColor(...GR); para('Für Photovoltaikanlagen und Stromspeicher auf bzw. an Wohngebäuden gilt der Nullsteuersatz nach § 12 Abs. 3 UStG.'); doc.setFontSize(10); doc.setTextColor(...INK); }
  if (d.outro) para(d.outro); para('Mit freundlichen Grüßen'); para(ST.user.name);
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) { doc.setPage(i); doc.setDrawColor(...LN); doc.line(M, 280, W - M, 280); doc.setFontSize(7); doc.setTextColor(...GR);
    doc.text([co.name, co.ceo ? 'Geschäftsführung: ' + co.ceo : '', co.register].filter(Boolean).join(' · '), M, 284); doc.text([co.bank, co.iban ? 'IBAN ' + co.iban : '', co.bic ? 'BIC ' + co.bic : ''].filter(Boolean).join(' · '), M, 288);
    doc.text([co.taxNo ? 'St.-Nr. ' + co.taxNo : '', co.vatId ? 'USt-IdNr. ' + co.vatId : ''].filter(Boolean).join(' · '), M, 292); doc.text(`Seite ${i} von ${pages}`, W - M, 292, { align: 'right' }); }
  const name = `Angebot_${(E.nr || 'Entwurf').replace(/[^\w-]/g, '_')}_${c.name.replace(/[^\wäöüÄÖÜß]+/g, '_')}.pdf`, blob = doc.output('blob'), file = new File([blob], name, { type: 'application/pdf' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: name }); return; } catch (e) { if (e.name === 'AbortError') return; } }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
}
const loadJs = src => new Promise((res, rej) => { if (document.querySelector(`script[src="${src}"]`)) return res(); const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Bibliothek fehlt')); document.head.appendChild(s); });

/* ---------- Artikel & Pakete (Admin/Büro) ---------- */
function viewArtikel() {
  const C = OF.cat; if (!C) return ''; const own = C.items.filter(i => i.own), prod = C.items.filter(i => !i.own), ed = OF.itemEdit;
  const form = it => `<form id="f-of-item" class="form-grid" data-id="${esc(it.id || '')}"><label style="grid-column:1/-1">Name<input name="name" value="${esc(it.name || '')}" required></label><label style="grid-column:1/-1">Beschreibung (steht im Angebot)<textarea name="descr" rows="2">${esc(it.descr || '')}</textarea></label>
    <label>Einheit<input name="unit" value="${esc(it.unit || 'Stk')}"></label><label>Preis netto €<input name="price" inputmode="decimal" value="${numDe(it.price || 0)}"></label><label>USt.<select name="tax">${[0, 7, 19].map(t => `<option value="${t}" ${+it.tax === t ? 'selected' : ''}>${t} %</option>`).join('')}</select></label>
    <label>Bereich<select name="cat">${Object.entries(C.cats).map(([k, l]) => `<option value="${k}" ${it.cat === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label><label style="grid-column:1/-1">Stichwörter für die Spracheingabe (Komma)<input name="words" value="${esc(it.words || '')}" placeholder="z. B. gerüst, absturzsicherung"></label>
    <div class="row" style="grid-column:1/-1;margin-top:12px"><button class="btn" type="submit">Speichern</button><button class="btn g" type="button" data-a="of-item-cancel">Abbrechen</button>${it.id ? `<button class="btn g danger" type="button" data-a="of-item-del" data-v="${esc(it.id)}">Löschen</button>` : ''}</div></form>`;
  const row = i => `<button class="grow" data-a="of-item-edit" data-v="${esc(i.id)}" ${i.own ? '' : 'disabled'}><span class="gmain"><b>${esc(i.name)}</b><span>${esc(C.cats[i.cat] || '')} · ${eur2(i.price)} / ${esc(i.unit)} · ${i.tax} % USt.</span></span>${i.own ? ic('next', 16) : ''}</button>`;
  return `<section class="hero"><h1>Artikel &amp; Pakete</h1><p class="muted">Was im Angebot stehen kann – und welche Standardleistungen automatisch dazukommen.</p></section>
    <section class="h-sec"><h2>Standardpakete</h2></section>
    <div class="glist">${C.packages.map(pk => `<div class="grow" style="align-items:flex-start"><span class="gic">${ic('box', 16)}</span><span class="gmain"><b>${esc(pk.name)}</b><span>wenn im Angebot: ${esc(C.cats[pk.trig] || pk.trig)}</span>
      <span style="white-space:normal;margin-top:4px">${pk.lines.map(l => { const it = C.items.find(i => i.id === 'i' + l.item || i.id === l.item); return it ? `${esc(it.name)} (${l.rule === 'perMod' ? l.qty + ' je Modul' : l.rule === 'perKwp' ? l.qty + ' je kWp' : l.qty + ' ' + esc(it.unit)})` : ''; }).filter(Boolean).join(' · ')}</span></span></div>`).join('')}</div>
    <p class="muted small" style="margin:8px 4px 0">Pakete ändern: bitte kurz Bescheid geben – die Zusammenstellung passe ich gern an (Bearbeiten in der App folgt).</p>
    <section class="h-sec"><h2>Eigene Artikel und Leistungen</h2><button class="btn sm" data-a="of-item-new">${ic('plus', 16)}Neu</button></section>
    ${ed ? `<div class="cardx">${form(ed)}</div>` : ''}
    <div class="glist">${own.map(row).join('')}</div>
    <section class="h-sec"><h2>Produkte aus der Wirtschaftlichkeit</h2></section>
    <div class="glist">${prod.map(row).join('') || '<div class="grow muted small">Keine Produkte</div>'}</div>
    <p class="muted small" style="margin:8px 4px 0">Diese Produkte samt Preis pflegst du in der Wirtschaftlichkeit unter Produkte – sie stehen hier automatisch zur Verfügung.</p>`;
}

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
      case 'of-q': { const p = d.pos[i]; p.qty = Math.max(0, Math.round((p.qty + +a.dataset.v) * 100) / 100); if (p.pkg) p.man = true; const inp = $(`[data-of="qty"][data-i="${i}"]`); if (inp) inp.value = numDe(p.qty);
        if (p.cat === 'mod' && !p.pkg) d.pos = ofApplyPackages(d.pos), ofRender(); else ofSumPaint(); return; }
      case 'of-add': { const it = OF.cat.items.find(x => x.id === a.dataset.v); if (!it) return; d.pos.push(ofPos(it, 1)); d.pos = ofApplyPackages(d.pos); OF.q = ''; return ofRender(); }
      case 'of-save': { a.disabled = true; const j = await api('of-save', { id: E.id, project: E.project, title: E.title, status: E.status, data: d }); OF.edit = j; toast(`Angebot ${j.nr} gespeichert · ${eur2(j.gross)}`); if (!location.hash.includes(j.id)) { history.replaceState(null, '', '#/angebot/' + j.id); } return ofRender(); }
      case 'of-pdf': { if (!E.id) { const j = await api('of-save', { id: E.id, project: E.project, title: E.title, status: E.status, data: d }); OF.edit = j; history.replaceState(null, '', '#/angebot/' + j.id); ofRender(); } return ofPdf(); }
      case 'of-delete': if (!confirm('Angebot löschen?')) return; await api('of-del', { id: E.id }); toast('Angebot gelöscht.'); OF.edit = null; location.hash = '#/kunde/' + E.project; return;
      case 'of-item-new': OF.itemEdit = { unit: 'Stk', tax: 19, cat: 'sonst', price: 0 }; return void ($('#app main').innerHTML = viewArtikel());
      case 'of-item-edit': OF.itemEdit = OF.cat.items.find(x => x.id === a.dataset.v); return void ($('#app main').innerHTML = viewArtikel());
      case 'of-item-cancel': OF.itemEdit = null; return void ($('#app main').innerHTML = viewArtikel());
      case 'of-item-del': if (!confirm('Artikel löschen?')) return; await api('of-item-del', { id: a.dataset.v }); OF.itemEdit = null; await ofCatalog(true); return void ($('#app main').innerHTML = viewArtikel());
    }
  } catch (err) { toast(err.message); a.disabled = false; }
});
document.addEventListener('input', e => {
  const el = e.target;
  if (el.id === 'of-q') { OF.q = el.value; const s = $('#of-sug'); if (s) s.innerHTML = ofSug(); return; }
  if (el.id === 'of-text') { OF.text = el.value; return; }
  const k = el.dataset && el.dataset.of; if (!k || !OF.edit) return; const d = OF.edit.data, i = +el.dataset.i;
  if (k === 'qty' || k === 'price') { d.pos[i][k] = parseNum(el.value); if (k === 'qty' && d.pos[i].pkg) d.pos[i].man = true; ofSumPaint(); }
  else if (k === 'name') d.pos[i].name = el.value;
  else if (k === 'discount') { d.discount = Math.max(0, Math.min(100, parseNum(el.value))); ofSumPaint(); }
  else if (k === 'title' || k === 'status') OF.edit[k] = el.value;
  else d[k] = el.value;
});
document.addEventListener('change', e => { const el = e.target; if (el.dataset && el.dataset.of === 'status' && OF.edit) OF.edit.status = el.value; if (el.dataset && el.dataset.of === 'qty' && OF.edit) { const p = OF.edit.data.pos[+el.dataset.i]; if (p && p.cat === 'mod' && !p.pkg) { OF.edit.data.pos = ofApplyPackages(OF.edit.data.pos); ofRender(); } } });
document.addEventListener('submit', async e => {
  if (e.target.id !== 'f-of-item') return; e.preventDefault(); e.stopImmediatePropagation();
  const f = e.target, d = Object.fromEntries(new FormData(f)); d.id = f.dataset.id; d.price = parseNum(d.price); d.tax = +d.tax;
  try { await api('of-item', d); OF.itemEdit = null; await ofCatalog(true); $('#app main').innerHTML = viewArtikel(); toast('Artikel gespeichert.'); } catch (err) { toast(err.message); }
}, true);
