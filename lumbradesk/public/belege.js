'use strict';
/* lumbra.desk – Rechnungen, Mahnwesen, Nummern & Texte (Update 4.0 / Wirtschaftlichkeit 3.0)
   Rechnung aus dem Angebot (komplett, Abschlag in %, Schlussrechnung mit Abzug der Abschläge), Entwurf → Festschreiben
   (Nummer aus dem Nummernkreis), PDF, E-Rechnung (XRechnung), Zahlung erfassen, Mahnstufen, Storno. */
Object.assign(IC, { check: '<path d="M20 6 9 17l-5-5"/>', refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8"/><path d="M21 3v5h-5"/>', alert: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>' });
const RB = { list: null, f: 'offen', edit: null, cfg: null, kinds: { rechnung: 'Rechnung', abschlag: 'Abschlagsrechnung', schluss: 'Schlussrechnung', storno: 'Stornorechnung' } };
const RE_ST = { entwurf: 'Entwurf', offen: 'Offen', bezahlt: 'Bezahlt', storniert: 'Storniert' };
const MAHN_L = ['Zahlungserinnerung', '1. Mahnung', '2. Mahnung'];
const dDe = s => s ? String(s).slice(0, 10).split('-').reverse().join('.') : '–';
const reAllowed = () => (ST.features || {}).rechnungen && ['admin', 'buero'].includes(ST.user.role);

/* Summen wie auf dem Server (EN 16931): Zeilen netto auf Cent, Steuer je Satz aus der Summe */
function reCalc(pos, disc) {
  const lines = [], bas = {};
  pos.forEach(x => { const t = x.tax / 100; let u = x.pm === 'brutto' ? Math.round(x.price * (1 + t) * 100) / 100 / (1 + t) : +x.price; u *= 1 - (disc || 0) / 100; u = Math.round(u * 10000) / 10000; const n = Math.round(x.qty * u * 100) / 100; lines.push({ unit: u, net: n }); bas[x.tax] = (bas[x.tax] || 0) + n; });
  const taxes = Object.entries(bas).map(([r, b]) => ({ rate: +r, base: Math.round(b * 100) / 100, tax: Math.round(b * r) / 100 })).sort((a, b) => a.rate - b.rate);
  const net = Math.round(taxes.reduce((a, t) => a + t.base, 0) * 100) / 100, tax = Math.round(taxes.reduce((a, t) => a + t.tax, 0) * 100) / 100;
  return { lines, taxes, net, tax, gross: Math.round((net + tax) * 100) / 100 };
}

/* ---------- Laden ---------- */
async function reLoad(view, arg) {
  if (!reAllowed()) return;
  if (view === 'rechnungen') { const j = await api('re-list'); RB.list = j.list; RB.mahn = j.mahn; }
  if (view === 'kunde') { try { RB.cust = (await api('re-list&p=' + encodeURIComponent(arg))).list; } catch (e) { RB.cust = []; } }
  if (view === 'belege') RB.cfg = await api('belege-cfg');
  if (view === 'rechnung') {
    await ofCatalog(); const h = location.hash.replace(/^#\/?/, '').split('/');
    if (h[1] === 'neu') {   // aus dem Angebot: erst Art wählen
      const o = await api('of-get&id=' + encodeURIComponent(h[2])); ST.cd = await api('crm-p&id=' + encodeURIComponent(o.project));
      const all = (await api('re-list&p=' + encodeURIComponent(o.project))).list.filter(r => r.offer === o.id);
      RB.edit = { pick: true, offer: o, prior: all };
    } else if (!RB.edit || RB.edit.id !== h[1] || RB.edit.pick) { const r = await api('re-get&id=' + encodeURIComponent(h[1])); RB.edit = r; ST.cd = await api('crm-p&id=' + encodeURIComponent(r.project)); }
  }
}
/* Entwurf aus dem Angebot bauen */
function reDraft(kind, o, prior, pct) {
  const ot = o.data.otype || 'pv', tx = k => ofTxDef(k, ot), d = o.data;
  const base = { project: o.project, offer: o.id, kind, date: ofIso(0), due: '', data: { pos: [], discount: 0, intro: tx('re_intro'), outro: tx('re_outro'), title: '', offerNr: o.nr, serviceDate: ofIso(0), buyerRef: '', pct: 0, prev: [] } };
  if (kind === 'rechnung' || kind === 'schluss') { base.data.pos = d.pos.map(p => ({ ...p })); base.data.discount = d.discount || 0; base.data.title = `${kind === 'schluss' ? 'Schlussrechnung' : 'Rechnung'} zu Angebot ${o.nr}`; }
  if (kind === 'schluss') base.data.prev = prior.filter(r => r.kind === 'abschlag' && ['offen', 'bezahlt'].includes(r.status)).map(r => ({ id: r.id, nr: r.nr, date: r.date, gross: r.gross }));
  if (kind === 'abschlag') {
    const T = reCalc(d.pos, d.discount || 0), n = prior.filter(r => r.kind === 'abschlag' && r.status !== 'storniert').length + 1;
    base.data.pct = pct; base.data.title = `${n}. Abschlagsrechnung zu Angebot ${o.nr}`;
    base.data.pos = T.taxes.filter(t => t.base).map(t => ({ item: '', name: `${n}. Abschlag ${numDe(pct)} % gemäß Angebot ${o.nr}${T.taxes.length > 1 ? ` (Anteil ${numDe(t.rate)} % USt.)` : ''}`, descr: `${numDe(pct)} % von ${eur2(t.base)} netto`, qty: 1, unit: 'psch', price: Math.round(t.base * pct) / 100, tax: t.rate, pm: 'netto', pausch: true, cat: '' }));
  }
  return base;
}

/* ---------- Liste „Rechnungen“ ---------- */
function viewRechnungen() {
  if (!RB.list) return '';
  const L = RB.list, F = { offen: r => r.status === 'offen', faellig: r => r.overdue, entwurf: r => r.status === 'entwurf', bezahlt: r => r.status === 'bezahlt', alle: () => true };
  const sum = f => L.filter(f).reduce((a, r) => a + r.open, 0), list = L.filter(F[RB.f] || F.offen);
  return `<section class="hero"><h1>Rechnungen</h1><p class="muted">Rechnungen, Abschläge, E-Rechnung und Mahnungen – erstellt aus dem Angebot beim Kunden.</p></section>
    <div class="kgrid3"><div class="mini"><span class="wl">Offen</span><b>${eur2(sum(F.offen))}</b><span class="ws">${L.filter(F.offen).length} Rechnungen</span></div>
      <div class="mini" style="${L.some(F.faellig) ? 'box-shadow:inset 0 0 0 2px #E5484D' : ''}"><span class="wl">Überfällig</span><b>${eur2(sum(F.faellig))}</b><span class="ws">${L.filter(F.faellig).length} zum Mahnen</span></div>
      <div class="mini"><span class="wl">Entwürfe</span><b>${L.filter(F.entwurf).length}</b><span class="ws">noch nicht gestellt</span></div></div>
    <div class="chips" style="margin-top:14px">${[['offen', 'Offen'], ['faellig', 'Überfällig'], ['entwurf', 'Entwürfe'], ['bezahlt', 'Bezahlt'], ['alle', 'Alle']].map(([k, l]) => `<button class="chip ${RB.f === k ? 'on' : ''}" data-rb="f" data-v="${k}">${l}</button>`).join('')}</div>
    <div class="card clist">${list.map(reRow).join('') || '<p class="muted" style="padding:16px">Keine Rechnungen in dieser Ansicht. Rechnungen entstehen beim Kunden aus einem Angebot („Rechnung erstellen“).</p>'}</div>`;
}
function reRow(r) {
  const tag = r.overdue ? `<span class="tag" style="background:#E5484D22;color:#E5484D">überfällig${r.level ? ' · ' + MAHN_L[r.level - 1] : ''}</span>` : `<span class="tag">${RE_ST[r.status]}${r.level ? ' · ' + MAHN_L[r.level - 1] : ''}</span>`;
  return `<a class="crow" href="#/rechnung/${esc(r.id)}"><span class="evi">${ic('offer', 18)}</span><div class="cmain"><b>${esc(r.nr || 'Entwurf')} · ${esc(r.customer || '')}</b><span class="muted">${esc(RB.kinds[r.kind] || r.kind)} · ${r.status === 'entwurf' ? 'angelegt' : 'fällig ' + dDe(r.due)} ${tag}</span></div><b class="small of-amt">${eur2(r.status === 'offen' ? r.open : r.gross - r.prepaid)}</b></a>`;
}
/* Karte beim Kunden */
function invoiceCard() {
  if (!reAllowed() || !RB.cust) return '';
  return `<div class="card sec"><div class="of-head"><h2>Rechnungen</h2></div>${RB.cust.length ? `<div class="clist flat">${RB.cust.map(r => reRow({ ...r, customer: '' })).join('')}</div>` : '<p class="muted">Noch keine Rechnung. Im Angebot auf „Rechnung erstellen“ tippen.</p>'}</div>`;
}

/* ---------- Rechnung: Art wählen / bearbeiten / ansehen ---------- */
function viewRechnung() {
  const E = RB.edit; if (!E || !ST.cd) return '<p class="muted" style="padding:30px 0">Rechnung nicht gefunden.</p>';
  const c = ST.cd.customer;
  if (E.pick) {
    const o = E.offer, ab = E.prior.filter(r => r.kind === 'abschlag' && r.status !== 'storniert'), done = ab.reduce((a, r) => a + (r.data && r.data.pct || 0), 0);
    return `<a class="backl" href="#/angebot/${esc(o.id)}">${ic('back', 18)}Angebot ${esc(o.nr)}</a><section class="hero"><h1>Rechnung erstellen</h1><p class="muted">${esc(c.name)} · Angebot ${esc(o.nr)} über ${eur2(o.gross)}</p></section>
      <div class="card clist">
        <button class="crow" data-rb="draft" data-v="rechnung"><span class="evi">${ic('offer', 18)}</span><div class="cmain"><b>Rechnung über das ganze Angebot</b><span class="muted">alle Positionen, ${eur2(o.gross)}</span></div>${ic('next', 18)}</button>
        <div class="crow" style="flex-wrap:wrap"><span class="evi">${ic('offer', 18)}</span><div class="cmain"><b>Abschlagsrechnung</b><span class="muted">Prozent vom Angebot${ab.length ? ` · bisher ${ab.length} Abschläge` : ''}</span></div>
          <div class="row" style="gap:6px;flex-wrap:wrap;width:100%;margin-top:8px">${[30, 60, 10, 50, 40].map(p => `<button class="chip" data-rb="draft" data-v="abschlag" data-p="${p}">${p} %</button>`).join('')}<input id="rb-pct" inputmode="decimal" placeholder="eigene %" style="width:110px;height:36px"><button class="btn sm s" data-rb="draft" data-v="abschlag" data-p="x">Los</button></div></div>
        <button class="crow" data-rb="draft" data-v="schluss"><span class="evi">${ic('check', 18)}</span><div class="cmain"><b>Schlussrechnung</b><span class="muted">${ab.length ? `alle Positionen abzüglich ${ab.length} Abschläge` : 'alle Positionen – noch keine Abschläge gestellt'}</span></div>${ic('next', 18)}</button></div>`;
  }
  const d = E.data, T = reCalc(d.pos, d.discount), draft = E.status === 'entwurf', pre = (d.prev || []).reduce((a, x) => a + x.gross, 0), due = T.gross - (E.kind === 'storno' ? E.prepaid : pre);
  const open = E.status === 'offen' ? Math.round((due - (E.paid || 0)) * 100) / 100 : 0, dun = d.dunning || [];
  return `<a class="backl" href="#/kunde/${esc(c.id)}">${ic('back', 18)}${esc(c.name)}</a>
    <section class="h-top" style="padding-top:8px"><div class="h-date"><i></i>${esc(RB.kinds[E.kind])} · ${esc(RE_ST[E.status])}${E.overdue ? ' · überfällig' : ''}</div><h1 class="h-title" style="font-size:30px">${draft ? 'Entwurf' : esc(E.nr)}</h1></section>
    ${draft ? '<p class="muted small" style="margin:0 4px 10px">Entwurf: noch änderbar. Beim „Festschreiben“ bekommt die Rechnung ihre Nummer und ist danach unveränderlich (Korrektur nur per Storno).</p>' : ''}
    <div class="glist ofl">${d.pos.map((p, i) => `<div class="ofp"><div class="ofp-h"><span class="ofn">${i + 1}</span>${draft ? `<input class="ofi-name" data-re="name" data-i="${i}" value="${esc(p.name)}"><button class="xbtn" data-rb="pdel" data-v="${i}" aria-label="Position löschen">${ic('x', 14)}</button>` : `<b class="ofi-ro">${esc(p.name)}</b>`}</div>
        ${p.descr ? `<div class="ofd">${esc(p.descr)}</div>` : ''}
        <div class="ofp-r">${draft ? `<input class="ofi-pr" style="width:72px" inputmode="decimal" data-re="qty" data-i="${i}" value="${numDe(p.qty)}"><span class="muted small">${esc(p.unit)} ×</span><input class="ofi-pr" inputmode="decimal" data-re="price" data-i="${i}" value="${numDe(T.lines[i].unit)}">` : `<span class="muted small">${numDe(p.qty)} ${esc(p.unit)} × ${eur2(T.lines[i].unit)}</span>`}<span class="muted small">netto · ${numDe(p.tax)} %</span><b class="ofl-t">${eur2(T.lines[i].net)}</b></div></div>`).join('')}</div>
    <div class="cardx sec ofsum" id="re-sum">${reSumHTML(E, T, pre)}</div>
    <section class="h-sec"><h2>Angaben</h2></section>
    <div class="cardx form-grid ofmeta">
      <label>Rechnungsdatum<input type="date" data-re="date" value="${esc(E.date || '')}" ${draft ? '' : 'disabled'}></label><label>Fällig am<input type="date" data-re="due" value="${esc(E.due || '')}" ${draft ? '' : 'disabled'}></label>
      <label>Leistungsdatum<input type="date" data-re="serviceDate" value="${esc(d.serviceDate || '')}" ${draft ? '' : 'disabled'}></label><label>Ihr Zeichen / Leitweg-ID<input data-re="buyerRef" value="${esc(d.buyerRef || '')}" placeholder="nur bei Firmen/Behörden" ${draft ? '' : 'disabled'}></label>
      ${[['intro', 're_intro', 'Einleitung'], ['outro', 're_outro', 'Schlusstext']].map(([k, tk, l]) => { const tl = ofTx(tk, 'alle'); return `<label style="grid-column:1/-1"><span class="flex-lbl">${l}${draft && tl.length ? `<select class="txsel" data-rtx="${k}" data-tk="${tk}"><option value="">Textbaustein …</option>${tl.map(t => `<option value="${esc(t.id)}">${esc(t.name)}</option>`).join('')}</select>` : ''}</span><textarea rows="2" data-re="${k}" ${draft ? '' : 'disabled'}>${esc(d[k] || '')}</textarea></label>`; }).join('')}
      <p class="muted small" style="grid-column:1/-1;margin:0">Platzhalter: {Kunde}, {Nummer}, {Datum}, {Betrag}, {Fällig}.</p></div>
    ${!draft && E.kind !== 'storno' ? `<section class="h-sec"><h2>Zahlung &amp; Mahnwesen</h2></section><div class="cardx">
      ${E.status === 'offen' ? `<div class="form-grid"><label>Bezahlt (gesamt)<input id="re-paid" inputmode="decimal" value="${numDe(E.paid ? E.paid : due)}"></label><label>Zahlungseingang am<input id="re-paidat" type="date" value="${ofIso(0)}"></label></div><button class="btn s" style="margin-top:8px" data-rb="paid">${ic('check', 16)}Zahlung erfassen</button>` : `<p class="muted">${E.status === 'bezahlt' ? `Bezahlt am ${dDe(E.paidAt)}` : 'Storniert'}.</p>`}
      ${dun.length ? `<div class="clist flat" style="margin-top:10px">${dun.map((m, i) => `<div class="crow"><span class="evi">${ic('alert', 18)}</span><div class="cmain"><b>${MAHN_L[m.level - 1]}</b><span class="muted">vom ${dDe(m.date)} · Frist ${dDe(m.due)}${m.fee ? ' · Gebühr ' + eur2(m.fee) : ''}</span></div><button class="btn sm s" data-rb="mpdf" data-v="${i}">PDF</button></div>`).join('')}</div>` : ''}
      ${E.status === 'offen' && open > 0 && dun.length < 3 ? `<button class="btn ${E.overdue ? '' : 's'}" style="margin-top:10px" data-rb="dun">${ic('alert', 16)}${MAHN_L[dun.length]} erstellen</button>${E.overdue ? '' : '<span class="muted small" style="margin-left:8px">noch nicht fällig</span>'}` : ''}
    </div>` : ''}
    <div class="ofbar">${draft ? `<button class="btn" data-rb="save">${ic('check', 18)}Speichern</button><button class="btn s" data-rb="prev">Vorschau</button><button class="btn s" data-rb="final">Festschreiben</button><button class="btn g danger" data-rb="del">${ic('x', 16)}</button>`
      : `<button class="btn" data-rb="pdf">${ic('offer', 18)}PDF</button><button class="btn s" data-rb="xml">E-Rechnung</button>${E.status !== 'storniert' && E.kind !== 'storno' ? '<button class="btn g danger" data-rb="storno">Storno</button>' : ''}`}</div>`;
}
function reSumHTML(E, T, pre) {
  const due = T.gross - pre;
  return `<div class="sr"><span>Summe netto</span><span>${eur2(T.net)}</span></div>${T.taxes.map(t => `<div class="sr muted"><span>USt. ${numDe(t.rate)} % auf ${eur2(t.base)}${t.rate === 0 ? ' (§ 12 Abs. 3 UStG)' : ''}</span><span>${eur2(t.tax)}</span></div>`).join('')}
    <div class="sr ${pre ? '' : 'big2'}"><span>Gesamt brutto</span><span>${eur2(T.gross)}</span></div>
    ${pre ? (E.data.prev || []).map(x => `<div class="sr muted"><span>abzgl. ${esc(x.nr)} vom ${dDe(x.date)}</span><span>−${eur2(x.gross)}</span></div>`).join('') + `<div class="sr big2"><span>Zu zahlen</span><span>${eur2(due)}</span></div>` : ''}`;
}
const reRender = () => { const y = scrollY; $('#app main').innerHTML = viewRechnung(); scrollTo(0, y); };
function reSumPaint() { const E = RB.edit, s = $('#re-sum'); if (!s || !E || E.pick) return; const T = reCalc(E.data.pos, E.data.discount); s.innerHTML = reSumHTML(E, T, (E.data.prev || []).reduce((a, x) => a + x.gross, 0)); $$('.ofl-t').forEach((el, i) => { if (T.lines[i]) el.textContent = eur2(T.lines[i].net); }); }

/* ---------- PDF: Rechnung und Mahnung ---------- */
async function rePdf(mahnIdx) {
  await loadJs('rechner/vendor/jspdf.umd.min.js');
  const { jsPDF } = window.jspdf, doc = new jsPDF({ unit: 'mm', format: 'a4' }), E = RB.edit, d = E.data, c = ST.cd.customer, co = OF.cat.company || {}, T = reCalc(d.pos, d.discount);
  const W = 210, M = 18, INK = [18, 23, 42], GR = [110, 116, 130], LN = [225, 228, 234], pre = (d.prev || []).reduce((a, x) => a + x.gross, 0), M0 = mahnIdx !== undefined ? d.dunning[mahnIdx] : null;
  let logo = null; if (co.logoFile) { try { const b = await (await fetch('api/?r=cfg-file&id=' + encodeURIComponent(co.logoFile), { credentials: 'same-origin' })).blob(); logo = await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); }); } catch (e) {} }
  const head = () => { if (logo) { try { const p = doc.getImageProperties(logo), w = Math.min(60, p.width / p.height * 14); doc.addImage(logo, M, 12, w, w * p.height / p.width); } catch (e) {} } else { doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(...INK); doc.text(co.name || '', M, 20); }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...GR); doc.text([co.name, co.street, [co.zip, co.city].filter(Boolean).join(' '), co.phone, co.email].filter(Boolean), W - M, 14, { align: 'right' }); };
  head(); doc.setFontSize(7); doc.setTextColor(...GR); doc.text([co.name, co.street, [co.zip, co.city].filter(Boolean).join(' ')].filter(Boolean).join(' · '), M, 46);
  doc.setFontSize(10.5); doc.setTextColor(...INK); doc.text([c.name, c.street, [c.zip, c.city].filter(Boolean).join(' ')].filter(Boolean), M, 52);
  const title = M0 ? MAHN_L[M0.level - 1] : (d.title || RB.kinds[E.kind]);
  const meta = M0 ? [['Datum', dDe(M0.date)], ['Rechnung', E.nr], ['Rechnungsdatum', dDe(E.date)], ['Zahlbar bis', dDe(M0.due)]]
    : [[RB.kinds[E.kind] + '-Nr.', E.nr || '(Entwurf)'], ['Rechnungsdatum', dDe(E.date)], ['Leistungsdatum', dDe(d.serviceDate || E.date)], ...(d.offerNr ? [['Angebot', d.offerNr]] : []), ...(d.buyerRef ? [['Ihr Zeichen', d.buyerRef]] : []), ['Zahlbar bis', dDe(E.due)]];
  doc.setFontSize(9); meta.forEach(([k, v], i) => { doc.setTextColor(...GR); doc.text(k, 128, 52 + i * 5); doc.setTextColor(...INK); doc.text(String(v), W - M, 52 + i * 5, { align: 'right' }); });
  doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.text(title, M, 88); doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  let y = 96; const para = t => { for (const ln of doc.splitTextToSize(t, W - 2 * M)) { if (y > 272) { doc.addPage(); head(); y = 40; } doc.text(ln, M, y); y += 4.6; } y += 3; };
  const salut = /^Familie|^Frau/i.test(c.name) ? `Sehr geehrte ${c.name},` : /^Herr/i.test(c.name) ? `Sehr geehrter ${c.name},` : 'Sehr geehrte Damen und Herren,';
  const PH = { Kunde: c.name, Nummer: E.nr || '', Datum: dDe(E.date), Betrag: eur2(T.gross - pre - (E.paid || 0) + (M0 ? d.dunning.slice(0, mahnIdx + 1).reduce((a, m) => a + (m.fee || 0), 0) : 0)), Fällig: dDe(M0 ? M0.due : E.due) };
  const sr = (k, v, b, lx) => { if (y > 268) { doc.addPage(); head(); y = 40; } doc.setFont('helvetica', b ? 'bold' : 'normal'); doc.setFontSize(b ? 11 : 9.5); doc.setTextColor(...(b ? INK : GR)); doc.text(k, lx || W - M - 75, y); doc.setTextColor(...INK); doc.text(v, W - M, y, { align: 'right' }); y += b ? 7 : 5; };
  para(salut);
  if (M0) {
    const tx = ((OF.cat.texte || []).find(t => t.kind === 'mahn' + M0.level && t.def) || (OF.cat.texte || []).find(t => t.kind === 'mahn' + M0.level) || {}).text || '';
    para(ofFill(tx, PH)); y += 2;
    const open = T.gross - pre - (E.paid || 0), fees = d.dunning.slice(0, mahnIdx + 1).reduce((a, m) => a + (m.fee || 0), 0);
    sr(`Rechnung ${E.nr} vom ${dDe(E.date)}`, eur2(T.gross - pre), false, M); if (E.paid) sr('bereits gezahlt', '−' + eur2(E.paid), false, M); if (fees) sr('Mahngebühren', eur2(fees), false, M); sr('Offener Betrag', eur2(open + fees), true, M);
    y += 4; doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...INK);
    para(`Bitte überweisen Sie ${eur2(open + fees)} bis zum ${dDe(M0.due)} auf ${co.iban ? 'IBAN ' + co.iban : 'unser Konto'} – Verwendungszweck: ${E.nr}.`);
  } else {
    if (d.intro) para(ofFill(d.intro, PH));
    const cols = [[M, 'Pos.'], [M + 12, 'Menge'], [M + 32, 'Bezeichnung'], [W - M - 48, 'USt.'], [W - M - 26, 'Einzelpreis'], [W - M, 'Gesamt netto']], wN = W - 2 * M - 100;
    const th = () => { doc.setFillColor(242, 243, 246); doc.rect(M, y - 4, W - 2 * M, 7, 'F'); doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...GR); cols.forEach(([x, l], i) => doc.text(l, x + (i >= 3 ? 0 : 1), y, { align: i >= 3 ? 'right' : 'left' })); y += 7; doc.setFont('helvetica', 'normal'); };
    th();
    d.pos.forEach((p, i) => {
      const nl = doc.splitTextToSize(p.name, wN), dl = p.descr ? doc.splitTextToSize(p.descr, wN) : [], h = nl.length * 4.4 + dl.length * 3.6 + 3;
      if (y + h > 262) { doc.addPage(); head(); y = 40; th(); }
      doc.setFontSize(9); doc.setTextColor(...INK); doc.text(String(i + 1), M + 1, y); doc.text(`${numDe(p.qty)} ${p.unit}`, M + 12, y); doc.text(nl, M + 32, y);
      doc.text(numDe(p.tax) + ' %', W - M - 48, y, { align: 'right' }); doc.text(eur2(T.lines[i].unit), W - M - 26, y, { align: 'right' }); doc.text(eur2(T.lines[i].net), W - M, y, { align: 'right' });
      if (dl.length) { doc.setFontSize(7.8); doc.setTextColor(...GR); doc.text(dl, M + 32, y + nl.length * 4.4); }
      y += h; doc.setDrawColor(...LN); doc.line(M, y - 2, W - M, y - 2); y += 2;
    });
    if (y > 225) { doc.addPage(); head(); y = 40; }
    y += 2; sr('Summe netto', eur2(T.net)); T.taxes.forEach(t => sr(`USt. ${numDe(t.rate)} % auf ${eur2(t.base)}`, eur2(t.tax))); sr('Gesamt brutto', eur2(T.gross), !pre);
    if (pre) { (d.prev || []).forEach(x => sr(`abzgl. ${x.nr} vom ${dDe(x.date)}`, '−' + eur2(x.gross))); sr('Zu zahlen', eur2(T.gross - pre), true); }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...INK); y += 4;
    if (T.taxes.some(t => t.rate === 0)) { doc.setFontSize(8.5); doc.setTextColor(...GR); para('Für Photovoltaikanlagen und Stromspeicher auf bzw. an Wohngebäuden gilt der Nullsteuersatz nach § 12 Abs. 3 UStG.'); doc.setFontSize(10); doc.setTextColor(...INK); }
    if (E.kind === 'storno' && d.ref) para(`Diese Stornorechnung hebt die Rechnung ${d.ref} vom ${dDe(d.refDate)} vollständig auf.`);
    if (d.outro) para(ofFill(d.outro, PH));
  }
  para('Mit freundlichen Grüßen'); para(co.name || ST.user.name);
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) { doc.setPage(i); doc.setDrawColor(...LN); doc.line(M, 280, W - M, 280); doc.setFontSize(7); doc.setTextColor(...GR);
    doc.text([co.name, co.ceo ? 'Geschäftsführung: ' + co.ceo : '', co.register].filter(Boolean).join(' · '), M, 284); doc.text([co.bank, co.iban ? 'IBAN ' + co.iban : '', co.bic ? 'BIC ' + co.bic : ''].filter(Boolean).join(' · '), M, 288);
    doc.text([co.taxNo ? 'St.-Nr. ' + co.taxNo : '', co.vatId ? 'USt-IdNr. ' + co.vatId : ''].filter(Boolean).join(' · '), M, 292); doc.text(`Seite ${i} von ${pages}`, W - M, 292, { align: 'right' }); }
  const nm = `${M0 ? MAHN_L[M0.level - 1].replace(/\W+/g, '_') : RB.kinds[E.kind]}_${(E.nr || 'Entwurf').replace(/[^\w-]/g, '_')}_${c.name.replace(/[^\wäöüÄÖÜß]+/g, '_')}.pdf`;
  return { blob: doc.output('blob'), name: nm };
}
async function reShare(mahnIdx) {
  const { blob, name } = await rePdf(mahnIdx), file = new File([blob], name, { type: 'application/pdf' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: name }); return; } catch (e) { if (e.name === 'AbortError') return; } }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/* ---------- Einstellungen: Nummern & Texte, Mahnwesen ---------- */
