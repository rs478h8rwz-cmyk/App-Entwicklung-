/* =========================================================
   Produkte: Felder je Kategorie, Kopieren, bessere Erkennung,
   eigene PDF-Seite „Ihre Komponenten“
   ========================================================= */
CATS.rod = ['Heizstab', 'kW'];
const CAT_ORDER = ['mod', 'inv', 'bat', 'wp', 'rod', 'misc'];
const capLabel = pr => (pr.cat === 'bat' ? 'Kapazität' : pr.cat === 'mod' ? 'Leistung' : 'Leistung');
const prodIcon = cat => (cat === 'wp' ? 'fan' : cat === 'mod' ? 'sun' : cat === 'bat' ? 'battery' : cat === 'inv' ? 'bolt' : cat === 'rod' ? 'flame' : 'box');
/* Kennwerte eines Produkts als Liste [Bezeichnung, Wert] */
function prodSpecs(pr) {
  const u = CATS[pr.cat] ? CATS[pr.cat][1] : '', out = [];
  if (pr.power) out.push([capLabel(pr), `${num(pr.power, pr.power % 1 ? 1 : 0)} ${u}`.trim()]);
  if (pr.cat === 'inv' && pr.mppt) out.push(['MPP-Tracker', num(pr.mppt)]);
  if (pr.cat === 'bat' && pr.cycles) out.push(['Ladezyklen', num(pr.cycles)]);
  if (pr.cat === 'rod' && pr.depth) out.push(['Einschraubtiefe', `${num(pr.depth)} mm`]);
  if (pr.cat === 'wp' && pr.jaz) out.push(['JAZ', num(pr.jaz, 2)]);
  return out;
}

