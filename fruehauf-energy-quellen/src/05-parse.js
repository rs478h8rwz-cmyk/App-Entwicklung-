
/* =========================================================
   Dokumente lesen (PDF, Bilder, OCR)
   ========================================================= */
function groupLines(items, tol = 3) {
  const its = items.filter(i => i.str && i.str.trim()).map(i => ({ x: i.transform[4], y: i.transform[5], s: i.str, w: i.width || 0 }));
  its.sort((a, b) => b.y - a.y || a.x - b.x);
  const lines = [];
  for (const it of its) {
    let ln = lines.find(l => Math.abs(l.y - it.y) <= tol);
    if (!ln) { ln = { y: it.y, parts: [] }; lines.push(ln); }
    ln.parts.push(it);
  }
  lines.sort((a, b) => b.y - a.y);
  return lines.map(l => {
    l.parts.sort((a, b) => a.x - b.x);
    let out = '', end = null;
    for (const pt of l.parts) { if (end !== null && pt.x - end > 1.5 && !out.endsWith(' ')) out += pt.x - end > 18 ? '   ' : ' '; out += pt.s; end = pt.x + pt.w; }
    return out.replace(/\s+$/, '');
  }).filter(Boolean);
}
async function canvasToBlob(cv, q = 0.82) { return new Promise(r => cv.toBlob(b => r(b), 'image/jpeg', q)); }
async function readPdf(file, maxRender, onProg) {
  const pdfjs = await needPdfJs();
  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  const n = pdf.numPages, pages = [], images = [], canvases = [];
  let leftLines = [];
  for (let i = 1; i <= n; i++) {
    const page = await pdf.getPage(i);
    if (i <= Math.max(maxRender, 12)) {
      const tc = await page.getTextContent();
      const vp1 = page.getViewport({ scale: 1 });
      pages.push(groupLines(tc.items));
      if (i === 1) leftLines = groupLines(tc.items.filter(it => it.transform[4] < vp1.width * 0.45));
    }
    if (i <= maxRender) {
      onProg && onProg(`Seite ${i} von ${Math.min(n, maxRender)} wird gelesen …`);
      const vp = page.getViewport({ scale: 1.7 });
      const cv = document.createElement('canvas'); cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
      const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
      await page.render({ canvasContext: ctx, viewport: vp }).promise;
      images.push(await canvasToBlob(cv));
      if (canvases.length < 4) canvases.push(cv); else { cv.width = cv.height = 0; }
    }
  }
  return { pageCount: n, pages, leftLines, images, canvases };
}
async function ocrCanvases(canvases, onProg) {
  const T = await needTesseract();
  onProg && onProg('Texterkennung wird vorbereitet …');
  const worker = await T.createWorker('deu', 1, { ...TESS_OPTS(), logger: m => { if (m.status === 'recognizing text' && onProg) onProg(`Texterkennung ${Math.round(m.progress * 100)} %`); } });
  const pages = []; let leftLines = [];
  try {
    for (let i = 0; i < canvases.length; i++) {
      const { data } = await worker.recognize(canvases[i]);
      pages.push(String(data.text || '').split('\n').map(s => s.trim()).filter(Boolean));
      if (i === 0) {
        const w = canvases[i].width;
        if (Array.isArray(data.lines) && data.lines.length) leftLines = data.lines.filter(l => l.bbox && l.bbox.x0 < w * 0.45).map(l => String(l.text || '').trim()).filter(Boolean);
        else leftLines = pages[0];
      }
    }
  } finally { await worker.terminate(); }
  return { pages, leftLines };
}
async function imageToCanvas(file, maxPx = 1800) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const sc = Math.min(1, maxPx / Math.max(img.naturalWidth, img.naturalHeight));
    const cv = document.createElement('canvas'); cv.width = Math.round(img.naturalWidth * sc); cv.height = Math.round(img.naturalHeight * sc);
    const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.drawImage(img, 0, 0, cv.width, cv.height);
    return cv;
  } finally { URL.revokeObjectURL(url); }
}
async function readAnyFile(file, isTech, onProg) {
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  if (isPdf) {
    const r = await readPdf(file, isTech ? 40 : 12, onProg);
    const chars = r.pages.join('').replace(/\s/g, '').length;
    if (chars < 80 && r.canvases.length) {
      try { const o = await ocrCanvases(r.canvases.slice(0, 4), onProg); r.pages = o.pages.concat(r.pages.slice(o.pages.length)); r.leftLines = o.leftLines; r.ocr = true; }
      catch (e) { console.warn(e); toast('Texterkennung nicht möglich – bitte Daten manuell eintragen.', 'warn'); }
    }
    r.canvases.forEach(c => { c.width = c.height = 0; });
    return r;
  }
  const cv = await imageToCanvas(file, 1800);
  const blob = await canvasToBlob(cv, 0.86);
  let o = { pages: [[]], leftLines: [] };
  try { o = await ocrCanvases([cv], onProg); } catch (e) { console.warn(e); toast('Texterkennung nicht möglich – bitte Daten manuell eintragen.', 'warn'); }
  return { pageCount: 1, pages: o.pages, leftLines: o.leftLines, images: [blob], ocr: true };
}

/* =========================================================
   Angebotserkennung
   ========================================================= */
