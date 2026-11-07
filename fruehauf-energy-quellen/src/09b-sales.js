/* =========================================================
   Vertriebs-PDF – kompaktes Verkaufsdokument (zweites Layout)
   Seiten, Reihenfolge, Texte, Schrift und Farben sind in den
   Einstellungen anpassbar. *Wort* in Überschriften = Akzentfarbe.
   ========================================================= */
const SALES_KEYS = ['cover', 'sGlance', 'sSystem', 'sInvest', 'sMonthly', 'sLong', 'sWhy', 'sSign', 'sBasis', 'attach'];
Object.assign(DOC_TEXT, {
  sCover: { label: 'Deckblatt (Vertrieb)', badge: 'Ihr persönliches Energiekonzept', title: 'Mit {system} zahlen Sie künftig *{monat} weniger* Energiekosten – jeden Monat.', lead: '' },
  sGlance: { label: 'Auf einen Blick', badge: 'Auf einen Blick', title: 'Das bringt Ihnen Ihr neues *Energiesystem*', lead: '{kunde}, hier sehen Sie die wichtigsten Zahlen Ihres Energiekonzepts – berechnet mit Ihren eigenen Verbrauchsdaten.' },
  sSystem: { label: 'Ihr neues Energiesystem', badge: 'Ihr neues Energiesystem', title: 'Das bauen wir *für Sie* ein', lead: 'Gemäß unserem Angebot {angebot} – fachgerecht geplant und montiert von {firma}.' },
  sInvest: { label: 'Ihre Investition', badge: 'Ihre Investition', title: 'Der Staat zahlt *mit*', lead: '' },
  sMonthly: { label: 'Ihre monatlichen Kosten', badge: 'Ihre monatlichen Kosten', title: 'Jeden Monat *{monat}* mehr in Ihrer Tasche', lead: 'Was Sie jeden Monat für {was} bezahlen – heute und in den kommenden Jahren.' },
  sLong: { label: 'Langfristig gerechnet', badge: 'Langfristig gerechnet', title: '*{gesamt}* Ersparnis in {jahre} Jahren', lead: '' },
  sWhy: { label: 'Warum jetzt?', badge: 'Warum jetzt?', title: 'Warten wird *teurer*', lead: 'Gute Gründe, Ihr neues Energiesystem jetzt umzusetzen.' },
  sSign: { label: 'Angebot annehmen', badge: 'Angebot annehmen', title: 'Ihr Weg zum neuen *Energiesystem*', lead: 'Sie möchten Ihr neues Energiesystem beauftragen? Dann unterschreiben Sie bitte hier und senden uns diese Seite zurück.' },
  sBasis: { label: 'Rechengrundlagen', badge: '', title: 'Rechengrundlagen', lead: 'Transparenz ist uns wichtig: Auf diesen Annahmen beruht Ihre Berechnung.' }
});
const SALES_FONTS = ['Inter', 'Plus Jakarta Sans', 'Manrope', 'Figtree', 'DM Sans', 'Geist', 'Instrument Sans', 'IBM Plex Sans'];
const layoutOf = p => UI.docLayout || (p && p.docOpts && p.docOpts.layout) || 'full';
const salesOrder = () => { const o = (S.doc.salesOrder || []).filter(k => SALES_KEYS.includes(k)); return o.concat(SALES_KEYS.filter(k => !o.includes(k))); };

/* Seitenauswahl je Layout */
const _fullPageDefs = docPageDefs, _fullVisible = visiblePages;
docPageDefs = function (p, R) { return layoutOf(p) === 'sales' ? salesPageDefs(p, R) : _fullPageDefs(p, R); };
visiblePages = function (p, R) { return layoutOf(p) === 'sales' ? salesPageDefs(p, R).filter(d => d.on) : _fullVisible(p, R); };
function salesPageDefs(p, R) {
  const o = p.pages || {}, att = attachmentPages(p), dflt = S.doc.defaults || {};
  const spec = { reviews: reviewsOn(), cover: true, sGlance: true, sSystem: true, sInvest: true, sMonthly: true, sLong: true, sWhy: true, sSign: true, sBasis: true, attach: att.length > 0 };
  return salesOrder().map(key => {
    const applies = spec[key], def = key === 'sBasis' ? dflt.sBasis === true : dflt[key] !== false;
    if (key === 'sBasis' && R.scen === 'opt') return { key, label: DOC_TEXT[key].label, applies, on: true, note: 'Beim optimistischen Szenario immer enthalten', count: 1 };
    const label = key === 'attach' ? `Anlagen (${att.length} ${att.length === 1 ? 'Seite' : 'Seiten'})` : key === 'cover' ? 'Deckblatt' : DOC_TEXT[key].label;
    return { key, label, applies, on: applies && (o[key] !== undefined ? !!o[key] : def), note: '', count: key === 'attach' ? att.length : 1 };
  });
}

/* Texte mit Platzhaltern; *Wort* wird farbig hervorgehoben */
function sysName(p) { return p.type === 'pvwp' ? 'Solarstrom und Wärmepumpe' : p.type === 'pv' ? 'Ihrer Solaranlage' : 'Ihrer Wärmepumpe'; }
function sFill(s, p, R) {
  const mon = Math.max(0, R.monthOld1 - R.monthNew1);
  return String(s || '').replace(/\{kunde\}/g, custName(p)).replace(/\{angebot\}/g, p.offer.number ? `Nr. ${p.offer.number}${p.offer.date ? ' vom ' + deDate(p.offer.date) : ''}` : '').replace(/\{firma\}/g, coName())
    .replace(/\{monat\}/g, eur(mon)).replace(/\{gesamt\}/g, eur(R.total)).replace(/\{jahre\}/g, R.N).replace(/\{system\}/g, sysName(p))
    .replace(/\{was\}/g, R.W && R.V ? 'Heizung und Haushaltsstrom' : R.W ? 'Ihre Heizung' : 'Ihren Haushaltsstrom').replace(/Gemäß unserem Angebot  –/, 'Nach Ihrem Angebot –');
}
const sMark = s => esc(s).replace(/\*([^*]+)\*/g, '<span style="color:var(--p);white-space:nowrap">$1</span>').replace(/(\d) €/g, '$1&nbsp;€');
const sTxt = (key, field, p, R) => sFill(txt(key, field), p, R);
function sChap(key, p, R, o = {}) {
  const badge = sTxt(key, 'badge', p, R), title = o.title || sTxt(key, 'title', p, R), lead = o.lead !== undefined && !(S.doc.texts[key] || {}).lead ? o.lead : sTxt(key, 'lead', p, R);
  return `${badge ? `<span class="sbadge">${esc(badge)}</span>` : '<div class="sbar"></div>'}<h1>${sMark(title)}</h1>${lead ? `<p class="lead">${esc(lead)}</p>` : ''}`;
}
const slVars = () => `--sf:'${S.doc.salesFont || 'Inter'}';--s:${S.design.secondary};--sacc:${S.design.accent || mix(S.design.primary, '#1E4C86', 0.7)}`;
const gradBg = () => `linear-gradient(115deg,${S.design.primary} 0%,${S.design.accent || mix(S.design.primary, '#1E4C86', 0.7)} 100%)`;
/* Symbole als Bild – so zeichnet html2canvas sie zuverlässig */
const sImg = (n, mm, col, sw = 1.8) => `<img src="${svgDataUri(icC(n, 24, col, sw).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '))}" style="width:${mm}mm;height:${mm}mm;display:block">`;
const sIcon = (n, col) => `<div class="sic" style="display:flex">${sImg(n, 4.4, col || S.design.primary)}</div>`;
const sNum = n => numCircle(n, 6.5, { fill: S.design.secondary, color: '#fff', fs: 12 });
const sDiscount = (p, R, big) => R.discount ? `<div class="sdisc" style="${big ? 'padding:6mm 7mm' : ''}"><div><div style="font-size:7.8pt;font-weight:600;color:var(--s-dark)">Ihr Vorteil bei schneller Entscheidung</div><div style="font-size:${big ? 11.5 : 10.5}pt;font-weight:700;margin-top:1mm">${esc(S.discount.text.replace('{datum}', deDate(p.discount.until)))}</div></div><div style="font-size:${big ? 24 : 19}pt;font-weight:700;color:var(--p);white-space:nowrap">– ${eur(R.discount)}</div></div>` : '';
function nextFunding(p, R) {
  if (!R.W || !R.fund.stand) return null;
  const st = S.funding.stands.slice().sort((a, b) => a.from.localeCompare(b.from)), i = st.findIndex(s => s.id === R.fund.stand.id), nx = st[i + 1];
  if (!nx) return null;
  const f2 = fundingOf({ ...p, fund: { ...p.fund, stand: nx.id } });
  return f2.amount < R.funding - 1 ? { from: nx.from, amount: f2.amount, rate: f2.rate, diff: R.funding - f2.amount } : null;
}

