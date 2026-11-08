/* =========================================================
   Modulplan (PV-Dachbelegung) – nur auf PC, iPad und aufgeklapptem Foldable
   Ablauf: Foto → Dachfläche (4 Ecken) → Referenz (Pfannen zählen oder Maß) → Module belegen
   Die Pfannen-Referenz ist ein echtes Rechteck auf dem Dach: daraus wird das Foto entzerrt
   (Homographie). So stimmen auch Trapez-Flächen (Walmdach) in Form und Größe.
   ========================================================= */
const ROOF_GAP = 0.015;                                     // 1,5 cm Abstand zwischen Modulen
const TILE_DEFAULTS = [
  { id: 'frankfurter', name: 'Frankfurter Pfanne', w: 30, l: 33.5 },
  { id: 'doppels', name: 'Doppel-S-Pfanne', w: 30, l: 33 },
  { id: 'harzer', name: 'Harzer Pfanne', w: 30, l: 33 },
  { id: 'tegalit', name: 'Flachdachpfanne (z. B. Tegalit)', w: 30, l: 33 },
  { id: 'hohlfalz', name: 'Hohlfalzziegel', w: 21.5, l: 33 },
  { id: 'reform', name: 'Reformpfanne', w: 22, l: 34 },
  { id: 'biber', name: 'Biberschwanz (Doppeldeckung)', w: 18, l: 15 },
  { id: 'custom', name: 'Individuell', w: 30, l: 33 }
];
const roofTiles = () => { if (!Array.isArray(S.roofTiles) || !S.roofTiles.length) S.roofTiles = clone(TILE_DEFAULTS); return S.roofTiles; };
const roofOk = () => Math.min(innerWidth, innerHeight) >= 600 || innerWidth >= 900;
const roofMods = () => PRODUCTS.filter(x => x.cat === 'mod' && +x.len > 0 && +x.wid > 0);
const RIMG = {};
let RS = null;                                               // Editor-Zustand

/* ---------- Mathematik: Homographie Einheitsquadrat → Viereck ---------- */
function sqToQuad(q) {                                     // q: [[x,y]×4] in Reihenfolge (0,0),(1,0),(1,1),(0,1)
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  let g = 0, h = 0; const den = dx1 * dy2 - dx2 * dy1;
  if (Math.abs(dx3) > 1e-9 || Math.abs(dy3) > 1e-9) { g = (dx3 * dy2 - dx2 * dy3) / den; h = (dx1 * dy3 - dx3 * dy1) / den; }
  return [x1 - x0 + g * x1, x3 - x0 + h * x3, x0, y1 - y0 + g * y1, y3 - y0 + h * y3, y0, g, h, 1];
}
const hApply = (m, x, y) => { const w = m[6] * x + m[7] * y + m[8]; return [(m[0] * x + m[1] * y + m[2]) / w, (m[3] * x + m[4] * y + m[5]) / w]; };
function hInv(m) {
  const [a, b, c, d, e, f, g, h, i] = m, A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g, det = a * A + b * B + c * C;
  return [A, -(b * i - c * h), b * f - c * e, B, a * i - c * g, -(a * f - c * d), C, -(a * h - b * g), a * e - b * d].map(v => v / det);
}
/* Geometrie einer Dachfläche: Ebene in Metern (x entlang Rinne, y den Hang hinab) */
function faceGeom(f) {
  if (!f || !f.iw || !f.corners || !f.ref) return null;
  const P = q => q.map(([x, y]) => [x * f.iw, y * f.ih]);
  let rw, rh;
  if (f.refMode === 'len') { rw = (+f.lw || 0) / 100; rh = (+f.lh || 0) / 100; }
  else { const t = roofTiles().find(x => x.id === f.tileId) || roofTiles()[0]; rw = (+f.nx || 0) * t.w / 100; rh = (+f.ny || 0) * t.l / 100; }
  if (!(rw > 0 && rh > 0)) return null;
  const H = sqToQuad(P(f.ref)), Hi = hInv(H);
  const toPlane = ([x, y]) => { const [u, v] = hApply(Hi, x, y); return [u * rw, v * rh]; };
  const raw = P(f.corners).map(toPlane);                    // Reihenfolge: Rinne li, First li, First re, Rinne re
  if (raw.some(p => !isFinite(p[0]) || !isFinite(p[1]))) return null;
  const ox = Math.min(...raw.map(p => p[0])), oy = Math.min(...raw.map(p => p[1]));
  const poly = raw.map(([x, y]) => [x - ox, y - oy]);
  const W = Math.max(...poly.map(p => p[0])), Hh = Math.max(...poly.map(p => p[1]));
  if (!(W > 0.5 && Hh > 0.5 && W < 80 && Hh < 40)) return { bad: true, W, H: Hh };
  const toImg = (X, Y) => hApply(H, (X + ox) / rw, (Y + oy) / rh);
  const m = [(+f.mSide || 0) / 100, (+f.mTop || 0) / 100, (+f.mSide || 0) / 100, (+f.mBot || 0) / 100];   // Kanten: li, First, re, Rinne
  return { poly, W, H: Hh, toImg, inset: insetPoly(poly, m), eave: Math.hypot(poly[3][0] - poly[0][0], poly[3][1] - poly[0][1]), ridge: Math.hypot(poly[2][0] - poly[1][0], poly[2][1] - poly[1][1]), slope: Math.hypot(poly[1][0] - poly[0][0], poly[1][1] - poly[0][1]) };
}
function insetPoly(p, m) {
  const n = p.length, area = p.reduce((s, a, i) => { const b = p[(i + 1) % n]; return s + a[0] * b[1] - b[0] * a[1]; }, 0), sg = area > 0 ? 1 : -1;
  const lines = p.map((a, i) => { const b = p[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L * sg, ny = dx / L * sg; return [[a[0] + nx * m[i], a[1] + ny * m[i]], [dx, dy]]; });
  return lines.map((l, i) => { const k = lines[(i - 1 + n) % n], [[ax, ay], [adx, ady]] = k, [[bx, by], [bdx, bdy]] = l, den = adx * bdy - ady * bdx; if (Math.abs(den) < 1e-9) return [bx, by]; const t = ((bx - ax) * bdy - (by - ay) * bdx) / den; return [ax + adx * t, ay + ady * t]; });
}
function inPoly(p, [x, y]) {
  let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length], c = (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]); if (Math.abs(c) < 1e-9) continue; if (s === 0) s = Math.sign(c); else if (Math.sign(c) !== s) return false; }
  return true;
}
function xRange(p, y) {                                      // waagerechter Schnitt durch ein konvexes Viereck
  const xs = []; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; if ((a[1] - y) * (b[1] - y) <= 0 && a[1] !== b[1]) xs.push(a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1])); }
  return xs.length >= 2 ? [Math.min(...xs), Math.max(...xs)] : null;
}