/* ---------- Produktübersicht ---------- */
viewProducts = function () {
  // Sortierung: Hersteller (Standard), Kategorie oder Name – merkt sich die Wahl auf diesem Gerät
  const mode = PERSONAL.prodSort || 'maker', by = (a, b) => String(a || '').localeCompare(String(b || ''), 'de', { numeric: true, sensitivity: 'base' });
  const catIx = pr => CAT_ORDER.indexOf(pr.cat), list = PRODUCTS.slice().sort((a, b) => mode === 'cat' ? catIx(a) - catIx(b) || by(a.maker, b.maker) || by(a.name, b.name) : mode === 'name' ? by(a.name, b.name) : by(a.maker || '~', b.maker || '~') || catIx(a) - catIx(b) || by(a.name, b.name));
  const groups = mode === 'name' ? [['', list]] : [...new Set(list.map(pr => (mode === 'cat' ? (CATS[pr.cat] || CATS.misc)[0] : pr.maker || 'Ohne Hersteller')))].map(g => [g, list.filter(pr => (mode === 'cat' ? (CATS[pr.cat] || CATS.misc)[0] : pr.maker || 'Ohne Hersteller') === g)]);
  const sortBar = `<div class="flex flex-wrap items-center gap-2 mt-5"><span class="text-[13px] text-ink3 mr-1">Sortieren nach</span>${[['maker', 'Hersteller'], ['cat', 'Art'], ['name', 'Name']].map(([k, l]) => `<button class="chip ${mode === k ? '!border-p !text-ink' : ''}" data-a="prod-sort" data-v="${k}">${l}</button>`).join('')}</div>`;
  const card = pr => `<div class="card p-4 flex flex-col min-w-0"><div class="aspect-[4/3] rounded-[calc(var(--r)-4px)] grid place-items-center overflow-hidden" style="background:radial-gradient(ellipse at 50% 60%, rgb(var(--p-rgb)/.14), transparent 70%)">${fileUrl(pr.img) || pr.imgUrl ? `<img src="${esc(fileUrl(pr.img) || pr.imgUrl)}" class="w-full h-full object-contain" alt="">` : `<span class="text-p opacity-60">${ic(prodIcon(pr.cat), 44)}</span>`}</div>
    <div class="flex flex-wrap gap-1.5 mt-3"><span class="badge bg-p/10 text-p">${esc((CATS[pr.cat] || CATS.misc)[0])}</span>${pr.cat === 'wp' && pr.beg ? '<span class="badge bg-tyel text-yel-ink">BEG-förderfähig</span>' : ''}</div>
    <div class="font-semibold text-[15px] mt-2 leading-snug">${esc(pr.name || 'Ohne Namen')}</div><div class="text-[13px] text-ink3">${esc(pr.maker || '')}</div>
    <div class="text-[13px] text-ink2 mt-2 space-y-0.5">${prodSpecs(pr).map(([k, v]) => `<div>${k}: <b>${esc(v)}</b></div>`).join('')}${pr.warranty ? `<div>Garantie: <b>${esc(pr.warranty)}</b></div>` : ''}${pr.note ? `<div class="text-ink3 mt-1">${esc(pr.note)}</div>` : ''}</div>
    <div class="flex flex-wrap gap-1 mt-auto pt-3 -mx-2"><button class="btn-g" data-a="prod-edit" data-id="${pr.id}">${ic('pen', 15)}Bearbeiten</button><button class="btn-g" data-a="prod-copy" data-id="${pr.id}">${ic('copy', 15)}Kopieren</button><button class="btn-g hover:!text-ember2" data-a="prod-del" data-id="${pr.id}">${ic('trash', 15)}Löschen</button></div></div>`;
  return `<div class="max-w-7xl mx-auto px-4 pt-8"><div class="flex flex-wrap items-end justify-between gap-3"><div><h1 class="h-font text-[32px]">Produkte</h1><p class="text-ink3 text-[14px]">Ihre Komponenten – werden in Angeboten erkannt und auf der Seite „Ihre Komponenten“ im Dokument gezeigt.</p></div><button class="btn-p" data-a="prod-new">${ic('plus', 17)}Neues Produkt</button></div>
    ${PRODUCTS.length ? sortBar + groups.map(([g, items]) => `${g ? `<div class="flex items-baseline gap-2 mt-7"><h2 class="font-semibold text-[17px]">${esc(g)}</h2><span class="text-[13px] text-ink3">${items.length}</span></div>` : ''}<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${g ? 'mt-3' : 'mt-5'}">${items.map(card).join('')}</div>`).join('') : `<div class="card p-10 text-center text-ink3 mt-6">Noch keine Produkte angelegt.</div>`}</div>`;
};