const RX_AMOUNT = /(\(?)(-?\d{1,3}(?:\.\d{3})+|-?\d+),(\d{2})(?!\d)\s*(\)?)\s*(?:€|EUR)?(\)?)/g;
const parseAmt = (a, b) => parseFloat(a.replace(/\./g, '') + '.' + b);
const LABEL_RX = /(angebots?\s*-?\s*(nr|nummer)|kunden\s*-?\s*(nr|nummer)|projekt\s*-?\s*(nr|nummer)|beleg|datum|ansprechpartner|bearbeiter|berater|mobil|telefon|tel\.|fax|e-?mail|bv\s*:|bauvorhaben|lieferanschrift|lieferadresse|rechnungs|seite\s+\d|www\.|ust|steuer|gültig|zahlungs)/i;
function ownChecker() {
  const c = S.company, words = [];
  if (c.name) { words.push(c.name.toLowerCase()); const fw = c.name.split(/\s+/)[0]; if (fw && fw.length >= 4) words.push(fw.toLowerCase()); }
  if (c.street) words.push(c.street.toLowerCase());
  if (c.email) words.push(c.email.toLowerCase());
  if (c.phone) words.push(c.phone.replace(/\s/g, '').toLowerCase());
  return line => {
    const l = line.toLowerCase();
    if (words.some(w => w && l.includes(w))) return true;
    if (c.phone && l.replace(/\s/g, '').includes(c.phone.replace(/\s/g, '').toLowerCase())) return true;
    return /[·|•]/.test(line) || /\bgmbh\b|\biban\b|steuer-?\s?n|steuernummer|geschäftsführ|amtsgericht|handelsregister|\bhrb\b|ust-?id|^\s*seite\s+\d/i.test(line);
  };
}
const isFurniture = l => /^\s*Pos\.?\s+Menge\b/i.test(l) || /Seite\s+\d+\s*\/\s*\d+/i.test(l) || /\bIBAN\b|Steuernummer|USt-?IdNr|Geschäftsführer/i.test(l) || /^\s*(Beispielbild|Technische Merkmale)\s*$/i.test(l);
function splitPositions(lines) {
  const blocks = []; let cur = null;
  const startRx = /^\s*(\d{1,3}(?:\.\d{1,4}){1,3}|\d{1,3})\.?\s+(\d+(?:,\d+)?\s*(?:stk\.?|st\.?|stück|x|psch\.?|pausch\.?|pauschal|std\.?|m|lfm|satz|set|pkt)?\s+)?\S/i;
  lines.forEach((l, i) => {
    const m = startRx.exec(l);
    const hasAmount = /\d,\d{2}/.test(l);
    if (m && (/\./.test(m[1]) || m[2]) && (hasAmount || /[a-zäöü]{3}/i.test(l))) {
      cur = { no: m[1], lines: [l], idx: [i] }; blocks.push(cur);
    } else if (cur) {
      if (isFurniture(l)) return;
      if (/^(zusammenfassung|summe|zwischensumme|gesamt|netto|mwst|brutto|endbetrag|übertrag|alternative positionen|bedarfspositionen|ergänzende informationen)/i.test(l.trim()) || /^pos\.?\s+\d+\s+[A-Za-zÄÖÜäöü]/i.test(l.trim()) || cur.lines.length > 40) { cur = null; return; }
      cur.lines.push(l); cur.idx.push(i);
    }
  });
  for (const b of blocks) {
    const text = b.lines.join('\n'), joined = text.replace(/[-\u00AD]\s*\n\s*/g, '').replace(/\s*\n\s*/g, ' ').replace(/\u00AD/g, '');
    b.text = joined;
    const q = /^\s*[\d.]+\.?\s+(\d+(?:,\d+)?)\s*(stk\.?|st\.?|stück|x)?\s/i.exec(b.lines[0]);
    b.qty = q ? pnum(q[1]) : (/(\d+(?:,\d+)?)\s*(stk\.?|st\.?|stück)\b/i.exec(joined) ? pnum(/(\d+(?:,\d+)?)\s*(stk\.?|st\.?|stück)\b/i.exec(joined)[1]) : 1);
    const euroAmts = l => [...l.matchAll(RX_AMOUNT)].filter(m => /€|EUR/.test(m[0]) || m[1] === '(');
    const firstAmts = euroAmts(b.lines[0]);
    const amts = firstAmts.length ? firstAmts : b.lines.slice(1, 3).flatMap(euroAmts);
    const last = amts[amts.length - 1];
    b.total = last ? parseAmt(last[2], last[3]) : null;
    b.bracket = amts.some(a => a[1] === '(' && (a[4] === ')' || a[5] === ')'));
    const plain = b.lines.map(l => l.replace(RX_AMOUNT, '').replace(/€/g, '').trim()).join('\n').replace(/[-\u00AD]\s*\n\s*/g, '').replace(/\s*\n\s*/g, ' ').replace(/\u00AD/g, '');
    b.notOrdered = b.bracket || /alternativ\s*-?\s*position|alternativposition|bedarfs\s*-?\s*position/i.test(joined + ' ' + plain);
    b.first = b.lines[0].replace(/\u00AD/g, '');
    b.title = joined.replace(/^\s*[\d.]+\.?\s+/, '').replace(/^\d+(?:,\d+)?\s*(stk\.?|st\.?|stück|x|psch\.?|pausch\.?|pauschal)?\s+/i, '').replace(RX_AMOUNT, '').replace(/\s{2,}/g, ' ').trim().slice(0, 90);
    if (b.notOrdered) b.kind = /alternativ/i.test(joined + plain) ? 'Alternativposition' : /bedarf/i.test(joined + plain) ? 'Bedarfsposition' : 'nicht beauftragt';
    b.title = b.first.replace(/^\s*[\d.]+\.?\s+/, '').replace(/^\d+(?:,\d+)?\s*(stk\.?|st\.?|stück|x|psch\.?|pausch\.?|pauschal|lfm|m)?\s+/i, '').replace(RX_AMOUNT, '').replace(/€/g, '').replace(/\((alternative|bedarfs?|be)[^)]*$/i, '').replace(/\((alternative position|bedarfsposition)\)/i, '').replace(/\s{2,}/g, ' ').trim().slice(0, 70);
  }
  return blocks;
}
function scoreAmounts(lines) {
  const out = [];
  lines.forEach((l, i) => {
    const low = l.toLowerCase();
    let sc = 0;
    if (/gesamt|endbetrag|gesamtsumme|zu zahlen|\btotal\b|angebotssumme/.test(low)) sc += 4;
    if (/brutto|inkl\.?\s*(mwst|ust)|einschl/.test(low)) sc += 3;
    if (/summe/.test(low)) sc += 1;
    if (/netto|zzgl|zwischensumme/.test(low)) sc -= 2;
    if (/(mwst|ust|umsatzsteuer|mehrwertsteuer)/.test(low) && !/inkl|brutto|gesamt|summe/.test(low)) sc -= 3;
    if (/rabatt|anzahlung|skonto|förderung|zuschuss|abschlag/.test(low)) sc -= 3;
    for (const m of l.matchAll(RX_AMOUNT)) {
      if (m[1] === '(') continue;
      const v = parseAmt(m[2], m[3]);
      if (v < 500) continue;
      out.push({ v, score: sc + (i / Math.max(1, lines.length)) * 1.2, line: l.trim() });
    }
  });
  out.sort((a, b) => b.score - a.score || b.v - a.v);
  const uniq = []; for (const a of out) if (!uniq.some(u => Math.abs(u.v - a.v) < 0.01)) uniq.push(a);
  return uniq;
}
function parseCustomer(all, left, own) {
  const res = {};
  const plzRx = /^\s*(?:D\s*-\s*)?(\d{5})\s+([A-ZÄÖÜ][A-Za-zÄÖÜäöüß.\- ]{1,40}?)\s*$/;
  const streetRx = /^\s*([A-ZÄÖÜa-zäöüß][A-Za-zÄÖÜäöüß.\- ]{2,40}?)\s+(\d{1,4}\s?[a-zA-Z]?(?:\s?[-/]\s?\d{1,4}[a-z]?)?)\s*$/;
  const salRx = /^(Herrn?|Frau|Familie|Eheleute|Firma)\b\.?\s*(.*)$/i;
  const tryIn = lines => {
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (own(l) || LABEL_RX.test(l)) continue;
      const m = plzRx.exec(l); if (!m) continue;
      let j = i - 1; while (j >= 0 && (own(lines[j]) || LABEL_RX.test(lines[j]) || !lines[j].trim())) j--;
      const st = j >= 0 ? streetRx.exec(lines[j]) : null; if (!st) continue;
      let k = j - 1; while (k >= 0 && (own(lines[k]) || LABEL_RX.test(lines[k]))) k--;
      if (k < 0) continue;
      let name = lines[k].trim(), sal = '';
      const sm = salRx.exec(name);
      if (sm) { sal = sm[1]; name = sm[2]; }
      if (!name && k + 1 < j) name = lines[k + 1].trim();
      if (!sal && k - 1 >= 0) { const sm2 = salRx.exec(lines[k - 1].trim()); if (sm2 && !sm2[2]) sal = sm2[1]; }
      if (!name || name.length > 60 || /\d{3,}/.test(name)) continue;
      return { name, sal, street: lines[j].trim().replace(/\s{2,}/g, ' '), zip: m[1], city: m[2].trim() };
    }
    return null;
  };
  const c = tryIn(left) || tryIn(all);
  if (c) Object.assign(res, c);
  if (!res.name) {
    const m = /Sehr geehrte[rn]?\s+(Herr|Frau)\s+([A-ZÄÖÜ][^,\n]{1,40})/.exec(all.join('\n'));
    if (m) { res.sal = m[1]; res.name = m[2].trim(); }
  }
  if (res.sal) res.sal = /^herr/i.test(res.sal) ? 'Herr' : res.sal[0].toUpperCase() + res.sal.slice(1).toLowerCase();
  const leftTxt = left.filter(l => !own(l) && !/ansprechpartner|berater|bearbeiter/i.test(l)).join('\n');
  const em = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/.exec(leftTxt); if (em) res.email = em[0];
  const ph = /(?:tel(?:efon)?\.?|mobil|fon)?[:\s]*((?:\+49|0)\s?[\d][\d\s/\-()]{5,18}\d)/i.exec(leftTxt.split('\n').filter(l => !/\d{5}\s+[A-ZÄÖÜ]/.test(l) && !/^\s*\d{1,3}[.,]\d/.test(l)).join('\n'));
  if (ph) res.phone = ph[1].trim();
  return res;
}
function parseMeta(all) {
  const txt = all.join('\n'), res = {};
  const nr = /angebots?\s*-?\s*(?:nr\.?|nummer|no\.?)\s*[:.#]?\s*([A-Z0-9][\w\-/.]{2,24})/i.exec(txt) || /\bangebot\s+([A-Z]{0,4}[-\s]?\d[\w\-/]{2,20})/i.exec(txt);
  if (nr) res.number = nr[1].replace(/[.,]$/, '');
  const dl = all.find(l => /datum/i.test(l) && /\d{1,2}\.\d{1,2}\.\d{2,4}/.test(l)) || all.find(l => /\d{1,2}\.\d{1,2}\.\d{4}/.test(l) && !/gültig|bis zum|lieferung/i.test(l));
  if (dl) { const m = /(\d{1,2})\.(\d{1,2})\.(\d{2,4})/.exec(dl); let y = +m[3]; if (y < 100) y += 2000; res.date = `${y}-${String(m[2]).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`; }
  const apl = all.find(l => /\b(ansprechpartner(in)?|ihr\s+berater(in)?|berater(in)?|bearbeiter(in)?)\b/i.test(l) && !/^sehr geehrte/i.test(l.trim()));
  if (apl) { const m = /(?:[Aa]nsprechpartner(?:in)?|[Bb]erater(?:in)?|[Bb]earbeiter(?:in)?)\s*[:\-]?\s+((?:Herr|Frau)\s+)?([A-ZÄÖÜ][a-zäöüß]+(?:[ -][A-ZÄÖÜ][a-zäöüß.]+){0,2})/.exec(apl.replace(/^.*?(?=(Ansprechpartner|Ihr Berater|Berater|Bearbeiter))/i, '')); if (m) res.advisor = m[2].trim(); }
  const ai = all.findIndex(l => l === apl);
  if (ai >= 0) { const near = all.slice(ai, ai + 4).join('\n'); const ph = /(?:mobil|tel(?:efon)?\.?|fon)\s*:?\s*((?:\+49|0)[\d\s/()-]{6,18}\d)/i.exec(near); const em = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/.exec(near); if (ph) res.advisorPhone = ph[1].trim(); if (em) res.advisorEmail = em[0]; }
  return res;
}
const num1 = s => pnum(String(s).replace(/\s/g, ''));
function parseTech(lines, hpKw) {
  const txt = lines.join('\n'), res = {};
  const j = /(?:JAZ|Jahresarbeitszahl|Jahres-Arbeitszahl)[^\d\n]{0,40}(\d[.,]\d{1,2}|\d)(?!\d)/i.exec(txt);
  if (j) { const v = num1(j[1]); if (v >= 1.5 && v <= 7) res.jaz = v; }
  const wb = /(?:Jahresheizwärmebedarf|Heizwärmebedarf|Jahreswärmebedarf|Gesamtwärmebedarf|Wärmebedarf)[^\d\n]{0,50}(\d{1,3}(?:\.\d{3})+|\d{3,6})(?:,\d+)?\s*kWh/i.exec(txt);
  if (wb) res.heat = num1(wb[1]);
  const sb = /(?:Jahresstrombedarf|Strombedarf|Stromverbrauch|elektrische\s+Energie|Energiebedarf\s+Strom)[^\d\n]{0,50}(\d{1,3}(?:\.\d{3})+|\d{3,6})(?:,\d+)?\s*kWh/i.exec(txt);
  if (sb) res.power = num1(sb[1]);
  const hl = /Heizlast[^\d\n]{0,40}(\d{1,2}(?:[.,]\d{1,2})?)\s*kW\b/i.exec(txt);
  if (hl) res.load = num1(hl[1]);
  // SCOP
  const sizeLine = lines.find(l => (l.match(/CHA[-\s]?\d{2}/gi) || []).length >= 2) || lines.find(l => (l.match(/\b\d{1,2}\s*kW\b/gi) || []).length >= 2 && !/scop|cop/i.test(l));
  let sizes = [];
  if (sizeLine) sizes = (sizeLine.match(/CHA[-\s]?(\d{2})/gi) || []).map(s => +s.replace(/\D/g, '')).concat(sizeLine.match(/CHA/i) ? [] : (sizeLine.match(/\b(\d{1,2})\s*kW\b/gi) || []).map(s => +s.replace(/\D/g, '')));
  const scop = [];
  lines.forEach((l, i) => {
    if (!/SCOP/i.test(l)) return;
    const ctx = l + ' ' + (lines[i + 1] && !/SCOP/i.test(lines[i + 1]) && !/\d{2}\s*°/.test(l) ? '' : '');
    const tm = /(35|55)\s*°?\s*C/.exec(ctx) || /W\s?(35|55)/.exec(ctx);
    const temp = tm ? +tm[1] : null;
    const vals = [...ctx.replace(/(35|55)\s*°?\s*C/g, '').matchAll(/(?<![\d.,])(\d[.,]\d{1,2})(?![\d])/g)].map(m => num1(m[1])).filter(v => v >= 2 && v <= 7);
    if (!vals.length) return;
    if (sizes.length && vals.length === sizes.length) vals.forEach((v, k) => scop.push({ temp, size: sizes[k], value: v }));
    else vals.forEach(v => scop.push({ temp, size: hpKw || null, value: v }));
  });
  if (scop.length) res.scop = scop.filter((s, i, a) => a.findIndex(x => x.temp === s.temp && x.size === s.size && x.value === s.value) === i).slice(0, 8);
  Object.assign(res, parseSound(lines, hpKw, sizes));
  return res;
}
function pickBySize(vals, sizes, hpKw) {
  if (vals.length > 1 && sizes.length === vals.length && hpKw) { let best = 0; sizes.forEach((s, k) => { if (Math.abs(s - hpKw) < Math.abs(sizes[best] - hpKw)) best = k; }); return vals[best]; }
  return vals[0];
}
function parseSound(lines, hpKw, sizes = []) {
  const res = {};
  const dbVals = l => [...l.matchAll(/(?<![\d,.])(\d{2}(?:[.,]\d)?)(?![\d])\s*(?:dB)?/g)].map(m => num1(m[1])).filter(v => v >= 20 && v <= 90);
  const merged = lines.map((l, k) => /nacht|schall/i.test(l) && /db/i.test(l) && !/\b(m|meter)\b/i.test(l) ? l + ' ' + (lines[k + 1] || '') : l);
  for (const l of merged) {
    if (!/db|schall/i.test(l)) continue;
    const v = dbVals(l.replace(/\b(35|55)\s*°C/g, '').replace(/\d+(?:[.,]\d)?\s*(?:m|meter)\b/gi, ''));
    if (!v.length) continue;
    if (/schallleistung/i.test(l) && /nacht/i.test(l)) res.swNight ??= pickBySize(v, sizes, hpKw);
    else if (/schallleistung/i.test(l) && /tag|max/i.test(l)) res.swDay ??= pickBySize(v, sizes, hpKw);
    else if (/schallleistung/i.test(l)) res.sw ??= pickBySize(v, sizes, hpKw);
    else if (/nacht/i.test(l) && /(\d+(?:[.,]\d)?)\s*(m|meter)\b/i.test(l) && !res.spl) { res.spl = v[0]; res.splDist = num1(/(\d+(?:[.,]\d)?)\s*(m|meter)\b/i.exec(l)[1]); }
    else if (/schalldruck/i.test(l)) { res.spl ??= pickBySize(v, sizes, hpKw); const d = /(\d+(?:[.,]\d)?)\s*m\b/.exec(l); if (d && !res.splDist) res.splDist = num1(d[1]); }
  }
  return res;
}
/* Garantie-Aussagen aus einem Positionstext, z. B. „30 Jahre Produkt sowie Leistungsgarantie (…)“ */
/* Zeilen zusammenfügen; pdf.js verliert weiche Trennstriche – kleingeschriebene Fortsetzung wird angehängt,
   außer nach vollständigen kurzen Wörtern („mit“, „und“ …) */
const SHORT_WORDS = new Set('mit und von der die das im in auf bis zu für bei nach sowie oder ein eine einer den dem des ist sind wird als auch an am zum zur über unter aus ohne je pro bzw inkl'.split(' '));
function joinLines(lines) {
  let out = '';
  for (const raw of lines) {
    const l = raw.replace(/\u00AD/g, '').trim(); if (!l) continue;
    if (!out) { out = l; continue; }
    const last = (out.match(/([A-Za-zÄÖÜäöüß]+)$/) || [])[1];
    out += last && /^[a-zäöüß]/.test(l) && !SHORT_WORDS.has(last.toLowerCase()) ? l : ' ' + l;
  }
  return out;
}
function warrantyOf(text) {
  const t = String(Array.isArray(text) ? joinLines(text) : text || '').replace(/\s+/g, ' '), out = [];
  for (const m of t.matchAll(/(\d{1,2})\s*Jahre?\s+([^•]{0,140}?garantie[^•]*?)(?=\s*•|\s*\d{1,3}\.\d{3}\b|$)/gi)) out.push(`${m[1]} Jahre ${m[2].trim()}`);
  for (const m of t.matchAll(/Garantie(?:erweiterung|verlängerung)[^•]{0,80}?(?=\s*•|\s*\d{1,3}\.\d{3}\b|$)/gi)) out.push(m[0].trim());
  return cleanWarranty([...new Set(out.map(x => x.replace(/\s*\(keine Folgekosten im Garantiefall\)/i, '').replace(/\s{2,}/g, ' ').replace(/[,;.\s]+$/, '').slice(0, 150)))].join(' · '));
}
/* „30 Jahre Leistungsgarantie“ fällt weg, wenn „30 Jahre Produkt und Leistungsgarantie“ schon dasteht */
function cleanWarranty(s) {
  const parts = [...new Set(String(s || '').split(/\s*·\s*/).map(x => x.trim()).filter(Boolean))];
  const yrs = x => (x.match(/^(\d{1,2})\s*Jahre/) || [])[1];
  return parts.filter(a => {
    const key = (a.toLowerCase().match(/([a-zäöüß]+)garantie\b/) || [])[1];
    if (!key) return true;
    return !parts.some(b => b !== a && b.length > a.length && yrs(b) === yrs(a) && b.toLowerCase().includes(key) && /garantie/i.test(b));
  }).join(' · ');
}
const itemName = b => b.title.replace(/\((alternative|bedarf)[^)]*\)/gi, '').replace(/\s{2,}/g, ' ').trim();
function parseOffer(read, role) {
  const raw = read.pages.flat(), all = raw.map(l => l.replace(/\u00AD/g, '')), own = ownChecker();
  read = { ...read, leftLines: (read.leftLines || []).map(l => l.replace(/\u00AD/g, '')) };
  const blocks = splitPositions(raw);
  const skipIdx = new Set(blocks.filter(b => b.notOrdered).flatMap(b => b.idx));
  const ordered = all.filter((l, i) => !skipIdx.has(i));
  const R = { role, ocr: !!read.ocr };
  R.customer = parseCustomer(all, read.leftLines && read.leftLines.length ? read.leftLines : all.slice(0, 40), own);
  Object.assign(R, parseMeta(all));
  R.amounts = scoreAmounts(ordered.filter(l => !own(l))).slice(0, 8);
  R.gross = R.amounts[0] ? R.amounts[0].v : null;
  R.skipped = blocks.filter(b => b.notOrdered).map(b => ({ no: b.no, title: b.title, total: b.total, kind: b.kind }));
  const ob = blocks.filter(b => !b.notOrdered);
  // PV
  if (role !== 'offerWP') {
    let kwp = 0, mods = [];
    const wattRx = /(\d{3})\s*(?:W|Wp|Watt|Watt-?peak)\b/gi;
    for (const b of ob) {
      if (/wechselrichter|speicher|batterie|kabel|unterkonstruktion|montage|gestell|halterung|optimierer|dachhaken|schiene|wallbox/i.test(b.first)) continue;
      const wFirst = [...b.first.matchAll(wattRx)].map(m => +m[1]).find(v => v >= 250 && v <= 800);
      const isModule = /modul|solarmodul|pv-?modul|photovoltaikmodul|panel/i.test(b.text) || wFirst;
      if (!isModule) continue;
      const w = wFirst || [...b.text.matchAll(wattRx)].map(m => +m[1]).find(v => v >= 250 && v <= 800);
      if (!w) continue;
      kwp += (b.qty || 1) * w / 1000; mods.push(`${num(b.qty || 1)} × ${w} W`);
    }
    if (!kwp) {
      const txt = ordered.join('\n');
      for (const m of txt.matchAll(/(\d{1,3}(?:[.,]\d{1,3})?)\s*kWp/gi)) {
        const before = txt.slice(Math.max(0, m.index - 18), m.index).toLowerCase();
        if (/\bab\b|größer|über|bis|max|pflicht|>|<|≥/.test(before)) continue;
        const v = num1(m[1]); if (v > 0.5 && v < 200) { kwp = v; break; }
      }
    }
    if (kwp) { R.kwp = Math.round(kwp * 1000) / 1000; R.modules = mods.join(' + '); }
    const modB = ob.find(b => !/wechselrichter|speicher|batterie|kabel|unterkonstruktion|montage|gestell|halterung|optimierer|dachhaken|schiene|wallbox/i.test(b.first) && /(\d{3})\s*(?:W|Wp|Watt)\b/i.test(b.first));
    if (modB) { R.modMaker = itemName(modB); R.modWarranty = warrantyOf(modB.lines); }
    const invB = ob.find(b => /wechselrichter/i.test(b.first) && !/montage|anschluss|installation/i.test(b.first));
    if (invB) { R.invMaker = itemName(invB).replace(/\s+inkl\..*$/i, ''); R.invWarranty = warrantyOf(invB.lines); }
    let bat = 0;
    for (const b of ob) {
      if (!/speicher|batterie|akku/i.test(b.first) || /wasser|puffer|liter|wärme|\bl\b/i.test(b.first) || !(b.total > 0)) continue;
      const k = /(\d{1,3}(?:[.,]\d{1,2})?)\s*kWh/i.exec(b.text); if (!k) continue;
      bat += (b.qty || 1) * num1(k[1]);
    }
    if (bat) R.bat = Math.round(bat * 100) / 100;
    const batB = ob.find(b => /speicher|batterie|akku/i.test(b.first) && !/wasser|puffer|liter|wärme|\bl\b/i.test(b.first) && b.total > 0 && /kWh/i.test(b.text));
    if (batB) { R.batMaker = itemName(batB); R.batWarranty = warrantyOf(batB.lines); }
  }
  // Wärmepumpe
  if (role !== 'offerPV') {
    const hpRx = /(\d{1,2}(?:[.,]\d)?)\s*kW\b|\d{1,2}\s*\/\s*400\s*V|CHA|[A-Z]{2,}[-\s]?\d/i, noHp = /rohr|leitung|fundament|hauseinführung|antrag|förder|sockel|konsole/i;
    const hpB = ob.find(b => b.total > 0 && /wärmepumpe|luft-?wasser/i.test(b.first) && !noHp.test(b.first) && hpRx.test(b.text)) || ob.find(b => b.total > 0 && /wärmepumpe/i.test(b.first) && !noHp.test(b.first)) || ob.find(b => b.total > 0 && /wärmepumpe/i.test(b.text) && hpRx.test(b.text) && !noHp.test(b.first));
    const hpTxt = hpB ? hpB.text : ordered.filter(l => /wärmepumpe|heizleistung/i.test(l)).join(' ');
    let kw = null;
    const m1 = /(?:heizleistung|nennleistung|leistung)?[^\d]{0,12}(\d{1,2}(?:[.,]\d{1,2})?)\s*kW\b(?!h)/i.exec(hpTxt);
    if (m1) kw = num1(m1[1]);
    const m2 = /(?:-|\s)(\d{1,2})\s*\/\s*(?:230|400)\s*V/i.exec(hpTxt); if ((!kw || kw < 2) && m2) kw = +m2[1];
    const m3 = /CHA\s*-?\s*(?:Monoblock\s*)?(\d{1,2})\b/i.exec(hpTxt); if ((!kw || kw < 2) && m3) kw = +m3[1];
    if (kw >= 2 && kw <= 60) R.hpKw = kw;
    if (hpB) {
      let model = hpB.first.replace(/^\s*[\d.]+\.?\s+/, '').replace(/^\d+(?:,\d+)?\s*(stk\.?|st\.?|stück|x|psch\.?|pausch\.?)?\s+/i, '').replace(RX_AMOUNT, '').replace(/\s*€\s*/g, ' ').replace(/\s{2,}/g, ' ').trim();
      if (/\b(mit|und|inkl\.?)$/i.test(model) && hpB.lines[1]) model += ' ' + hpB.lines[1].replace(RX_AMOUNT, '').split(',')[0].trim();
      R.hpModel = model.slice(0, 80);
    }
    const all2 = ordered;
    const indoor = (l, idx) => /innen|hydraulik|speicher/i.test(l.slice(Math.max(0, idx - 28), idx));
    for (const l of all2) {
      const d = /(\d{3,4})\s*(?:mm)?\s*[x×]\s*(\d{3,4})\s*(?:mm)?\s*[x×]\s*(\d{3,4})\s*mm/i.exec(l);
      if (d && !R.dims && !indoor(l, d.index)) R.dims = `${d[1]} x ${d[2]} x ${d[3]} mm`;
      const g = /gewicht[^\d\n]{0,30}(\d{2,3}(?:[.,]\d)?)\s*kg/i.exec(l);
      if (g && !R.weight && !indoor(l, g.index)) R.weight = num1(g[1]);
    }
    Object.assign(R, Object.fromEntries(Object.entries(parseTech(all, R.hpKw)).filter(([k]) => ['jaz', 'heat', 'power', 'load', 'scop', 'sw', 'swDay', 'swNight', 'spl', 'splDist'].includes(k))));
    const wm = /CHA\s*-?\s*(?:Monoblock\s*)?(0?7|10|16)\b/i.exec(hpTxt || all.join(' '));
    { const wt = all.join(' ').replace(/\u00AD/g, '').replace(/-\s+/g, '').replace(/\s+/g, ' ');
      const g = /(\w+)?\s*Garantie\s+von\s+(\d{1,2})\s*Jahren[^.]{0,80}?Wartung/i.exec(wt) || /(\d{1,2})\s*Jahre[^.]{0,40}Garantie[^.]{0,80}?Wartung/i.exec(wt);
      if (g) { const yrs = g[2] || g[1], mk = g[2] && g[1] && /^[A-ZÄÖÜ]/.test(g[1]) ? g[1] + '-' : ''; R.hpWarranty = `${yrs} Jahre ${mk}Herstellergarantie – Voraussetzung: jährliche Wartung`; } }
    const clean = s => s.replace(/\s+(inkl\.?|inklusive|mit Verohrrung|mit Verrohrung).*$/i, '').replace(/\s+für die Heizung/i, '').trim();
    const bufB = ob.find(b => /puffer/i.test(b.first)), dhwB = ob.find(b => /(warm|trink|brauch)wasser-?speicher|speicher.*warmwasser/i.test(b.first) && !/puffer/i.test(b.first));
    if (bufB) R.hpBuffer = clean(itemName(bufB)); if (dhwB) R.hpDhw = clean(itemName(dhwB));
    if (wm && /wolf/i.test(all.join(' '))) { const w = WOLF[wm[1].padStart(2, '0')]; R.sw ??= w.sw; R.swDay ??= w.day; R.swNight ??= w.night; R.spl ??= w.spl; R.splDist ??= 3; R.wolf = 'CHA-' + wm[1]; }
  }
  R.products = matchProducts(ordered);
  // Absicherung: Wärmepumpe nur, wenn ihre Leistung zur erkannten Heizleistung passt (z. B. CHA 10 statt CHA 16)
  if (R.hpKw) {
    const wpHits = R.products.filter(m => { const pr = PRODUCTS.find(x => x.id === m.id); return pr && pr.cat === 'wp'; });
    const fits = m => { const pr = PRODUCTS.find(x => x.id === m.id), kw = pr.power || +((String(pr.name).match(/(?<![\d.,])(\d{1,2})(?![\d.,]*\d)/) || [])[1]); return !kw || Math.abs(kw - R.hpKw) <= 0.6; };
    if (wpHits.some(fits)) R.products = R.products.filter(m => !wpHits.includes(m) || fits(m));
    else if (wpHits.length) R.products = R.products.filter(m => !wpHits.includes(m));
  }
  return R;
}
function matchProducts(lines) {
  const txt = lines.join('\n').toLowerCase(), out = [];
  for (const pr of PRODUCTS) {
    const raw = pr.name.toLowerCase().split(/[\s,/]+/).filter(Boolean), words = [];
    for (let i = 0; i < raw.length; i++) { if (/^\d+([.,]\d+)?$/.test(raw[i]) && /^(kw|kwh|kwp|wp|w|v|l)$/.test(raw[i + 1] || '')) { words.push(raw[i] + ' ' + raw[i + 1]); i++; } else if (raw[i].length >= 2) words.push(raw[i]); }
    if (!words.length) continue;
    const wre = w => new RegExp('(?<![\\p{L}\\d])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s*') + '(?![\\p{L}\\d])', 'iu');
    const hits = words.filter(w => wre(w).test(txt)).length;
    if (hits / words.length < 0.67) continue;
    let best = null, bh = 0;
    for (const l of lines) { const ll = l.toLowerCase(); const h = words.filter(w => wre(w).test(ll)).length; if (h > bh) { bh = h; best = l; } }
    const q = best && (/(\d+)\s*(?:stk\.?|st\.?|stück|x)\b/i.exec(best) || /^\s*[\d.]+\.?\s+(\d+)\s/.exec(best));
    out.push({ id: pr.id, qty: q ? +q[1] : 1, on: true });
  }
  return out;
}
function isRelevantTechPage(lines) { return /technische\s+daten|scop|\bjaz\b|jahresarbeitszahl|abmessungen|strombedarf|wärmebedarf|heizlast|auslegung|leistungsdaten/i.test(lines.join(' ')); }