/* ---------- Module ---------- */
const roofProd = f => PRODUCTS.find(x => x.id === f.prodId) || roofMods()[0] || { id: '', name: 'Standardmodul 1722 × 1134 mm', power: 430, len: 1722, wid: 1134, generic: true };
const modWH = (f, o) => { const pr = roofProd(f), a = +pr.wid / 1000, b = +pr.len / 1000; return o === 'l' ? [b, a] : [a, b]; };
const modBox = (f, m) => { const [w, h] = modWH(f, m.o); return { x0: m.x, y0: m.y, x1: m.x + w, y1: m.y + h }; };
function modState(f, g, m, i) {
  const b = modBox(f, m), pts = [[b.x0, b.y0], [b.x1, b.y0], [b.x1, b.y1], [b.x0, b.y1]];
  const over = f.mods.some((o, j) => j !== i && (() => { const c = modBox(f, o); return b.x0 < c.x1 - 1e-4 && b.x1 > c.x0 + 1e-4 && b.y0 < c.y1 - 1e-4 && b.y1 > c.y0 + 1e-4; })());
  if (over) return 'over';
  return pts.every(p => inPoly(g.inset, p)) ? 'ok' : pts.every(p => inPoly(g.poly, p)) ? 'margin' : 'out';
}
const faceKwp = f => (f.mods || []).length * (+roofProd(f).power || 0) / 1000;

/* ---------- Bilder ---------- */
async function roofImg(id) {
  if (!id) return null; if (RIMG[id]) return RIMG[id];
  await loadFiles([id]); const u = fileUrl(id); if (!u) return null;
  return (RIMG[id] = await new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = u; }));
}
async function roofPhoto(file) {
  const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
  const k = Math.min(1, 2400 / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas');
  c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
  const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.88)); return { id: await putFile(blob, 'dach.jpg'), w: c.width, h: c.height };
}
/* Entzerrtes Dachbild (Ebene in Metern) – per Dreiecksnetz, wird gecacht */
function roofWarp(f, g, img) {
  const key = JSON.stringify([f.photo, f.corners, f.ref, f.refMode, f.nx, f.ny, f.lw, f.lh, f.tileId]);
  if (RS && RS.warpKey === key && RS.warp) return RS.warp;
  const ppm = Math.min(90, 2200 / Math.max(g.W, g.H)), c = document.createElement('canvas');
  c.width = Math.ceil(g.W * ppm); c.height = Math.ceil(g.H * ppm);
  const x = c.getContext('2d'), N = 28;
  const tri = (s, d) => {                                    // Quelle s (Bild) → Ziel d (Canvas), affin
    const [[x0, y0], [x1, y1], [x2, y2]] = s, [[u0, v0], [u1, v1], [u2, v2]] = d, den = x0 * (y1 - y2) + x1 * (y2 - y0) + x2 * (y0 - y1); if (Math.abs(den) < 1e-9) return;
    const a = (u0 * (y1 - y2) + u1 * (y2 - y0) + u2 * (y0 - y1)) / den, b = (u0 * (x2 - x1) + u1 * (x0 - x2) + u2 * (x1 - x0)) / den, cc = (u0 * (x1 * y2 - x2 * y1) + u1 * (x2 * y0 - x0 * y2) + u2 * (x0 * y1 - x1 * y0)) / den;
    const dd = (v0 * (y1 - y2) + v1 * (y2 - y0) + v2 * (y0 - y1)) / den, e = (v0 * (x2 - x1) + v1 * (x0 - x2) + v2 * (x1 - x0)) / den, ff = (v0 * (x1 * y2 - x2 * y1) + v1 * (x2 * y0 - x0 * y2) + v2 * (x0 * y1 - x1 * y0)) / den;
    const cx = (u0 + u1 + u2) / 3, cy = (v0 + v1 + v2) / 3, ex = p => [p[0] + (p[0] - cx) * 0.04, p[1] + (p[1] - cy) * 0.04];
    x.save(); x.beginPath(); const q = d.map(ex); x.moveTo(q[0][0], q[0][1]); x.lineTo(q[1][0], q[1][1]); x.lineTo(q[2][0], q[2][1]); x.closePath(); x.clip();
    x.setTransform(a, dd, b, e, cc, ff); x.drawImage(img, 0, 0); x.restore();
  };
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const X = k => g.W * k / N, Y = k => g.H * k / N, P = [[X(i), Y(j)], [X(i + 1), Y(j)], [X(i + 1), Y(j + 1)], [X(i), Y(j + 1)]];
    const S2 = P.map(([a, b]) => g.toImg(a, b)), D = P.map(([a, b]) => [a * ppm, b * ppm]);
    tri([S2[0], S2[1], S2[2]], [D[0], D[1], D[2]]); tri([S2[0], S2[2], S2[3]], [D[0], D[2], D[3]]);
  }
  RS.warpKey = key; RS.warp = c; return c;
}

/* ---------- Editor öffnen ---------- */
async function roofOpen(pid) {
  const p = findProject(pid); if (!p) return;
  if (!roofOk()) { toast('Der Modulplan braucht einen größeren Bildschirm – bitte am iPad, PC oder aufgeklappten Foldable öffnen.'); return; }
  p.roof = p.roof || { faces: [], saves: [] };
  if (!p.roof.faces.length) p.roof.faces.push(roofNewFace(1));
  RS = { pid, fi: 0, step: p.roof.faces[0].photo ? (faceGeom(p.roof.faces[0]) ? 'mod' : 'corners') : 'photo', mode: 'add', multi: false, magnet: true, sel: new Set(), hist: [], drag: null };
  document.body.insertAdjacentHTML('beforeend', '<div id="roof-ed" class="fixed inset-0 z-[75] bg-bg flex flex-col"></div>');
  document.documentElement.style.overflow = 'hidden';
  roofRender();
}
const roofNewFace = n => ({ id: uid('rf'), name: n === 1 ? 'Hauptdach' : `Dachfläche ${n}`, photo: '', iw: 0, ih: 0, corners: [[0.2, 0.8], [0.35, 0.35], [0.65, 0.35], [0.8, 0.8]], ref: null, refMode: 'tiles', tileId: 'frankfurter', nx: null, ny: null, lw: null, lh: null, mTop: 30, mBot: 30, mSide: 30, prodId: (roofMods()[0] || {}).id || '', orient: 'p', mods: [] });
function roofClose() { const e = $('#roof-ed'); if (e) e.remove(); document.documentElement.style.overflow = ''; RS = null; render(); }
const roofP = () => RS && findProject(RS.pid), roofF = () => roofP().roof.faces[RS.fi];
function roofSave() { const p = roofP(); if (p) saveProject(p); }