/* ---------- Produkt bearbeiten: Felder je Kategorie ---------- */
productModal = function (id) {
  const pr = PRODUCTS.find(x => x.id === id); if (!pr) return;
  const b = k => `x:${id}:${k}`, img = fileUrl(pr.img) || pr.imgUrl, u = (CATS[pr.cat] || CATS.misc)[1];
  const extra = pr.cat === 'inv' ? field('MPP-Tracker (Anzahl)', b('mppt'), { t: 'n', ph: 'z. B. 3' })
    : pr.cat === 'bat' ? field('Ladezyklen', b('cycles'), { t: 'n', ph: 'z. B. 6000' })
    : pr.cat === 'rod' ? field('Einschraubtiefe', b('depth'), { t: 'n', unit: 'mm' })
    : pr.cat === 'wp' ? field('JAZ', b('jaz'), { t: 'n' }) : '';
  modal(`<h3 class="text-[20px] font-semibold pr-8 mb-5">Produkt bearbeiten</h3>
    <div class="space-y-4">${field('Name', b('name'), { hint: 'Wie im Angebot bezeichnet – z. B. „EcoFlow Ocean 2 Heimspeicher 10 kWh“. Hersteller, Modell und Größe helfen der Erkennung.' })}
    <div class="grid sm:grid-cols-2 gap-4">${field('Hersteller', b('maker'))}${sel('Kategorie', b('cat'), CAT_ORDER.map(k => [k, CATS[k][0] + (CATS[k][1] ? ` (${CATS[k][1]})` : '')]))}
    ${u ? field(capLabel(pr), b('power'), { t: 'n', unit: u }) : ''}${extra}${field('Gewicht', b('weight'), { t: 'n', unit: 'kg' })}${field('Abmessungen', b('dims'), { ph: '1286 x 979 x 562 mm' })}</div>
    ${field('Garantie', b('warranty'), { ph: 'z. B. 15 Jahre Produktgarantie' })}
    ${area('Freier Text (erscheint im Dokument)', b('note'), 2, { ph: 'z. B. Besonderheiten, Ausstattung, Vorteile' })}
    ${pr.cat === 'wp' ? `<div class="rounded-[calc(var(--r)-4px)] bg-bg px-4">${toggleRow('BEG-förderfähig', b('beg'))}</div>` : ''}
    <div><span class="lbl">Bild</span><div class="flex items-center gap-3">${img ? `<img src="${esc(img)}" class="w-20 h-20 rounded-[calc(var(--r)-4px)] object-contain bg-card border border-line">` : `<div class="w-20 h-20 rounded-[calc(var(--r)-4px)] bg-bg grid place-items-center text-ink4">${ic('image', 26)}</div>`}<div class="flex flex-wrap gap-2"><label class="btn-s btn-sm cursor-pointer">${ic('upload', 15)}Hochladen<input type="file" accept="image/*" class="hidden" data-imgup="product" data-id="${id}"></label>${pr.img ? `<button class="btn-g" data-a="prod-img-del" data-id="${id}">Entfernen</button>` : ''}</div></div>
    <div class="mt-3">${inp(b('imgUrl'), { ph: 'oder Bild-URL (https://…)' })}</div></div></div>
    <div class="flex justify-end mt-6"><button class="btn-p" data-a="modal-close">Fertig</button></div>`);
};
async function copyProduct(id) {
  const src = PRODUCTS.find(x => x.id === id); if (!src) return;
  const cp = clone(src); cp.id = uid('pr'); cp.name = (src.name || 'Produkt') + ' (Kopie)';
  if (src.img) cp.img = (await copyFile(src.img)) || '';
  PRODUCTS.splice(PRODUCTS.indexOf(src) + 1, 0, cp); saveProducts(); render(); productModal(cp.id);
  toast('Kopie angelegt – bitte Name und Werte anpassen.');
}

