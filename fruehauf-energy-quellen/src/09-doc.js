
/* =========================================================
   Kundendokument
   ========================================================= */
const PAGE_KEYS = ['cover', 'summary', 'situation', 'year', 'howWP', 'howPV', 'invest', 'variants', 'monthly', 'finance', 'prices', 'why', 'leisure', 'roadmap', 'sign', 'attach'];
const DOC_TEXT = {
  cover: { label: 'Deckblatt', title: '', lead: '' },
  summary: { label: 'Ihr Angebot auf einen Blick', title: 'Ihr Angebot auf einen Blick', lead: 'Die wichtigsten Zahlen Ihrer persönlichen Berechnung – und warum sich der Schritt lohnt.' },
  situation: { label: 'Ausgangssituation & Energiesystem', title: 'Ausgangssituation & Energiesystem', lead: 'Ihre heutige Situation und das neue Energiesystem auf einen Blick.' },
  year: { label: 'Ihr Strom übers Jahr', title: 'Ihr Strom übers Jahr', lead: 'Wann Ihr Haus Strom braucht – und wann die Sonne ihn liefert.' },
  howWP: { label: 'So funktioniert eine Wärmepumpe', title: 'So funktioniert eine Wärmepumpe', lead: 'Im Prinzip wie ein Kühlschrank – nur umgekehrt: Sie holt Wärme aus der Umgebung ins Haus.' },
  howPV: { label: 'So funktioniert Ihre Photovoltaikanlage', title: 'So funktioniert Ihre Photovoltaikanlage', lead: 'Ihr Dach wird zum Kraftwerk: Solarstrom wird zuerst im Haus genutzt, Überschüsse werden gespeichert oder eingespeist.' },
  invest: { label: 'Investition & Förderung, Energiebilanz', title: 'Investition & Förderung', lead: 'Was Ihre Anlage kostet – und was davon der Staat übernimmt.' },
  monthly: { label: 'Ihre monatlichen Energiekosten', title: 'Ihre monatlichen Energiekosten', lead: 'So entwickeln sich Ihre Energiekosten pro Monat – heute und in Zukunft.' },
  finance: { label: 'Finanzielle Bilanz & Ersparnis', title: 'Finanzielle Bilanz & Ersparnis', lead: 'Ab wann sich Ihre Investition rechnet – und was danach übrig bleibt.' },
  prices: { label: 'Energiepreise: Rückblick & Ausblick', title: 'Energiepreise: 20 Jahre Rückblick & Ausblick', lead: 'Historische Preise (Fläche) und Prognose bis 2040 (gestrichelt).' },
  why: { label: 'Warum Öl und Gas teurer werden', title: 'Warum Öl und Gas langfristig teurer werden', lead: 'Vier Entwicklungen, die heute schon feststehen.' },
  leisure: { label: 'Was Sie sich leisten können', title: 'Was Sie sich in {jahre} Jahren leisten können', lead: 'Ihre Ersparnis – greifbar gemacht.' },
  variants: { label: 'Varianten im Vergleich', title: 'Ihre Varianten im Vergleich', lead: 'Dieselbe Rechnung für verschiedene Ausstattungen – so sehen Sie, was sich für Sie am meisten lohnt.' },
  roadmap: { label: 'Roadmap nach der Unterschrift', title: 'So geht es nach Ihrer Unterschrift weiter', lead: 'Von der Unterschrift bis zur fertigen Anlage – Schritt für Schritt, mit einem festen Ansprechpartner.' },
  sign: { label: 'Angebot annehmen', title: 'Angebot annehmen', lead: 'Überzeugt? Dann können Sie Ihren Auftrag direkt hier erteilen.' },
  attach: { label: 'Anlagen', title: '', lead: '' },
  assump: { label: 'Berechnungsannahmen', title: 'Berechnungsannahmen', lead: 'Grundlagen dieser Berechnung.' }
};
const docOrder = () => { const o = (S.doc.order || []).filter(k => PAGE_KEYS.includes(k)); return o.concat(PAGE_KEYS.filter(k => !o.includes(k))); };
let CUR_KEY = '';
const txt = (key, field) => { const o = S.doc.texts[key] || {}; const v = o[field]; return v !== undefined && v !== '' ? v : DOC_TEXT[key][field]; };
function attachmentPages(p) {
  const order = { offerWP: 0, offer: 0, offerPV: 1, tech: 2 };
  const label = { offer: 'Angebot', offerWP: 'Angebot Wärmepumpe', offerPV: 'Angebot Photovoltaik', tech: 'Technische Unterlagen' };
  const out = [];
  p.docs.filter(d => d.attach).sort((a, b) => order[a.role] - order[b.role]).forEach(d => {
    const sel = d.pages.filter((_, i) => d.sel[i]);
    sel.forEach((f, i) => out.push({ file: f, label: `Anlage · ${label[d.role]}${d.role === 'tech' ? ' – ' + d.name.replace(/\.[a-z]+$/i, '') : ''} ${i + 1}/${sel.length}` }));
  });
  return out;
}
function financeAutoHidden(R) { return R.amortRise === null || R.amortRise > S.calc.hideFinanceAbove; }
function docPageDefs(p, R) {
  const o = p.pages || {}, fin = financeAutoHidden(R), att = attachmentPages(p), dflt = S.doc.defaults || {};
  const yearOk = R.W ? R.hpPower > 0 : R.yield > 0;
  const finNote = fin ? `Automatisch ausgeblendet: Amortisation mit steigenden Preisen über ${S.calc.hideFinanceAbove} Jahren` : '';
  const spec = {
    cover: [true, true], summary: [true, true], situation: [true, true], year: [yearOk, true, yearOk ? '' : (R.W ? 'Braucht den Verbrauch der Heizung' : 'Braucht die Anlagenleistung')],
    howWP: [R.W, true], howPV: [R.V, true], invest: [true, true], monthly: [true, true], finance: [true, !fin, finNote],
    prices: [true, !!S.prices.showPages], why: [R.W, !!S.prices.showPages], leisure: [true, !fin, finNote], variants: [(p.variants || []).length > 0, true], roadmap: [true, true], reviews: [reviewsOn(), true], sign: [true, !!S.discount.signPage], attach: [att.length > 0, true]
  };
  return docOrder().map(key => {
    const [applies, auto, note = ''] = spec[key];
    const def = key === 'finance' || key === 'leisure' ? auto && dflt[key] !== false : (dflt[key] !== undefined ? dflt[key] && auto : auto);
    const label = key === 'attach' ? `Anlagen (${att.length} ${att.length === 1 ? 'Seite' : 'Seiten'})` : txt(key, 'label').replace('{jahre}', R.N);
    return { key, label, applies, on: applies && (o[key] !== undefined ? !!o[key] : def), note: applies && o[key] === undefined ? note : (!applies ? note : ''), count: key === 'attach' ? att.length : 1 };
  });
}
function showAssumptions(p, R) { if (R.scen === 'opt') return true; return p.docOpts.assumptions !== undefined ? !!p.docOpts.assumptions : !!S.calc.showAssump2; }
function visiblePages(p, R) {
  const defs = docPageDefs(p, R).filter(d => d.on);
  if (!defs.find(d => d.key === 'leisure') && showAssumptions(p, R)) { const i = defs.findIndex(d => d.key === 'roadmap' || d.key === 'sign' || d.key === 'attach'); const a = { key: 'assump', label: 'Berechnungsannahmen', on: true, count: 1 }; if (i < 0) defs.push(a); else defs.splice(i, 0, a); }
  return defs;
}
const coName = () => S.company.name || 'Frühauf Energy';
const custName = p => [p.customer.salutation && p.customer.salutation !== 'Firma' ? p.customer.salutation : '', p.customer.name].filter(Boolean).join(' ') || 'Kunde';
const custAddr = p => [p.customer.street, [p.customer.zip, p.customer.city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
function logoImgUrl() { return fileUrl(S.company.logoFile) || S.company.logoUrl || ''; }
function docLogo() { const u = logoImgUrl(); return u ? `<img src="${esc(u)}" alt="">` : `${sunMark(30)}<span>${esc(coName())}</span>`; }
function advisorOf(p) {
  const n = String(p.offer.advisor || '').trim().toLowerCase(), list = S.company.advisors || [];
  const a = list.find(x => x.id === p.offer.advisorId && (!n || x.name.trim().toLowerCase() === n)) || list.find(x => x.name && x.name.trim().toLowerCase() === n) || list.find(x => x.name && n && (x.name.toLowerCase().includes(n) || n.includes(x.name.toLowerCase()))) || (!n && list[0]);
  // Profil dieses Geräts (Mein Profil): gilt, wenn der Berater im Projekt diese Person ist – Foto und Kontakt haben Vorrang
  const pr = PERSONAL.profile || {}, prName = String(pr.name || '').trim().toLowerCase();
  const me = prName && (!n || prName === n || (a && a.name.trim().toLowerCase() === prName)) ? pr : null;
  return {
    name: (me && me.name) || (a && a.name) || p.offer.advisor || '',
    role: (me && me.role) || (a && a.role) || 'Ihr Energieberater',
    phone: (me && me.phone) || (a && a.phone) || p.offer.advisorPhone || S.company.phone,
    email: (me && me.email) || (a && a.email) || p.offer.advisorEmail || S.company.email,
    photo: (me && fileUrl(me.photo)) || (a && fileUrl(a.photo)) || ''
  };
}
function pageFooter(n, N) {
  const c = S.company;
  const l1 = [coName(), c.street, [c.zip, c.city].filter(Boolean).join(' ')].filter(Boolean).join(' · ');
  const l2 = [[c.phone && 'Tel. ' + c.phone, c.email, c.web].filter(Boolean).join(' · '), [c.ceo && 'Geschäftsführung: ' + c.ceo, c.register].filter(Boolean).join(' · ')].filter(Boolean).join(' · ');
  const l3 = [c.taxNo && 'St.-Nr. ' + c.taxNo, c.vatId && 'USt-IdNr. ' + c.vatId, c.bank, c.iban && 'IBAN ' + c.iban, c.bic && 'BIC ' + c.bic].filter(Boolean).join(' · ');
  return `<div class="pf"><div>${esc(l1)}${l2 ? '<br>' + esc(l2) : ''}${l3 ? '<br>' + esc(l3) : ''}</div><div class="pn">Seite ${n} / ${N}</div></div>`;
}
const pageWrap = (p, title, body, n, N, key) => `<section class="${pageCls(key)}" data-key="${key}">${S.design.pdfHeader === 'fade' ? '<div class="phg"></div>' : ''}<div class="ph ${S.design.pdfHeader}"><div class="lg">${docLogo()}</div><div class="tt"><b>${esc(title)}</b><span>${esc(custName(p))}</span></div></div><div class="pb">${body}</div>${pageFooter(n, N)}</section>`;
function chap(t, lead = '') {
  const o = S.doc.texts[CUR_KEY] || {};
  const title = (o.title || t).replace('{jahre}', S.calc.years).replace(/\*/g, ''), ld = o.lead !== undefined && o.lead !== '' ? o.lead : lead;
  return `${kmHtml()}<h1>${title}</h1>${ld ? `<p class="lead">${esc(ld)}</p>` : '<div style="height:3mm"></div>'}`;
}
const tile = (k, v, u = '', cls = '') => `<div class="tile ${cls}"><div class="k">${k}</div><div class="v">${v}</div>${u ? `<div class="u">${u}</div>` : ''}</div>`;
const fig = (k, v, u = '', col = '') => `<div><div class="small" style="font-weight:500">${k}</div><div class="fig" style="white-space:nowrap;margin-top:1.2mm;${col ? 'color:' + col : ''}">${v}</div>${u ? `<div class="small" style="margin-top:1mm">${u}</div>` : ''}</div>`;
const withDoc = fn => {
  const prev = THEME_CTX, pal = typeof coverPalActive === 'function' ? coverPalActive() : null, saved = { primary: S.design.primary, secondary: S.design.secondary, accent: S.design.accent };
  THEME_CTX = 'doc'; if (pal) Object.assign(S.design, pal);
  try { return fn(); } finally { THEME_CTX = prev; if (pal) Object.assign(S.design, saved); }
};
const pageCls = key => (CUR_LAYOUT === 'sales' ? 'page sl' : docDark() || (key === 'cover' && S.design.pdfTheme === 'mixed') ? 'page dk' : 'page');
let CUR_LAYOUT = 'full';
function buildDocHtml(p, R) { return withDoc(() => { CUR_LAYOUT = layoutOf(p); try { return buildDocHtmlInner(p, R); } finally { CUR_LAYOUT = 'full'; } }); }
function buildDocHtmlInner(p, R) {
  const pages = visiblePages(p, R), N = pages.reduce((a, x) => a + x.count, 0);
  let n = 0, html = '';
  for (const d of pages) {
    if (d.key === 'attach') { attachmentPages(p).forEach(a => { n++; html += `<section class="page" data-key="attach" data-file="${a.file}" data-label="${esc(a.label)}"><div class="att"><img src="${fileUrl(a.file)}" alt=""><div class="lab">${esc(a.label)}</div></div></section>`; }); continue; }
    n++; CUR_KEY = d.key;
    const sales = layoutOf(p) === 'sales';
    if (d.key === 'cover') { html += sales ? salesCover(p, R, n, N) : docCover(p, R, n, N); continue; }
    const f = DOC[d.key]; if (!f) continue;
    const r = f(p, R); html += sales ? salesWrap(p, r, n, N, d.key) : pageWrap(p, r.title, r.body, n, N, d.key);
  }
  CUR_KEY = '';
  return html;
}
function subtitleOf(p, R) {
  if (p.type === 'wp') return 'Ihre neue Wärmepumpe – individuell für Ihr Zuhause berechnet';
  if (p.type === 'pv') return (R.bat ? 'Photovoltaik und Stromspeicher' : 'Ihre Photovoltaikanlage') + ' – individuell für Ihr Zuhause berechnet';
  return 'Photovoltaik, Stromspeicher und Wärmepumpe – individuell für Ihr Zuhause berechnet';
}
/* Hintergrund hinter Logo und Deckblatt-Texten: Art und Stärke (Deckkraft) wählbar */
const BG_KINDS = [['none', 'Kein'], ['white', 'Weiß'], ['dark', 'Dunkel'], ['brand', 'Hausfarbe']];
function bgOf(o, legacy, dflt) { return { kind: o.bg || (o[legacy] === false ? 'none' : 'white'), a: isNum(o.bgAlpha) ? o.bgAlpha : dflt }; }
function bgCss(o, legacy, dflt, shape) {
  const { kind, a } = bgOf(o, legacy, dflt); if (kind === 'none' || a <= 0) return '';
  const rgb = kind === 'white' ? '255,255,255' : kind === 'dark' ? '12,20,28' : hexToRgb(S.design.primary).join(',');
  return `background:rgba(${rgb},${(a / 100).toFixed(2)});${shape}${a >= 70 ? 'box-shadow:0 2mm 8mm rgba(15,42,61,.12);' : ''}`;
}
/* Schrift auf dunklem Hintergrund (Dunkel/Hausfarbe) automatisch hell */
const coverInkDark = cv => { const { kind, a } = bgOf(cv, 'whiteBox', 95); return (kind === 'dark' || kind === 'brand') && a >= 45 ? false : cv.dark; };
function coverLogoHtml() {
  const L = S.design.coverLogo, url = L.source === 'custom' ? fileUrl(L.file) : logoImgUrl();
  const inner = url ? `<img src="${esc(url)}" style="max-height:${L.size}mm;max-width:90mm;width:auto;height:auto;display:block">` : `<span style="display:flex;align-items:center;gap:2.5mm;font-weight:600;font-size:${Math.max(9, L.size * 0.85)}pt;color:${(() => { const k = bgOf(L, 'whiteBg', 100); return k.kind === 'white' && k.a >= 45 ? '#0F2A3D' : (k.kind === 'dark' || k.kind === 'brand') && k.a >= 45 ? '#ffffff' : 'var(--ink)'; })()};height:${L.size}mm">${sunMark(Math.round(L.size * 3.2))}${esc(coName())}</span>`;
  return `<div style="position:absolute;left:${L.x}%;top:${L.y}%;transform:translate(-${L.x}%,-${L.y}%);${bgCss(L, 'whiteBg', 100, 'border-radius:30mm;padding:3mm 6mm;')}z-index:3">${inner}</div>`;
}
function coverFigures(p, R, first, compact) {
  const fin = visiblePages(p, R).some(d => d.key === 'finance');
  const items = [[`Ø Ersparnis pro Jahr`, eur(R.avg), `über ${R.N} Jahre`, 'var(--p)'], ['Förderung und Zuschüsse', eur(R.funding + R.other), R.W && R.fund.rate ? `Fördersatz ${pct(R.fund.rate)}` : 'Zuschüsse'], fin ? [`Überschuss nach ${R.N} Jahren`, eur(R.surplus), 'nach Abzug der Investition'] : ['Weniger CO₂ pro Jahr', num(R.co2Save / 1000, 1) + ' t', 'gegenüber heute']];
  return `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;${first ? '' : 'margin-top:6mm;border-top:0.25mm solid var(--line)'}">${items.map(([k, v, u, col], i) => `<div style="padding:4.5mm ${i < 2 ? '5mm' : '0'} 0 ${i ? '5mm' : '0'};${i ? 'border-left:0.25mm solid var(--line);' : ''}">${compact ? fig(k, v, u, col).replace('class="fig" style="', `class="fig" style="font-size:${compact}pt;`) : fig(k, v, u, col)}</div>`).join('')}</div>`;
}
const CI = () => ({ badge: true, title: true, subtitle: true, customer: true, address: true, offer: true, created: true, advisor: true, figures: true, contact: true, note: '', ...(S.design.coverInfo || {}) });
function custBlock(p, dark = true) {
  const I = CI(), col = dark ? 'var(--ink)' : '#ffffff', sub = dark ? 'var(--ink3)' : 'rgba(255,255,255,.85)';
  const meta = [p.offer.number && `Angebot ${esc(p.offer.number)}`, p.offer.date && `vom ${deDate(p.offer.date)}`].filter(Boolean).join(' ');
  const line = [I.offer && meta ? `<span>${meta}</span>` : '', I.created ? `<span>Erstellt am ${new Date().toLocaleDateString('de-DE')}</span>` : '', I.advisor && p.offer.advisor ? `<span>Ihr Berater: <b style="color:${col};font-weight:600">${esc(p.offer.advisor)}</b></span>` : ''].filter(Boolean).join('');
  if (!I.customer && !I.address && !line) return '';
  return `<div style="color:${col}">${I.customer ? `<div style="font-size:7.6pt;font-weight:500;color:${sub}">Erstellt für</div><div style="font-size:14pt;font-weight:600;line-height:1.25;margin-top:0.5mm">${esc(custName(p))}</div>` : ''}${I.address ? `<div style="font-size:9pt;color:${sub}">${esc(custAddr(p))}</div>` : ''}
    ${line ? `<div style="display:flex;gap:6mm;margin-top:2.5mm;font-size:8.2pt;color:${sub};flex-wrap:wrap">${line}</div>` : ''}</div>`;
}
/* Inhalt des Deckblatts – jedes Element in den Einstellungen abschaltbar */
function coverText(p, R, opt = {}) {
  const I = CI(), big = opt.size || 29, cb = custBlock(p, opt.dark !== false);
  if (opt.part === 'head') return [I.badge ? `<span class="pill" style="background:var(--t-yel);color:var(--s-dark)">Ihr Energiekonzept ${R.startYear}</span>` : '', I.title ? `<div style="font-family:var(--fh),Georgia,serif;font-weight:var(--hw);font-size:${big}pt;line-height:1.08;color:var(--ink);margin:${I.badge ? '4mm' : '0'} 0 ${I.subtitle || I.note ? 3 : 0}mm">${esc(p.offer.title)}</div>` : '', I.subtitle ? `<div style="font-size:11pt;color:var(--ink2)">${esc(subtitleOf(p, R))}</div>` : '', I.note ? `<div style="font-size:10pt;color:var(--ink);margin-top:${I.title || I.subtitle ? 3 : 0}mm;white-space:pre-line">${esc(I.note)}</div>` : ''].join('');
  if (opt.part === 'cust') return (cb || '') + (I.figures ? coverFigures(p, R, !cb, opt.w < 80 ? Math.max(11, Math.round(opt.w * 0.24)) : 0) : '');
  if (opt.part === 'contact') return I.contact ? coverContact(p, true) : '';
  return [
    I.badge ? `<span class="pill" style="background:var(--t-yel);color:var(--s-dark)">Ihr Energiekonzept ${R.startYear}</span>` : '',
    I.title ? `<div style="font-family:var(--fh),Georgia,serif;font-weight:var(--hw);font-size:${big}pt;line-height:1.08;color:${opt.dark === false ? '#fff' : 'var(--ink)'};margin:${I.badge ? '4mm' : '0'} 0 3mm">${esc(p.offer.title)}</div>` : '',
    I.subtitle ? `<div style="font-size:11pt;color:${opt.dark === false ? 'rgba(255,255,255,.88)' : 'var(--ink2)'};max-width:150mm">${esc(subtitleOf(p, R))}</div>` : '',
    I.note ? `<div style="font-size:10pt;color:${opt.dark === false ? '#fff' : 'var(--ink)'};margin-top:3mm;white-space:pre-line">${esc(I.note)}</div>` : '',
    cb ? `<div style="margin-top:${I.title || I.subtitle ? 8 : 0}mm">${cb}</div>` : '',
    I.figures ? coverFigures(p, R) : '',
    I.contact ? coverContact(p) : ''
  ].join('');
}
function coverContact(p, bare) {
  const a = advisorOf(p); if (!a.name && !a.phone) return '';
  return `<div style="${bare ? '' : 'margin-top:9mm;padding-top:4mm;border-top:0.25mm solid var(--line);'}display:flex;align-items:center;gap:4mm">${a.photo ? `<div style="width:11mm;height:11mm;border-radius:50%;background:#fff url('${a.photo}') center/cover no-repeat;flex-shrink:0"></div>` : `<div style="width:11mm;height:11mm;border-radius:50%;background:var(--p-light);color:var(--ink);display:flex;align-items:center;justify-content:center;font-weight:600;font-size:9pt;flex-shrink:0">${esc(initials(a.name || coName()))}</div>`}
    <div style="font-size:8.6pt;line-height:1.45"><div style="color:var(--ink3);font-size:7.4pt">Ihr Ansprechpartner</div><b style="font-weight:600">${esc(a.name || coName())}</b>${a.phone ? ` · ${esc(a.phone)}` : ''}${a.email ? ` · ${esc(a.email)}` : ''}</div></div>`;
}
function coverBigSun() {
  const s = S.design.secondary, p = S.design.primary;
  let rays = ''; for (let i = 0; i <= 12; i++) { const a = Math.PI + i * Math.PI / 12; rays += `<line x1="${300 + Math.cos(a) * 170}" y1="${300 + Math.sin(a) * 170}" x2="${300 + Math.cos(a) * 215}" y2="${300 + Math.sin(a) * 215}" stroke="${s}" stroke-width="10" stroke-linecap="round" opacity=".9"/>`; }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 330" width="1200" height="660"><circle cx="300" cy="300" r="150" fill="${s}"/><circle cx="300" cy="300" r="115" fill="${mix(s, '#ffffff', 0.35)}"/>${rays}<rect x="0" y="300" width="600" height="30" fill="${p}"/></svg>`;
}
/* Eigenes Deckblatt: Titel, Kundendaten und Ansprechpartner einzeln per Schieberegler platzieren */
const COVER_BLOCKS = [['head', 'Titel und Untertitel'], ['cust', 'Kundendaten und Kennzahlen'], ['contact', 'Ansprechpartner']];
function coverBlocks(p, R, cv, vars) {
  const B = cv.blocks || {};
  return COVER_BLOCKS.map(([k]) => {
    const b = { x: 0, y: 50, w: 100, ...(B[k] || {}) }, w = Math.max(30, Math.min(100, b.w));
    const html = coverText(p, R, { size: w < 60 ? 18 : 22, dark: coverInkDark(cv), part: k, w }); if (!html) return '';
    return `<div style="${vars}color:var(--ink);position:absolute;width:calc((100% - 28mm) * ${w / 100});left:calc(14mm + (100% - 28mm) * ${(100 - w) / 100} * ${b.x / 100});top:calc(12mm + (100% - 24mm) * ${b.y / 100});transform:translateY(-${b.y}%);box-sizing:border-box;${bgCss(cv, 'whiteBox', 95, `border-radius:var(--dr);padding:${k === 'contact' ? '4mm 6mm' : '7mm 8mm'};`)}">${html}</div>`;
  }).join('');
}
function docCover(p, R, n, N) {
  const cv = S.design.cover, st = S.design.coverStyle, year = R.startYear;
  if (st === 'image' && fileUrl(cv.file)) {
    const vars = coverInkDark(cv) ? '--ink:#0F2A3D;--ink2:#3D5568;--ink3:#64788A;--line:rgba(15,42,61,.12);--line2:rgba(15,42,61,.2);--p-light:#E2F0ED;--t-yel:#FFF4DC;--s-dark:#8A5A06;' : '--ink:#ffffff;--ink2:rgba(255,255,255,.88);--ink3:rgba(255,255,255,.75);--line:rgba(255,255,255,.25);--line2:rgba(255,255,255,.35);--p-light:rgba(255,255,255,.18);--t-yel:rgba(245,165,36,.25);--s-dark:#FFE3A3;';
    return `<section class="${pageCls('cover')}" data-key="cover"><div style="position:absolute;inset:0;background:#fff url('${fileUrl(cv.file)}') center/cover no-repeat"></div>${coverLogoHtml()}
      ${cv.showCustomer ? (cv.layout === 'split' ? coverBlocks(p, R, cv, vars) : `<div style="${vars}color:var(--ink);position:absolute;left:14mm;right:14mm;top:calc(12mm + (100% - 24mm) * ${cv.pos / 100});transform:translateY(-${cv.pos}%);${bgCss(cv, 'whiteBox', 95, 'border-radius:var(--dr);padding:7mm 8mm;')}">${coverText(p, R, { size: 22, dark: coverInkDark(cv) })}</div>`) : ''}</section>`;
  }
  const textBlock = coverText(p, R);
  if (st === 'type') {
    return `<section class="${pageCls('cover')}" data-key="cover"><div style="position:absolute;inset:0;background:var(--bg)"></div>
      <div style="position:absolute;right:-20mm;top:20mm;width:150mm;height:82.5mm"><img src="${svgDataUri(coverBigSun())}" style="width:150mm;height:82.5mm;display:block"></div>${coverLogoHtml()}
      <div style="position:absolute;left:14mm;right:14mm;top:118mm;background:#fff;border-radius:var(--dr);padding:9mm 9mm 8mm">${textBlock}</div>${pageFooter(n, N)}</section>`;
  }
  return `<section class="${pageCls('cover')}" data-key="cover"><div style="position:absolute;left:0;right:0;top:0;height:130mm;overflow:hidden"><img src="${svgDataUri(houseSVG({ cover: true, pv: hasPV(p), hp: hasWP(p), car: !!(p.car && p.car.on), bat: hasPV(p) && nz(p.pv.bat) > 0, ...coverHouseOpts(p) }))}" style="width:210mm;height:130mm;display:block"><div style="position:absolute;left:0;right:0;bottom:0;height:18mm;background:linear-gradient(180deg,${pageCls('cover') === 'page dk' ? 'rgba(11,17,24,0),#0B1118' : 'rgba(255,255,255,0),#fff'})"></div>${coverLogoHtml()}</div>
    <div style="position:absolute;left:14mm;right:14mm;top:133mm">${textBlock}</div>${pageFooter(n, N)}</section>`;
}
/* Puffer- und separater Warmwasserspeicher – Namen aus dem Angebot, sonst allgemein */
function storageNote(p, mode) {
  if (S.calc.storageNote === false) return '';
  const buf = String(p.hp.buffer || '').trim(), dhw = String(p.hp.dhw || '').trim();
  const t = `Zu Ihrer Wärmepumpe gehören ein <b style="font-weight:600">Pufferspeicher</b>${buf ? ` (${esc(buf)})` : ''} und ein <b style="font-weight:600">separater Warmwasserspeicher</b>${dhw ? ` (${esc(dhw)})` : ''}.${mode === 'short' ? ' Der Puffer sorgt für lange, gleichmäßige Laufzeiten; der Warmwasserspeicher hält warmes Wasser getrennt vom Heizwasser bereit.' : ' Der Puffer speichert Heizwärme und sorgt für gleichmäßige, lange Laufzeiten – das spart Strom und schont die Wärmepumpe. Der Warmwasserspeicher hält jederzeit ausreichend warmes Wasser bereit, getrennt vom Heizwasser.'}`;
  return mode === 'sales' ? `<p class="small" style="color:var(--ink2);font-size:7.8pt;line-height:1.45;margin-top:2.5mm">${t}</p>` : `<div class="tile" style="margin-top:3.5mm;padding:3mm 4mm;display:flex;gap:3.5mm;align-items:flex-start"><div style="flex-shrink:0;padding-top:0.3mm">${sImg('flame', 4.6, S.design.primary)}</div><div style="font-size:8.6pt;line-height:1.45">${t}</div></div>`;
}
/* Hersteller und Garantien – genau so, wie sie im Angebot stehen */
function makersBlock(p, R) {
  const pv = p.pv || {}, rows = [];
  if (R.V && (pv.modMaker || pv.modWarranty)) rows.push(['Solarmodule', pv.modMaker, cleanWarranty(pv.modWarranty)]);
  if (R.V && (pv.invMaker || pv.invWarranty)) rows.push(['Wechselrichter', pv.invMaker, cleanWarranty(pv.invWarranty)]);
  if (R.V && R.bat && (pv.batMaker || pv.batWarranty)) rows.push(['Stromspeicher', pv.batMaker, cleanWarranty(pv.batWarranty)]);
  if (R.W && (p.hp.model || p.hp.warranty)) rows.push(['Wärmepumpe', p.hp.model, p.hp.warranty]);
  if (!rows.some(r => r[2])) return '';
  return `<div class="sec" style="margin-top:4.5mm"><h2>Hersteller & Garantien</h2><table class="t" style="font-size:7.4pt"><thead><tr><th>Komponente</th><th style="text-align:left">Hersteller / Typ</th><th style="text-align:left">Garantie laut Angebot</th></tr></thead><tbody>${rows.map(([k, m, w]) => `<tr><td style="font-weight:600;white-space:nowrap">${k}</td><td style="text-align:left">${esc(m || '–')}</td><td style="text-align:left;color:var(--ink2)">${esc(w || '–')}</td></tr>`).join('')}</tbody></table></div>`;
}
function soundBlock(p) {
  const v = isNum(p.hp.spl) ? p.hp.spl : null;
  return `<div class="sec"><h2>Wie laut ist Ihre Wärmepumpe?</h2><p class="small" style="margin-bottom:2mm">Schalldruckpegel nachts${p.hp.splDist ? ` in ${num(p.hp.splDist, 1)} m Abstand` : ''} im Vergleich zu Alltagsgeräuschen.</p>${soundScaleSVG(v)}</div>`;
}
const checkLi = t => `<div style="display:flex;gap:2.5mm;align-items:flex-start;margin-bottom:2.2mm"><span style="flex-shrink:0;display:inline-flex;width:5mm;height:5mm;border-radius:50%;background:var(--p-light);align-items:center;justify-content:center;margin-top:0.2mm">${icC('check', 12, S.design.primary, 2.6)}</span><span style="font-size:9pt;line-height:1.4">${t}</span></div>`;
function benefitsOf(p, R) {
  const b = [];
  if (R.W) b.push(`Unabhängig von ${R.fuel === 'oil' ? 'Heizöl' : 'Erdgas'}, CO₂-Preis und steigenden Netzentgelten`);
  if (R.W && R.funding > 0) b.push(`<b>${eur(R.funding)}</b> staatliche Förderung – ${pct(R.fund.rate)} Ihrer förderfähigen Kosten`);
  if (R.V) b.push(`Rund <b>${kwh100(R.yield)} kWh</b> eigener Solarstrom pro Jahr – ${pct(R.autarky * 100)} Autarkie`);
  if (p.type === 'pvwp') { const A = annualProfile(p, R); if (A.share > 0) b.push(`Rund <b>${pct(A.share * 100)}</b> des Wärmepumpen-Stroms kommen vom eigenen Dach`); }
  if (R.V && R.bat) b.push(`Speicher mit ${num(R.bat, 1)} kWh – Solarstrom auch am Abend`);
  b.push(`<b>${num(R.co2Save / 1000, 1)} t</b> weniger CO₂ pro Jahr`);
  if (R.carKWh) b.push(`Ihr E-Auto lädt rund <b>${kwh100(R.carPV)} kWh</b> Solarstrom pro Jahr`);
  if (R.rod) b.push(`Im Sommer Warmwasser per Heizstab mit Solarstrom – die Wärmepumpe pausiert ${R.rodMonths} Monate und hält länger`);
  if (R.W) b.push('Wärme und Warmwasser aus Umweltwärme – zuverlässig auch bei Frost');
  return b.slice(0, 5);
}
function advisorCard(p, R, compact) {
  const a = advisorOf(p);
  const photo = a.photo ? `<div style="width:18mm;height:18mm;border-radius:50%;flex-shrink:0;background:#fff url('${a.photo}') center/cover no-repeat;border:0.6mm solid #fff"></div>` : `<div style="width:16mm;height:16mm;border-radius:50%;flex-shrink:0;background:#fff;color:var(--p);display:flex;align-items:center;justify-content:center;font-weight:600;font-size:13pt">${esc(initials(a.name || coName()))}</div>`;
  return `<div style="background:var(--p-light);border-radius:var(--dr);padding:5mm 6mm;display:flex;gap:5mm;align-items:center">${photo}<div style="flex:1;min-width:0">
    <div style="font-family:var(--fh),Georgia,serif;font-weight:var(--hw);font-size:12.5pt">${esc(S.sales.ctaTitle)}</div><div style="font-size:8.6pt;color:var(--ink2);margin-top:0.8mm">${esc(S.sales.ctaText)}</div>
    <div style="display:flex;flex-wrap:wrap;gap:1.5mm 6mm;margin-top:2.5mm;font-size:8.6pt">${a.name ? `<span><b style="font-weight:600">${esc(a.name)}</b> · ${esc(a.role)}</span>` : ''}${a.phone ? `<span>${esc(a.phone)}</span>` : ''}${a.email ? `<span>${esc(a.email)}</span>` : ''}</div>
    </div></div>`;
}
let DAY_CACHE = null;
const DOC = {
  cover: () => ({}),
  summary(p, R) {
    let b = chap(txt('summary', 'title'), txt('summary', 'lead'));
    const am = R.amortRise;
    b += `<div class="grad" style="border-radius:var(--dr);padding:7mm 8mm;display:grid;grid-template-columns:1.25fr 1fr;gap:6mm;align-items:end">
      <div><div style="font-size:9pt;color:rgba(255,255,255,.85)">Sie sparen durchschnittlich</div><div style="font-size:32pt;font-weight:600;letter-spacing:-0.02em;line-height:1.25;color:var(--hl-num);margin-top:1mm">${eur(R.avg)}</div><div style="font-size:9pt;color:rgba(255,255,255,.85);margin-top:1mm">pro Jahr – im ersten Jahr bereits ${eur(R.saving1)}</div></div>
      <div style="border-left:0.3mm solid rgba(255,255,255,.3);padding-left:6mm"><div style="font-size:9pt;color:rgba(255,255,255,.85)">Bezahlt gemacht nach</div><div style="font-size:22pt;font-weight:600;letter-spacing:-0.02em;margin-top:1mm">${am === null ? 'über ' + R.N : num(am, 1)} Jahren</div><div style="font-size:8pt;color:rgba(255,255,255,.75)">mit steigenden Energiepreisen${R.scen === 'opt' ? ' (optimistisch)' : ''}</div></div></div>`;
    const fin = visiblePages(p, R).some(d => d.key === 'finance');
    b += `<div style="display:grid;grid-template-columns:repeat(${3 + (R.W ? 1 : 0) + (R.other ? 1 : 0) + (R.discount ? 1 : 0)},1fr);margin-top:5mm">${[['Angebotspreis', eur(R.gross)], ...(R.W ? [['Förderung', '− ' + eur(R.funding)]] : []), ...(R.other ? [['Zuschüsse', '− ' + eur(R.other)]] : []), ...(R.discount ? [['Sonderrabatt', '− ' + eur(R.discount)]] : []), ['Ihre Kosten', eur(R.net)], fin ? [`Überschuss in ${R.N} J.`, eur(R.surplus)] : ['Weniger CO₂/Jahr', num(R.co2Save / 1000, 1) + ' t']].map(([k, v], i) => `<div style="padding:0 4mm;${i ? 'border-left:0.25mm solid var(--line);' : 'padding-left:0;'}"><div class="small" style="font-weight:500">${k}</div><div style="font-size:14pt;font-weight:600;margin-top:1mm;${k === 'Förderung' || k === 'Sonderrabatt' || k === 'Zuschüsse' ? 'color:var(--p)' : ''}">${v}</div></div>`).join('')}</div>`;
    b += `<div class="sec" style="display:grid;grid-template-columns:1fr 1fr;gap:7mm"><div><h2>Ihre Vorteile</h2>${benefitsOf(p, R).map(checkLi).join('')}</div>`;
    const tr = S.sales.trustOn ? S.sales.trust.filter(t => t.on).slice(0, 4) : [];
    b += `<div>${tr.length ? `<h2>Warum ${esc(coName())}</h2>${tr.map(t => `<div style="display:flex;gap:3mm;margin-bottom:3mm"><span style="flex-shrink:0;display:inline-flex;width:8mm;height:8mm;border-radius:calc(var(--dr) * .7);background:var(--tile);align-items:center;justify-content:center">${icC(t.icon, 16, S.design.primary, 1.8)}</span><div><div style="font-weight:600;font-size:9pt">${esc(t.title)}</div><div class="small" style="font-size:7.8pt;line-height:1.4">${esc(t.text)}</div></div></div>`).join('')}` : ''}</div></div>`;
    // Ansprechpartner nur einmal: steht er schon auf dem Deckblatt, entfällt der Kasten hier
    const coverContact = CI().contact && !!advisorOf(p).name && visiblePages(p, R).some(d => d.key === 'cover');
    if (!coverContact) b += `<div class="sec">${advisorCard(p, R)}</div>`;
    if (R.discount) b += `<div style="margin-top:3mm;background:var(--t-yel);border-radius:var(--dr);padding:4.5mm 6mm;display:flex;justify-content:space-between;align-items:center;gap:5mm"><div><div style="font-size:8pt;font-weight:600;color:var(--s-dark)">Ihr Vorteil bei schneller Entscheidung</div><div style="font-size:10pt;font-weight:600;margin-top:0.8mm">${esc(S.discount.text.replace('{datum}', deDate(p.discount.until)))}</div></div><div style="font-size:18pt;font-weight:600;color:var(--p);white-space:nowrap">− ${eur(R.discount)}</div></div>`;
    return { title: txt('summary', 'title'), body: b };
  },
  year(p, R) {
    const A = annualProfile(p, R), hp = A.mode === 'hp';
    const lead = hp ? (A.pot ? `Ihre Wärmepumpe braucht vor allem im Winter Strom, die Sonne liefert vor allem im Sommer. Trotzdem könnte eine Photovoltaikanlage mit ${num(A.kwp, 1)} kWp einen großen Teil des Wärmepumpen-Stroms abdecken – vor allem im Frühjahr und im Herbst, wenn noch geheizt wird und die Sonne schon kräftig scheint.` : 'Ihre Wärmepumpe braucht vor allem im Winter Strom, die Sonne liefert vor allem im Sommer. Trotzdem kann Ihre Photovoltaikanlage einen großen Teil des Wärmepumpen-Stroms abdecken – vor allem im Frühjahr und im Herbst, wenn noch geheizt wird und die Sonne schon kräftig scheint.') : 'So verteilen sich Ihr Stromverbrauch und Ihre Solarerzeugung über die Monate.';
    let b = chap(txt('year', 'title'), S.doc.texts.year && S.doc.texts.year.lead ? S.doc.texts.year.lead : lead);
    b += `<div class="tile" style="padding:4mm 4mm 3mm">${annualChart(A, { h: 250 })}<div class="small" style="margin-top:2mm">${annualLegend(A)}</div></div>`;
    b += `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;margin-top:6mm">${[[hp ? 'Anteil Solarstrom am WP-Strom' : 'Anteil Solarstrom am Verbrauch', pct(A.share * 100), 'rechnerisch übers Jahr', 'var(--p)'], ['Vom eigenen Dach', 'ca. ' + kwh100(A.covered) + ' kWh', `von ${num(A.total)} kWh Bedarf`], [hp ? 'Weniger Stromkosten' : 'Wert des Eigenverbrauchs', eur(A.value), A.pot ? 'pro Jahr, zusätzlich möglich' : 'pro Jahr – bereits in Ihrer Ersparnis enthalten']].map(([k, v, u, col], i) => `<div style="padding:0 5mm;${i ? 'border-left:0.25mm solid var(--line);' : 'padding-left:0;'}">${fig(k, v, u, col)}</div>`).join('')}</div>`;
    const seas = (a, z) => A.months.slice(a, z).reduce((s, m) => s + m.covered, 0) / Math.max(1, A.months.slice(a, z).reduce((s, m) => s + m.demand, 0));
    const winter = (A.months[0].covered + A.months[1].covered + A.months[10].covered + A.months[11].covered) / Math.max(1, A.months[0].demand + A.months[1].demand + A.months[10].demand + A.months[11].demand);
    b += `<div class="sec g3">${[['Frühling und Herbst', `Die beste Zeit: Ihr Haus braucht noch Wärme, und die Sonne liefert schon viel Strom. Rund ${pct((A.months.filter((m, i) => [2, 3, 4, 8, 9].includes(i)).reduce((a, m) => a + m.covered, 0) / Math.max(1, A.months.filter((m, i) => [2, 3, 4, 8, 9].includes(i)).reduce((a, m) => a + m.demand, 0))) * 100)} des Bedarfs von März bis Mai und im September/Oktober kommen vom Dach.`], ['Sommer', hp ? (A.rod ? `Der Heizstab (${esc(R.rodName)}) erwärmt das Warmwasser mit überschüssigem Solarstrom. Ihre Wärmepumpe kann nahezu komplett pausieren – das schont sie und verlängert ihre Lebensdauer.` : 'Die Wärmepumpe bereitet fast nur Warmwasser – das läuft tagsüber nahezu komplett mit Solarstrom. Überschüsse fließen in den Speicher oder ins Netz.') : 'Die Anlage erzeugt mehr, als Sie verbrauchen. Überschüsse fließen in den Speicher oder ins Netz.'], ['Winter', hp ? `Auch an kurzen Wintertagen liefert Ihr Dach Strom: Rund ${pct(winter * 100)} kommen jetzt von der eigenen Anlage, den Rest liefert ${R.tariffOn ? 'Ihr günstiger Wärmepumpentarif' : 'das Stromnetz'}. Ihre Wärmepumpe macht dabei aus jeder Kilowattstunde Strom rund ${num(R.jaz, 1)} Kilowattstunden Wärme – deutlich günstiger als Öl oder Gas.` : `Auch an kurzen Wintertagen liefert Ihr Dach Strom: Rund ${pct(winter * 100)} Ihres Bedarfs kommen jetzt von der eigenen Anlage, den Rest liefert das Stromnetz. Übers Jahr gerechnet sparen Sie trotzdem deutlich.`]].map(([t, x]) => `<div class="tile"><h3>${t}</h3><div class="small" style="font-size:8pt;line-height:1.45;color:var(--ink2)">${x}</div></div>`).join('')}</div>`;
    if (A.pot) b += `<div class="sec" style="background:var(--t-yel);border-radius:var(--dr);padding:4.5mm 5mm;display:flex;gap:4mm;align-items:center">${icC('sun', 26, S.design.secondary, 1.8)}<div style="font-size:8.8pt"><b style="font-weight:600">Die Photovoltaikanlage in diesem Diagramm ist nicht Teil Ihres Angebots.</b> Das Diagramm zeigt, wie viel Strom für Ihre Wärmepumpe eine eigene Solaranlage mit ${num(A.kwp, 1)} kWp liefern könnte. Gern erstellen wir Ihnen dafür ein Angebot.</div></div>`;
    b += `<p class="small" style="margin-top:3mm">Modellrechnung mit typischen Monatswerten für den Raum Münster/Osnabrück (Ertrag ${num(A.yieldY / Math.max(0.01, A.kwp))} kWh/kWp${hp ? ', Heizgradtage und jahreszeitliche Effizienz der Wärmepumpe' : ''}). Die tatsächliche Deckung hängt von Wetter, Laufzeiten und Speichergröße ab.</p>`;
    return { title: txt('year', 'title'), body: b };
  },
  roadmap(p, R) {
    let b = chap(txt('roadmap', 'title'), txt('roadmap', 'lead'));
    b += roadmapHtml(p, true);
    return { title: 'Ihr Weg zur neuen Energie', body: b };
  },
  situation(p, R) {
    let b = chap('Ausgangssituation & Energiesystem', 'Ihre heutige Situation und das neue Energiesystem auf einen Blick.');
    if (R.W) {
      const age = heatingAge(p);
      b += `<div class="g4">${tile('Heizung', R.fuel === 'oil' ? 'Heizöl' : (p.heating.gasType === 'etage' ? 'Gasetage' : 'Erdgas'), p.heating.year ? `Baujahr ${p.heating.year}${age !== null ? ` · ${age} Jahre` : ''}` : 'Baujahr unbekannt', 'tred')}${tile('Verbrauch', num(R.cons) + (R.fuel === 'oil' ? ' l' : ' kWh'), 'pro Jahr')}${tile('Heizkosten', eur(R.costOld1), 'pro Jahr inkl. Wartung')}${tile('CO₂', num(R.co2Old / 1000, 1) + ' t', 'pro Jahr')}</div>`;
    } else {
      b += `<div class="g4">${tile('Stromverbrauch', num(R.hhCons) + ' kWh', 'pro Jahr', 'tred')}${tile('Strompreis', ct(R.hhPrice), 'pro kWh')}${tile('Stromkosten', eur(R.hhCons * R.hhPrice), 'pro Jahr')}${tile('CO₂', num(R.hhCons * S.calc.co2El / 1000, 1) + ' t', 'pro Jahr')}</div>`;
    }
    const sys = [];
    if (R.V) { sys.push(tile('Photovoltaik', num(R.kwp, 2) + ' kWp', p.pv.modules || `ca. ${kwh100(R.yield)} kWh pro Jahr`, 'tgrn')); sys.push(tile('Stromspeicher', R.bat ? num(R.bat, 1) + ' kWh' : 'ohne', R.bat ? 'speichert Solarstrom für abends' : '', 'tgrn')); }
    if (R.W) sys.push(tile('Wärmepumpe', p.hp.kw ? num(p.hp.kw, 1) + ' kW' : '–', `JAZ ${num(R.jaz, 2)}`, 'tgrn'));
    if (R.rod) sys.push(tile('Heizstab', num(R.rodKw, 1) + ' kW', 'mit PV-Überschuss', 'tgrn'));
    b += `<div class="sec"><h2>Ihr neues Energiesystem</h2><div class="g${Math.max(2, sys.length)}">${sys.join('')}</div></div>`;
    b += makersBlock(p, R);
    if (R.W) {
      const mk = !!makersBlock(p, R), kv = [...(mk ? [] : [['Modell', p.hp.model || '–']]), ['Heizleistung', p.hp.kw ? num(p.hp.kw, 1) + ' kW' : '–'], ['Jahresarbeitszahl', num(R.jaz, 2)], ['Maße Außeneinheit', p.hp.dims || '–'], ['Gewicht', p.hp.weight ? num(p.hp.weight) + ' kg' : '–'], ['Schallleistung', p.hp.sw ? num(p.hp.sw, 1) + ' dB(A)' : '–']];
      b += `<div class="sec tile" style="padding:4mm 5mm"><h3>Ihre Wärmepumpe</h3><div style="display:grid;grid-template-columns:${mk ? 'repeat(5,1fr)' : '1fr 1fr 1fr'};gap:2mm 5mm;margin-top:1.5mm">${kv.map(([k, v]) => `<div><div class="small">${k}</div><div style="font-weight:600;font-size:9pt">${esc(v)}</div></div>`).join('')}</div></div>`;
    }
    const hasMk = !!makersBlock(p, R), comps = p.components.map(c => ({ c, pr: PRODUCTS.find(x => x.id === c.id) })).filter(x => x.pr && !(hasMk && /wechselrichter|speicher|modul|wärmepumpe/i.test(x.pr.name))).slice(0, 4);
    if (comps.length) b += `<div class="sec"><h2>Ihre Komponenten</h2><div class="g${Math.min(4, Math.max(2, comps.length))}">${comps.map(({ c, pr }) => { const u = fileUrl(pr.img) || pr.imgUrl; return `<div class="tile" style="text-align:center;padding:3mm">${u ? `<img src="${esc(u)}" style="max-height:${R.W ? 16 : 24}mm;max-width:100%;width:auto;height:auto;margin:0 auto 1.5mm;display:block">` : ''}<div style="font-weight:600;font-size:8.4pt;line-height:1.25">${c.qty > 1 ? c.qty + ' × ' : ''}${esc(pr.name)}</div><div class="small">${esc(pr.maker || '')}</div></div>`; }).join('')}</div></div>`;
    if (R.W) b += soundBlock(p);
    return { title: 'Ausgangssituation', body: b };
  },
  howWP(p, R) {
    const c = S.calc, oil = R.fuel === 'oil', eff = nz(p.heating.eff, 85) / 100, fuelIn = 100 / eff, el = 100 / R.jaz, env = 100 - el;
    const pricePerKwh = oil ? R.price / 10 : R.price;
    const costOld = fuelIn * pricePerKwh, costNew = el * R.tariff, co2O = fuelIn * (oil ? c.co2Oil : c.co2Gas), co2N = el * c.co2El;
    const steps = [['Verdampfer', 'Ein Kältemittel nimmt die Wärme der Außenluft auf und verdampft – schon bei Minusgraden.'], ['Verdichter', 'Mit etwas Strom wird der Dampf verdichtet. Dabei steigt seine Temperatur deutlich an.'], ['Verflüssiger', 'Das heiße Kältemittel gibt seine Wärme an Heizung und Warmwasser ab und wird wieder flüssig.'], ['Expansionsventil', 'Der Druck sinkt, das Kältemittel kühlt ab – und der Kreislauf beginnt von vorn.']];
    const bar = (parts, max) => `<div style="display:flex;height:7mm;border-radius:2mm;overflow:hidden;width:${(parts.reduce((a, x) => a + x[0], 0) / max * 100).toFixed(1)}%">${parts.map(([v, col, t, tc]) => `<div style="width:${(v / parts.reduce((a, x) => a + x[0], 0) * 100).toFixed(1)}%;background:${col};color:${tc || '#fff'};font-size:7.2pt;font-weight:600;display:flex;align-items:center;justify-content:center;white-space:nowrap;overflow:hidden">${t}</div>`).join('')}</div>`;
    const mx = Math.max(fuelIn, 100);
    let b = chap('So funktioniert eine Wärmepumpe', 'Im Prinzip wie ein Kühlschrank – nur umgekehrt: Sie holt Wärme aus der Umgebung ins Haus.');
    b += S.design.hpIllu === 'diagram' ? `<div class="tile" style="padding:3mm 4mm">${hpCycleSVG()}</div>` : `<div style="border-radius:var(--dr);overflow:hidden">${hpSceneSVG()}</div>`;
    b += `<div class="g4" style="margin-top:3.5mm">${steps.map(([t, x], i) => `<div><div style="display:flex;align-items:center;gap:2mm;margin-bottom:1mm">${numCircle(i + 1, 5.5, { fill: S.design.primary, color: '#fff', fs: 12 })}<b style="font-size:9pt">${t}</b></div><div class="small" style="line-height:1.4">${x}</div></div>`).join('')}</div>`;
    if (R.rod) b += `<div class="tile" style="margin-top:3.5mm;padding:3.5mm 4mm;background:var(--p-light);display:flex;gap:3.5mm;align-items:flex-start">${icC('sun', 20, S.design.primary, 1.8)}<div><b style="font-weight:600">Sommerpause für Ihre Wärmepumpe:</b> <span class="muted">Ein ${esc(R.rodName)} mit ${num(R.rodKw, 1)} kW erwärmt von ${R.rodMonths === 3 ? 'Juni' : 'Mai'} bis ${['', '', '', 'August', 'August', 'September', 'Oktober'][R.rodMonths]} Ihr Warmwasser mit überschüssigem Solarstrom – rund ${num(R.rodHeat)} kWh im Jahr. Die Wärmepumpe bleibt in dieser Zeit nahezu aus: weniger Laufzeit, weniger Starts, eine längere Lebensdauer.</span></div></div>`;
    b += storageNote(p, R.rod ? 'short' : 'full');
    if (!R.rod) b += `<div class="tile" style="margin-top:3.5mm;padding:3mm 4mm;background:var(--t-yel)"><b>Der Kühlschrank-Vergleich:</b> <span class="muted">Ihr Kühlschrank holt die Wärme aus dem Inneren und gibt sie hinten an die Küche ab. Die Wärmepumpe macht genau das mit der Außenluft – und gibt die Wärme an Ihr Haus.</span></div>`;
    b += `<div class="sec"><h2>Warum die Wärmepumpe so effizient ist</h2><p class="small">So entstehen 100 kWh Wärme:</p>
      <div style="display:grid;grid-template-columns:30mm 1fr;gap:2.5mm 3mm;align-items:center;margin-top:2mm">
      <b style="font-size:8.6pt">${oil ? 'Ölheizung' : 'Gasheizung'}</b>${bar([[100, '#D9482B', '100 kWh Wärme'], [fuelIn - 100, '#F2B8A6', `${num(fuelIn - 100)} kWh Verlust`, '#7A2A14']], mx)}
      <b style="font-size:8.6pt">Wärmepumpe</b>${bar([[el, '#F5A524', `${num(el)} kWh Strom`, '#4A3000'], [env, 'var(--p)', `${num(env)} kWh Umweltwärme`]], mx)}
      </div><p class="small" style="margin-top:2mm">Bei ${oil ? 'Öl' : 'Gas'} brauchen Sie ${num(fuelIn)} kWh Brennstoff, die Wärmepumpe nur ${num(el)} kWh Strom – den Rest liefert die Umwelt kostenlos.</p></div>`;
    b += `<div class="g3" style="margin-top:3mm">${tile('Jahresarbeitszahl', `<span style="font-size:22pt">${num(R.jaz, 1)}</span>`, `aus 1 kWh Strom werden ${num(R.jaz, 1)} kWh Wärme`, 'grad')}${tile('Kosten pro 100 kWh Wärme', `${eur(costNew, 2)}`, `statt ${eur(costOld, 2)} mit ${oil ? 'Öl' : 'Gas'}`)}${tile('CO₂ pro 100 kWh Wärme', `${num(co2N, 1)} kg`, `statt ${num(co2O, 1)} kg mit ${oil ? 'Öl' : 'Gas'}`)}</div>`;
    return { title: 'So funktioniert eine Wärmepumpe', body: b };
  },
  howPV(p, R) {
    const price = p.type === 'pvwp' ? nz(p.offer.grossPV) : R.gross;
    let gen20 = 0; for (let t = 0; t < R.N; t++) gen20 += R.yield * Math.pow(1 - S.calc.pvDeg / 100, t);
    const own = gen20 ? price / gen20 : null;
    const steps = [['Sonne einfangen', `Ihre ${num(R.kwp, 2)} kWp erzeugen rund ${kwh100(R.yield)} kWh Strom im Jahr.`], ['Selbst nutzen', `Etwa ${kwh100(R.self)} kWh nutzen Sie direkt oder über den Speicher.`], ['Speichern', R.bat ? `Der ${num(R.bat, 1)}-kWh-Speicher versorgt Sie abends und nachts.` : 'Ein Speicher lässt sich jederzeit nachrüsten.'], ['Einspeisen', `Rund ${kwh100(R.feed)} kWh gehen ins Netz – vergütet mit ${num(S.calc.feedIn, 2)} ct/kWh.`]];
    let b = chap('So funktioniert Ihre Photovoltaikanlage', 'Ihr Dach wird zum Kraftwerk: Solarstrom wird zuerst im Haus genutzt, Überschüsse gespeichert oder eingespeist.');
    b += S.design.pvIllu === 'diagram' ? `<div class="tile" style="padding:3mm 4mm">${pvFlowSVG(R)}</div>` : `<div style="border-radius:var(--dr);overflow:hidden">${pvSceneSVG(R)}</div>`;
    b += `<div class="g4" style="margin-top:3.5mm">${steps.map(([t, x], i) => `<div><div style="display:flex;align-items:center;gap:2mm;margin-bottom:1mm">${numCircle(i + 1, 5.5, { fill: S.design.primary, color: '#fff', fs: 12 })}<b style="font-size:9pt">${t}</b></div><div class="small" style="line-height:1.4">${x}</div></div>`).join('')}</div>`;
    b += `<div class="sec"><h2>Ein typischer Tag im ${MONTH_NAMES[dayMonth(p) - 1]} – 6 Uhr bis 6 Uhr</h2>${rodPause(R, dayMonth(p)) ? `<div style="background:var(--t-yel);border-radius:var(--dr);padding:2.5mm 4mm;margin-bottom:2mm;font-size:8.4pt;display:flex;gap:3mm;align-items:flex-start">${icC('sun', 16, S.design.secondary, 2)}<div><b style="font-weight:600">Sommerpause der Wärmepumpe.</b> ${esc(rodPauseText(R))}</div></div>` : ''}<p class="small" style="margin-bottom:1.5mm">${R.bat ? `Tagsüber lädt der Überschuss Ihren ${num(R.bat, 1)}-kWh-Speicher, abends und nachts versorgt er Ihr Haus.` : 'Tagsüber nutzen Sie den Solarstrom direkt, Überschüsse gehen ins Netz.'} Leistung in kW. ${(() => { const D = simulateDay(R, dayMonth(p), p); DAY_CACHE = D; return dayInfo(D) + '.'; })()}</p>${dayProfileSVG(R, { D: DAY_CACHE, h: 185 })}<div class="small" style="margin-top:1mm">${dayLegend(R)}</div></div>`;
    b += `<div class="g3" style="margin-top:4mm">${tile('Autarkie', pct(R.autarky * 100), 'Ihres Strombedarfs aus eigener Erzeugung')}${tile('Solarstrom im Jahr (geschätzt)', 'ca. ' + kwh100(R.yield) + ' kWh', `davon ca. ${kwh100(R.self)} kWh selbst genutzt`)}${tile('Was eine kWh kostet', `${ct(own)} <span style="font-size:9pt;color:var(--ink3)">statt ${ct(R.hhPrice)}</span>`, `eigener Solarstrom (Anlagenpreis ÷ Erzeugung in ${R.N} Jahren) gegenüber Netzstrom`)}</div>`;
    b += `<p class="small" style="margin-top:2.5mm">Alle Angaben zum erzeugten Strom sind kalkulierte Schätzwerte (auf volle 100 kWh abgerundet). Der tatsächliche Ertrag hängt von Wetter, Verschattung und Ihrem Verbrauch ab.</p>`;
    return { title: 'So funktioniert Ihre Photovoltaikanlage', body: b };
  },
  invest(p, R) {
    const F = R.fund;
    const row = (k, v, st = '') => `<div class="row" style="${st}"><span>${k}</span><b>${v}</b></div>`;
    let rows = '';
    if (p.type === 'pvwp' && !(p.offer.total > 0)) rows += row('Angebot Wärmepumpe', eur(p.offer.grossWP)) + row('Angebot Photovoltaik', eur(p.offer.grossPV));
    else rows += row(p.offer.number ? `Angebotspreis (Angebot ${esc(p.offer.number)})` : 'Angebotspreis', eur(R.gross));
    if (R.W) rows += row(`Staatliche Förderung (BEG, ${pct(F.rate)})`, '− ' + eur(R.funding), 'color:var(--p)');
    if (R.other) rows += row('Weitere Zuschüsse', '− ' + eur(R.other));
    if (R.discount) rows += row(esc(S.discount.text.replace('{datum}', deDate(p.discount.until))), '− ' + eur(R.discount), 'background:var(--t-yel);color:var(--ink);border-radius:2mm');
    rows += `<div class="row grad" style="border-radius:var(--dr);margin-top:2mm;border:0;padding:3mm 4mm"><span style="font-weight:600">Ihre schlussendlichen Kosten</span><b style="font-size:14pt;color:var(--hl-num)">${eur(R.net)}</b></div>`;
    if (R.sowieso) rows += row(`Ohnehin fällige neue ${R.fuel === 'oil' ? 'Ölheizung' : 'Gasheizung'}`, '− ' + eur(R.sowieso)) + row('<b>Ihre tatsächlichen Mehrkosten</b>', `<span style="font-size:11pt">${eur(R.invest)}</span>`);
    let b = chap('Investition & Förderung', 'Was Ihre Anlage kostet – und was davon der Staat übernimmt.') + `<div>${rows}</div>`;
    if (R.W) b += `<div class="sec tile" style="padding:3.5mm 4.5mm"><h3>So setzt sich Ihr Fördersatz zusammen</h3><div style="font-size:9pt;margin-top:1.5mm;line-height:1.6">${F.parts.map(([k, v]) => `${esc(k)} <b style="font-weight:600">${pct(v)}</b>`).join(' <span style="color:var(--ink3)">+</span> ')} <span style="color:var(--ink3)">=</span> <b style="font-weight:600;color:var(--p);font-size:11pt">${pct(F.rate)}</b>${F.capped ? ` <span class="small">(Höchstsatz ${F.max} %)</span>` : ''}</div><div class="small" style="margin-top:2mm">Förderfähige Kosten ${eur(F.base)} (Kappungsgrenze ${eur(F.cap)}) · Förderstand ${deDate(F.stand.from)}${F.stand.to ? '–' + deDate(F.stand.to) : ''}${F.stand.note ? ' · ' + esc(F.stand.note) : ''}</div></div>`;
    b += `<div class="sec"><div class="km"></div><h1 style="font-size:15pt">Energiebilanz</h1>`;
    if (R.W) b += `<h3 style="margin-top:2mm">Heizkosten im ersten Jahr</h3>${hBars([{ label: R.fuel === 'oil' ? 'Ölheizung' : 'Gasheizung', sub: 'bisher', v: R.costOld1, c: '#D9482B', txt: eur(R.costOld1) }, { label: 'Wärmepumpe', sub: 'künftig', v: R.costNew1, c: S.design.primary, txt: eur(R.costNew1) }], { rowH: 40 })}`;
    const t = [];
    if (R.V) t.push(tile('Solarstrom (geschätzt)', 'ca. ' + kwh100(R.yield) + ' kWh', 'pro Jahr'), tile('Eigenverbrauch', pct(R.selfShare * 100), `ca. ${kwh100(R.self)} kWh`), tile('Autarkie', pct(R.autarky * 100), 'unabhängig vom Netz'));
    t.push(tile('CO₂-Einsparung', num(R.co2Save / 1000, 1) + ' t', 'pro Jahr', 'tgrn'));
    b += `<div class="g${t.length}" style="margin-top:3mm">${t.join('')}</div></div>`;
    return { title: 'Investition & Förderung', body: b };
  },
  monthly(p, R) {
    const c = C(), last = R.rows[R.rows.length - 1], oil = R.fuel === 'oil';
    const ys = [...new Set((R.fin ? [0, 1, 2] : [0, 1, 2, 3, 4]).map(i => R.startYear + i).concat(R.fin ? [2030, 2035, 2040, 2045] : [2030, 2032, 2035, 2038, 2040, 2045]))].filter(y => y >= R.startYear && y <= R.startYear + R.N - 1).sort();
    let b = chap('Ihre monatlichen Energiekosten', R.W && R.V ? 'Heizung und Haushaltsstrom zusammen – so entwickeln sich Ihre Energiekosten pro Monat, heute und in Zukunft.' : R.W ? 'Ihre Heizkosten pro Monat inklusive Grundpreis und Wartung – heute und in Zukunft.' : 'Ihre Stromkosten pro Monat – heute und in Zukunft.');
    b += `<div class="g3">${tile('Heute', eur(R.monthOld1), 'pro Monat mit dem heutigen System', 'tred')}${tile('Künftig', eur(R.monthNew1), 'pro Monat mit dem neuen System', 'tgrn')}${tile('Ersparnis', eur(R.monthOld1 - R.monthNew1), `pro Monat · in ${R.N} Jahren ${eur(last.monthSave)}`, 'tyel')}</div>`;
    b += `<div class="sec">${groupBars(monthlyGroups(R), { h: 200 })}<div class="small">${legendDot(c.red2, 'Heute-System')}${legendDot(c.p, 'Neues System')}</div></div>`;
    b += `<table class="t" style="margin-top:3mm"><thead><tr><th>Jahr</th>${R.W ? `<th>${oil ? 'Öl je Liter' : 'Gas je kWh'}</th><th>davon CO₂</th><th>${R.tariffOn ? 'WP-Strom' : 'Strom'} je kWh</th>` : '<th>Strom je kWh</th>'}<th>Heute-System / Monat</th><th>Neues System / Monat</th><th>Ersparnis / Monat</th></tr></thead><tbody>${ys.map(y => { const r = rowOfYear(R, y); return `<tr><td>${y}</td>${R.W ? `<td>${oil ? eur(r.fuelPrice, 2) : ct(r.fuelPrice)}</td><td>${oil ? eur(r.co2Part, 2) : ct(r.co2Part)}</td><td>${ct(r.hpPrice)}</td>` : `<td>${ct(r.hhPrice)}</td>`}<td>${eur(r.monthOld)}</td><td>${eur(r.monthNew)}</td><td style="color:var(--p);font-weight:600">${eur(r.monthSave)}</td></tr>`; }).join('')}</tbody></table>`;
    const P = R.scen === 'opt' ? { ...S.calc, ...S.optimistic } : S.calc;
    b += `<p class="small" style="margin-top:3mm">Prognose: ${R.W ? `${oil ? 'Heizöl' : 'Erdgas'} +${num(P.fuelInc, 1)} % pro Jahr zzgl. CO₂-Preis nach Pfad (${Object.entries(P.co2Path).map(([y, v]) => `${y}: ${v} €/t`).join(', ')})${R.fuel === 'gas' && P.gasNet ? `, Gasnetzentgelt +${num(P.gasNet, 1)} ct/kWh bis ${P.gasNetYear}` : ''}; ` : ''}Strom +${num(P.elecInc, 1)} % pro Jahr; Wartung +${num(P.maintInc, 1)} % pro Jahr.${R.V ? ' Haushaltsstrom ist in beiden Systemen enthalten, der Solarstrom-Nutzen ist beim neuen System abgezogen.' : ''}</p>`;
    return { title: 'Monatliche Energiekosten', body: b };
  },
  finance(p, R) {
    const am = R.amortRise ? Math.ceil(R.amortRise) : null, ys = [...new Set([1, 2, 3, 5, 10, 15, 20].concat(am ? [am] : []))].filter(t => t <= R.N).sort((a, b) => a - b);
    let b = chap('Finanzielle Bilanz & Ersparnis', 'Ab wann sich Ihre Investition rechnet – und was danach übrig bleibt.');
    b += `<div class="g4">${tile('Amortisation', yrs(R.amortStatic), 'bei gleichbleibenden Energiepreisen')}${tile('Amortisation', yrs(R.amortRise), `mit steigenden Energiepreisen${R.scen === 'opt' ? ' (optimistisch)' : ''}`, 'grad')}${tile('Ø Ersparnis', eur(R.avg), 'pro Jahr')}${tile(`Überschuss nach ${R.N} Jahren`, eur(R.surplus), 'nach Abzug der Investition', 'tyel')}</div>`;
    b += `<div class="sec">${amortChart(R, { h: 240 })}<div class="small">${legendDot(S.design.primary, 'kumulierter Saldo mit steigenden Preisen')}${legendDot('#F2B8A6', 'noch nicht amortisiert')}${legendDot('#1E4C86', 'gleichbleibende Preise', true)}</div></div>`;
    const hh = r => (R.V ? (R.hhCons + R.carKWh) * r.hhPrice : 0);
    b += `<table class="t" style="margin-top:3mm"><thead><tr><th>Jahr</th><th>Energiekosten bisher</th><th>Energiekosten neu</th><th>Ersparnis</th><th>Ersparnis gesamt</th><th>Stand nach Investition</th></tr></thead><tbody>${ys.map(t => { const r = R.rows[t - 1]; return `<tr class="${am === t ? 'hl' : ''}"><td>${t} (${r.year})${am === t ? ' · amortisiert' : ''}</td><td>${eur(r.costOld + hh(r))}</td><td>${eur(r.costNew + hh(r) - r.pv)}</td><td>${eur(r.saving)}</td><td>${eur(r.cum)}</td><td style="font-weight:600;color:${r.saldo < 0 ? 'var(--old)' : 'var(--p)'}">${r.saldo > 0 ? '+' : ''}${eur(r.saldo)}</td></tr>`; }).join('')}</tbody></table>`;
    b += `<p class="small" style="margin-top:2.5mm">Energiekosten pro Jahr ${R.W && R.V ? 'für Heizung und Haushaltsstrom' : R.W ? 'für die Heizung inkl. Grundpreis und Wartung' : 'für den Haushaltsstrom'}${R.V ? '; beim neuen System ist der Nutzen Ihres Solarstroms bereits abgezogen' : ''}. „Stand nach Investition“: Ersparnis gesamt minus Ihre Investition von ${eur(R.invest)} (${R.sowieso ? 'Mehrkosten nach Abzug der ohnehin fälligen neuen Heizung' : 'Kosten nach Förderung, Zuschüssen und Rabatt'}). Ab dem hervorgehobenen Jahr ist die Anlage bezahlt.${R.zins > 0 ? ` Mit einem Kalkulationszins von ${num(R.zins, 1)} % beträgt der Barwert des Überschusses ${eur(R.npvSurplus)}.` : ''}</p>`;
    return { title: 'Finanzielle Bilanz', body: b };
  },
  prices(p, R) {
    const mine = R.W ? (R.fuel === 'oil' ? 'oel' : 'gas') : 'strom';
    const block = key => {
      const d = S.prices[key], first = Object.entries(d.years).sort((a, b) => a[0] - b[0])[0], inc = first ? (d.current / first[1] - 1) * 100 : null;
      const col = key === 'strom' ? '#1E4C86' : key === 'gas' ? S.design.primary : '#D9482B';
      return `<div class="tile" style="display:grid;grid-template-columns:1fr 50mm;gap:4mm;padding:3.5mm 4mm;margin-bottom:3mm;${key === mine ? 'box-shadow:0 0 0 0.4mm ' + S.design.secondary : ''}"><div>${priceChart(key, { h: 170, color: col })}</div><div>${key === mine ? '<div style="display:table;background:var(--t-yel);color:var(--s-dark);border-radius:10mm;padding:1.2mm 3mm;font-size:7.4pt;font-weight:600;line-height:1.2;margin-bottom:2mm">Ihr heutiger Energieträger</div>' : ''}<h2 style="margin:0">${d.label}</h2>
        <div style="font-size:15pt;font-weight:600;margin-top:2mm">${num(d.current, d.current < 100 ? 2 : 0)} <span style="font-size:8.5pt;color:var(--ink3)">${d.unit}</span></div><div class="small">aktuell${d.currentNote ? ', ' + esc(d.currentNote) : ''}</div>
        ${inc !== null ? `<div style="display:table;background:var(--t-red);color:var(--old);border-radius:10mm;padding:1.2mm 3mm;font-size:7.4pt;font-weight:600;line-height:1.2;margin-top:1.5mm">${inc >= 0 ? '+' : ''}${num(inc)} % seit ${first[0]}</div>` : ''}
        <div class="small" style="margin-top:1.5mm">Prognose 2040: <b style="color:var(--ink)">${num(d.forecast[2040], d.forecast[2040] < 100 ? 1 : 0)} ${d.unit}</b></div><div class="small" style="margin-top:1mm;line-height:1.35">${esc(d.text)}</div></div></div>`;
    };
    const b = chap('Energiepreise: 20 Jahre Rückblick & Ausblick', 'Historische Preise (Fläche) und Prognose bis 2040 (gestrichelt).') + ['strom', 'gas', 'oel'].map(block).join('') + `<p class="small">Quellen: ${esc(S.prices.sources)}</p>`;
    return { title: 'Energiepreise', body: b };
  },
  why(p, R) {
    const oil = R.fuel === 'oil', co2Now = interpPath(S.calc.co2Path, R.startYear), co2_30 = interpPath(S.calc.co2Path, 2030), co2_40 = interpPath(S.calc.co2Path, 2040);
    const perYear = pr => R.cons * co2Share(R.fuel, pr);
    const num3 = (n, t, x) => `<div style="display:flex;gap:3mm;align-items:flex-start;margin-bottom:1.5mm">${numCircle(n, 7, { fill: S.design.primary, color: '#fff', fs: 12 })}<div><h2 style="margin:0.6mm 0 0.5mm">${t}</h2><div class="small" style="font-size:8.2pt;color:var(--ink2)">${x}</div></div></div>`;
    let b = chap('Warum Öl und Gas langfristig teurer werden', 'Vier Entwicklungen, die heute schon feststehen.');
    b += `<div class="tile" style="padding:3.5mm 4mm">${num3(1, 'Der CO₂-Preis steigt', `Seit 2021 kostet jede Tonne CO₂ aus Heizöl und Erdgas Geld. Ab 2028 bildet sich der Preis im europäischen Emissionshandel frei – Experten erwarten deutlich höhere Werte.`)}
      <div style="display:grid;grid-template-columns:1fr 70mm;gap:4mm;align-items:center"><div style="max-width:78mm">${co2Columns()}<div class="small" style="text-align:center">CO₂-Preis in €/t</div></div><div style="background:#fff;border-radius:var(--dr);padding:3mm 4mm"><div class="small">Bei Ihrem Verbrauch von ${num(R.cons)} ${oil ? 'Litern Heizöl' : 'kWh Erdgas'} zahlen Sie allein für CO₂:</div>
      <div style="display:grid;grid-template-columns:1fr auto;gap:1mm 3mm;margin-top:2mm;font-size:8.6pt"><span>heute (${num(co2Now)} €/t)</span><b>${eur(perYear(co2Now))}</b><span>2030 (${num(co2_30)} €/t)</span><b>${eur(perYear(co2_30))}</b><span>2040 (${num(co2_40)} €/t)</span><b style="color:var(--old)">${eur(perYear(co2_40))}</b></div><div class="small" style="margin-top:1.5mm">pro Jahr, inkl. MwSt.</div></div></div></div>`;
    b += `<div class="tile" style="padding:3.5mm 4mm;margin-top:2.5mm;display:grid;grid-template-columns:1fr 70mm;gap:4mm;align-items:center"><div>${num3(2, 'Heizöl hängt am Weltmarkt', 'Der Ölpreis folgt Rohöl, Dollarkurs und Krisen – ohne Vorwarnung. Dazu kommen Tankwartung, Lagerung und Prüfpflichten. Und je weniger Häuser mit Öl heizen, desto teurer wird die Lieferung pro Kunde.')}</div><div>${oilBars()}<div class="small" style="text-align:center">Heizöl in €/100 l (Jahresmittel, ${new Date().getFullYear()} aktuell)</div></div></div>`;
    b += `<div class="tile" style="padding:3.5mm 4mm;margin-top:2.5mm;display:grid;grid-template-columns:1fr 72mm;gap:4mm;align-items:center"><div>${num3(3, 'Weniger Kunden, gleiche Netzkosten', 'Immer mehr Haushalte steigen auf Wärmepumpen um. Die Kosten für das Gasnetz bleiben aber – und verteilen sich auf immer weniger Kunden. Laut Fraunhofer IFAM kann das Netzentgelt von heute rund 2,3 ct auf ca. 22 ct pro kWh steigen.')}</div><div>${gasSpiral()}</div></div>`;
    b += `<div class="tile" style="padding:3.5mm 4mm;margin-top:2.5mm">${num3(4, 'Strom wird heimisch und erneuerbar', 'Wind und Sonne liefern schon heute mehr als die Hälfte unseres Stroms – ohne Brennstoffkosten und ohne CO₂-Preis. Mit eigener Photovoltaik erzeugen Sie einen Teil davon direkt auf Ihrem Dach.')}</div>`;
    b += `<div class="grad" style="border-radius:var(--dr);padding:4mm 5mm;margin-top:3.5mm"><b style="font-size:10.5pt">Fazit</b><div style="margin-top:1mm;font-size:9pt;color:rgba(255,255,255,.92)">Wer heute von ${oil ? 'Öl' : 'Gas'} auf eine Wärmepumpe umsteigt, macht sich unabhängig von CO₂-Preis, ${oil ? 'Weltmarktschwankungen' : 'steigenden Netzentgelten'} – und sichert sich die aktuell hohe Förderung.</div></div>`;
    b += `<p class="small" style="margin-top:2.5mm">Quellen: Brennstoffemissionshandelsgesetz (BEHG), EU-Emissionshandel (ETS 2), Fraunhofer IFAM „Gasnetzentgelte im Wandel“, Umweltbundesamt.</p>`;
    return { title: 'Warum Öl und Gas teurer werden', body: b };
  },
  leisure(p, R) {
    const comps = comparisonsOf(R).slice(0, 4), base = S.comparisons.basis === 'total' ? R.total : R.surplus;
    let b = chap(`Was Sie sich in ${R.N} Jahren leisten können`, 'Ihre Ersparnis – greifbar gemacht.');
    b += `<div class="grad" style="border-radius:var(--dr);padding:6mm 7mm"><div style="font-size:9pt;color:rgba(255,255,255,.9)">${S.comparisons.basis === 'total' ? `Gesamtersparnis in ${R.N} Jahren` : `Überschuss nach ${R.N} Jahren – nach Abzug der Investition`}</div><div style="font-size:30pt;font-weight:600;color:var(--hl-num);line-height:1.15">${eur(base)}</div>
      ${comps.length ? `<div class="g${comps.length}" style="margin-top:4mm">${comps.map(i => `<div style="background:rgba(255,255,255,.14);border-radius:3.5mm;padding:3.5mm;text-align:center"><div style="display:flex;justify-content:center">${icC(i.icon, 26, '#ffffff')}</div><div style="font-size:17pt;font-weight:600;margin-top:1mm">${num(Math.floor(i.times))}×</div><div style="font-size:8.2pt;color:rgba(255,255,255,.9)">${esc(i.label)}</div><div style="font-size:7pt;color:rgba(255,255,255,.7)">à ${eur(i.price)}</div></div>`).join('')}</div>` : ''}</div>`;
    b += assumptionsBlock(p, R, showAssumptions(p, R));
    return { title: 'Ihre Ersparnis', body: b };
  },
  assump(p, R) { return { title: 'Berechnungsannahmen', body: chap('Berechnungsannahmen', 'Grundlagen dieser Berechnung.') + assumptionsBlock(p, R, true) }; },
  variants(p, R) {
    const list = variantResults(p), best = list.reduce((a, b) => (b.R.surplus > a.R.surplus ? b : a), list[0]);
    let b = chap(txt('variants', 'title'), txt('variants', 'lead'));
    const desc = x => { if (!x.v) return 'Wie angeboten'; const q = applyVariant(p, x.v), d = []; if (hasPV(p)) { d.push(num(nz(q.pv.kwp), 1) + ' kWp'); d.push(nz(q.pv.bat) > 0 ? num(q.pv.bat, 1) + ' kWh Speicher' : 'ohne Speicher'); } if (p.type === 'pvwp') d.push(q.rod.on ? 'mit Heizstab' : 'ohne Heizstab'); return d.join(' · '); };
    b += `<table class="t"><thead><tr><th></th>${list.map(x => `<th>${esc(x.name)}</th>`).join('')}</tr></thead><tbody><tr><td>Ausstattung</td>${list.map(x => `<td style="font-size:7.4pt;color:var(--ink3)">${esc(desc(x))}</td>`).join('')}</tr>${variantRows(list).map(([k, f]) => `<tr><td>${k}</td>${list.map(x => `<td style="${x === best ? 'font-weight:600;color:var(--p)' : ''}">${f(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    b += `<div class="sec" style="background:var(--p-light);border-radius:var(--dr);padding:4.5mm 5mm;font-size:9pt">${best.R.surplus > 0 ? `<b style="font-weight:600">Unsere Empfehlung:</b> Den höchsten Überschuss nach ${S.calc.years} Jahren erzielt <b style="font-weight:600">${esc(best.name)}</b> mit ${eur(best.R.surplus)}${best.R.amortRise !== null ? ` – bezahlt gemacht nach ${num(best.R.amortRise, 1)} Jahren` : ''}.` : `<b style="font-weight:600">Im Vergleich am wirtschaftlichsten:</b> ${esc(best.name)} (Ergebnis nach ${S.calc.years} Jahren: ${eur(best.R.surplus)}).`}</div>`;
    b += `<p class="small" style="margin-top:3mm">Alle Varianten sind mit denselben Annahmen gerechnet (Energiepreise, Förderung, Verbrauch). Grün hervorgehoben: die Variante mit dem höchsten Überschuss.</p>`;
    return { title: 'Varianten im Vergleich', body: b };
  },
  sign(p, R) {
    const T = S.discount.orderText.replace('{firma}', coName()).replace('{angebot}', p.offer.number || '–').replace('{angebotsdatum}', p.offer.date ? deDate(p.offer.date) : '–').replace('{preis}', eur(R.gross, 2)).replace('{rabatt}', R.discount ? ` abzüglich ${S.discount.text.replace('{datum}', deDate(p.discount.until)).replace(/^Sonderrabatt/, 'Sonderrabatt von ' + eur(R.discount, 2))}` : '');
    let b = chap('Angebot annehmen', 'Überzeugt? Dann können Sie Ihren Auftrag direkt hier erteilen.');
    if (R.discount) b += `<div style="background:var(--t-yel);border-radius:var(--dr);padding:6mm 7mm;display:flex;justify-content:space-between;align-items:center;gap:5mm"><div><div style="font-size:9pt;font-weight:600;color:var(--s-dark)">Ihr Vorteil bei schneller Entscheidung</div><div style="font-size:11pt;font-weight:600;color:var(--ink);margin-top:1mm">${esc(S.discount.text.replace('{datum}', deDate(p.discount.until)))}</div></div><div style="font-size:24pt;font-weight:600;color:var(--p);white-space:nowrap">${eur(R.discount)}</div></div>`;
    b += `<div class="sec tile"><div style="display:grid;grid-template-columns:1fr 1fr;gap:2.5mm 6mm;font-size:9pt"><span class="muted">Angebot</span><b>${esc(p.offer.number || '–')}</b><span class="muted">Angebotsdatum</span><b>${p.offer.date ? deDate(p.offer.date) : '–'}</b><span class="muted">Bruttopreis</span><b>${eur(R.gross, 2)}</b>${R.discount ? `<span class="muted">Sonderrabatt</span><b>− ${eur(R.discount, 2)}</b><span class="muted">Preis nach Rabatt</span><b>${eur(R.gross - R.discount, 2)}</b>` : ''}</div></div>`;
    const sg = p.sign && p.sign.cust ? p.sign : null, box = on => (on ? `<span style="display:inline-block;width:4.4mm;height:4.4mm;border-radius:1mm;background:var(--p);vertical-align:-1mm;margin-right:2mm;position:relative"><img src="${svgDataUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="32" height="32"><path d="M3.5 8.5 6.6 11.5 12.5 4.8" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>')}" style="position:absolute;left:0.3mm;top:0.3mm;width:3.8mm;height:3.8mm"></span>` : '<span class="chk"></span>');
    b += `<div class="sec" style="font-size:9.6pt;line-height:1.55"><p>${box(sg && sg.order)}${esc(T)}</p><p>${box(sg && sg.cond)}Die Beauftragung erfolgt unter der aufschiebenden Bedingung der Förderzusage.</p></div>`;
    const line = (l, inner = '') => sigField(l, inner, 16);
    const sigImg = id => (sigSrc(id) ? `<img src="${sigSrc(id)}" style="max-height:15mm;max-width:70mm;width:auto;height:auto">` : '');
    const od = sg ? `<span style="font-family:'HandSig','Caveat',cursive;font-weight:500;font-size:16pt;line-height:1.1">${esc(sg.place || '')}, ${deDate(sg.date)}</span>` : '';
    b += `<div class="g2" style="margin-top:8mm;gap:12mm">${line('Ort, Datum', od)}${line('Ort, Datum', sg && sg.adv ? od : '')}${line(`Unterschrift Kunde (${esc(custName(p))})`, sg ? sigImg(sg.cust) : '')}${line(`Unterschrift ${esc(coName())}`, sg ? sigImg(sg.adv) : '')}</div>`;
    b += `<p class="small" style="margin-top:6mm">Es gelten die Bedingungen und die Widerrufsbelehrung des zugrunde liegenden Angebots.</p><div style="margin-top:6mm">${advisorCard(p, R, true)}</div>`;
    return { title: 'Angebot annehmen', body: b };
  }
};
function assumptionsBlock(p, R, show) {
  const items = assumptionItems(p, R), c = S.calc;
  return `${show ? `<div class="sec"><h2>Berechnungsannahmen</h2><ul class="dl">${items.map(i => `<li>${i}</li>`).join('')}</ul></div>` : ''}<div class="sec small" style="border-top:0.3mm solid #E6EDF3;padding-top:3mm;line-height:1.5"><b style="color:var(--ink2)">Haftungshinweis:</b> ${esc(c.disclaimer)}</div>`;
}
function assumptionItems(p, R) {
  const c = S.calc, P = R.scen === 'opt' ? { ...c, ...S.optimistic } : c, F = R.fund, items = [];
  if (R.scen === 'opt') items.push(`Szenario: ${esc(S.optimistic.label)} (Standardannahmen: Amortisation ${amortTxt(R.real.amortRise)} Jahre)`);
  items.push(`Betrachtungszeitraum ${R.N} Jahre ab ${R.startYear}`);
  if (R.W) {
    items.push(`Preissteigerung ${R.fuel === 'oil' ? 'Heizöl' : 'Erdgas'} ohne CO₂: ${num(P.fuelInc, 1)} % pro Jahr`);
    items.push(`CO₂-Preis: ${Object.entries(P.co2Path).map(([y, v]) => `${y} ${v} €`).join(', ')} je Tonne`);
    if (R.fuel === 'gas' && P.gasNet) items.push(`Gasnetzentgelt: +${num(P.gasNet, 1)} ct/kWh bis ${P.gasNetYear}`);
    items.push(`Heizöl 10 kWh/l, Nutzungsgrad Kessel ${num(nz(p.heating.eff, 85))} %`);
    items.push(`Jahresarbeitszahl ${num(R.jaz, 2)}, ${R.tariffOn ? `separater WP-Stromtarif ${ct(R.tariff)}/kWh` : `Wärmepumpe über Haushaltsstrom ${ct(R.tariff)}/kWh`}`);
    items.push(`Wärmebedarf ${num(R.heat)} kWh, WP-Strom ${num(R.hpPower)} kWh pro Jahr`);
    if (F.stand) items.push(`Förderung BEG EM, Stand ${deDate(F.stand.from)}: ${pct(F.rate)}`);
  }
  items.push(`Preissteigerung Strom: ${num(P.elecInc, 1)} % pro Jahr`, `Preissteigerung Wartung: ${num(P.maintInc, 1)} % pro Jahr`);
  if (R.V) items.push(R.yieldSrc === 'pvgis' ? `PV-Ertrag laut PVGIS (EU-Kommission): ca. ${kwh100(R.yield)} kWh/Jahr` : `PV-Ertrag ${num(c.pvYield)} kWh/kWp bei Süd 30–35°, Ihr Dach ${pct(R.roofFactor * 100)} davon`, `Degradation ${num(c.pvDeg, 1)} % pro Jahr`, ...(R.carKWh ? [`E-Auto: ${num(R.carKWh)} kWh Ladestrom zu Hause, davon rund ${kwh100(R.carPV)} kWh Solarstrom`] : []), `Einspeisevergütung ${num(c.feedIn, 2)} ct/kWh`, `Eigenverbrauch ${pct(R.selfShare * 100)} (Modell inkl. Speicher)`, `Haushaltsstrom ${num(R.hhCons)} kWh zu ${ct(R.hhPrice)}/kWh`);
  if (R.sowieso) items.push(`Sowieso-Kosten neue ${R.fuel === 'oil' ? 'Öl' : 'Gas'}heizung: ${eur(R.sowieso)}`);
  items.push(`Kalkulationszins ${num(P.rate, 1)} %`, `CO₂-Faktoren: Öl ${num(c.co2Oil, 2)}, Gas ${num(c.co2Gas, 2)}, Strom ${num(c.co2El, 2)} kg/kWh`);
  return items;
}

/* =========================================================
   PDF-Erzeugung
   ========================================================= */
function fitPages(root) {
  $$('section.page .pb', root).forEach(pb => {
    pb.style.transform = ''; pb.style.width = ''; pb.style.right = '';
    const box = pb.getBoundingClientRect(); if (!box.height) return;
    const bottom = [...pb.querySelectorAll('*')].reduce((m, e) => Math.max(m, e.getBoundingClientRect().bottom), box.top);
    const over = bottom - box.bottom; if (over <= 1) return;
    const s = Math.max(0.8, box.height / (box.height + over + 2));
    pb.style.width = (box.width / s) + 'px'; pb.style.right = 'auto'; pb.style.transformOrigin = 'top left'; pb.style.transform = `scale(${s.toFixed(4)})`;
  });
}
/* Hintergrund hinter den Unterschriftsfeldern – Form, Farbe, Stärke einstellbar */
function sigBoxStyle() {
  const o = { mode: 'auto', color: '#ffffff', alpha: 88, shape: 'round', ...(S.design.sigBox || {}) };
  const dark = CUR_LAYOUT !== 'sales' && docDark();
  if (o.mode === 'off' || (o.mode === 'auto' && !dark)) return '';
  const [r, g, b] = hexToRgb(o.color), lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255, a = Math.max(5, Math.min(100, nz(o.alpha, 88))) / 100;
  const rad = o.shape === 'pill' ? '10mm' : o.shape === 'square' ? '0.6mm' : '2.5mm';
  return `background:rgba(${r},${g},${b},${a.toFixed(2)});border-radius:${rad};padding:0 5mm;align-items:center;${a >= 0.45 ? `color:${lum > 0.55 ? '#0F2A3D' : '#ffffff'};` : ''}`;
}
/* Unterschriftsfeld: mit Hintergrund ohne Strich, Beschriftung klein und ausgeblichen unten links im Feld */
function sigField(l, inner, h) {
  const box = sigBoxStyle();
  if (!box) return `<div><div style="height:${h}mm;display:flex;align-items:flex-end;padding-bottom:1mm">${inner}</div><div style="border-top:0.35mm solid var(--ink);padding-top:1.5mm;font-size:8pt;color:var(--ink3)">${l}</div></div>`;
  const pill = (S.design.sigBox || {}).shape === 'pill';
  return `<div style="height:${h + 5}mm;position:relative;display:flex;padding-bottom:5mm;${box}">${inner}<div style="position:absolute;left:${pill ? 8 : 5}mm;right:${pill ? 8 : 4}mm;bottom:2.4mm;font-size:7.4pt;line-height:1.4;opacity:.6;white-space:nowrap">${l}</div></div>`;
}
const sigSrc = id => (id && String(id).startsWith('data:') ? id : id ? fileUrl(id) : '');
function checkBeforePdf(p) {
  if (hasWP(p) && !(p.heating.year > 1900)) { toast('Bitte zuerst das Baujahr der Heizung eintragen – es bestimmt die Förderung.', 'err', 4500); UI.step = 3; p.step = 3; saveProject(p); go('projekt/' + p.id + '/3'); setTimeout(() => { const el = $('[data-b="p:heating.year"]'); if (el) { el.scrollIntoView({ block: 'center' }); el.focus(); } }, 120); return false; }
  return true;
}
function fixSvgColors(root) {
  $$('svg', root).forEach(svg => {
    const col = getComputedStyle(svg).color || '#0F2A3D';
    svg.querySelectorAll('[stroke="currentColor"],[fill="currentColor"]').forEach(n => { if (n.getAttribute('stroke') === 'currentColor') n.setAttribute('stroke', col); if (n.getAttribute('fill') === 'currentColor') n.setAttribute('fill', col); });
    if (svg.getAttribute('stroke') === 'currentColor') svg.setAttribute('stroke', col);
  });
}
async function waitImages(root) { await Promise.all($$('img', root).map(img => img.complete && img.naturalWidth ? null : new Promise(r => { img.onload = img.onerror = r; setTimeout(r, 6000); }))); }
async function preparePrintRoot(p, R) {
  await loadFiles(p.docs.flatMap(d => d.pages).concat(p.components.map(c => (PRODUCTS.find(x => x.id === c.id) || {}).img), p.sign ? [p.sign.cust, p.sign.adv] : []));
  const root = $('#print-root'); root.innerHTML = buildDocHtml(p, R);
  fixSvgColors(root); fitPages(root);
  await document.fonts.ready; await waitImages(root);
  return root;
}
let pdfBusy = false;
async function makePdf(force, layout) {
  const p = curProject(); if (!p || pdfBusy) return;
  if (!checkBeforePdf(p)) return;
  const ask = S.doc.pdfAsk || 'ask';
  if (!layout) layout = ask === 'ask' ? null : ask;
  if (!layout) { pdfChooser(p); return; }
  UI.pdfLayout = layout; p.docOpts.layout = layout; saveProject(p);
  if (!force) { const w = plausibility(p, compute(p)); if (w.length) { modal(`<h3 class="text-[20px] font-semibold pr-8">Bitte kurz prüfen</h3><p class="text-ink3 text-[14px] mt-1">Einige Angaben sind ungewöhnlich. Stimmen sie, können Sie das PDF trotzdem erstellen.</p><ul class="mt-4 space-y-2 text-[14px] text-ink2 list-disc pl-5">${w.map(t => `<li>${esc(t)}</li>`).join('')}</ul><div class="flex flex-wrap justify-end gap-2 mt-6"><button class="btn-s" data-a="plaus-back">Zurück zu den Daten</button><button class="btn-p" data-a="pdf-force">Trotzdem erstellen</button></div>`); return; } }
  pdfBusy = true;
  modal(`<div class="text-center py-4"><div class="w-14 h-14 rounded-full bg-p/10 text-p grid place-items-center mx-auto"><span class="spin inline-block">${ic('refresh', 26)}</span></div><div class="font-extrabold text-[18px] mt-4">PDF wird erstellt …</div><div class="text-ink3 text-[14px] mt-1" id="pdf-prog">Vorbereitung</div></div>`);
  try {
    const R = compute(p);
    const { html2canvas, jsPDF } = await needPdfMaker();
    const root = await preparePrintRoot(p, R);
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
    const pages = $$('section.page', root);
    for (let i = 0; i < pages.length; i++) {
      const el = pages[i], prog = $('#pdf-prog'); if (prog) prog.textContent = `Seite ${i + 1} von ${pages.length}`;
      if (i) pdf.addPage();
      if (el.dataset.file) {
        const f = FILES[el.dataset.file]; if (!f) continue;
        const data = pdfSmall() ? await shrinkDataUrl(await blobToDataURL(f.blob)) : await blobToDataURL(f.blob);
        const img = await new Promise(r => { const im = new Image(); im.onload = () => r(im); im.src = data; });
        const sc = Math.min(210 / img.naturalWidth, 297 / img.naturalHeight), w = img.naturalWidth * sc, h = img.naturalHeight * sc;
        pdf.addImage(data, 'JPEG', (210 - w) / 2, (297 - h) / 2, w, h, undefined, 'FAST');
        const lab = el.dataset.label; pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7.5);
        const tw = pdf.getTextWidth(lab) + 6; pdf.setFillColor(255, 255, 255); pdf.setDrawColor(220, 230, 238); pdf.roundedRect(205 - tw, 4, tw, 6, 3, 3, 'FD'); pdf.setTextColor(61, 85, 104); pdf.text(lab, 208 - tw, 8);
        continue;
      }
      const canvas = await html2canvas(el, { scale: pdfSmall() ? 1.35 : 2, useCORS: true, allowTaint: false, backgroundColor: '#ffffff', logging: false, width: el.offsetWidth, height: el.offsetHeight, windowWidth: 1200 });
      pdf.addImage(canvas.toDataURL('image/jpeg', pdfSmall() ? 0.72 : 0.9), 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      canvas.width = canvas.height = 0;
    }
    const blob = pdf.output('blob');
    root.innerHTML = '';
    const name = `${layoutOf(p) === 'sales' ? 'Energiekonzept' : 'Wirtschaftlichkeit'}_${(p.customer.name || 'Kunde').replace(/[^\wäöüÄÖÜß-]+/g, '_')}_${isoToday()}.pdf`;
    if ((p.status || 'offen') === 'offen') { p.status = 'gesendet'; p.statusDate = isoToday(); saveProject(p); }
    pdfReady(blob, name);
  } catch (e) { console.error(e); closeModal(); toast('PDF konnte nicht erstellt werden: ' + (e.message || e), 'err', 5000); }
  pdfBusy = false;
}
function pdfChooser(p) {
  const R = compute(p), cnt = l => { const prev = UI.docLayout; UI.docLayout = l; try { return visiblePages(p, R).reduce((a, x) => a + x.count, 0); } finally { UI.docLayout = prev; } };
  const opt = (l, t, x) => `<button class="w-full text-left rounded-[calc(var(--r)-2px)] border border-line2 hover:border-p p-4 flex items-start gap-3 ${layoutOf(p) === l ? 'ring-2 ring-p/40' : ''}" data-a="pdf-go" data-v="${l}"><span class="icon-box shrink-0">${ic(l === 'full' ? 'file' : 'sparkle', 18)}</span><span class="flex-1"><span class="block font-semibold text-[15px]">${t} <span class="text-ink3 font-normal text-[13px]">· ${cnt(l)} Seiten</span></span><span class="block text-[13px] text-ink3 mt-0.5">${x}</span></span></button>`;
  modal(`<h3 class="text-[20px] font-semibold pr-8">Welche PDF möchten Sie erstellen?</h3><div class="space-y-3 mt-5">${opt('full', 'Komplette PDF', 'Alle Seiten mit Erklärungen, Diagrammen und Hintergründen.')}${opt('sales', 'Vertriebs-PDF', 'Kompakt und verkaufsstark: die wichtigsten Zahlen, Förderung, Ersparnis und Auftrag.')}</div><p class="hint mt-4">Die Frage lässt sich unter Einstellungen → Dokument & Verkauf abschalten.</p>`);
}
function pdfReady(blob, name) {
  const url = URL.createObjectURL(blob), file = new File([blob], name, { type: 'application/pdf' });
  const canShare = !!(navigator.canShare && navigator.canShare({ files: [file] }));
  modal(`<div class="text-center"><div class="w-14 h-14 rounded-full bg-p text-white grid place-items-center mx-auto">${ic('check', 28)}</div><h3 class="text-[20px] font-extrabold mt-4">PDF ist fertig</h3><p class="text-ink3 text-[14px] mt-1 break-all">${esc(name)} · ${num(blob.size / 1024 / 1024, 1)} MB</p>
    <div class="flex flex-col gap-2 mt-6">${canShare ? `<button class="btn-p" id="pdf-share">${ic('share', 17)}Teilen / In Dateien sichern</button>` : ''}<a class="${canShare ? 'btn-s' : 'btn-p'}" href="${url}" download="${esc(name)}">${ic('download', 17)}Herunterladen</a><a class="btn-s" href="${url}" target="_blank" rel="noopener">${ic('ext', 17)}Öffnen</a></div></div>`);
  const sb = $('#pdf-share'); if (sb) sb.onclick = async () => { try { await navigator.share({ files: [file], title: name }); } catch (e) { if (e.name !== 'AbortError') toast('Teilen nicht möglich.', 'err'); } };
}
async function printDoc() {
  const p = curProject(); if (!p || !checkBeforePdf(p)) return;
  await preparePrintRoot(p, compute(p));
  window.print();
  setTimeout(() => { $('#print-root').innerHTML = ''; }, 1500);
}