/* ---------- Oberfläche ---------- */
function roofRender() {
  const box = $('#roof-ed'); if (!box || !RS) return;
  const p = roofP(), f = roofF(), g = faceGeom(f);
  const steps = [['photo', '1 · Foto'], ['corners', '2 · Dachfläche'], ['ref', '3 · Referenz'], ['mod', '4 · Belegen']];
  const can = { photo: true, corners: !!f.photo, ref: !!f.photo, mod: !!(g && !g.bad) };
  const tot = p.roof.faces.reduce((a, x) => [a[0] + x.mods.length, a[1] + faceKwp(x)], [0, 0]);
  box.innerHTML = `
  <div class="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-line" style="padding-top:max(10px,env(safe-area-inset-top))">
    <div class="font-semibold text-[16px] mr-2 flex items-center gap-2"><span class="text-p">${ic('sun', 18)}</span>Modulplan · ${esc(p.customer.name || 'Neue Berechnung')}</div>
    <div class="flex flex-wrap gap-1.5">${steps.map(([k, l]) => `<button class="chip ${RS.step === k ? '!border-p !text-ink !bg-p/10' : ''} ${can[k] ? '' : 'opacity-40 pointer-events-none'}" data-r="step" data-v="${k}">${l}</button>`).join('')}</div>
    <div class="ml-auto flex gap-2"><button class="btn-s !h-9 !px-3 text-[13px]" data-r="save">${ic('download', 15)}Stand speichern</button><button class="btn-g !h-9 !px-3 text-[13px]" data-r="close">${ic('x', 16)}Schließen</button></div>
  </div>
  <div class="flex-1 min-h-0 flex flex-col md:flex-row">
    <div id="roof-stage" class="relative flex-1 min-h-[320px] bg-black/40 touch-none select-none overflow-hidden"><canvas id="roof-cv" class="absolute inset-0 w-full h-full block"></canvas>
      <div id="roof-tip" class="absolute left-3 bottom-3 right-3 text-[12px] text-white/80 pointer-events-none"></div></div>
    <div class="md:w-[340px] shrink-0 border-t md:border-t-0 md:border-l border-line overflow-y-auto max-h-[42vh] md:max-h-none p-4 space-y-4">${roofPanel(p, f, g)}</div>
  </div>
  <div class="flex flex-wrap items-center gap-x-5 gap-y-1 px-4 py-2.5 border-t border-line text-[14px]" style="padding-bottom:max(10px,env(safe-area-inset-bottom))">
    <span><span class="text-ink3">${esc(f.name)}:</span> <b>${f.mods.length} Module</b> · <b>${num(faceKwp(f), 2)} kWp</b></span>
    ${p.roof.faces.length > 1 ? `<span><span class="text-ink3">Gesamt:</span> <b class="text-p">${tot[0]} Module · ${num(tot[1], 2)} kWp</b></span>` : ''}
    <span id="roof-warn" class="text-[13px]"></span>
    <button class="btn-p !h-9 !px-4 text-[13px] ml-auto" data-r="apply" ${tot[0] ? '' : 'disabled'}>${ic('check', 15)}In Berechnung übernehmen</button>
  </div>`;
  roofBindStage(); roofDraw();
}
function roofPanel(p, f, g) {
  const faces = `<div><span class="lbl">Dachflächen</span><div class="flex flex-wrap gap-1.5">${p.roof.faces.map((x, i) => `<button class="chip ${i === RS.fi ? '!border-p !text-ink !bg-p/10' : ''}" data-r="face" data-v="${i}">${esc(x.name)} · ${x.mods.length}</button>`).join('')}<button class="chip" data-r="face-add">${ic('plus', 14)}Fläche</button></div>
    <div class="flex gap-2 mt-2"><input class="inp !h-10" data-rf="name" value="${esc(f.name)}" placeholder="Name der Fläche">${p.roof.faces.length > 1 ? `<button class="btn-g !h-10 !px-3" data-r="face-del" title="Fläche löschen">${ic('trash', 16)}</button>` : ''}</div></div>`;
  const saves = (p.roof.saves || []).length ? `<div><span class="lbl">Gespeicherte Stände</span><div class="space-y-1.5">${p.roof.saves.map(s => `<div class="flex items-center gap-2 text-[13px] rounded-lg bg-raised px-3 py-2"><span class="flex-1 min-w-0 truncate"><b>${esc(s.name)}</b> <span class="text-ink3">${esc(s.date)}</span></span><button class="text-p font-medium" data-r="load" data-v="${s.id}">Laden</button><button class="text-ink3" data-r="save-del" data-v="${s.id}">${ic('x', 14)}</button></div>`).join('')}</div></div>` : '';
  let body = '';
  if (RS.step === 'photo') body = `<div><div class="font-semibold text-[15px]">Foto der Dachfläche</div><p class="text-[13px] text-ink3 mt-1">Am besten möglichst frontal und ohne starken Weitwinkel fotografieren. Die Pfannen sollten gut zu erkennen sein.</p>
      <label class="btn-p w-full mt-3 cursor-pointer">${ic('image', 17)}${f.photo ? 'Anderes Foto wählen' : 'Foto aus der Bibliothek wählen'}<input type="file" accept="image/*" class="hidden" data-r="photo"></label>
      ${f.photo ? `<button class="btn-s w-full mt-2" data-r="step" data-v="corners">Weiter: Dachfläche markieren ${ic('arrowR', 16)}</button>` : ''}</div>`;
  else if (RS.step === 'corners') body = `<div><div class="font-semibold text-[15px]">Dachfläche markieren</div><p class="text-[13px] text-ink3 mt-1">Ziehen Sie die vier Punkte auf die Ecken der Fläche – die Lupe hilft beim genauen Treffen:</p>
      <ol class="text-[13px] mt-2 space-y-1"><li><b class="text-p">1</b> unten links an der Regenrinne</li><li><b class="text-p">2</b> oben links am First</li><li><b class="text-p">3</b> oben rechts am First</li><li><b class="text-p">4</b> unten rechts an der Regenrinne</li></ol>
      <button class="btn-p w-full mt-3" data-r="step" data-v="ref">Weiter: Referenz ${ic('arrowR', 16)}</button></div>`;
  else if (RS.step === 'ref') {
    const tiles = roofTiles(), t = tiles.find(x => x.id === f.tileId) || tiles[0];
    body = `<div><div class="font-semibold text-[15px]">Referenz aus den Dachpfannen</div><p class="text-[13px] text-ink3 mt-1">Legen Sie das gestrichelte Rechteck genau auf Pfannenkanten – <b>möglichst groß</b>, z. B. über die ganze Breite und Höhe. Die Ecken: oben links, oben rechts, unten rechts, unten links.</p>
      <div class="seg mt-3">${[['tiles', 'Pfannen zählen'], ['len', 'Maß eingeben']].map(([k, l]) => `<button class="${f.refMode === k ? 'on' : ''}" data-r="refmode" data-v="${k}">${l}</button>`).join('')}</div>
      ${f.refMode === 'len' ? `<div class="grid grid-cols-2 gap-2 mt-3"><label><span class="lbl">Breite</span>${roofIn('lw', 'cm')}</label><label><span class="lbl">Höhe (Hang)</span>${roofIn('lh', 'cm')}</label></div>`
    : `<label class="block mt-3"><span class="lbl">Pfannentyp</span><select class="inp appearance-none" data-rf="tileId">${tiles.map(x => `<option value="${x.id}" ${x.id === t.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>
      <div class="grid grid-cols-2 gap-2 mt-2"><label><span class="lbl">Deckbreite</span><div class="relative"><input class="inp pr-12" inputmode="decimal" data-rt="w" value="${inputFmt(t.w, 'n')}"><span class="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-ink4">cm</span></div></label><label><span class="lbl">Decklänge</span><div class="relative"><input class="inp pr-12" inputmode="decimal" data-rt="l" value="${inputFmt(t.l, 'n')}"><span class="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-ink4">cm</span></div></label></div>
      <p class="hint">Typische Werte – bitte prüfen. Änderungen werden für diesen Pfannentyp gespeichert.</p>
      <div class="grid grid-cols-2 gap-2 mt-2"><label><span class="lbl">Pfannen waagerecht</span>${roofIn('nx', 'Stk')}</label><label><span class="lbl">Reihen senkrecht</span>${roofIn('ny', 'Stk')}</label></div>`}
      <div class="mt-3"><span class="lbl">Randabstände</span><div class="grid grid-cols-3 gap-2"><label><span class="text-[11px] text-ink3">First</span>${roofIn('mTop', 'cm')}</label><label><span class="text-[11px] text-ink3">Rinne</span>${roofIn('mBot', 'cm')}</label><label><span class="text-[11px] text-ink3">Seiten</span>${roofIn('mSide', 'cm')}</label></div></div>
      <div id="roof-dims" class="mt-3 rounded-[calc(var(--r)-4px)] bg-raised p-3 text-[13px]">${roofDims(g)}</div>
      <button class="btn-p w-full mt-3" data-r="step" data-v="mod" ${g && !g.bad ? '' : 'disabled'}>Weiter: Module belegen ${ic('arrowR', 16)}</button></div>`;
  } else {
    const mods = roofMods(), pr = roofProd(f);
    body = `<div><span class="lbl">PV-Modul</span>${mods.length ? `<select class="inp appearance-none" data-rf="prodId">${mods.map(x => `<option value="${x.id}" ${x.id === pr.id ? 'selected' : ''}>${esc(x.name)} · ${num(x.power)} Wp</option>`).join('')}</select><div class="hint">${num(pr.len)} × ${num(pr.wid)} mm</div>` : `<div class="text-[13px] rounded-lg p-3" style="background:rgba(229,154,92,.14)">Noch kein PV-Modul mit Maßen unter „Produkte“. Bis dahin: Standardmodul 1722 × 1134 mm, 430 Wp. Legen Sie Ihre Module mit Länge und Breite an.</div>`}</div>
      <div class="grid grid-cols-2 gap-2"><div><span class="lbl">Ausrichtung</span><div class="seg">${[['p', 'Hochkant'], ['l', 'Quer']].map(([k, l]) => `<button class="${f.orient === k ? 'on' : ''}" data-r="orient" data-v="${k}">${l}</button>`).join('')}</div></div>
        <div><span class="lbl">Magnet</span><div class="seg">${[[true, 'An'], [false, 'Aus']].map(([k, l]) => `<button class="${RS.magnet === k ? 'on' : ''}" data-r="magnet" data-v="${k}">${l}</button>`).join('')}</div></div></div>
      <div><span class="lbl">Werkzeug</span><div class="seg w-full">${[['add', 'Hinzufügen'], ['select', 'Auswählen']].map(([k, l]) => `<button class="flex-1 ${RS.mode === k ? 'on' : ''}" data-r="mode" data-v="${k}">${l}</button>`).join('')}</div>
        <label class="flex items-center gap-2 mt-2 text-[13px]"><input type="checkbox" data-r="multi" ${RS.multi ? 'checked' : ''}> Mehrfachauswahl (Antippen fügt hinzu)</label></div>
      <div class="grid grid-cols-2 gap-2">
        <button class="btn-s !h-10 text-[13px]" data-r="fill">${ic('grid', 15)}Fläche füllen</button><button class="btn-s !h-10 text-[13px]" data-r="all">Alle auswählen</button>
        <button class="btn-s !h-10 text-[13px]" data-r="rotate" ${RS.sel.size ? '' : 'disabled'}>${ic('refresh', 15)}Drehen</button><button class="btn-s !h-10 text-[13px]" data-r="del" ${RS.sel.size ? '' : 'disabled'}>${ic('trash', 15)}Löschen${RS.sel.size ? ` (${RS.sel.size})` : ''}</button>
        <button class="btn-g !h-10 text-[13px]" data-r="undo" ${RS.hist.length ? '' : 'disabled'}>${ic('arrowL', 15)}Rückgängig</button><button class="btn-g !h-10 text-[13px]" data-r="none" ${RS.sel.size ? '' : 'disabled'}>Auswahl aufheben</button>
      </div>
      <p class="hint">Hinzufügen: auf die Fläche tippen. Auswählen: Module antippen oder einen Rahmen ziehen, dann gemeinsam verschieben. Am PC: Entf löscht, R dreht, Strg+A wählt alle.</p>
      <div class="text-[12px] text-ink3 rounded-lg bg-raised p-3">${roofDims(g)}</div>`;
  }
  return faces + body + saves;
}
const roofIn = (k, unit) => { const f = roofF(); return `<div class="relative"><input class="inp pr-11" inputmode="decimal" data-rf="${k}" value="${isNum(+f[k]) && f[k] !== null && f[k] !== '' ? inputFmt(+f[k], 'n') : ''}">${unit ? `<span class="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-ink4">${unit}</span>` : ''}</div>`; };
function roofDims(g) {
  if (!g) return 'Bitte Referenz eingeben – dann berechnet die App die Maße der Dachfläche.';
  if (g.bad) return `<span style="color:#E5484D">Die Maße wirken unplausibel (${num(g.W, 1)} × ${num(g.H, 1)} m). Bitte Referenz-Rechteck und Anzahl prüfen.</span>`;
  return `Dachfläche: Rinne <b>${num(g.eave, 2)} m</b> · First <b>${num(g.ridge, 2)} m</b> · Hanglänge <b>${num(g.slope, 2)} m</b><br><span class="text-ink3">Schätzung aus dem Foto – vor Ort bitte nachmessen.</span>`;
}

/* ---------- Zeichnen ---------- */
function roofView(cv, f, g, img) {
  const cw = cv.clientWidth, ch = cv.clientHeight, pad = 24;
  if (RS.step === 'mod' && g && !g.bad) { const s = Math.min((cw - 2 * pad) / g.W, (ch - 2 * pad) / g.H); return { kind: 'plane', s, ox: (cw - g.W * s) / 2, oy: (ch - g.H * s) / 2 }; }
  if (!img) return null;
  const k = Math.min((cw - 2 * pad) / f.iw, (ch - 2 * pad) / f.ih); return { kind: 'img', k, ox: (cw - f.iw * k) / 2, oy: (ch - f.ih * k) / 2 };
}
async function roofDraw() {
  const cv = $('#roof-cv'); if (!cv || !RS) return;
  const f = roofF(), g = faceGeom(f), img = await roofImg(f.photo);
  const dpr = devicePixelRatio || 1, cw = cv.clientWidth, ch = cv.clientHeight;
  if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); }
  const x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, cw, ch);
  const V = RS.view = roofView(cv, f, g, img), tip = $('#roof-tip');
  if (!V) { if (tip) tip.textContent = 'Bitte zuerst ein Foto wählen.'; return; }
  const pc = getComputedStyle(document.documentElement).getPropertyValue('--p-rgb').trim().split(/\s+/).join(','), P = `rgb(${pc})`;
  if (V.kind === 'img') {
    x.drawImage(img, V.ox, V.oy, f.iw * V.k, f.ih * V.k);
    const S = ([u, v]) => [V.ox + u * f.iw * V.k, V.oy + v * f.ih * V.k];
    const quad = (q, col, dash, labels) => { x.save(); x.setLineDash(dash || []); x.lineWidth = 2.5; x.strokeStyle = col; x.fillStyle = col.replace('rgb', 'rgba').replace(')', ',.14)'); x.beginPath(); q.map(S).forEach((p, i) => (i ? x.lineTo(...p) : x.moveTo(...p))); x.closePath(); x.fill(); x.stroke(); x.restore();
      q.map(S).forEach((p, i) => { x.beginPath(); x.arc(p[0], p[1], 13, 0, 7); x.fillStyle = col; x.fill(); x.strokeStyle = '#fff'; x.lineWidth = 2; x.stroke(); x.fillStyle = '#fff'; x.font = '600 12px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(labels[i], p[0], p[1] + 0.5); }); };
    if (RS.step === 'ref' || RS.step === 'corners') quad(f.corners, P, RS.step === 'ref' ? [6, 4] : null, ['1', '2', '3', '4']);
    if (RS.step === 'ref' && f.ref) quad(f.ref, 'rgb(229,154,92)', [8, 5], ['↖', '↗', '↘', '↙']);
    if (RS.drag && RS.drag.loupe) roofLoupe(x, img, S(RS.drag.loupe), f, V, cw);
    if (tip) tip.textContent = RS.step === 'corners' ? 'Punkte 1–4 auf die Ecken der Dachfläche ziehen.' : 'Oranges Rechteck auf Pfannenkanten legen – möglichst groß.';
    return;
  }
  /* Belegen: entzerrte Fläche in Metern */
  const s = V.s, M = (a, b) => [V.ox + a * s, V.oy + b * s];
  if (img) { const w = roofWarp(f, g, img); x.drawImage(w, V.ox, V.oy, g.W * s, g.H * s); }
  x.save(); x.beginPath(); x.rect(0, 0, cw, ch); g.poly.map(p => M(...p)).forEach((p, i) => (i ? x.lineTo(...p) : x.moveTo(...p))); x.closePath(); x.fillStyle = 'rgba(8,10,14,.72)'; x.fill('evenodd'); x.restore();
  const path = (q, col, w, dash) => { x.save(); x.setLineDash(dash || []); x.strokeStyle = col; x.lineWidth = w; x.beginPath(); q.map(p => M(...p)).forEach((p, i) => (i ? x.lineTo(...p) : x.moveTo(...p))); x.closePath(); x.stroke(); x.restore(); };
  path(g.poly, '#fff', 2); path(g.inset, 'rgba(255,214,120,.9)', 1.5, [6, 5]);
  let warn = [0, 0]; const pr = roofProd(f), pimg = pr.planImg ? await roofImg(pr.planImg) : null;
  f.mods.forEach((m, i) => {
    const b = modBox(f, m), st = modState(f, g, m, i), [a0, b0] = M(b.x0, b.y0), w = (b.x1 - b.x0) * s, h = (b.y1 - b.y0) * s;
    if (st === 'over') warn[0]++; else if (st !== 'ok') warn[1]++;
    if (pimg) {                                                     // eigenes Belegungsbild (hochkant hinterlegt, quer gedreht)
      x.save(); if (m.o === 'l') { x.translate(a0 + w / 2, b0 + h / 2); x.rotate(Math.PI / 2); x.drawImage(pimg, -h / 2, -w / 2, h, w); } else x.drawImage(pimg, a0, b0, w, h); x.restore();
      if (st !== 'ok') { x.fillStyle = st === 'over' ? 'rgba(229,72,77,.55)' : 'rgba(229,154,92,.5)'; x.fillRect(a0, b0, w, h); }
    } else {
      x.fillStyle = st === 'over' ? 'rgba(229,72,77,.85)' : st === 'ok' ? 'rgba(22,34,62,.92)' : 'rgba(229,154,92,.85)'; x.fillRect(a0, b0, w, h);
      x.strokeStyle = 'rgba(160,190,230,.35)'; x.lineWidth = 1; const nc = m.o === 'l' ? 10 : 6, nr = m.o === 'l' ? 6 : 10;
      x.beginPath(); for (let c = 1; c < nc; c++) { x.moveTo(a0 + w * c / nc, b0); x.lineTo(a0 + w * c / nc, b0 + h); } for (let r = 1; r < nr; r++) { x.moveTo(a0, b0 + h * r / nr); x.lineTo(a0 + w, b0 + h * r / nr); } x.stroke();
    }
    x.strokeStyle = RS.sel.has(i) ? P : 'rgba(255,255,255,.75)'; x.lineWidth = RS.sel.has(i) ? 3 : 1; x.strokeRect(a0, b0, w, h);
  });
  if (RS.drag && RS.drag.lasso) { const [a, b, c, d] = RS.drag.lasso; x.save(); x.setLineDash([5, 4]); x.strokeStyle = P; x.fillStyle = `rgba(${pc},.12)`; x.lineWidth = 1.5; x.fillRect(Math.min(a, c), Math.min(b, d), Math.abs(c - a), Math.abs(d - b)); x.strokeRect(Math.min(a, c), Math.min(b, d), Math.abs(c - a), Math.abs(d - b)); x.restore(); }
  const wEl = $('#roof-warn'); if (wEl) wEl.innerHTML = [warn[0] ? `<span style="color:#E5484D">${warn[0]} überlappen</span>` : '', warn[1] ? `<span style="color:#E59A5C">${warn[1]} im Randbereich</span>` : ''].filter(Boolean).join(' · ');
  if (tip) tip.textContent = RS.mode === 'add' ? 'Auf die Fläche tippen, um ein Modul zu setzen. Gelb gestrichelt: Randabstand.' : 'Module antippen oder Rahmen ziehen – dann verschieben.';
}
function roofLoupe(x, img, [sx, sy], f, V, cw) {
  const R = 70, Z = 3, left = sx > cw / 2, cx = left ? R + 16 : cw - R - 16, cy = R + 16;
  const ix = (sx - V.ox) / V.k, iy = (sy - V.oy) / V.k, src = R / (V.k * Z);
  x.save(); x.beginPath(); x.arc(cx, cy, R, 0, 7); x.closePath(); x.fillStyle = '#000'; x.fill(); x.clip();
  x.drawImage(img, ix - src, iy - src, src * 2, src * 2, cx - R, cy - R, R * 2, R * 2);
  x.strokeStyle = '#ff3b30'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(cx - 14, cy); x.lineTo(cx + 14, cy); x.moveTo(cx, cy - 14); x.lineTo(cx, cy + 14); x.stroke(); x.restore();
  x.beginPath(); x.arc(cx, cy, R, 0, 7); x.strokeStyle = '#fff'; x.lineWidth = 3; x.stroke();
}

/* ---------- Bedienung auf der Fläche (Maus, Finger, Stift) ---------- */
function roofBindStage() {
  const cv = $('#roof-cv'); if (!cv) return;
  if (RS.ro) RS.ro.disconnect(); RS.ro = new ResizeObserver(() => roofDraw()); RS.ro.observe(cv);
  cv.onpointerdown = e => { cv.setPointerCapture(e.pointerId); roofDown(e); };
  cv.onpointermove = e => { if (RS && RS.drag) roofMove(e); };
  cv.onpointerup = cv.onpointercancel = e => { if (RS && RS.drag) roofUp(e); };
}
const evXY = e => { const r = $('#roof-cv').getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
function roofDown(e) {
  const f = roofF(), V = RS.view; if (!V) return; const [sx, sy] = evXY(e);
  if (V.kind === 'img') {
    const S = ([u, v]) => [V.ox + u * f.iw * V.k, V.oy + v * f.ih * V.k], lists = RS.step === 'ref' && f.ref ? [['ref', f.ref], ['corners', f.corners]] : [['corners', f.corners]];
    for (const [k, q] of lists) { const i = q.findIndex(p => { const [a, b] = S(p); return Math.hypot(a - sx, b - sy) < 26; }); if (i >= 0 && (RS.step === 'corners' || k === 'ref')) { RS.drag = { pt: [k, i], loupe: q[i] }; roofDraw(); return; } }
    return;
  }
  const g = faceGeom(f), X = (sx - V.ox) / V.s, Y = (sy - V.oy) / V.s;
  const hit = f.mods.map((m, i) => [m, i]).reverse().find(([m]) => { const b = modBox(f, m); return X >= b.x0 && X <= b.x1 && Y >= b.y0 && Y <= b.y1; });
  if (hit) {
    const i = hit[1]; if (RS.multi || e.shiftKey || e.ctrlKey || e.metaKey) { if (RS.sel.has(i) && RS.mode === 'select') RS.sel.delete(i); else RS.sel.add(i); } else if (!RS.sel.has(i)) RS.sel = new Set([i]);
    RS.drag = { move: true, X, Y, start: [...RS.sel].map(j => [j, f.mods[j].x, f.mods[j].y]), moved: false }; roofRefreshPanel(); roofDraw(); return;
  }
  if (RS.mode === 'add') {
    const [w, h] = modWH(f, f.orient), m = { x: X - w / 2, y: Y - h / 2, o: f.orient };
    roofHist(); f.mods.push(m); RS.sel = new Set([f.mods.length - 1]);
    if (RS.magnet) roofSnap(f, g, RS.sel);
    roofSave(); roofRender(); return;
  }
  if (!(RS.multi || e.shiftKey)) RS.sel = new Set();
  RS.drag = { lasso: [sx, sy, sx, sy] }; roofDraw();
}
function roofMove(e) {
  const f = roofF(), V = RS.view, d = RS.drag, [sx, sy] = evXY(e);
  if (d.pt) {
    const [k, i] = d.pt, u = Math.min(1, Math.max(0, (sx - V.ox) / (f.iw * V.k))), v = Math.min(1, Math.max(0, (sy - V.oy) / (f.ih * V.k)));
    f[k][i] = [u, v]; d.loupe = [u, v]; if (RS.step === 'ref') { const el = $('#roof-dims'); if (el) el.innerHTML = roofDims(faceGeom(f)); } roofDraw(); return;
  }
  if (d.lasso) { d.lasso[2] = sx; d.lasso[3] = sy; roofDraw(); return; }
  if (d.move) {
    const X = (sx - V.ox) / V.s, Y = (sy - V.oy) / V.s, dx = X - d.X, dy = Y - d.Y;
    if (!d.moved && Math.hypot(dx, dy) * V.s < 4) return;
    if (!d.moved) { roofHist(); d.moved = true; }
    d.start.forEach(([j, x0, y0]) => { f.mods[j].x = x0 + dx; f.mods[j].y = y0 + dy; });
    if (RS.magnet) roofSnap(f, faceGeom(f), RS.sel);
    roofDraw();
  }
}
function roofUp() {
  const f = roofF(), V = RS.view, d = RS.drag; RS.drag = null;
  if (d.lasso) {
    const [a, b, c, e] = d.lasso, X0 = (Math.min(a, c) - V.ox) / V.s, X1 = (Math.max(a, c) - V.ox) / V.s, Y0 = (Math.min(b, e) - V.oy) / V.s, Y1 = (Math.max(b, e) - V.oy) / V.s;
    if (Math.abs(c - a) > 6 || Math.abs(e - b) > 6) f.mods.forEach((m, i) => { const bx = modBox(f, m); if (bx.x0 < X1 && bx.x1 > X0 && bx.y0 < Y1 && bx.y1 > Y0) RS.sel.add(i); });
    roofRefreshPanel(); roofDraw(); return;
  }
  roofSave(); if (d.pt && RS.step === 'ref') roofRender(); else roofDraw();
}
/* Magnet: Gruppe an Nachbarmodulen (mit 1,5 cm Fuge) und am Randabstand ausrichten */
function roofSnap(f, g, sel) {
  if (!sel.size || !g) return;
  const bs = [...sel].map(i => modBox(f, f.mods[i])), G = { x0: Math.min(...bs.map(b => b.x0)), y0: Math.min(...bs.map(b => b.y0)), x1: Math.max(...bs.map(b => b.x1)), y1: Math.max(...bs.map(b => b.y1)) };
  const others = f.mods.filter((m, i) => !sel.has(i)).map(m => modBox(f, m)), T = 0.25;
  const ins = g.inset, yTop = Math.max(ins[1][1], ins[2][1]), yBot = Math.min(ins[0][1], ins[3][1]);
  const cx = [], cy = [];
  for (const o of others) {
    const nearY = o.y0 < G.y1 + T && o.y1 > G.y0 - T, nearX = o.x0 < G.x1 + T && o.x1 > G.x0 - T;
    if (nearY) cx.push(o.x1 + ROOF_GAP - G.x0, o.x0 - ROOF_GAP - G.x1, o.x0 - G.x0, o.x1 - G.x1);
    if (nearX) cy.push(o.y1 + ROOF_GAP - G.y0, o.y0 - ROOF_GAP - G.y1, o.y0 - G.y0, o.y1 - G.y1);
  }
  cy.push(yTop - G.y0, yBot - G.y1);
  const rT = xRange(ins, G.y0 + 0.001), rB = xRange(ins, G.y1 - 0.001); if (rT && rB) cx.push(Math.max(rT[0], rB[0]) - G.x0, Math.min(rT[1], rB[1]) - G.x1);
  const list = arr => [0, ...arr.filter(d => Math.abs(d) < T)].sort((a, b) => Math.abs(a) - Math.abs(b));
  const hits = (dx, dy) => bs.some(b => others.some(o => b.x0 + dx < o.x1 - 1e-4 && b.x1 + dx > o.x0 + 1e-4 && b.y0 + dy < o.y1 - 1e-4 && b.y1 + dy > o.y0 + 1e-4));
  /* Kombination mit kleinster Verschiebung wählen, die keine Überlappung erzeugt; Einrasten bevorzugt */
  const pairs = []; for (const dx of list(cx)) for (const dy of list(cy)) pairs.push([dx, dy, (dx ? 0 : 0.3) + (dy ? 0 : 0.3) + Math.abs(dx) + Math.abs(dy)]);
  pairs.sort((a, b) => a[2] - b[2]);
  const ok = pairs.find(([dx, dy]) => !hits(dx, dy)) || [0, 0];
  for (const i of sel) { f.mods[i].x += ok[0]; f.mods[i].y += ok[1]; }
}
function roofHist() { const f = roofF(); RS.hist.push(JSON.stringify(f.mods)); if (RS.hist.length > 60) RS.hist.shift(); }
function roofRefreshPanel() { const p = roofP(), f = roofF(), el = $('#roof-ed .md\\:w-\\[340px\\]'); if (el) el.innerHTML = roofPanel(p, f, faceGeom(f)); }
/* Fläche mit Modulen füllen (Reihen mittig, nur wo frei) */
function roofFill(f, g) {
  const [w, h] = modWH(f, f.orient), ins = g.inset, yTop = Math.max(ins[1][1], ins[2][1]), yBot = Math.min(ins[0][1], ins[3][1]); let n = 0;
  for (let y = yTop; y + h <= yBot + 1e-6; y += h + ROOF_GAP) {
    const a = xRange(ins, y + 1e-4), b = xRange(ins, y + h - 1e-4); if (!a || !b) continue;
    const x0 = Math.max(a[0], b[0]), x1 = Math.min(a[1], b[1]), k = Math.floor((x1 - x0 + ROOF_GAP) / (w + ROOF_GAP)); if (k < 1) continue;
    const start = x0 + (x1 - x0 - (k * w + (k - 1) * ROOF_GAP)) / 2;
    for (let c = 0; c < k; c++) { const m = { x: start + c * (w + ROOF_GAP), y, o: f.orient }, bx = modBox(f, m); if (!f.mods.some(o => { const q = modBox(f, o); return bx.x0 < q.x1 && bx.x1 > q.x0 && bx.y0 < q.y1 && bx.y1 > q.y0; })) { f.mods.push(m); n++; } }
  }
  return n;
}

/* ---------- Klicks und Eingaben im Editor ---------- */
document.addEventListener('click', async e => {
  const a = e.target.closest('#roof-ed [data-r]'); if (!a || !RS) return;
  const p = roofP(), f = roofF(), g = faceGeom(f), r = a.dataset.r, v = a.dataset.v;
  if (r === 'close') return roofClose();
  if (r === 'step') { RS.step = v; if (v === 'ref' && !f.ref) { const c = f.corners, l = (A, B, t) => [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t]; f.ref = [l(c[1], c[3], 0.12), l(c[2], c[0], 0.12), l(c[3], c[1], 0.12), l(c[0], c[2], 0.12)]; } RS.sel = new Set(); roofSave(); return roofRender(); }
  if (r === 'face') { RS.fi = +v; RS.sel = new Set(); RS.hist = []; RS.warp = null; const nf = roofF(); RS.step = !nf.photo ? 'photo' : faceGeom(nf) ? 'mod' : 'corners'; return roofRender(); }
  if (r === 'face-add') { p.roof.faces.push(roofNewFace(p.roof.faces.length + 1)); RS.fi = p.roof.faces.length - 1; RS.step = 'photo'; RS.sel = new Set(); RS.hist = []; roofSave(); return roofRender(); }
  if (r === 'face-del') { if (!(await confirmDlg('Dachfläche löschen?', `„${f.name}“ mit ${f.mods.length} Modulen wird gelöscht.`))) return; p.roof.faces.splice(RS.fi, 1); RS.fi = 0; RS.sel = new Set(); roofSave(); return roofRender(); }
  if (r === 'refmode') { f.refMode = v; roofSave(); return roofRender(); }
  if (r === 'orient') { f.orient = v; roofSave(); return roofRefreshPanel(); }
  if (r === 'magnet') { RS.magnet = v === 'true'; return roofRefreshPanel(); }
  if (r === 'mode') { RS.mode = v; roofRefreshPanel(); return roofDraw(); }
  if (r === 'all') { RS.sel = new Set(f.mods.map((m, i) => i)); RS.mode = 'select'; roofRefreshPanel(); return roofDraw(); }
  if (r === 'none') { RS.sel = new Set(); roofRefreshPanel(); return roofDraw(); }
  if (r === 'del' && RS.sel.size) { roofHist(); f.mods = f.mods.filter((m, i) => !RS.sel.has(i)); RS.sel = new Set(); roofSave(); return roofRender(); }
  if (r === 'rotate' && RS.sel.size) { roofHist(); for (const i of RS.sel) { const m = f.mods[i], [w, h] = modWH(f, m.o); m.o = m.o === 'l' ? 'p' : 'l'; const [w2, h2] = modWH(f, m.o); m.x += (w - w2) / 2; m.y += (h - h2) / 2; } roofSave(); return roofDraw(); }
  if (r === 'undo' && RS.hist.length) { f.mods = JSON.parse(RS.hist.pop()); RS.sel = new Set(); roofSave(); return roofRender(); }
  if (r === 'fill' && g && !g.bad) { roofHist(); const n = roofFill(f, g); toast(n ? `${n} Module ergänzt.` : 'Kein freier Platz mehr für weitere Module.'); roofSave(); return roofRender(); }
  if (r === 'save') { p.roof.saves = p.roof.saves || []; const n = p.roof.saves.length + 1; p.roof.saves.unshift({ id: uid('rs'), name: `Stand ${n} · ${p.roof.faces.reduce((s, x) => s + x.mods.length, 0)} Module`, date: new Date().toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }), faces: clone(p.roof.faces) }); roofSave(); toast('Stand gespeichert.'); return roofRender(); }
  if (r === 'load') { const s = (p.roof.saves || []).find(x => x.id === v); if (!s) return; if (!(await confirmDlg(`„${s.name}“ laden?`, 'Der aktuelle Stand wird ersetzt – speichern Sie ihn vorher, wenn Sie ihn behalten möchten.', 'Laden', false))) return; p.roof.faces = clone(s.faces); RS.fi = 0; RS.sel = new Set(); RS.hist = []; RS.warp = null; RS.step = faceGeom(p.roof.faces[0]) ? 'mod' : 'corners'; roofSave(); return roofRender(); }
  if (r === 'save-del') { p.roof.saves = p.roof.saves.filter(x => x.id !== v); roofSave(); return roofRender(); }
  if (r === 'apply') return roofApply(p);
});
document.addEventListener('change', async e => {
  const el = e.target; if (!RS || !el.closest || !el.closest('#roof-ed')) return;
  const f = roofF();
  if (el.dataset.r === 'photo' && el.files && el.files[0]) { toast('Foto wird vorbereitet …'); const ph = await roofPhoto(el.files[0]); Object.assign(f, { photo: ph.id, iw: ph.w, ih: ph.h, ref: null, mods: [] }); RS.warp = null; RS.step = 'corners'; roofSave(); return roofRender(); }
  if (el.dataset.r === 'multi') { RS.multi = el.checked; return; }
  if (el.dataset.rf === 'tileId' || el.dataset.rf === 'prodId') { f[el.dataset.rf] = el.value; roofSave(); return roofRender(); }
});
document.addEventListener('input', e => {
  const el = e.target; if (!RS || !el.closest || !el.closest('#roof-ed')) return;
  const f = roofF();
  if (el.dataset.rf === 'name') { f.name = el.value; roofSave(); return; }
  if (el.dataset.rf && el.tagName === 'INPUT') { const v = pnum(el.value); f[el.dataset.rf] = isFinite(v) ? v : null; }
  if (el.dataset.rt) { const t = roofTiles().find(x => x.id === f.tileId); const v = pnum(el.value); if (t && isFinite(v) && v > 0) { t[el.dataset.rt] = v; saveSettings(); } }
  roofSave(); const d = $('#roof-dims'); if (d) d.innerHTML = roofDims(faceGeom(f));
  const ok = !!(faceGeom(f) && !faceGeom(f).bad), btn = $('#roof-ed [data-r="step"][data-v="mod"].btn-p'); if (btn) btn.disabled = !ok;
  const chip = $('#roof-ed .chip[data-r="step"][data-v="mod"]'); if (chip) chip.classList.toggle('opacity-40', !ok), chip.classList.toggle('pointer-events-none', !ok);
  roofDraw();
});
document.addEventListener('keydown', e => {
  if (!RS || RS.step !== 'mod' || /INPUT|SELECT|TEXTAREA/.test((document.activeElement || {}).tagName || '')) return;
  const click = r => { const b = $(`#roof-ed [data-r="${r}"]`); if (b && !b.disabled) b.click(); };
  if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); click('del'); }
  else if (e.key === 'r' || e.key === 'R') click('rotate');
  else if ((e.ctrlKey || e.metaKey) && e.key === 'a') { e.preventDefault(); click('all'); }
  else if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); click('undo'); }
  else if (e.key === 'Escape') click('none');
});