/* ---------- Bessere Erkennung im Angebot ---------- */
matchProducts = function (lines) {
  const norm = s => String(s || '').toLowerCase().replace(/\u00AD/g, '').replace(/(\d)\s*watt\b/g, '$1 w').replace(/(\d)\s*wp\b/g, '$1 w');
  const nl = lines.map(norm), esc2 = w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const NUM = /(\d{1,4}(?:[.,]\d{1,2})?)\s*(kwh|kwp|kw|w|v|l)(?![a-z])/g;
  // Zahl mit Einheit – oder als Modellnummer ohne Einheit (z. B. „CHA 10/400V“)
  const numOk = (t, v, unit) => { const re = new RegExp(`(?<![\\d.,])(\\d{1,4}(?:[.,]\\d{1,2})?)(\\s*${esc2(unit)}(?![a-z])|(?=\\s*[/-]?\\s*\\d{3}\\s*v)|(?=\\s*/))`, 'g'); let m; while ((m = re.exec(t))) { const x = parseFloat(m[1].replace(',', '.')); if (Math.abs(x - v) <= Math.max(0.05, v * 0.02)) return true; } return false; };
  const wordIn = (t, w) => (/^\d+$/.test(w) ? new RegExp('(?<![\\d.,])' + w + '(?![\\d.,]*\\d)', 'u') : w.length >= 6 ? new RegExp(esc2(w) + '(?![\\p{L}])', 'iu') : new RegExp('(?<![\\p{L}\\d])' + esc2(w) + '(?![\\p{L}\\d])', 'iu')).test(t);
  const cand = [];
  for (const pr of PRODUCTS) {
    const name = norm(pr.name); if (!name.trim()) continue;
    const nums = [...name.matchAll(NUM)].map(m => [parseFloat(m[1].replace(',', '.')), m[2]]);
    const words = name.replace(NUM, ' ').split(/[\s,/()+–-]+/).filter(w => w.length >= 2 || /^\d$/.test(w)).filter(w => !/^(und|mit|inkl|für|der|die|das)$/.test(w));
    const maker = norm(pr.maker).trim(); if (maker && !words.includes(maker)) words.unshift(maker);
    if (!words.length && !nums.length) continue;
    let best = null;
    nl.forEach((l, i) => {
      const head = nl.slice(i, i + 2).join(' '), win = nl.slice(i, i + 6).join(' ');
      // Größe (z. B. 10 kWh) und Modellnummern müssen in der Positionsüberschrift stehen, nicht irgendwo im Text
      if (!nums.every(([v, unit]) => numOk(head, v, unit))) return;
      const bare = words.filter(w => /^\d+$/.test(w)); if (!bare.every(w => wordIn(head, w))) return;
      const txtW = words.filter(w => !/^\d+$/.test(w)), hit = txtW.filter(w => wordIn(win, w)).length, headHit = txtW.filter(w => wordIn(head, w)).length;
      if (txtW.length && (hit / txtW.length < 0.6 || headHit === 0)) return;
      const score = hit + headHit + nums.length * 3 + bare.length * 2;
      if (!best || score > best.score) best = { i, score };
    });
    if (!best) continue;
    const qline = [lines[best.i], lines[best.i + 1] || ''].find(l => /\d+\s*(?:stk\.?|stück)\b/i.test(l)) || lines[best.i];
    const q = /(\d+)\s*(?:stk\.?|st\.?|stück|x)\b/i.exec(qline) || /^\s*[\d.]+\.?\s+(\d+)\s/.exec(qline);
    cand.push({ id: pr.id, score: best.score, line: best.i, qty: q ? +q[1] : 1 });
  }
  // dieselbe Angebotszeile nur einem Produkt zuordnen (das am besten passende)
  cand.sort((a, b) => b.score - a.score);
  const used = new Set(), out = [];
  for (const c of cand) { if (used.has(c.line)) continue; used.add(c.line); out.push(c); }
  return out.map(({ id, qty }) => ({ id, qty, on: true }));
};

/* ---------- Heizstab aus Komponenten übernehmen ---------- */
const _applyComponents19 = applyComponents;
applyComponents = function (p) {
  _applyComponents19(p);
  const rodC = p.components.map(c => PRODUCTS.find(x => x.id === c.id)).find(pr => pr && pr.cat === 'rod');
  if (rodC && p.type === 'pvwp') { p.rod = p.rod || {}; p.rod.on = true;  if (rodC.power) p.rod.kw = rodC.power; }
};

