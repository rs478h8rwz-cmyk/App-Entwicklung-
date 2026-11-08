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
  const list = PRODUCTS.slice().sort((a, b) => CAT_ORDER.indexOf(a.cat) - CAT_ORDER.indexOf(b.cat));
  const card = pr => `<div class="card p-4 flex flex-col min-w-0"><div class="aspect-[4/3] rounded-[calc(var(--r)-4px)] bg-bg grid place-items-center overflow-hidden">${fileUrl(pr.img) || pr.imgUrl ? `<img src="${esc(fileUrl(pr.img) || pr.imgUrl)}" class="w-full h-full object-contain" alt="">` : `<span class="text-p opacity-60">${ic(prodIcon(pr.cat), 44)}</span>`}</div>
    <div class="flex flex-wrap gap-1.5 mt-3"><span class="badge bg-p/10 text-p">${esc((CATS[pr.cat] || CATS.misc)[0])}</span>${pr.cat === 'wp' && pr.beg ? '<span class="badge bg-tyel text-yel-ink">BEG-förderfähig</span>' : ''}</div>
    <div class="font-semibold text-[15px] mt-2 leading-snug">${esc(pr.name || 'Ohne Namen')}</div><div class="text-[13px] text-ink3">${esc(pr.maker || '')}</div>
    <div class="text-[13px] text-ink2 mt-2 space-y-0.5">${prodSpecs(pr).map(([k, v]) => `<div>${k}: <b>${esc(v)}</b></div>`).join('')}${pr.warranty ? `<div>Garantie: <b>${esc(pr.warranty)}</b></div>` : ''}${pr.note ? `<div class="text-ink3 mt-1">${esc(pr.note)}</div>` : ''}</div>
    <div class="flex flex-wrap gap-1 mt-auto pt-3 -mx-2"><button class="btn-g" data-a="prod-edit" data-id="${pr.id}">${ic('pen', 15)}Bearbeiten</button><button class="btn-g" data-a="prod-copy" data-id="${pr.id}">${ic('copy', 15)}Kopieren</button><button class="btn-g hover:!text-ember2" data-a="prod-del" data-id="${pr.id}">${ic('trash', 15)}Löschen</button></div></div>`;
  return `<div class="max-w-7xl mx-auto px-4 pt-8"><div class="flex flex-wrap items-end justify-between gap-3"><div><h1 class="h-font text-[32px]">Produkte</h1><p class="text-ink3 text-[14px]">Ihre Komponenten – werden in Angeboten erkannt und auf der Seite „Ihre Komponenten“ im Dokument gezeigt.</p></div><button class="btn-p" data-a="prod-new">${ic('plus', 17)}Neues Produkt</button></div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">${list.map(card).join('') || `<div class="card p-10 text-center sm:col-span-2 lg:col-span-3 xl:col-span-4 text-ink3">Noch keine Produkte angelegt.</div>`}</div></div>`;
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
  if (rodC && p.type === 'pvwp') { p.rod = p.rod || {}; p.rod.on = true; p.rod.name = p.rod.name || [rodC.maker, rodC.name].filter(Boolean).join(' ').replace(new RegExp('^' + (rodC.maker || '') + '\\s+' + (rodC.maker || '') , 'i'), rodC.maker || ''); if (rodC.power) p.rod.kw = rodC.power; }
};

/* ---------- PDF-Seite „Ihre Komponenten“ (beide Layouts) ---------- */
DOC_TEXT.products = { label: 'Ihre Komponenten', badge: 'Ihre Komponenten', title: 'Ihre *Komponenten* im Überblick', lead: 'Diese Produkte bauen wir für Sie ein – ausgewählt für Qualität, Effizienz und lange Lebensdauer.' };
PAGE_KEYS.splice(PAGE_KEYS.indexOf('situation') + 1, 0, 'products');
SALES_KEYS.splice(SALES_KEYS.indexOf('sSystem') + 1, 0, 'products');
const docComps = p => p.components.map(c => ({ c, pr: PRODUCTS.find(x => x.id === c.id) })).filter(x => x.pr).sort((a, b) => CAT_ORDER.indexOf(a.pr.cat) - CAT_ORDER.indexOf(b.pr.cat)).slice(0, 6);
DOC.products = function (p, R) {
  const sales = CUR_LAYOUT === 'sales', list = docComps(p), many = list.length > 4;
  let b = sales ? sChap('products', p, R) : chap(String(txt('products', 'title')).replace(/\*/g, ''), txt('products', 'lead'));
  const imgH = many ? 34 : list.length > 2 ? 44 : 60;
  b += `<div style="display:grid;grid-template-columns:${list.length === 1 ? '1fr' : '1fr 1fr'};gap:4mm">${list.map(({ c, pr }) => {
    const u = fileUrl(pr.img) || pr.imgUrl, specs = prodSpecs(pr);
    return `<div style="background:var(--tile);border-radius:var(--dr);overflow:hidden;display:flex;flex-direction:column;border:0.3mm solid var(--line)">
      <div style="height:${imgH}mm;background:#ffffff;border-bottom:0.3mm solid var(--line);display:flex;align-items:center;justify-content:center;padding:3mm">${u ? `<img src="${esc(u)}" style="max-height:${imgH - 6}mm;max-width:100%;width:auto;height:auto;display:block">` : sImg(prodIcon(pr.cat), 16, S.design.primary)}</div>
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