/* Ergebnis in die Berechnung übernehmen: kWp, Modulzeile, Komponenten */
function roofApply(p) {
  const by = {}; let n = 0, kwp = 0;
  for (const f of p.roof.faces) { const pr = roofProd(f); n += f.mods.length; kwp += faceKwp(f); if (pr.id) by[pr.id] = (by[pr.id] || 0) + f.mods.length; }
  if (!n) return;
  p.pv.kwp = Math.round(kwp * 1000) / 1000;
  const pr0 = roofProd(p.roof.faces.find(f => f.mods.length) || p.roof.faces[0]);
  p.pv.modules = `${n} × ${num(pr0.power)} W`;
  if (Object.keys(by).length) {
    p.components = (p.components || []).filter(c => { const x = PRODUCTS.find(y => y.id === c.id); return !x || x.cat !== 'mod'; }).concat(Object.entries(by).map(([id, qty]) => ({ id, qty })));
    try { applyComponents(p); } catch (e) {}
    p.pv.kwp = Math.round(kwp * 1000) / 1000; p.pv.modules = `${n} × ${num(pr0.power)} W`;
  }
  p.roof.applied = { n, kwp: p.pv.kwp, date: isoToday() };
  saveProject(p); toast(`Übernommen: ${n} Module · ${num(kwp, 2)} kWp.`); roofClose();
}