/* ---------- PDF-Seite „Ihre Komponenten“ (beide Layouts) ---------- */
DOC_TEXT.products = { label: 'Ihre Komponenten', badge: 'Ihre Komponenten', title: 'Ihre *Komponenten* im Überblick', lead: 'Diese Produkte bauen wir für Sie ein – ausgewählt für Qualität, Effizienz und lange Lebensdauer.' };
PAGE_KEYS.splice(PAGE_KEYS.indexOf('situation') + 1, 0, 'products');
const docComps = p => effComps(p).map(c => ({ c, pr: PRODUCTS.find(x => x.id === c.id) })).filter(x => x.pr).sort((a, b) => CAT_ORDER.indexOf(a.pr.cat) - CAT_ORDER.indexOf(b.pr.cat)).slice(0, 6);
const stageBg = () => { const dk = docDark(), pc = S.design.primary;
  return svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" preserveAspectRatio="none"><defs><radialGradient id="g" cx="50%" cy="58%" r="62%"><stop offset="0" stop-color="${dk ? mix(pc, '#ffffff', 0.25) : '#ffffff'}" stop-opacity="${dk ? 0.22 : 0.95}"/><stop offset="0.55" stop-color="${dk ? pc : mix(pc, '#ffffff', 0.86)}" stop-opacity="${dk ? 0.10 : 0.55}"/><stop offset="1" stop-color="${dk ? '#000000' : mix(pc, '#ffffff', 0.93)}" stop-opacity="0"/></radialGradient><linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0.72" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="${dk ? '#000000' : pc}" stop-opacity="${dk ? 0.18 : 0.06}"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/><rect width="400" height="300" fill="url(#f)"/></svg>`); };
const shadowBg = () => svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="24" viewBox="0 0 300 24" preserveAspectRatio="none"><defs><radialGradient id="s" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#000" stop-opacity="${docDark() ? 0.55 : 0.28}"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs><ellipse cx="150" cy="12" rx="150" ry="12" fill="url(#s)"/></svg>`);
DOC.products = function (p, R) {
  const sales = CUR_LAYOUT === 'sales', list = docComps(p), many = list.length > 4;
  let b = sales ? sChap('products', p, R) : chap(String(txt('products', 'title')).replace(/\*/g, ''), txt('products', 'lead'));
  const imgH = many ? 40 : list.length > 2 ? 56 : 72;
  b += `<div style="display:grid;grid-template-columns:${list.length === 1 ? '1fr' : '1fr 1fr'};gap:4mm">${list.map(({ c, pr }) => {
    const u = fileUrl(pr.img) || pr.imgUrl, specs = prodSpecs(pr);
    return `<div style="background:var(--tile);border-radius:var(--dr);overflow:hidden;display:flex;flex-direction:column">
      <div style="height:${imgH}mm;position:relative;background-image:url('${stageBg()}');background-size:100% 100%;display:flex;align-items:flex-end;justify-content:center;padding:4mm 5mm 3.2mm">
        <img src="${shadowBg()}" style="position:absolute;left:18%;right:18%;width:64%;bottom:2mm;height:4mm;display:block">
        ${u ? `<img src="${esc(u)}" style="position:relative;max-height:${imgH - 9}mm;max-width:100%;width:auto;height:auto;display:block">` : `<div style="position:relative;margin-bottom:3mm">${sImg(prodIcon(pr.cat), 16, S.design.primary)}</div>`}</div>
      <div style="padding:${many ? '3mm 4mm' : '4mm 5mm'}"><div style="font-size:7.4pt;font-weight:600;color:var(--p)">${esc(CATS[pr.cat][0])}${c.qty > 1 ? ` · ${num(c.qty)} Stück` : ''}</div>
        <div style="font-size:${many ? 10 : 11}pt;font-weight:700;line-height:1.25;margin-top:0.6mm">${esc(pr.name)}</div>${pr.maker ? `<div class="small">${esc(pr.maker)}</div>` : ''}
        ${specs.length ? `<div style="display:flex;flex-wrap:wrap;gap:1mm 4mm;margin-top:2mm;font-size:8pt">${specs.map(([k, v]) => `<span><span style="color:var(--ink3)">${k}</span> <b>${esc(v)}</b></span>`).join('')}</div>` : ''}
        ${pr.warranty ? `<div style="font-size:7.8pt;margin-top:1.6mm;color:var(--p);font-weight:600">Garantie: ${esc(pr.warranty)}</div>` : ''}
        ${pr.note ? `<div class="small" style="margin-top:1.4mm;line-height:1.4;color:var(--ink2)">${esc(pr.note)}</div>` : ''}${pr.cat === 'wp' && pr.beg ? '<div class="small" style="margin-top:1.2mm">BEG-förderfähig</div>' : ''}</div></div>`;
  }).join('')}</div>`;
  return { title: 'Ihre Komponenten', body: b };
};
/* Seite nur, wenn im Projekt Produkte ausgewählt sind */
const _docPageDefs19 = docPageDefs;
docPageDefs = function (p, R) {
  return _docPageDefs19(p, R).map(d => (d.key === 'products' ? { ...d, applies: docComps(p).length > 0, on: docComps(p).length > 0 && (p.pages.products !== undefined ? !!p.pages.products : (S.doc.defaults || {}).products !== false), note: docComps(p).length ? '' : 'Erscheint, sobald Produkte aus Ihrer Datenbank ausgewählt sind' } : d));
};