/* Kopf- und Fußzeile im Vertriebs-Layout */
function salesWrap(p, r, n, N, key) {
  const lab = key === 'sBasis' ? 'Rechengrundlagen' : DOC_TEXT[key] ? DOC_TEXT[key].label : r.title;
  return `<section class="page sl" data-key="${key}" style="${slVars()}"><div class="sh"><div class="lg">${docLogo()}</div><div class="tt">${esc(lab)}<span class="dot"></span><b>${esc(custName(p))}</b></div></div><div class="pb">${r.body}</div><div class="sf"><b>${esc(coName())}</b><span>Seite ${n} / ${N}</span></div></section>`;
}
function salesCover(p, R, n, N) {
  if (S.design.coverStyle === 'image' && fileUrl(S.design.cover.file)) return docCover(p, R, n, N).replace('class="page', `style="${slVars()}" class="page`);
  const I = CI(), a = advisorOf(p), badge = sTxt('sCover', 'badge', p, R), head = sTxt('sCover', 'title', p, R);
  const meta = [I.title && ['Dokument', esc(p.offer.title)], I.offer && p.offer.number && ['Angebot', esc(p.offer.number)], I.created && ['Datum', new Date().toLocaleDateString('de-DE')], I.advisor && a.name && ['Ihr Berater', esc(a.name)]].filter(Boolean);
  return `<section class="page sl" data-key="cover" style="${slVars()}"><div style="position:absolute;left:0;right:0;top:0;height:128mm;overflow:hidden"><img src="${svgDataUri(houseSVG({ cover: true, dawn: false, pv: hasPV(p), hp: hasWP(p), car: !!(p.car && p.car.on), bat: hasPV(p) && nz(p.pv.bat) > 0, ...coverHouseOpts(p) }))}" style="width:210mm;height:130mm;display:block">${coverLogoHtml()}</div>
    <div style="position:absolute;left:16mm;right:16mm;top:140mm">
      ${I.badge && badge ? `<span class="sbadge">${esc(badge)}</span>` : ''}
      ${I.customer ? `<div style="font-size:27pt;font-weight:800;line-height:1.2;margin-top:3mm">${esc(custName(p))}</div>` : ''}
      ${I.address ? `<div style="font-size:10pt;color:var(--ink3);margin-top:2mm">${esc(custAddr(p))}</div>` : ''}
      ${I.subtitle && head ? `<div style="margin-top:10mm;border-left:1.6mm solid var(--s);padding:1mm 0 1mm 6mm;font-size:15pt;font-weight:700;line-height:1.35;max-width:150mm">${sMark(head)}</div>` : ''}
      ${I.note ? `<div style="margin-top:6mm;font-size:10pt;color:var(--ink2);white-space:pre-line">${esc(I.note)}</div>` : ''}
      ${I.figures ? `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4mm;margin-top:9mm">${[['Ersparnis pro Monat', eur(Math.max(0, R.monthOld1 - R.monthNew1))], R.W && R.funding > 0 ? ['Zuschuss vom Staat', eur(R.funding)] : ['Solarstrom pro Jahr', num(R.yield) + ' kWh'], ['Bezahlt nach', R.amortRise === null ? `über ${R.N} J.` : num(R.amortRise, 1) + ' Jahren']].map(([k, v]) => `<div class="scard" style="padding:4mm 5mm"><div class="small">${k}</div><div style="font-size:16pt;font-weight:700;margin-top:1mm">${v}</div></div>`).join('')}</div>` : ''}
    </div>
    ${meta.length ? `<div style="position:absolute;left:16mm;right:16mm;bottom:12mm;border-top:0.25mm solid var(--line);padding-top:4mm;display:grid;grid-template-columns:${meta.map((m, i) => (i === 0 && m[0] === 'Dokument' ? '2.4fr' : '1fr')).join(' ')};gap:5mm">${meta.map(([k, v]) => `<div><div style="font-size:7pt;color:var(--ink3)">${k}</div><div style="font-size:8.4pt;font-weight:700;margin-top:0.6mm;line-height:1.3">${v}</div></div>`).join('')}</div>` : ''}
    ${I.contact && a.photo ? `<div style="position:absolute;right:16mm;top:140mm;width:20mm;height:20mm;border-radius:50%;background:#fff url('${a.photo}') center/cover no-repeat;border:0.8mm solid #fff;box-shadow:0 0 0 0.25mm var(--line)"></div>` : ''}</section>`;
}

/* Seiten */
Object.assign(DOC, {
  sGlance(p, R) {
    const mOld = R.monthOld1, mNew = R.monthNew1, mSave = Math.max(0, mOld - mNew), credit = mNew < 0;
    let b = sChap('sGlance', p, R);
    b += `<div class="sgrad" style="padding:7mm 7mm 7mm 8mm;display:grid;grid-template-columns:1fr 8mm 1fr 1.25fr;align-items:center;gap:2mm">
      <div><div style="font-size:9pt;font-weight:600">Heute</div><div style="font-size:24pt;font-weight:700;opacity:.62;margin-top:1mm">${eur(mOld)}</div><div style="font-size:7.8pt;opacity:.8;margin-top:1mm">pro Monat</div></div>
      <div style="font-size:16pt;opacity:.8;text-align:center">→</div>
      <div><div style="font-size:9pt;font-weight:600">Künftig</div><div style="font-size:24pt;font-weight:700;margin-top:1mm">${credit ? '+ ' + eur(-mNew) : eur(mNew)}</div><div style="font-size:7.8pt;opacity:.8;margin-top:1mm">${credit ? 'Gutschrift pro Monat' : 'pro Monat'}</div></div>
      <div style="background:#fff;color:var(--ink);border-radius:var(--dr);padding:5mm 6mm"><div style="font-size:8.6pt;font-weight:600;color:var(--ink2)">Ihre Ersparnis</div><div style="font-size:26pt;font-weight:800;color:var(--p);line-height:1.25;margin-top:0.5mm">${eur(mSave)}</div><div style="font-size:7.6pt;color:var(--ink3);margin-top:1.2mm">jeden Monat · ${eur(R.saving1)} im Jahr</div></div></div>`;
    const t = [];
    if (R.W && R.funding > 0) t.push(['gift', eur(R.funding), 'Zuschuss vom Staat', `${pct(R.fund.rate)} Förderung`]);
    if (R.V) t.push(['sun', pct(R.autarky * 100), 'Strom selbst erzeugt', R.W ? 'Ihres Bedarfs inkl. Wärmepumpe' : 'Ihres Strombedarfs']);
    t.push(['clock', R.amortRise === null ? `> ${R.N} Jahre` : num(R.amortRise, 1) + ' Jahre', 'bis zur Amortisation', 'mit steigenden Energiepreisen']);
    if (t.length < 3) t.push(['leaf', num(R.co2Save / 1000, 1) + ' t', 'weniger CO₂ pro Jahr', 'gegenüber heute']);
    if (t.length < 3) t.push(['bolt', num(R.yield) + ' kWh', 'Solarstrom pro Jahr', 'vom eigenen Dach']);
    b += `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4mm;margin-top:4mm">${t.slice(0, 3).map(([i, v, k, u]) => `<div class="scard">${sIcon(i)}<div style="font-size:17pt;font-weight:700;margin-top:3.5mm">${v}</div><div style="font-size:8.6pt;font-weight:700;margin-top:0.5mm">${k}</div><div class="small">${u}</div></div>`).join('')}</div>`;
    const ben = salesBenefits(p, R);
    b += `<h2 style="margin-top:8mm">Ihre Vorteile</h2><div style="display:grid;grid-template-columns:1fr 1fr;gap:1mm 8mm">${ben.map(sCheck).join('')}</div>`;
    const minus = R.funding + R.other + R.discount;
    b += `<h2 style="margin-top:7mm">Ihre Investition</h2><div class="sbox" style="display:grid;grid-template-columns:1fr 6mm 1fr 6mm 1fr;align-items:center;padding:5mm 7mm"><div><div class="small">Angebotspreis</div><div style="font-size:14pt;font-weight:700">${eur(R.gross)}</div></div><div style="color:var(--ink3);font-size:14pt">–</div><div><div class="small">${[R.W && 'Förderung', R.other && 'Zuschüsse', R.discount && 'Rabatt'].filter(Boolean).join(', ') || 'Förderung'}</div><div style="font-size:14pt;font-weight:700">${eur(minus)}</div></div><div style="color:var(--ink3);font-size:14pt">=</div><div><div class="small">Ihre Kosten</div><div style="font-size:16pt;font-weight:800;color:var(--p)">${eur(R.net)}</div></div></div>`;
    return { title: 'Auf einen Blick', body: b };
  },
  sSystem(p, R) {
    let b = sChap('sSystem', p, R);
    const items = [];
    const pv = p.pv, short = s => String(s || '').replace(/\s*\(.*$/, '').trim();
    if (R.V) { const m = String(pv.modules || '').match(/(\d+)\s*[×x]\s*(\d+)\s*W/i); items.push(['sun', 'Photovoltaikanlage', m ? `${m[1]} Solarmodule à ${m[2]} Watt` : (pv.modules || 'Ihre Solaranlage'), [pv.modMaker, `rund ${num(Math.round(R.yield / 100) * 100)} kWh Solarstrom im Jahr`].filter(Boolean).join(' · '), num(R.kwp, 2) + ' kWp', pv.modWarranty ? [cleanWarranty(pv.modWarranty)] : []]); }
    if (R.V && (pv.invMaker || pv.invWarranty)) { const kw = /(\d{1,2}(?:[.,]\d{1,2})?)\s*kW\b(?!h)/i.exec(pv.invMaker || ''); items.push(['bolt', 'Wechselrichter', short(pv.invMaker) || 'Wechselrichter', 'Wandelt Solarstrom in Haushaltsstrom um und steuert den Speicher', kw ? num(parseFloat(kw[1].replace(',', '.')), 1) + ' kW' : '', pv.invWarranty ? [cleanWarranty(pv.invWarranty)] : []]); }
    if (R.V && R.bat) items.push(['battery', 'Stromspeicher', pv.batMaker || 'Batteriespeicher', 'Speichert Solarstrom für Abend und Nacht', num(R.bat, 1) + ' kWh', pv.batWarranty ? [cleanWarranty(pv.batWarranty)] : []]);
    if (R.W) items.push(['flame', 'Wärmepumpe', p.hp.model || 'Luft-Wasser-Wärmepumpe', [`Jahresarbeitszahl ${num(R.jaz, 2)}`, p.hp.dims && `Außeneinheit ${p.hp.dims.replace(/\s*x\s*/gi, ' × ')}`, p.hp.weight && `${num(p.hp.weight)} kg`].filter(Boolean).join(' · '), p.hp.kw ? num(p.hp.kw, 1) + ' kW' : '', p.hp.warranty ? [p.hp.warranty] : []]);
    if (R.rod) items.push(['sun', 'Heizstab', R.rodName || 'Heizstab', 'Warmwasser mit überschüssigem Solarstrom', num(R.rodKw, 1) + ' kW']);
    const wn = items.reduce((a, x) => a + (x[5] || []).length, 0), dense = items.length >= 4 || wn > 0; DENSE = dense && R.W && isNum(p.hp.spl);
    const wLine = w => (w && w.length ? `<div style="margin-top:1mm;font-size:7.3pt;line-height:1.35;color:var(--p);font-weight:600">Garantie: ${w.map(esc).join(' · ')}</div>` : '');
    if (items.length >= 5) {
      // viele Komponenten: zweispaltig, Wert rechts oben – passt auf eine Seite
      b += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:2.5mm">${items.map(([i, k, t, u, v, w]) => `<div class="scard" style="padding:3mm 4mm"><div style="display:flex;align-items:center;gap:3mm"><span class="sic" style="width:8.5mm;height:8.5mm">${sImg(i, 4.4, S.design.primary)}</span><div style="flex:1;min-width:0"><div class="small">${k}</div></div><div style="font-size:14pt;font-weight:800;color:var(--p);white-space:nowrap">${v}</div></div><div style="font-size:9.6pt;font-weight:700;line-height:1.3;margin-top:1.5mm">${esc(t)}</div><div class="small" style="color:var(--ink2);line-height:1.35">${esc(u)}</div>${wLine(w)}</div>`).join('')}</div>`;
    } else b += items.map(([i, k, t, u, v, w]) => `<div class="scard" style="display:flex;align-items:center;gap:5mm;padding:${dense ? 2.6 : 4}mm 6mm;margin-bottom:${dense ? 2 : 2.5}mm"><span class="sic" style="width:11mm;height:11mm">${sImg(i, 5.2, S.design.primary)}</span><div style="flex:1;min-width:0"><div class="small">${k}</div><div style="font-size:${dense ? 10.8 : 11.5}pt;font-weight:700;line-height:1.3">${esc(t)}</div><div class="small" style="color:var(--ink2)">${esc(u)}</div>${wLine(w)}</div><div style="font-size:19pt;font-weight:800;color:var(--p);white-space:nowrap">${v}</div></div>`).join('');
    const steps = p.type === 'pvwp' ? [['Strom vom Dach', `Ihre Module erzeugen rund ${num(Math.round(R.yield / 100) * 100)} kWh Solarstrom im Jahr – auch bei bewölktem Himmel.`], R.bat ? ['Speichern', 'Was tagsüber übrig ist, lädt den Speicher – für den Abend und die Nacht.'] : ['Selbst nutzen', 'Ihr Haus und Ihre Wärmepumpe nutzen den Solarstrom direkt.'], ['Wärme aus der Luft', `Die Wärmepumpe holt kostenlose Wärme aus der Außenluft – auch bei Frost. Aus 1 kWh Strom werden rund ${num(R.jaz, 1)} kWh Wärme.`], ['Wohlige Wärme', 'Für Heizkörper oder Fußbodenheizung und für Ihr Warmwasser – leise und ohne Brennstofflager.']]
      : p.type === 'pv' ? [['Strom vom Dach', `Ihre Module erzeugen rund ${num(Math.round(R.yield / 100) * 100)} kWh Solarstrom im Jahr.`], ['Selbst nutzen', 'Ihr Haushalt verbraucht den Solarstrom zuerst direkt.'], R.bat ? ['Speichern', 'Überschüsse laden den Speicher – für Abend und Nacht.'] : ['Einspeisen', 'Was übrig ist, fließt gegen Vergütung ins Netz.'], ['Unabhängig', `Rund ${pct(R.autarky * 100)} Ihres Stroms kommen künftig vom eigenen Dach.`]]
      : [['Wärme aus der Luft', 'Die Wärmepumpe holt kostenlose Wärme aus der Außenluft – auch bei Frost.'], ['Verdichten', `Mit wenig Strom wird die Wärme auf Heiztemperatur gebracht. Aus 1 kWh Strom werden rund ${num(R.jaz, 1)} kWh Wärme.`], ['Wohlige Wärme', 'Für Heizkörper oder Fußbodenheizung und für Ihr Warmwasser.'], ['Ohne Öl und Gas', 'Kein Brennstofflager, kein Schornsteinfeger, kein CO₂-Preis.']];
    if (DENSE && (items.length >= 4 || wn >= 3)) b += `<h2 style="margin-top:3.5mm">So einfach funktioniert es</h2><div class="sbox" style="padding:3mm 4mm;display:grid;grid-template-columns:repeat(4,1fr);gap:3mm">${steps.map(([t], i) => `<div style="display:flex;align-items:center;gap:2mm">${sNum(i + 1)}<b style="font-size:8.6pt;line-height:1.25">${t}</b></div>`).join('')}</div>`;
    else b += `<h2 style="margin-top:${DENSE ? 3.5 : 5}mm">So einfach funktioniert es</h2><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:3mm">${steps.map(([t, x], i) => `<div class="sbox" style="padding:${DENSE ? 3 : 4}mm">${sNum(i + 1)}<div style="font-size:9.2pt;font-weight:700;margin-top:${DENSE ? 1.8 : 2.5}mm;line-height:1.3">${t}</div><div class="small" style="color:var(--ink2);font-size:${DENSE ? 7.1 : 7.6}pt;line-height:1.4;margin-top:1mm">${x}</div></div>`).join('')}</div>`;
    if (R.W && isNum(p.hp.spl)) b += salesNoise(p);
    return { title: 'Ihr neues Energiesystem', body: b };
  },
  sInvest(p, R) {
    const F = R.fund, nx = nextFunding(p, R);
    let b = sChap('sInvest', p, R, { title: R.W ? undefined : 'Ihre *Investition*', lead: R.W ? `Für Ihre neue Wärmepumpe erhalten Sie ${eur(R.funding)} Zuschuss. So setzen sich Ihre Kosten zusammen:` : 'So setzen sich Ihre Kosten zusammen:' });
    const row = (k, u, v, st = '', vc = '') => `<div style="display:flex;justify-content:space-between;align-items:center;gap:4mm;padding:4mm 5mm;border-bottom:0.25mm solid var(--line);${st}"><div><div style="font-size:9.6pt;font-weight:700">${k}</div>${u ? `<div class="small">${u}</div>` : ''}</div><div style="font-size:10.5pt;font-weight:700;white-space:nowrap;${vc}">${v}</div></div>`;
    let rows = '';
    if (p.type === 'pvwp' && !(p.offer.total > 0)) rows += row('Angebot Wärmepumpe', 'brutto inkl. Montage', eur(p.offer.grossWP, 2)) + row('Angebot Photovoltaik', 'brutto inkl. Montage', eur(p.offer.grossPV, 2));
    else rows += row('Angebotspreis', 'brutto inkl. Montage', eur(R.gross, 2));
    if (R.W) rows += row('Staatliche Förderung (BEG)', `${pct(F.rate)} auf ${eur(F.base)} förderfähige Kosten`, '– ' + eur(R.funding, 2), 'background:#fff', 'color:var(--p)');
    if (R.other) rows += row('Weitere Zuschüsse', '', '– ' + eur(R.other, 2), 'background:#fff', 'color:var(--p)');
    if (R.discount) rows += row(esc(S.discount.text.replace('{datum}', deDate(p.discount.until))), 'gilt nur bei Auftrag bis zu diesem Datum', '– ' + eur(R.discount, 2), 'background:var(--t-yel)', 'color:var(--p)');
    rows += `<div class="sgrad" style="border-radius:0;display:flex;justify-content:space-between;align-items:center;padding:5mm"><div><div style="font-size:10pt;font-weight:700">Ihre Kosten</div><div style="font-size:7.6pt;opacity:.85">${R.W ? 'nach Abzug der Förderung' : R.discount ? 'nach Abzug des Rabatts' : 'brutto'}</div></div><div style="font-size:19pt;font-weight:800">${eur(R.net, 2)}</div></div>`;
    const right = R.W ? `<div class="sgrad" style="padding:6mm"><div style="font-size:8.6pt;opacity:.9">Ihr Fördersatz</div><div style="font-size:30pt;font-weight:800;line-height:1.25;margin-top:1mm">${pct(F.rate)}</div><div style="margin-top:1.5mm;font-size:10pt;font-weight:700;color:${mix(S.design.secondary, '#ffffff', 0.15)}">= ${eur(R.funding)} Zuschuss</div>
        <div style="margin-top:4mm">${F.parts.map(([k, v]) => `<div style="display:flex;justify-content:space-between;border-top:0.25mm solid rgba(255,255,255,.25);padding:2mm 0;font-size:8pt"><span>${esc(k)}</span><b>${pct(v)}</b></div>`).join('')}</div>
        <div style="font-size:6.8pt;opacity:.75;margin-top:2mm">BEG EM / KfW 458 · Förderstand für Anträge ab ${deDate(F.stand.from)}</div></div>`
      : (() => { let gen = 0; for (let t = 0; t < R.N; t++) gen += R.yield * Math.pow(1 - S.calc.pvDeg / 100, t); const own = gen ? R.net / gen : 0; return `<div class="sgrad" style="padding:6mm"><div style="font-size:8.6pt;opacity:.9">Ihr Solarstrom kostet</div><div style="font-size:30pt;font-weight:800;line-height:1.25">${ct(own)}</div><div style="font-size:9pt;font-weight:600;margin-top:1mm">pro kWh – statt ${ct(R.hhPrice)} aus dem Netz</div><div style="font-size:6.8pt;opacity:.75;margin-top:3mm">Ihre Kosten geteilt durch die Erzeugung in ${R.N} Jahren</div></div>`; })();
    b += `<div style="display:grid;grid-template-columns:1.3fr 1fr;gap:5mm;align-items:start"><div style="border-radius:var(--dr);overflow:hidden;background:var(--tile)">${rows}</div>${right}</div>`;
    if (nx) b += `<div style="margin-top:5mm;background:var(--t-red);border-radius:var(--dr);padding:5mm 6mm;display:flex;gap:4mm;align-items:flex-start">${numCircleIcon()}<div><div style="font-size:9.6pt;font-weight:700">Förderung jetzt sichern</div><div style="font-size:8.8pt;margin-top:0.5mm">Bei einem Förderantrag ab ${deDate(nx.from)} sinkt Ihr Zuschuss voraussichtlich auf ${eur(nx.amount)} (${pct(nx.rate)}) – das wären <b>${eur(nx.diff)} weniger</b>.</div></div></div>`;
    const steps = R.W ? [['Auftrag mit Förderbedingung', 'Sie beauftragen uns – unter der Bedingung, dass die Förderung bewilligt wird.'], ['Antrag bei der KfW', 'Der Förderantrag wird vor Beginn der Arbeiten online gestellt.'], ['Auszahlung', 'Nach Einbau und Nachweis wird der Zuschuss direkt an Sie ausgezahlt.']]
      : [['Auftrag', 'Sie unterschreiben – wir planen Ihre Anlage im Detail.'], ['Anmeldung', 'Wir melden die Anlage beim Netzbetreiber an.'], ['Montage', 'Unser Team montiert und nimmt die Anlage in Betrieb.']];
    b += `<h2 style="margin-top:7mm">${R.W ? 'So kommen Sie an Ihre Förderung' : 'So geht es los'}</h2><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4mm">${steps.map(([t, x], i) => `<div class="sbox" style="padding:4.5mm 5mm">${sNum(i + 1)}<div style="font-size:10pt;font-weight:700;margin-top:3mm;line-height:1.3">${t}</div><div class="small" style="color:var(--ink2);font-size:8pt;margin-top:1mm">${x}</div></div>`).join('')}</div>`;
    return { title: 'Ihre Investition', body: b };
  },
  sMonthly(p, R) {
    const oil = R.fuel === 'oil', last = R.rows[R.rows.length - 1];
    let b = sChap('sMonthly', p, R);
    const oldL = R.W ? `Heute: Weiter mit ${oil ? 'Ölheizung' : 'Gasheizung'}${R.V ? ' und Netzstrom' : ''}` : 'Heute: Strom aus dem Netz';
    b += `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4mm">${[[oldL, eur(R.monthOld1), 'pro Monat', 'var(--t-red)', 'var(--old)'], ['Künftig mit neuem System', R.monthNew1 < 0 ? '+ ' + eur(-R.monthNew1) : eur(R.monthNew1), R.monthNew1 < 0 ? 'Gutschrift pro Monat – Ihre Anlage verdient mehr, als Sie für Strom zahlen' : 'pro Monat', 'var(--p-light)', 'var(--p)'], ['Ihre Ersparnis', eur(R.monthOld1 - R.monthNew1), `pro Monat · in ${R.N} Jahren ${eur(last.monthSave)}`, 'var(--t-yel)', 'var(--s-dark)']].map(([k, v, u, bg, c]) => `<div style="background:${bg};border-radius:var(--dr);padding:5mm"><div style="font-size:8.4pt;font-weight:700;color:${c}">${k}</div><div style="font-size:21pt;font-weight:800;color:${c};margin-top:1.5mm">${v}</div><div style="font-size:7.6pt;color:${c};opacity:.85;margin-top:1mm">${u}</div></div>`).join('')}</div>`;
    const ys = [R.startYear].concat([2030, 2035, 2040, 2045, 2050].filter(y => y > R.startYear + 1 && y <= R.startYear + R.N - 1)).slice(0, 5);
    b += `<div class="sbox" style="margin-top:5mm;padding:5mm 5mm 3mm">${salesMonthChart(R, ys)}<div class="small" style="margin-top:2mm;font-size:8pt">${legendDot(S.design.old, R.W ? `Weiter mit ${oil ? 'Ölheizung' : 'Gasheizung'}${R.V ? ' und Netzstrom' : ''}` : 'Ohne Solaranlage')}${legendDot(S.design.primary, 'Mit Ihrem neuen Energiesystem')}</div></div>`;
    const P = R.scen === 'opt' ? { ...S.calc, ...S.optimistic } : S.calc;
    b += `<p class="small" style="margin-top:4mm">Preisentwicklung laut Prognose: ${R.W ? `${oil ? 'Heizöl' : 'Erdgas'} +${num(P.fuelInc, 1)} % pro Jahr, zuzüglich CO₂-Preis von ${num(interpPath(P.co2Path, R.startYear))} €/t auf ${num(interpPath(P.co2Path, R.startYear + R.N - 1))} €/t; ` : ''}Strom +${num(P.elecInc, 1)} % pro Jahr.${R.W ? ' Heizkosten inklusive Grundpreis und Wartung.' : ''}${R.V ? ' Beim neuen System ist der Nutzen der PV-Anlage (Eigenverbrauch und Einspeisung) abgezogen.' : ''}</p>`;
    return { title: 'Ihre monatlichen Kosten', body: b };
  },
  sLong(p, R) {
    const am = R.amortRise;
    let b = sChap('sLong', p, R, { lead: am !== null ? `Nach rund ${num(am, 1)} Jahren hat sich Ihr neues Energiesystem bezahlt gemacht – danach bleibt jeder gesparte Euro bei Ihnen.` : `Über ${R.N} Jahre sparen Sie insgesamt ${eur(R.total)} Energiekosten.` });
    b += `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4mm">${[['Amortisation', R.amortStatic !== null && R.amortStatic <= R.N * 2 ? yrs(R.amortStatic) : `über ${R.N} Jahre`, 'bei gleichbleibenden Energiepreisen', 0], ['Amortisation', yrs(am), 'mit steigenden Energiepreisen', 1], [`Überschuss nach ${R.N} Jahren`, eur(R.surplus), 'nach Abzug Ihrer Kosten', 0]].map(([k, v, u, g]) => `<div class="${g ? 'sgrad' : 'scard'}" style="padding:5mm"><div style="font-size:8.4pt;font-weight:600;${g ? 'opacity:.9' : 'color:var(--ink2)'}">${k}</div><div style="font-size:19pt;font-weight:800;margin-top:1.5mm">${v}</div><div style="font-size:7.6pt;margin-top:1mm;${g ? 'opacity:.85' : 'color:var(--ink3)'}">${u}</div></div>`).join('')}</div>`;
    b += `<div class="sbox" style="margin-top:5mm;padding:5mm 5mm 3mm">${salesAmortChart(R)}<div class="small" style="margin-top:1mm;font-size:8pt">${legendDot(S.design.primary, 'Mit steigenden Energiepreisen')}${legendDot(S.design.ink || '#0F2A3D', 'Bei gleichbleibenden Energiepreisen', true)}</div></div>`;
    const comps = R.surplus > 0 ? comparisonsOf(R).slice(0, 4) : [];
    if (comps.length) b += `<h2 style="margin-top:7mm">Davon könnten Sie sich zum Beispiel leisten</h2><div style="display:grid;grid-template-columns:repeat(${comps.length},1fr);gap:4mm">${comps.map(i => `<div style="background:${mix(S.design.secondary, '#ffffff', 0.9)};border-radius:var(--dr);padding:5mm">${sIcon(i.icon, mix(S.design.secondary, '#000000', 0.25))}<div style="font-size:18pt;font-weight:800;margin-top:3mm">${num(Math.floor(i.times))}×</div><div style="font-size:8.8pt;font-weight:700">${esc(i.label)}</div><div class="small">à ${eur(i.price)}</div></div>`).join('')}</div><p class="small" style="margin-top:2.5mm">Grundlage: ${S.comparisons.basis === 'total' ? `Ihre Gesamtersparnis von ${eur(R.total)}` : `Ihr Überschuss nach Abzug Ihrer Kosten von ${eur(R.surplus)}`}.</p>`;
    b += `<p class="small" style="margin-top:3mm">Alle Annahmen finden Sie unter „Rechengrundlagen“ am Ende des Dokuments.</p>`;
    return { title: 'Ihre Ersparnis', body: b };
  },
  sWhy(p, R) {
    const nx = nextFunding(p, R), cards = [['Warten kostet', eur(R.saving1), 'Jedes Jahr ohne neues System', `So viel sparen Sie schon im ersten Jahr – Geld, das sonst weiter für ${R.W ? (R.fuel === 'oil' ? 'Heizöl' : 'Erdgas') + (R.V ? ' und Netzstrom' : '') : 'Netzstrom'} ausgegeben wird.`]];
    if (R.W) {
      const y2 = Math.min(R.startYear + 9, 2035), now = R.cons * co2Share(R.fuel, interpPath(S.calc.co2Path, R.startYear)), later = R.cons * co2Share(R.fuel, interpPath(S.calc.co2Path, y2));
      cards.push(['CO₂-Preis steigt', `${eur(now)} → ${eur(later)}`, `CO₂-Kosten pro Jahr bis ${y2}`, `Auf jeden ${R.fuel === 'oil' ? 'Liter Heizöl' : 'Kubikmeter Erdgas'} kommt ein CO₂-Preis. Ab 2028 bildet er sich im europäischen Emissionshandel – mit sinkender Zertifikatsmenge.`]);
    } else {
      const r10 = R.rows[Math.min(9, R.rows.length - 1)];
      cards.push(['Strompreis steigt', `${ct(R.hhPrice)} → ${ct(r10.hhPrice)}`, `pro kWh in ${r10.t} Jahren`, 'Netzentgelte, Abgaben und Energiepreise steigen. Jede selbst erzeugte kWh ist davon unabhängig.']);
    }
    if (nx) cards.push(['Förderung sinkt', `– ${eur(nx.diff)}`, `bei Antrag ab ${deDate(nx.from)}`, `Heute erhalten Sie ${eur(R.funding)} (${pct(R.fund.rate)}). Danach voraussichtlich nur noch ${eur(nx.amount)}.`]);
    else cards.push(['Unabhängig werden', pct((R.V ? R.autarky : 1) * 100), R.V ? 'Ihres Stroms vom eigenen Dach' : 'Wärme ohne Öl und Gas', 'Je früher Sie umsteigen, desto länger profitieren Sie von stabilen Kosten.']);
    let b = sChap('sWhy', p, R);
    b += `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4mm">${cards.map(([k, v, t, x]) => `<div class="scard" style="padding:5mm"><div style="font-size:8.4pt;font-weight:700;color:var(--p)">${k}</div><div style="font-size:${v.length > 14 ? 14 : 18}pt;font-weight:800;margin-top:2mm;white-space:nowrap">${v}</div><div style="font-size:9pt;font-weight:700;margin-top:1mm;line-height:1.3">${t}</div><div class="small" style="color:var(--ink2);font-size:7.8pt;margin-top:2mm;line-height:1.45">${x}</div></div>`).join('')}</div>`;
    if (R.discount) b += `<div style="margin-top:5mm">${sDiscount(p, R, true)}</div>`;
    const steps = [['Auftrag', R.W ? 'Sie unterschreiben – mit Förderbedingung.' : 'Sie unterschreiben – wir planen im Detail.'], [R.W ? 'Förderung & Planung' : 'Planung & Anmeldung', R.W ? 'Förderantrag stellen, Termin und Details abstimmen.' : 'Netzanmeldung, Termin und Details abstimmen.'], ['Installation', 'Unser Team baut Ihr neues System ein – sauber und zügig.'], ['Sparen', 'Ab dem ersten Tag sinken Ihre Energiekosten.']];
    b += `<h2 style="margin-top:8mm">So geht es weiter</h2><div style="position:relative;display:grid;grid-template-columns:repeat(4,1fr);gap:4mm"><div style="position:absolute;left:8mm;right:25%;top:4mm;height:0.5mm;background:var(--line2)"></div>${steps.map(([t, x], i) => `<div style="position:relative">${numCircle(i + 1, 8, { fill: S.design.primary, color: '#fff', fs: 12 })}<div style="font-size:10pt;font-weight:700;margin-top:3mm">${t}</div><div class="small" style="color:var(--ink2);font-size:8pt;margin-top:1mm">${x}</div></div>`).join('')}</div>`;
    b += `<div style="margin-top:8mm">${salesContact(p)}</div>`;
    return { title: 'Warum jetzt?', body: b };
  },
  sSign(p, R) {
    let b = sChap('sSign', p, R);
    if (R.discount) b += sDiscount(p, R, false);
    const T = S.discount.orderText.replace('{firma}', coName()).replace('{angebot}', p.offer.number || '–').replace('{angebotsdatum}', p.offer.date ? deDate(p.offer.date) : '–').replace('{preis}', eur(R.gross, 2)).replace('{rabatt}', R.discount ? ` abzüglich ${eur(R.discount, 2)} Sonderrabatt` : '');
    const meta = [['Angebot', p.offer.number || '–'], ['vom', p.offer.date ? deDate(p.offer.date) : '–'], ['Bruttopreis', eur(R.gross, 2)]].concat(R.discount ? [['Sonderrabatt', '– ' + eur(R.discount, 2)]] : []);
    b += `<div style="display:flex;gap:9mm;padding:6mm 5mm 4mm;border-bottom:0.25mm solid var(--line);margin-top:3mm">${meta.map(([k, v]) => `<div><div class="small">${k}</div><div style="font-size:11pt;font-weight:700">${esc(v)}</div></div>`).join('')}</div>`;
    const sg = p.sign && p.sign.cust ? p.sign : null, box = on => `<span style="flex-shrink:0;display:inline-block;width:5mm;height:5mm;border:0.35mm solid var(--ink);border-radius:1.2mm;position:relative;margin-top:0.3mm">${on ? '<svg viewBox="0 0 16 16" style="position:absolute;left:0.3mm;top:0.3mm;width:3.6mm;height:3.6mm"><path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="#0F2A3D" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}</span>`;
    b += `<div style="padding:5mm 5mm 0;font-size:9.4pt;line-height:1.5"><div style="display:flex;gap:4mm;margin-bottom:3mm">${box(sg && sg.order)}<span>${esc(T)}</span></div><div style="display:flex;gap:4mm">${box(sg && sg.cond)}<span>Der Auftrag steht unter der aufschiebenden Bedingung der Förderzusage${R.W ? ' (BEG/KfW)' : ''}.</span></div></div>`;
    const a = advisorOf(p), line = (l, inner = '') => sigField(l, inner, 20);
    const sigImg = id => (sigSrc(id) ? `<img src="${sigSrc(id)}" style="max-height:18mm;max-width:80mm;width:auto;height:auto">` : '');
    const od = sg ? `<span style="font-family:'HandSig','Caveat',cursive;font-weight:500;font-size:16pt;line-height:1.1">${esc(sg.place || '')}, ${deDate(sg.date)}</span>` : '';
    b += `<div style="display:grid;grid-template-columns:1fr 1.4fr;gap:4mm 10mm;margin-top:10mm;padding:0 5mm">${line('Ort, Datum', od)}${line(`Unterschrift Auftraggeber · ${esc(custName(p))}`, sg ? sigImg(sg.cust) : '')}${line('Ort, Datum', sg && sg.adv ? od : '')}${line(`Unterschrift ${esc(coName())}${a.name ? ' · ' + esc(a.name) : ''}`, sg ? sigImg(sg.adv) : '')}</div>`;
    b += `<p class="small" style="margin-top:7mm">Es gelten die Bedingungen und Hinweise des zugrunde liegenden Angebots einschließlich der Widerrufsbelehrung.</p>`;
    return { title: 'Angebot annehmen', body: b };
  },
  sBasis(p, R) {
    let b = sChap('sBasis', p, R);
    const ys = [1, 2, 3, 5, 10, 15, 20, 25].filter(t => t <= R.N), npv = R.zins > 0;
    const cols = [['Jahr', r => r.t, 1]].concat(R.W ? [['Heizkosten alt', r => eur(r.costOld)], ['Heizkosten neu', r => eur(r.costNew)]] : [], R.V ? [['PV-Nutzen', r => eur(r.pv)]] : [], [['Ersparnis', r => eur(r.saving)], ['Saldo', r => `<span style="color:${r.saldo < 0 ? 'var(--old)' : 'var(--p)'}">${eur(r.saldo)}</span>`]], npv ? [['Saldo Barwert', r => `<span style="color:${r.saldoNpv < 0 ? 'var(--old)' : 'var(--p)'}">${eur(r.saldoNpv)}</span>`]] : []);
    b += `<table class="st"><thead><tr>${cols.map(([k], i) => `<th style="${i ? '' : 'text-align:left'}">${k}</th>`).join('')}</tr></thead><tbody>${ys.map(t => { const r = R.rows[t - 1]; return `<tr>${cols.map(([, f], i) => `<td style="${i ? '' : 'text-align:left'}">${f(r)}</td>`).join('')}</tr>`; }).join('')}</tbody></table>`;
    b += `<ul class="dl" style="margin-top:7mm;font-size:8pt">${assumptionItems(p, R).map(i => `<li>${i}</li>`).join('')}</ul>`;
    b += `<p class="small" style="margin-top:6mm;line-height:1.5">${esc(S.calc.disclaimer)}</p>`;
    return { title: 'Rechengrundlagen', body: b };
  }
});
function salesBenefits(p, R) {
  const b = [], oil = R.fuel === 'oil';
  if (R.W) b.push(oil ? 'Nie wieder Heizöl kaufen – Sie heizen mit Strom und kostenloser Umweltwärme.' : 'Kein Gas mehr – Sie heizen mit Strom und kostenloser Umweltwärme.');
  if (R.W && R.funding > 0) b.push(`<b>${eur(R.funding)}</b> Zuschuss vom Staat – ${pct(R.fund.rate)} Förderung.`);
  if (R.V) b.push(`Rund <b>${num(Math.round(R.yield / 100) * 100)} kWh</b> Solarstrom pro Jahr vom eigenen Dach.`);
  if (R.V && R.bat) b.push(`Speicher mit ${num(R.bat, 1)} kWh – Ihr Solarstrom auch abends und nachts.`);
  if (p.type === 'pvwp') b.push('Ihre Wärmepumpe heizt zum Teil mit eigenem Solarstrom.');
  if (R.rod) b.push('Im Sommer Warmwasser per Heizstab mit Solarstrom – die Wärmepumpe kann pausieren.');
  if (R.carKWh) b.push(`Ihr E-Auto lädt rund <b>${num(R.carPV)} kWh</b> Solarstrom pro Jahr.`);
  b.push(R.W ? `Unabhängiger von steigenden ${oil ? 'Heizöl' : 'Gas'}- und CO₂-Preisen.` : 'Unabhängiger von steigenden Strompreisen.');
  b.push(`<b>${num(R.co2Save / 1000, 1)} t</b> weniger CO₂ pro Jahr.`);
  return b.slice(0, 6);
}
const sCheck = t => `<div style="display:flex;gap:3mm;align-items:flex-start;margin-bottom:2.5mm"><span style="flex-shrink:0;display:inline-flex;width:5.5mm;height:5.5mm;border-radius:50%;background:var(--p);align-items:center;justify-content:center;margin-top:0.2mm">${sImg('check', 3.2, '#ffffff', 3)}</span><span style="font-size:9.2pt;line-height:1.4">${t}</span></div>`;
const numCircleIcon = () => `<span style="flex-shrink:0;display:inline-flex;width:9mm;height:9mm;border-radius:50%;background:${S.design.old};align-items:center;justify-content:center">${sImg('clock', 5, '#ffffff', 2)}</span>`;
function salesContact(p) {
  const a = advisorOf(p);
  const ph = a.photo ? `<div style="width:16mm;height:16mm;border-radius:50%;flex-shrink:0;background:#fff url('${a.photo}') center/cover no-repeat"></div>` : '';
  return `<div class="sbox" style="display:flex;align-items:center;gap:5mm;padding:5mm 7mm">${ph}<div style="flex:1"><div class="small">Ihr Ansprechpartner</div><div style="font-size:14pt;font-weight:800">${esc(a.name || coName())}</div><div class="small" style="color:var(--ink2)">${[a.phone, a.email].filter(Boolean).map(esc).join(' · ')}</div></div><div style="font-size:10.5pt;font-weight:700;color:var(--p);text-align:right">Fragen? Wir sind gern für Sie da.</div></div>`;
}
let DENSE = false;
function salesNoise(p) {
  const v = p.hp.spl, X = d => Math.max(0, Math.min(100, (d - 15) / 60 * 100)), lim = 35;
  const marks = [[20, 'Blätterrauschen'], [30, 'Flüstern'], [40, 'Kühlschrank'], [50, 'leiser Regen'], [60, 'Gespräch'], [70, 'Staubsauger']];
  return `<div class="sbar" style="margin-top:${DENSE ? 4 : 6}mm"></div><h1 style="font-size:${DENSE ? 16 : 18}pt;margin-top:1.5mm">Wie laut ist Ihre Wärmepumpe?</h1><p class="lead" style="font-size:9pt;margin-bottom:${DENSE ? 5 : 7}mm">Moderne Wärmepumpen sind leise. Nachts arbeitet Ihre Anlage im geräuschreduzierten Modus${p.hp.splDist ? ` – in ${num(p.hp.splDist, 1)} m Abstand misst man dann <b>${num(v, 1)} dB(A)</b>` : ` – rund <b>${num(v, 1)} dB(A)</b>`}.</p>
    <div style="position:relative;height:26mm">
      <div style="position:absolute;left:${X(v)}%;top:0;transform:translateX(-50%);background:var(--p);color:#fff;font-size:7.6pt;font-weight:700;border-radius:1.6mm;padding:1mm 3mm;white-space:nowrap">Ihre Wärmepumpe nachts: ${num(v, 1)} dB(A)</div>
      <div style="position:absolute;left:0;right:0;top:9mm;height:4mm;border-radius:2mm;background:linear-gradient(90deg,#BDE7C4 0%,#F4E3A1 45%,#F7C8A2 75%,#F5B5B0 100%)"></div>
      <div style="position:absolute;left:${X(v)}%;top:7.5mm;width:0.7mm;height:7mm;background:var(--ink);transform:translateX(-50%)"></div>
      <div style="position:absolute;left:${X(lim)}%;top:7.5mm;width:0.7mm;height:7mm;background:var(--ink2);transform:translateX(-50%)"></div>
      <div style="position:absolute;left:${X(lim)}%;top:15.5mm;transform:translateX(-50%);font-size:7pt;font-weight:600;color:var(--ink2);text-align:center;line-height:1.25">${lim} dB(A) nachts<br>reines Wohngebiet</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(6,1fr);text-align:center;margin-top:1mm">${marks.map(([d, l]) => `<div><div style="font-size:8pt;font-weight:700">${d} dB</div><div class="small" style="font-size:6.8pt">${l}</div></div>`).join('')}</div>
    <p class="small" style="margin-top:4mm;font-size:6.8pt">Schalldruckpegel der Außeneinheit, frei aufgestellt.${isNum(p.hp.sw) ? ` Schallleistungspegel im Nennbetrieb: ${num(p.hp.sw, 1)} dB(A)${isNum(p.hp.swNight) ? `, im Nachtbetrieb ${num(p.hp.swNight, 1)} dB(A)` : ''}.` : ''} Richtwert TA Lärm für reine Wohngebiete nachts: 35 dB(A) am Nachbarhaus. Jede Verdopplung des Abstands senkt den Pegel um etwa 6 dB.</p>`;
}
function salesMonthChart(R, ys) {
  const W = 640, H = 230, L = 46, B = 196, T = 22, rows = ys.map(y => rowOfYear(R, y));
  const max = Math.max(...rows.map(r => r.monthOld), 1), step = max > 600 ? 200 : max > 300 ? 100 : 50, top = Math.ceil(max * 1.1 / step) * step, Y = v => B - (B - T) * v / top;
  const gw = (W - L - 10) / rows.length, bw = Math.min(36, gw * 0.3);
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" style="font-family:inherit">`;
  for (let v = 0; v <= top; v += step) s += `<line x1="${L}" x2="${W - 6}" y1="${Y(v)}" y2="${Y(v)}" stroke="#E6ECF2"/><text x="${L - 8}" y="${Y(v) + 3.5}" text-anchor="end" font-size="10" fill="#8A97A6">${num(v)} €</text>`;
  rows.forEach((r, i) => {
    const cx = L + gw * i + gw / 2, x1 = cx - bw - 3, x2 = cx + 3;
    s += `<rect x="${x1}" y="${Y(r.monthOld)}" width="${bw}" height="${B - Y(r.monthOld)}" rx="4" fill="${S.design.old}"/><text x="${x1 + bw / 2}" y="${Y(r.monthOld) - 6}" text-anchor="middle" font-size="10.5" font-weight="700" fill="${S.design.old}">${eur(r.monthOld)}</text>`;
    const nv = Math.max(0, r.monthNew); s += `<rect x="${x2}" y="${Y(nv)}" width="${bw}" height="${Math.max(2, B - Y(nv))}" rx="${nv > 0 ? 4 : 1}" fill="${S.design.primary}"/><text x="${x2 + bw / 2}" y="${Y(nv) - 6}" text-anchor="middle" font-size="10.5" font-weight="700" fill="${S.design.primary}">${r.monthNew < 0 ? '+' + eur(-r.monthNew) : eur(r.monthNew)}</text>`;
    s += `<text x="${cx}" y="${B + 16}" text-anchor="middle" font-size="11.5" font-weight="700" fill="#10283A">${i ? r.year : 'Heute'}</text><text x="${cx}" y="${B + 29}" text-anchor="middle" font-size="9.5" fill="#8A97A6">${i ? `in ${r.t - 1} J.` : 'Jahr 1'}</text>`;
  });
  return s + '</svg>';
}
function salesAmortChart(R) {
  const W = 640, H = 230, L = 52, Rr = 8, T = 16, B = 196, n = R.rows.length;
  const vals = R.rows.map(r => r.saldo).concat(R.rows.map(r => r.saldoStatic), [-R.invest]);
  const step = Math.max(...vals.map(Math.abs)) > 60000 ? 20000 : 10000;
  const mn = Math.floor(Math.min(...vals, 0) / step) * step, mx = Math.ceil(Math.max(...vals, 0) / step) * step || step, Y = v => T + (B - T) * (mx - v) / (mx - mn);
  const gw = (W - L - Rr) / (n + 1), bw = gw * 0.62, X = i => L + gw * (i + 0.5);
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%">`;
  for (let v = mn; v <= mx; v += step) s += `<line x1="${L}" x2="${W - Rr}" y1="${Y(v)}" y2="${Y(v)}" stroke="${v === 0 ? '#9AA8B6' : '#E6ECF2'}" ${v ? 'stroke-dasharray="4 4"' : ''}/><text x="${L - 8}" y="${Y(v) + 3.5}" text-anchor="end" font-size="10" fill="#8A97A6">${num(v / 1000)} T€</text>`;
  const pts = [-R.invest].concat(R.rows.map(r => r.saldo));
  pts.forEach((v, i) => { const y0 = Y(0), y = Y(v); s += `<rect x="${X(i) - bw / 2}" y="${Math.min(y, y0)}" width="${bw}" height="${Math.max(1, Math.abs(y - y0))}" rx="3" fill="${v < 0 ? '#CBD5E0' : S.design.primary}"/>`; });
  const st = [-R.invest].concat(R.rows.map(r => r.saldoStatic));
  s += `<polyline points="${st.map((v, i) => `${X(i)},${Y(v)}`).join(' ')}" fill="none" stroke="#24364A" stroke-width="2" stroke-dasharray="6 5"/>`;
  const mk = (a, lab, col, dy) => { if (a === null || a > n) return ''; const x = X(0) + (X(1) - X(0)) * a; const left = x > W - 170; return `<line x1="${x}" x2="${x}" y1="${T}" y2="${B}" stroke="${col}" stroke-width="1.5" stroke-dasharray="4 3"/><text x="${left ? x - 4 : x + 4}" y="${T + dy}" font-size="10" font-weight="700" fill="${col}" text-anchor="${left ? 'end' : 'start'}">${lab}</text>`; };
  s += mk(R.amortRise, `steigende Preise ${num(R.amortRise, 1)} J.`, S.design.primary, 2) + mk(R.amortStatic, `gleichbleibende Preise ${num(R.amortStatic, 1)} J.`, '#24364A', 15);
  [0, 5, 10, 15, 20, 25, 30].filter(t => t <= n).forEach(t => { s += `<text x="${X(t)}" y="${B + 16}" text-anchor="middle" font-size="10" fill="#8A97A6">${t ? 'J. ' + t : 'Start'}</text>`; });
  return s + '</svg>';
}