/* ---------- Einbindung: Neue Berechnung, PV-Karte, Produkte ---------- */
function roofStartDialog() {
  modal(`<h3 class="text-[21px] font-semibold pr-8">Modulplan erstellen</h3><p class="text-ink3 text-[14px] mt-1 mb-5">Wofür ist die Berechnung?</p>
  <div class="grid sm:grid-cols-2 gap-3"><button class="card !shadow-none p-4 text-left hover:ring-2 hover:ring-p" data-a="roof-new" data-type="pv"><div class="text-p">${ic('sun', 24)}</div><div class="font-semibold mt-2">Photovoltaik</div></button>
  <button class="card !shadow-none p-4 text-left hover:ring-2 hover:ring-p" data-a="roof-new" data-type="pvwp"><div class="text-p flex">${ic('sun', 22)}${ic('fan', 22)}</div><div class="font-semibold mt-2">PV + Wärmepumpe</div></button></div>`);
}
function roofCard(p) {
  const r = p.roof, n = r ? r.faces.reduce((s, f) => s + f.mods.length, 0) : 0, kwp = r ? r.faces.reduce((s, f) => s + faceKwp(f), 0) : 0;
  return `<div class="mb-4 rounded-[calc(var(--r)-4px)] border ${n ? 'border-p/30' : 'border-dashed border-line2'} p-3 flex flex-wrap items-center gap-3" style="${n ? 'background:rgb(var(--p-rgb)/.06)' : ''}">
    <div class="w-10 h-10 rounded-xl bg-raised grid place-items-center text-p shrink-0">${ic('grid', 20)}</div>
    <div class="flex-1 min-w-[180px] text-[13px]">${n ? `<b class="text-[14px]">Modulplan: ${n} Module · ${num(kwp, 2)} kWp</b><div class="text-ink3">${r.faces.length} Dachfläche${r.faces.length > 1 ? 'n' : ''}${r.saves && r.saves.length ? ` · ${r.saves.length} gespeicherte Stände` : ''}</div>` : `<b class="text-[14px]">Modulplan</b><div class="text-ink3">Dach per Foto aufmessen und Module belegen.</div>`}</div>
    ${roofOk() ? `<button class="btn-s !h-9 !px-3 text-[13px]" data-a="roof-open" data-id="${p.id}">${ic(n ? 'eye' : 'plus', 15)}${n ? 'Öffnen' : 'Modulplan erstellen'}</button>` : '<span class="text-[12px] text-ink3">Bearbeiten am iPad oder PC</span>'}</div>`;
}
document.addEventListener('click', async e => {
  const a = e.target.closest('[data-a^="roof-"]'); if (!a) return;
  if (a.dataset.a === 'roof-start') { roofStartDialog(); }
  else if (a.dataset.a === 'roof-open') { roofOpen(a.dataset.id); }
  else if (a.dataset.a === 'roof-new') { const np = newProject(a.dataset.type); PROJECTS.push(np); await DB.put('projects', clone(np)); closeModal(); go(`projekt/${np.id}/1`); setTimeout(() => roofOpen(np.id), 250); }
});
/* PV-Module brauchen Länge und Breite für den Modulplan */
{
  const _pm = productModal;
  productModal = function (id) {
    _pm(id); const pr = PRODUCTS.find(x => x.id === id); if (!pr || pr.cat !== 'mod') return;
    const grid = $('#modal .grid.sm\\:grid-cols-2'); if (!grid) return;
    grid.insertAdjacentHTML('beforeend', field('Länge (Modul)', `x:${id}:len`, { t: 'n', unit: 'mm', ph: 'z. B. 1722', hint: 'Für den Modulplan' }) + field('Breite (Modul)', `x:${id}:wid`, { t: 'n', unit: 'mm', ph: 'z. B. 1134' })
      + `<div class="sm:col-span-2"><span class="lbl">Bild für den Modulplan</span><div class="flex items-center gap-3">${fileUrl(pr.planImg) ? `<img src="${esc(fileUrl(pr.planImg))}" class="h-20 rounded-lg border border-line bg-card" style="aspect-ratio:${(+pr.wid || 1134)}/${(+pr.len || 1722)}">` : `<div class="w-14 h-20 rounded-lg bg-bg grid place-items-center text-ink4">${ic('image', 22)}</div>`}
        <div><div class="flex flex-wrap gap-2"><label class="btn-s btn-sm cursor-pointer">${ic('upload', 15)}${pr.planImg ? 'Ersetzen' : 'Bild wählen'}<input type="file" accept="image/*" class="hidden" data-planimg="${id}"></label>${pr.planImg ? `<button class="btn-g btn-sm" data-a="planimg-del" data-id="${id}">${ic('trash', 15)}Entfernen</button>` : ''}</div>
        <div class="hint">Draufsicht des Moduls, hochkant – wird nur im Modulplan verwendet (nicht im PDF-Produktbild).</div></div></div></div>`);
    if (pr.planImg && !fileUrl(pr.planImg)) loadFiles([pr.planImg]).then(() => { if ($('#modal [data-planimg]')) productModal(id); });
  };
  const _ps = prodSpecs;
  prodSpecs = function (pr) { const o = _ps(pr); if (pr.cat === 'mod' && +pr.len > 0 && +pr.wid > 0) o.push(['Maße', `${num(pr.len)} × ${num(pr.wid)} mm`]); return o; };
}
/* Projekt öffnen: Dachfotos mitladen */
window.addEventListener('resize', () => { if (RS) roofDraw(); });

/* Belegungsbild hochladen / entfernen */
document.addEventListener('change', async e => {
  const el = e.target; if (!el.dataset || !el.dataset.planimg || !el.files || !el.files[0]) return;
  const id = el.dataset.planimg, pr = PRODUCTS.find(x => x.id === id); if (!pr) return;
  try { const blob = await imageKeepAlpha(el.files[0], 600); if (pr.planImg) { await delFiles([pr.planImg]); delete RIMG[pr.planImg]; } pr.planImg = await putFile(blob, 'modulplan.png'); saveProducts(); productModal(id); toast('Bild für den Modulplan gespeichert.'); }
  catch (err) { toast('Bild konnte nicht gelesen werden.', 'err'); }
});
document.addEventListener('click', async e => {
  const a = e.target.closest('[data-a="planimg-del"]'); if (!a) return;
  const pr = PRODUCTS.find(x => x.id === a.dataset.id); if (!pr || !pr.planImg) return;
  await delFiles([pr.planImg]); delete RIMG[pr.planImg]; pr.planImg = ''; saveProducts(); productModal(pr.id);
});