/* ---------- Erkannte Produkte automatisch übernehmen – alle Angaben aus der Produkt-Datenbank ---------- */
const _applyRecognition19 = applyRecognition;
applyRecognition = function (p, doc, r) {
  _applyRecognition19(p, doc, r);
  const found = (r.products || []).filter(m => m.on !== false);
  if (!found.length) return;
  const cats = new Set(found.map(m => (PRODUCTS.find(x => x.id === m.id) || {}).cat));
  p.components = p.components.filter(c => { const pr = PRODUCTS.find(x => x.id === c.id); const s = compSrc(p, c); return !(pr && cats.has(pr.cat) && (s === 'roof' || s === 'quick')); });
  for (const m of found) { const c = p.components.find(x => x.id === m.id); if (c) { c.qty = m.qty; c.src = 'offer'; } else p.components.push({ id: m.id, qty: m.qty, src: 'offer' }); }
  applyComponents(p);
};
const _applyComponents19b = applyComponents;
applyComponents = function (p) {
  _applyComponents19b(p);
  const full = pr => (pr.maker && !norm2(pr.name).startsWith(norm2(pr.maker)) ? pr.maker + ' ' : '') + pr.name;
  for (const c of p.components) {
    const pr = PRODUCTS.find(x => x.id === c.id); if (!pr) continue;
    if (pr.cat === 'mod' && hasPV(p)) { p.pv.modMaker = full(pr); if (pr.warranty) p.pv.modWarranty = pr.warranty; }
    if (pr.cat === 'inv' && hasPV(p)) { p.pv.invMaker = full(pr); if (pr.warranty) p.pv.invWarranty = pr.warranty; }
    if (pr.cat === 'bat' && hasPV(p)) { p.pv.batMaker = full(pr); if (pr.warranty) p.pv.batWarranty = pr.warranty; }
    if (pr.cat === 'wp' && hasWP(p)) { p.hp.model = full(pr); if (pr.power) p.hp.kw = pr.power; if (pr.jaz) p.hp.jaz = pr.jaz; if (pr.dims) p.hp.dims = pr.dims; if (pr.weight) p.hp.weight = pr.weight; if (pr.warranty) p.hp.warranty = pr.warranty; }
    if (pr.cat === 'rod' && p.rod) { p.rod.name = full(pr); }
  }
};
const norm2 = s => String(s || '').trim().toLowerCase();

/* Einmalig beim Laden: wenn Angebots- und Planungsprodukte derselben Art doppelt gezählt wurden, kWp/Speicher neu aus den Angebotsprodukten */
{ const _la22 = loadAll; loadAll = async function () { await _la22.apply(this, arguments); try { for (const p of PROJECTS) { if (!p.components || !p.components.length || p.fix222) continue; const all = p.components.length, eff = effComps(p).length; p.fix222 = true; if (eff < all && p.from && p.from['pv.kwp']) { applyComponents(p); saveProject(p); } } } catch (e) {} }; }

/* Produktbilder vor dem PDF laden (Vertriebs-PDF zeigt sie auf „Das bauen wir für Sie ein“) */
{ const _ppr22 = preparePrintRoot; preparePrintRoot = async function () { try { await loadFiles(PRODUCTS.map(x => x.img).filter(Boolean)); } catch (e) {} return _ppr22.apply(this, arguments); }; }