/* ---------- Upload verarbeiten ---------- */
async function handleUpload(p, role, fileList, replaceId) {
  const files = [...fileList].filter(f => /pdf|image\/(jpe?g|png)/i.test(f.type) || /\.(pdf|jpe?g|png)$/i.test(f.name));
  if (!files.length) return toast('Bitte PDF, JPG oder PNG verwenden.', 'err');
  for (const file of files) {
    const isTech = role === 'tech';
    let doc;
    if (replaceId) { doc = p.docs.find(d => d.id === replaceId); await delFiles(doc.pages); doc.pages = []; doc.sel = []; doc.name = file.name; }
    else { doc = { id: uid('d'), role, name: file.name, pages: [], sel: [], attach: true, pageCount: 0 }; if (!isTech) { const old = p.docs.filter(d => d.role === role); for (const o of old) await removeDoc(p, o.id, true); } p.docs.push(doc); }
    UI.busy[doc.id] = 'Datei wird geöffnet …'; render();
    try {
      const read = await readAnyFile(file, isTech, msg => { UI.busy[doc.id] = msg; const el = $(`[data-busy="${doc.id}"]`); if (el) el.textContent = msg; });
      for (const b of read.images) doc.pages.push(await putFile(b, file.name));
      doc.pageCount = read.pageCount;
      if (isTech && read.pageCount > 8) doc.sel = doc.pages.map((_, i) => i === 0 || (read.pages[i] && isRelevantTechPage(read.pages[i])));
      else doc.sel = doc.pages.map(() => true);
      if (doc.pageCount > doc.pages.length) doc.note = `Nur die ersten ${doc.pages.length} von ${doc.pageCount} Seiten übernommen.`;
      const rec = isTech ? { role, ...parseTech(read.pages.flat(), p.hp.kw), ...parseSound(read.pages.flat(), p.hp.kw), products: matchProducts(read.pages.flat()) } : parseOffer(read, role);
      if (isTech) { const t = parseTech(read.pages.flat(), p.hp.kw); Object.assign(rec, t); const w = /CHA[-\s]?(07|10|16)/i.exec(read.pages.flat().join(' ')); if (w && /wolf/i.test(read.pages.flat().join(' '))) { const W = WOLF[w[1]]; rec.sw ??= W.sw; rec.swDay ??= W.day; rec.swNight ??= W.night; rec.spl ??= W.spl; rec.splDist ??= 3; } }
      p.rec[doc.id] = rec;
      applyRecognition(p, doc, rec);
      const n = Object.keys(rec).filter(k => rec[k] != null && !(Array.isArray(rec[k]) && !rec[k].length) && !['role', 'ocr', 'customer'].includes(k)).length;
      toast(read.ocr ? 'Texterkennung abgeschlossen – bitte Werte prüfen.' : n ? 'Dokument gelesen. Bitte Werte prüfen.' : 'Dokument hinzugefügt.');
    } catch (e) {
      console.error(e); toast('Die Datei konnte nicht gelesen werden: ' + (e.message || e), 'err');
      if (!doc.pages.length) { p.docs = p.docs.filter(d => d.id !== doc.id); }
    }
    delete UI.busy[doc.id];
    saveProject(p); render();
  }
}
/* Modulanzahl/-leistung aus „40 × 500 W + 2 × 430 W“ */
const modCount = s => String(s || '').split('+').reduce((a, x) => { const m = /(\d+(?:[.,]\d+)?)\s*[×x]/.exec(x); return a + (m ? Math.round(+m[1].replace(',', '.')) : 0); }, 0);
const modWatt = s => { const m = /[×x]\s*(\d{3})\s*W/.exec(String(s || '')); return m ? +m[1] : 0; };
function setFrom(p, path, v) { if (v === undefined || v === null || v === '' || (typeof v === 'number' && !isFinite(v))) return false; setPath(p, path, v); p.from[path] = true; if (p.src) delete p.src[path]; return true; }
function setSrc(p, path, v, label) { setPath(p, path, v); p.from[path] = false; (p.src = p.src || {})[path] = label; }
function applyRecognition(p, doc, r) {
  if (doc.role !== 'tech') {
    const c = r.customer || {};
    setFrom(p, 'customer.name', c.name); setFrom(p, 'customer.street', c.street); setFrom(p, 'customer.zip', c.zip); setFrom(p, 'customer.city', c.city);
    if (c.sal) setFrom(p, 'customer.salutation', c.sal);
    setFrom(p, 'customer.email', c.email); setFrom(p, 'customer.phone', c.phone);
    if (p.type === 'pvwp') {
      if (r.gross) setFrom(p, doc.role === 'offerPV' ? 'offer.grossPV' : 'offer.grossWP', r.gross);
      const nums = p.docs.filter(d => d.role === 'offerWP' || d.role === 'offerPV').sort((a, b) => (a.role === 'offerWP' ? -1 : 1)).map(d => p.rec[d.id] && p.rec[d.id].number).filter(Boolean);
      if (nums.length) setFrom(p, 'offer.number', [...new Set(nums)].join(' / '));
    } else { setFrom(p, 'offer.gross', r.gross); setFrom(p, 'offer.number', r.number); }
    setFrom(p, 'offer.date', r.date);
    if (r.advisor) { const m = (S.company.advisors || []).find(a => a.name && (a.name.toLowerCase() === r.advisor.toLowerCase() || a.name.toLowerCase().includes(r.advisor.toLowerCase()) || r.advisor.toLowerCase().includes(a.name.toLowerCase()))); setFrom(p, 'offer.advisor', m ? m.name : r.advisor); p.offer.advisorId = m ? m.id : ''; p.offer.advisorPhone = r.advisorPhone || ''; p.offer.advisorEmail = r.advisorEmail || ''; }
    if (r.date) { p.discount.until = addDays(r.date > isoToday() ? r.date : isoToday(), S.discount.days); }
    if (hasPV(p)) { if (r.kwp) p.offerPv = { kwp: r.kwp, modules: r.modules || '', n: modCount(r.modules), w: modWatt(r.modules) }; if (!(p.roof && p.roof.applied)) { setFrom(p, 'pv.kwp', r.kwp); setFrom(p, 'pv.modules', r.modules); } setFrom(p, 'pv.bat', r.bat); ['modMaker', 'modWarranty', 'batMaker', 'batWarranty', 'invMaker', 'invWarranty'].forEach(k => setFrom(p, 'pv.' + k, r[k])); }
  }
  if (hasWP(p)) {
    setFrom(p, 'hp.kw', r.hpKw); setFrom(p, 'hp.model', r.hpModel); setFrom(p, 'hp.warranty', r.hpWarranty); setFrom(p, 'hp.buffer', r.hpBuffer); setFrom(p, 'hp.dhw', r.hpDhw); setFrom(p, 'hp.dims', r.dims); setFrom(p, 'hp.weight', r.weight);
    setFrom(p, 'hp.jaz', r.jaz); setFrom(p, 'hp.heat', r.heat); setFrom(p, 'hp.power', r.power);
    ['sw', 'swDay', 'swNight', 'spl', 'splDist'].forEach(k => setFrom(p, 'hp.' + k, r[k]));
  }
  if (p.type !== 'pv' && p.type === 'wp' && !p.fund.eligible) { /* förderfähig = Bruttopreis automatisch */ }
}
async function removeDoc(p, id, silent) {
  const d = p.docs.find(x => x.id === id); if (!d) return;
  await delFiles(d.pages);
  p.docs = p.docs.filter(x => x.id !== id); delete p.rec[id];
  saveProject(p); if (!silent) render();
}