function viewBelege() {
  const C = RB.cfg; if (!C) return ''; const N = C.nummern, K = C.kinds, tx = RB.txEdit || C.texte;
  const numBox = (t, l) => `<div class="cardx"><div class="h3x">${l}</div><div class="form-grid" style="margin-top:8px"><label>Format<input data-bn="${t}" data-k="fmt" value="${esc(N[t].fmt)}"></label><label>Nächste Nummer<input data-bn="${t}" data-k="next" inputmode="numeric" value="${N[t].next}"></label>
      <label class="sw" style="grid-column:1/-1"><input type="checkbox" data-bn="${t}" data-k="yearly" ${N[t].yearly ? 'checked' : ''}>Jedes Jahr wieder bei 1 beginnen</label></div><p class="muted small" style="margin:6px 0 0">Nächste: <b>${esc(N[t].preview)}</b></p></div>`;
  return `<section class="hero"><h1>Nummern &amp; Texte</h1><p class="muted">Nummernkreise für Angebote und Rechnungen, Textbausteine und Mahnwesen.</p></section>
    <section class="h-sec"><h2>Nummernkreise</h2></section>${numBox('an', 'Angebote')}${numBox('re', 'Rechnungen')}
    <p class="muted small" style="margin:6px 4px 0">Platzhalter: {JJJJ} Jahr, {JJ} Jahr zweistellig, {MM} Monat, {NNNN} laufende Nummer (Anzahl N = Stellen). Beispiel: „AN-{JJJJ}-{NNNN}“ → AN-2026-0001. Die erste Nummer legst du mit „Nächste Nummer“ fest.</p>
    <button class="btn" style="margin-top:10px" data-bs="num">Nummernkreise speichern</button>
    <section class="h-sec"><h2>Textbausteine</h2><button class="btn sm" data-bs="tx-add">${ic('plus', 16)}Neu</button></section>
    ${tx.map((t, i) => `<div class="cardx txb"><div class="form-grid"><label>Art<select data-bt="${i}" data-k="kind">${Object.entries(K).map(([k, l]) => `<option value="${k}" ${t.kind === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <label>Für<select data-bt="${i}" data-k="otype">${[['alle', 'alle'], ['pv', 'Photovoltaik'], ['wp', 'Wärmepumpe']].map(([k, l]) => `<option value="${k}" ${t.otype === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <label>Name<input data-bt="${i}" data-k="name" value="${esc(t.name)}"></label><label class="sw" style="align-self:end;min-height:44px"><input type="checkbox" data-bt="${i}" data-k="def" ${t.def ? 'checked' : ''}>Standard</label>
      <label style="grid-column:1/-1">Text<textarea rows="3" data-bt="${i}" data-k="text">${esc(t.text)}</textarea></label></div><button class="btn sm g danger" data-bs="tx-del" data-v="${i}">Löschen</button></div>`).join('')}
    <p class="muted small" style="margin:6px 4px 0">„Standard“ wird bei neuen Angeboten bzw. Rechnungen automatisch eingesetzt (je Art und Angebotsart). Platzhalter: {Kunde}, {Nummer}, {Datum}, {Betrag}, {Fällig}, {Gültig}.</p>
    <button class="btn" style="margin-top:10px" data-bs="tx">Textbausteine speichern</button>
    <section class="h-sec"><h2>Mahnwesen</h2></section>
    <div class="cardx"><div class="form-grid"><label>Zahlungsziel Rechnung (Tage)<input data-bm="ziel" inputmode="numeric" value="${C.mahn.ziel}"></label><span></span>
      ${MAHN_L.map((l, i) => `<label>${l}: Frist (Tage)<input data-bm="frist" data-i="${i}" inputmode="numeric" value="${C.mahn.frist[i]}"></label><label>${l}: Gebühr €<input data-bm="fee" data-i="${i}" inputmode="decimal" value="${numDe(C.mahn.fee[i])}"></label>`).join('')}</div>
      <p class="muted small" style="margin:8px 0 0">Bei Privatkunden sind nur die tatsächlichen Kosten als Mahngebühr zulässig (meist wenige Euro) – im Zweifel 0 € lassen.</p>
      <button class="btn" style="margin-top:10px" data-bs="mahn">Mahnwesen speichern</button></div>`;
}

/* ---------- Bedienung ---------- */
document.addEventListener('click', async e => {
  const a = e.target.closest('[data-rb],[data-bs]'); if (!a) return; e.preventDefault();
  const E = RB.edit, k = a.dataset.rb || 'bs:' + a.dataset.bs, v = a.dataset.v;
  try {
    if (k === 'f') { RB.f = v; $('#app main').innerHTML = viewRechnungen(); return; }
    if (k === 'draft') {
      let pct = 0; if (v === 'abschlag') { pct = a.dataset.p === 'x' ? parseNum(($('#rb-pct') || {}).value) : +a.dataset.p; if (!(pct > 0 && pct <= 100)) return toast('Bitte einen Prozentsatz zwischen 1 und 100 eingeben.'); }
      const dr = reDraft(v, E.offer, E.prior, pct); a.disabled = true; const r = await api('re-save', dr); RB.edit = r; location.hash = '#/rechnung/' + r.id; toast(`${RB.kinds[v]} als Entwurf angelegt – prüfen und festschreiben.`); return;
    }
    if (k === 'pdel') { E.data.pos.splice(+v, 1); return reRender(); }
    if (k === 'save' || k === 'final' || k === 'prev') {
      const r = await api('re-save', { id: E.id, project: E.project, offer: E.offer, kind: E.kind, date: E.date, due: E.due, data: E.data }); RB.edit = r;
      if (k === 'prev') { reRender(); return reShare(); }
      if (k === 'final') { if (!confirm('Rechnung festschreiben? Sie bekommt jetzt ihre Nummer und kann danach nicht mehr geändert werden.')) return reRender(); RB.edit = await api('re-final', { id: E.id }); toast(`${RB.kinds[RB.edit.kind]} ${RB.edit.nr} gestellt.`); }
      else toast('Gespeichert.'); return reRender();
    }
    if (k === 'del') { if (!confirm('Entwurf löschen?')) return; await api('re-del', { id: E.id }); toast('Entwurf gelöscht.'); location.hash = '#/kunde/' + E.project; return; }
    if (k === 'pdf') return reShare();
    if (k === 'mpdf') return reShare(+v);
    if (k === 'xml') {
      const res = await fetch('api/?r=re-xml&id=' + encodeURIComponent(E.id), { credentials: 'same-origin' });
      if (!res.ok) throw new Error(((await res.json().catch(() => ({}))).error) || 'E-Rechnung nicht möglich');
      const blob = await res.blob(), name = `XRechnung_${E.nr.replace(/[^\w-]/g, '_')}.xml`, file = new File([blob], name, { type: 'application/xml' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: name }); return; } catch (err) { if (err.name === 'AbortError') return; } }
      const l = document.createElement('a'); l.href = URL.createObjectURL(blob); l.download = name; document.body.appendChild(l); l.click(); l.remove(); return;
    }
    if (k === 'paid') { RB.edit = await api('re-paid', { id: E.id, amount: parseNum($('#re-paid').value), date: $('#re-paidat').value }); toast(RB.edit.status === 'bezahlt' ? 'Als bezahlt markiert.' : 'Teilzahlung erfasst.'); return reRender(); }
    if (k === 'dun') { RB.edit = await api('re-dun', { id: E.id }); const lv = RB.edit.data.dunning.length; toast(MAHN_L[lv - 1] + ' erstellt.'); reRender(); return reShare(lv - 1); }
    if (k === 'storno') { if (!confirm('Rechnung stornieren? Es wird eine Stornorechnung mit eigener Nummer erstellt.')) return; const s = await api('re-storno', { id: E.id }); toast('Stornorechnung ' + s.nr + ' erstellt.'); RB.edit = s; location.hash = '#/rechnung/' + s.id; return; }
    /* Einstellungen */
    const C = RB.cfg;
    if (k === 'bs:num') { const val = {}; for (const t of ['an', 're']) { val[t] = { fmt: $(`[data-bn="${t}"][data-k="fmt"]`).value, yearly: $(`[data-bn="${t}"][data-k="yearly"]`).checked }; const nx = parseInt($(`[data-bn="${t}"][data-k="next"]`).value, 10); if (nx !== C.nummern[t].next) val[t].next = nx; }
      C.nummern = (await api('belege-cfg', { part: 'nummern', value: val })).nummern; toast('Nummernkreise gespeichert.'); }
    if (k === 'bs:tx-add') { RB.txEdit = (RB.txEdit || C.texte).concat({ id: '', kind: 'outro', otype: 'alle', def: false, name: 'Neuer Text', text: '' }); }
    if (k === 'bs:tx-del') { if (!confirm('Textbaustein löschen?')) return; RB.txEdit = (RB.txEdit || C.texte).filter((x, i) => i !== +v); }
    if (k === 'bs:tx') { C.texte = (await api('belege-cfg', { part: 'texte', value: RB.txEdit || C.texte })).texte; RB.txEdit = null; await ofCatalog(true); toast('Textbausteine gespeichert.'); }
    if (k === 'bs:mahn') { const g = (n, i) => $(`[data-bm="${n}"]${i === undefined ? '' : `[data-i="${i}"]`}`).value; C.mahn = (await api('belege-cfg', { part: 'mahn', value: { ziel: +g('ziel'), frist: [0, 1, 2].map(i => +g('frist', i)), fee: [0, 1, 2].map(i => parseNum(g('fee', i))) } })).mahn; toast('Mahnwesen gespeichert.'); }
    if (k.startsWith('bs:')) { const y = scrollY; $('#app main').innerHTML = viewBelege(); scrollTo(0, y); }
  } catch (err) { toast(err.message); a.disabled = false; }
});
document.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset && el.dataset.bt !== undefined) { const C = RB.cfg; RB.txEdit = RB.txEdit || C.texte.map(t => ({ ...t })); const t = RB.txEdit[+el.dataset.bt]; t[el.dataset.k] = el.type === 'checkbox' ? el.checked : el.value; return; }
  const k = el.dataset && el.dataset.re, E = RB.edit; if (!k || !E || E.pick || E.status !== 'entwurf') return; const i = +el.dataset.i;
  if (k === 'qty') { E.data.pos[i].qty = parseNum(el.value); reSumPaint(); }
  else if (k === 'price') { const p = E.data.pos[i]; p.price = parseNum(el.value) / (1 - (E.data.discount || 0) / 100); p.pm = 'netto'; reSumPaint(); }
  else if (k === 'name') E.data.pos[i].name = el.value;
  else if (k === 'date' || k === 'due') E[k] = el.value;
  else E.data[k] = el.value;
});
document.addEventListener('change', e => {
  const el = e.target; if (el.dataset && el.dataset.bt !== undefined && el.type === 'checkbox') { const C = RB.cfg; RB.txEdit = RB.txEdit || C.texte.map(t => ({ ...t })); RB.txEdit[+el.dataset.bt][el.dataset.k] = el.checked; return; }
  if (el.dataset && el.dataset.bt !== undefined && el.tagName === 'SELECT') { const C = RB.cfg; RB.txEdit = RB.txEdit || C.texte.map(t => ({ ...t })); RB.txEdit[+el.dataset.bt][el.dataset.k] = el.value; return; }
  if (el.dataset && el.dataset.rtx && RB.edit && el.value) { const t = ((OF.cat || {}).texte || []).find(x => x.id === el.value); if (t) { RB.edit.data[el.dataset.rtx] = t.text; const ta = $(`textarea[data-re="${el.dataset.rtx}"]`); if (ta) ta.value = t.text; } el.value = ''; }
});
