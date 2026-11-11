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
const roofOk = () => true;   // auch auf dem Handy (eigene Ansicht in 19-roofm.js)
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
  const fromImg = (x, y) => { const [u, v] = hApply(Hi, x, y); return [u * rw - ox, v * rh - oy]; };
  const m = [(+f.mSide || 0) / 100, (+f.mTop || 0) / 100, (+f.mSide || 0) / 100, (+f.mBot || 0) / 100];   // Kanten: li, First, re, Rinne
  return { poly, W, H: Hh, toImg, fromImg, inset: insetPoly(poly, m), eave: Math.hypot(poly[3][0] - poly[0][0], poly[3][1] - poly[0][1]), ridge: Math.hypot(poly[2][0] - poly[1][0], poly[2][1] - poly[1][1]), slope: Math.hypot(poly[1][0] - poly[0][0], poly[1][1] - poly[0][1]) };
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
  if (!p.roof.modAsked) { const g = roofGuessProd(p); if (g) p.roof.faces.forEach(f => { if (!f.mods.length) f.prodId = g; }); }
  RS = { pid, fi: 0, step: p.roof.faces[0].photo ? (faceGeom(p.roof.faces[0]) ? 'mod' : 'corners') : 'photo', zm: { z: 1, x: 0, y: 0 }, ptrs: new Map(), pinch: null, mode: 'add', look: PERSONAL.roofLook || 'flat', multi: false, magnet: true, sel: new Set(), hist: [], drag: null };
  document.body.insertAdjacentHTML('beforeend', '<div id="roof-ed" class="fixed inset-0 z-[75] bg-bg flex flex-col" style="height:100dvh"></div>');
  /* Seite fixieren – verhindert auf dem iPad versetzte Tipp-Positionen nach der Tastatur */
  /* Hintergrund nur am Scrollen hindern – KEIN position:fixed am body: nach der Tastatur lägen Tipps auf dem iPad sonst daneben */
  RS.scrollY = window.scrollY; document.documentElement.style.overflow = 'hidden'; document.body.style.overflow = 'hidden';
  roofRender();
}
const roofNewFace = n => ({ id: uid('rf'), name: n === 1 ? 'Hauptdach' : `Dachfläche ${n}`, photo: '', iw: 0, ih: 0, corners: [[0.2, 0.8], [0.35, 0.35], [0.65, 0.35], [0.8, 0.8]], ref: null, refMode: 'tiles', tileId: 'frankfurter', nx: null, ny: null, lw: null, lh: null, mTop: 30, mBot: 30, mSide: 30, prodId: (roofMods()[0] || {}).id || '', orient: 'p', mods: [] });
function roofClose() { const e = $('#roof-ed'); if (e) e.remove(); document.documentElement.style.overflow = ''; const y = RS ? RS.scrollY || 0 : 0; document.body.style.overflow = ''; RS = null; render(); window.scrollTo(0, y); }
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
      <div id="roof-tip" class="absolute left-3 bottom-3 right-36 text-[12px] text-white/80 pointer-events-none"></div>
      <div id="roof-badge" class="absolute left-1/2 -translate-x-1/2 top-3 pointer-events-none hidden rounded-full px-4 py-2 text-[13.5px] font-semibold text-white shadow-lg" style="background:rgba(12,20,28,.82);backdrop-filter:blur(6px)"></div>
      <div id="roof-pad" class="absolute left-3 bottom-9 hidden flex-col items-center gap-1 select-none"><div class="relative w-[96px] h-[96px] rounded-full border-2 border-white/70 bg-black/45 backdrop-blur-sm touch-none" id="roof-pad-ring" title="Feinjustieren"><div id="roof-pad-knob" class="absolute w-9 h-9 rounded-full bg-white/90 shadow" style="left:30px;top:30px"></div><span class="absolute inset-0 grid place-items-center text-[10px] text-white/70 pointer-events-none" style="padding-top:62px">fein</span></div><div class="text-[11px] text-white/80" id="roof-pad-lbl"></div></div>
      <div class="absolute right-3 bottom-3 flex gap-1.5"><button class="btn-s !h-9 !w-9 !px-0 text-[18px]" data-r="zoom" data-v="out" title="Verkleinern">−</button><button class="btn-s !h-9 !w-9 !px-0 text-[18px]" data-r="zoom" data-v="in" title="Vergrößern">+</button><button class="btn-s !h-9 !px-2.5 text-[12px]" data-r="zoom" data-v="fit">Einpassen</button></div></div>
    <div id="roof-panel" class="md:w-[340px] shrink-0 border-t md:border-t-0 md:border-l border-line overflow-y-auto max-h-[42vh] md:max-h-none p-4 space-y-4">${roofPanel(p, f, g)}</div>
  </div>
  <div id="roof-foot">${roofFoot(p, f)}</div>
  </div>`;
  roofBindStage(); roofDraw();
}
function roofFoot(p, f) {
  const tot = p.roof.faces.reduce((a, x) => [a[0] + x.mods.length, a[1] + faceKwp(x)], [0, 0]);
  return `<div class="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 border-t border-line text-[14px]" style="padding-bottom:max(10px,env(safe-area-inset-bottom))">
    ${RS.step !== 'photo' ? `<button class="btn-s !h-10 !px-3 text-[13px]" data-r="prev">${ic('arrowL', 15)}Zurück</button>` : ''}
    <span><span class="text-ink3">${esc(f.name)}:</span> <b>${f.mods.length} Module</b> · <b>${num(faceKwp(f), 2)} kWp</b></span>${(() => { const ns = (p.roof.strings || []).filter(s => s.mods.length).length, no = p.roof.faces.reduce((a, o) => a + o.mods.filter(m => m.opt).length, 0); return ns || no ? `<span class="text-ink3">${ns ? `${ns} String${ns > 1 ? 's' : ''}` : ''}${ns && no ? ' · ' : ''}${no ? `${no} Optimierer` : ''}</span>` : ''; })()}
    ${p.roof.faces.length > 1 ? `<span><span class="text-ink3">Gesamt:</span> <b class="text-p">${tot[0]} Module · ${num(tot[1], 2)} kWp</b></span>` : ''}
    ${RS.step === 'mod' && roofMods().length ? `<select class="inp appearance-none !h-10 !w-auto !py-0 text-[13px] max-w-[240px]" data-rf="prodId" title="PV-Modul">${roofMods().map(x => `<option value="${x.id}" ${x.id === roofProd(f).id ? 'selected' : ''}>${esc(x.name)} · ${num(x.power)} Wp</option>`).join('')}</select>` : ''}
    ${RS.step === 'mod' ? `<span class="flex gap-1.5"><button class="btn-s !h-10 !px-3 text-[13px]" data-r="copy" ${RS.sel.size ? '' : 'disabled'}>${ic('copy', 15)}Kopieren</button><button class="btn-s !h-10 !px-3 text-[13px]" data-r="paste" ${RS.clip && RS.clip.length ? '' : 'disabled'}>${ic('plus', 15)}Einfügen</button></span>` : ''}
    <span id="roof-warn" class="text-[13px]"></span>
    ${RS.step === 'mod' ? `<button class="btn-p !h-10 !px-4 text-[13px] ml-auto" data-r="apply" ${tot[0] ? '' : 'disabled'}>${ic('check', 15)}In Berechnung übernehmen</button>`
      : `<button class="btn-p !h-10 !px-5 text-[14px] ml-auto" data-r="next">${{ photo: 'Weiter: Dachfläche', corners: 'Weiter: Referenz', ref: 'Weiter: Module belegen' }[RS.step]} ${ic('arrowR', 16)}</button>`}`;
}
function roofPanel(p, f, g) {
  const faces = `<div><span class="lbl">Dachflächen</span><div class="flex flex-wrap gap-1.5">${p.roof.faces.map((x, i) => `<button class="chip ${i === RS.fi ? '!border-p !text-ink !bg-p/10' : ''}" data-r="face" data-v="${i}">${esc(x.name)} · ${x.mods.length}</button>`).join('')}<button class="chip" data-r="face-add" title="Weitere Fläche im selben Foto einzeichnen">${ic('plus', 14)}Fläche</button><button class="chip" data-r="face-add-photo" title="Andere Ausrichtung – mit neuem Foto">${ic('image', 14)}Neues Foto</button></div>
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
      <p class="hint" style="color:#C7792F">Kontrolle: Das gelbe Raster muss genau auf den Pfannenkanten liegen. Wenn nicht – Ecken oder Anzahl korrigieren. Tipp: Foto nicht mit 0,5×-Weitwinkel aufnehmen.</p>
      <div class="grid grid-cols-2 gap-2 mt-2"><label><span class="lbl flex items-center justify-between">Pfannen waagerecht<span class="flex gap-1"><button type="button" class="chip !h-6 !px-2 text-[11px]" data-r="nxdiv">÷2</button><button type="button" class="chip !h-6 !px-2 text-[11px]" data-r="nxmul">×2</button></span></span>${roofIn('nx', 'Stk')}</label><label><span class="lbl">Reihen senkrecht</span>${roofIn('ny', 'Stk')}</label></div>
      <button class="btn-s w-full mt-2" data-r="autocount">${ic('sparkle', 16)}Automatisch zählen und scannen</button>
      ${+f.nx > 1 ? `<div class="mt-2 rounded-[calc(var(--r)-4px)] bg-raised p-3"><div class="text-[13px] font-semibold">Passt das Raster auf die Pfannen?</div><div class="text-[12px] text-ink3 mt-0.5">Sonst andere Anzahl antippen – das Raster rastet neu auf die Kanten ein.</div>
        <div class="flex flex-wrap gap-1.5 mt-2">${roofCands(+f.scanN || +f.nx).map(n => `<button type="button" class="chip !h-8 !px-3 text-[13px] ${n === Math.round(+f.nx) ? '!border-p !text-ink font-semibold' : ''}" data-r="ncand" data-v="${n}">${n} Pfannen</button>`).join('')}</div>
        <div class="grid grid-cols-2 gap-2 mt-2">${[['nx', 'Pfannen'], ['ny', 'Reihen']].map(([k, l]) => `<div class="flex items-center gap-1"><button type="button" class="chip !h-8 !w-9 !px-0 justify-center" data-r="nstep" data-k="${k}" data-d="-1">−1</button><span class="flex-1 text-center text-[13px]">${l}</span><button type="button" class="chip !h-8 !w-9 !px-0 justify-center" data-r="nstep" data-k="${k}" data-d="1">+1</button></div>`).join('')}</div></div>` : ''}
      <button class="btn-g w-full mt-1" data-r="numtiles">${ic('grid', 16)}${RS.num ? 'Nummern ausblenden' : 'Pfannen nummerieren (Kontrolle)'}</button>
      <p class="hint">Jedes gelbe Kästchen muss <b>genau eine</b> Pfanne sein. Liegen zwei Pfannen in einem Kästchen, ist die Anzahl zu klein (doppelte Zahl eintragen).</p>`}
      <div class="mt-3"><span class="lbl">Randabstände</span><div class="grid grid-cols-3 gap-2"><label><span class="text-[11px] text-ink3">First</span>${roofIn('mTop', 'cm')}</label><label><span class="text-[11px] text-ink3">Rinne</span>${roofIn('mBot', 'cm')}</label><label><span class="text-[11px] text-ink3">Seiten</span>${roofIn('mSide', 'cm')}</label></div></div>
      <div id="roof-dims" class="mt-3 rounded-[calc(var(--r)-4px)] bg-raised p-3 text-[13px]">${roofDims(g)}</div>
      <button class="btn-p w-full mt-3" data-r="next">Weiter: Module belegen ${ic('arrowR', 16)}</button></div>`;
  } else {
    const mods = roofMods(), pr = roofProd(f);
    body = `<div><span class="lbl">PV-Modul</span>${mods.length ? `<select class="inp appearance-none" data-rf="prodId">${mods.map(x => `<option value="${x.id}" ${x.id === pr.id ? 'selected' : ''}>${esc(x.name)} · ${num(x.power)} Wp</option>`).join('')}</select><div class="hint">${num(pr.len)} × ${num(pr.wid)} mm</div>` : `<div class="text-[13px] rounded-lg p-3" style="background:rgba(229,154,92,.14)">Noch kein PV-Modul mit Maßen unter „Produkte“. Bis dahin: Standardmodul 1722 × 1134 mm, 430 Wp. Legen Sie Ihre Module mit Länge und Breite an.</div>`}</div>
      <div><span class="lbl">Ansicht</span><div class="seg w-full">${[['flat', 'Entzerrt'], ['photo', 'Wie auf dem Foto']].map(([k, l]) => `<button class="flex-1 ${(RS.look || 'flat') === k ? 'on' : ''}" data-r="look" data-v="${k}">${l}</button>`).join('')}</div></div>
      <div class="grid grid-cols-2 gap-2"><div><span class="lbl">Ausrichtung</span><div class="seg">${[['p', 'Hochkant'], ['l', 'Quer']].map(([k, l]) => `<button class="${f.orient === k ? 'on' : ''}" data-r="orient" data-v="${k}">${l}</button>`).join('')}</div></div>
        <div><span class="lbl">Magnet</span><div class="seg">${[[true, 'An'], [false, 'Aus']].map(([k, l]) => `<button class="${RS.magnet === k ? 'on' : ''}" data-r="magnet" data-v="${k}">${l}</button>`).join('')}</div></div></div>
      <div><span class="lbl">Werkzeug</span><div class="seg w-full">${[['add', 'Setzen', 'plus'], ['select', 'Auswählen', 'grid'], ['string', 'Strings', 'bolt'], ['opt', 'Optimierer', 'sparkle']].map(([k, l, i]) => `<button class="flex-1 !px-1 !h-auto py-1.5 flex-col gap-0.5 text-[12px] ${RS.mode === k ? 'on' : ''}" data-r="mode" data-v="${k}">${ic(i, 16)}${l}</button>`).join('')}</div>${RS.mode === 'string' ? roofStrPanel(roofP()) : RS.mode === 'opt' ? roofOptPanel(roofP(), f) : ''}
        <div class="mt-2 flex gap-2 items-start rounded-lg px-3 py-2 text-[13px] leading-snug" style="background:rgb(var(--p-rgb)/.10)"><span class="text-p shrink-0 mt-[1px]">${ic('info', 15)}</span><span>${ROOF_HOW[RS.mode] || ''}</span></div>
        ${RS.mode === 'select' ? `<label class="flex items-center gap-2 mt-2 text-[13px]"><input type="checkbox" data-r="multi" ${RS.multi ? 'checked' : ''}> Mehrfachauswahl (Antippen fügt hinzu)</label>` : ''}</div>
      ${RS.mode === 'string' || RS.mode === 'opt' ? '' : `<div class="grid grid-cols-2 gap-2">
        <button class="btn-s !h-10 text-[13px]" data-r="fill">${ic('grid', 15)}Fläche füllen</button><button class="btn-s !h-10 text-[13px]" data-r="all">Alle auswählen</button>
        <button class="btn-s !h-10 text-[13px]" data-r="rotate" ${RS.sel.size ? '' : 'disabled'}>${ic('refresh', 15)}Drehen</button><button class="btn-s !h-10 text-[13px]" data-r="del" ${RS.sel.size ? '' : 'disabled'}>${ic('trash', 15)}Löschen${RS.sel.size ? ` (${RS.sel.size})` : ''}</button>
        <button class="btn-s !h-10 text-[13px]" data-r="copy" ${RS.sel.size ? '' : 'disabled'}>${ic('copy', 15)}Kopieren</button><button class="btn-s !h-10 text-[13px]" data-r="paste" ${RS.clip && RS.clip.length ? '' : 'disabled'}>${ic('plus', 15)}Einfügen${RS.clip && RS.clip.length ? ` (${RS.clip.length})` : ''}</button>
        <button class="btn-g !h-10 text-[13px]" data-r="undo" ${RS.hist.length ? '' : 'disabled'}>${ic('arrowL', 15)}Rückgängig</button><button class="btn-g !h-10 text-[13px]" data-r="none" ${RS.sel.size ? '' : 'disabled'}>Auswahl aufheben</button>
      </div>
      <p class="hint">Am PC: Entf löscht, R dreht, Strg+A wählt alle.</p>`}
      <div><span class="lbl">Randabstände</span><div class="grid grid-cols-3 gap-2"><label><span class="text-[11px] text-ink3">First</span>${roofIn('mTop', 'cm')}</label><label><span class="text-[11px] text-ink3">Rinne</span>${roofIn('mBot', 'cm')}</label><label><span class="text-[11px] text-ink3">Seiten</span>${roofIn('mSide', 'cm')}</label></div></div>
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
/* Umrechnung Ebene (Meter) ↔ Bildschirm – je nach Ansicht linear oder perspektivisch */
function roofP2S(V, g, X, Y) { if (V.kind === 'plane') return [V.ox + X * V.s, V.oy + Y * V.s]; const [ix, iy] = g.toImg(X, Y); return [V.ox + ix * V.k, V.oy + iy * V.k]; }
function roofS2P(V, g, sx, sy) { if (V.kind === 'plane') return [(sx - V.ox) / V.s, (sy - V.oy) / V.s]; return g.fromImg((sx - V.ox) / V.k, (sy - V.oy) / V.k); }
function roofView(cv, f, g, img) {
  const V = roofView0(cv, f, g, img); if (!V) return V;
  const z = (RS.zm && RS.zm.z) || 1, zx = (RS.zm && RS.zm.x) || 0, zy = (RS.zm && RS.zm.y) || 0, cw = cv.clientWidth, ch = cv.clientHeight;
  if (V.kind === 'plane') V.s *= z; else V.k *= z;
  V.ox = cw / 2 + (V.ox - cw / 2) * z + zx; V.oy = ch / 2 + (V.oy - ch / 2) * z + zy; return V;
}
function roofView0(cv, f, g, img) {
  const cw = cv.clientWidth, ch = cv.clientHeight, pad = 24;
  if (RS.step === 'mod' && g && !g.bad && !(RS.look === 'photo' && img)) { const s = Math.min((cw - 2 * pad) / g.W, (ch - 2 * pad) / g.H); return { kind: 'plane', s, ox: (cw - g.W * s) / 2, oy: (ch - g.H * s) / 2 }; }
  if (RS.step === 'mod' && g && !g.bad && img) {                 // auf das Dach zoomen (mit Rand)
    const xs = f.corners.map(c => c[0] * f.iw), ys = f.corners.map(c => c[1] * f.ih), bw = Math.max(...xs) - Math.min(...xs), bh = Math.max(...ys) - Math.min(...ys);
    const x0 = Math.max(0, Math.min(...xs) - bw * 0.15), x1 = Math.min(f.iw, Math.max(...xs) + bw * 0.15), y0 = Math.max(0, Math.min(...ys) - bh * 0.25), y1 = Math.min(f.ih, Math.max(...ys) + bh * 0.2);
    const k = Math.min((cw - 2 * pad) / (x1 - x0), (ch - 2 * pad) / (y1 - y0));
    return { kind: 'photo', k, ox: (cw - (x1 - x0) * k) / 2 - x0 * k, oy: (ch - (y1 - y0) * k) / 2 - y0 * k };
  }
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
  const pad = $('#roof-pad'); if (pad) { const on = !!(V && V.kind === 'img' && RS.act && f[RS.act[0]]); pad.classList.toggle('hidden', !on); pad.classList.toggle('flex', on); const lb = $('#roof-pad-lbl'); if (lb && on) lb.textContent = RS.act[0] === 'ref' ? 'Referenz-Ecke' : `Punkt ${RS.act[1] + 1}`; }
  if (!V) { if (tip) tip.textContent = 'Bitte zuerst ein Foto wählen.'; return; }
  const pc = getComputedStyle(document.documentElement).getPropertyValue('--p-rgb').trim().split(/\s+/).join(','), P = `rgb(${pc})`;
  if (V.kind === 'img') {
    x.drawImage(img, V.ox, V.oy, f.iw * V.k, f.ih * V.k);
    const S = ([u, v]) => [V.ox + u * f.iw * V.k, V.oy + v * f.ih * V.k];
    const quad = (q, col, dash, labels) => { x.save(); x.setLineDash(dash || []); x.lineWidth = 2.5; x.strokeStyle = col; x.fillStyle = col.replace('rgb', 'rgba').replace(')', ',.14)'); x.beginPath(); q.map(S).forEach((p, i) => (i ? x.lineTo(...p) : x.moveTo(...p))); x.closePath(); x.fill(); x.stroke(); x.restore();
      q.map(S).forEach((p, i) => { x.beginPath(); x.arc(p[0], p[1], 13, 0, 7); x.fillStyle = col; x.fill(); x.strokeStyle = '#fff'; x.lineWidth = 2; x.stroke(); x.fillStyle = '#fff'; x.font = '600 12px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(labels[i], p[0], p[1] + 0.5); }); };
    roofOthers(x, f, ([u, v]) => [V.ox + u * f.iw * V.k, V.oy + v * f.ih * V.k], 1);
    if (RS.step === 'ref' || RS.step === 'corners') quad(f.corners, P, RS.step === 'ref' ? [6, 4] : null, ['1', '2', '3', '4']);
    if (RS.step === 'ref' && f.ref) {
      /* Kontrollraster: so viele Linien wie gezählte Pfannen/Reihen – müssen auf den echten Pfannenkanten liegen */
      const nx = f.refMode === 'len' ? 0 : Math.min(80, Math.round(+f.nx || 0)), ny = f.refMode === 'len' ? 0 : Math.min(60, Math.round(+f.ny || 0));
      if (nx > 1 || ny > 1) {
        const Hq = sqToQuad(f.ref.map(([u, v]) => [V.ox + u * f.iw * V.k, V.oy + v * f.ih * V.k])), [LX, LY] = roofGridLines(f, nx, ny);
        x.save(); x.strokeStyle = 'rgba(255,240,140,.85)'; x.lineWidth = 1; x.beginPath();
        for (const u of LX) if (u > 0.002 && u < 0.998) { x.moveTo(...hApply(Hq, u, 0)); x.lineTo(...hApply(Hq, u, 1)); }
        for (const v of LY) if (v > 0.002 && v < 0.998) { x.moveTo(...hApply(Hq, 0, v)); x.lineTo(...hApply(Hq, 1, v)); }
        x.stroke(); x.restore();
        if (RS.num) roofNumbers(x, Hq, LX, LY);
      }
      if (!(RS.num && performance.now() - RS.num.t0 < 2650 && !matchMedia('(prefers-reduced-motion: reduce)').matches)) quad(f.ref, 'rgb(229,154,92)', [8, 5], ['↖', '↗', '↘', '↙']);
    }
    if (RS.act) { const q = f[RS.act[0]]; if (q && q[RS.act[1]]) { const [a, b] = S(q[RS.act[1]]); x.beginPath(); x.arc(a, b, 19, 0, 7); x.strokeStyle = '#fff'; x.lineWidth = 2.5; x.setLineDash([4, 3]); x.stroke(); x.setLineDash([]); } }
    if (RS.drag && RS.drag.loupe) roofLoupe(x, img, S(RS.drag.loupe), f, V, cw);
    else if (RS.fine && RS.act) roofLoupe(x, img, S(f[RS.act[0]][RS.act[1]]), f, V, cw);
    if (tip) tip.textContent = (RS.step === 'corners' ? 'Punkte 1–4 auf die Ecken ziehen.' : 'Oranges Rechteck auf Pfannenkanten legen – möglichst groß.') + ' Zoomen: zwei Finger bzw. Mausrad; Bild verschieben: daneben ziehen.';
    return;
  }
  /* Belegen: entzerrt (Meter) oder perspektivisch auf dem Foto */
  const M = (a, b) => roofP2S(V, g, a, b);
  if (V.kind === 'plane') { if (img) { const w = roofWarp(f, g, img); x.drawImage(w, V.ox, V.oy, g.W * V.s, g.H * V.s); } }
  else x.drawImage(img, V.ox, V.oy, f.iw * V.k, f.ih * V.k);
  x.save(); x.beginPath(); x.rect(0, 0, cw, ch); g.poly.map(p => M(...p)).forEach((p, i) => (i ? x.lineTo(...p) : x.moveTo(...p))); x.closePath(); x.fillStyle = V.kind === 'plane' ? 'rgba(8,10,14,.72)' : 'rgba(8,10,14,.12)'; x.fill('evenodd'); x.restore();
  const path = (q, col, w, dash) => { x.save(); x.setLineDash(dash || []); x.strokeStyle = col; x.lineWidth = w; x.beginPath(); q.map(p => M(...p)).forEach((p, i) => (i ? x.lineTo(...p) : x.moveTo(...p))); x.closePath(); x.stroke(); x.restore(); };
  if (V.kind === 'plane') { path(g.poly, '#fff', 2); path(g.inset, 'rgba(255,214,120,.9)', 1.5, [6, 5]); } else { path(g.poly, 'rgba(255,255,255,.55)', 1); path(g.inset, 'rgba(255,214,120,.55)', 1, [5, 5]); }
  if (V.kind === 'photo') roofOthers(x, f, ([u, v]) => [V.ox + u * f.iw * V.k, V.oy + v * f.ih * V.k], V.k);
  let warn = [0, 0]; const pr = roofProd(f), pimg = pr.planImg ? await roofPlanImg(pr.planImg) : null;
  const L = (A, B, t) => [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t];
  f.mods.forEach((m, i) => {
    const b = modBox(f, m), st = modState(f, g, m, i), q = [[b.x0, b.y0], [b.x1, b.y0], [b.x1, b.y1], [b.x0, b.y1]].map(p => M(...p));
    if (st === 'over') warn[0]++; else if (st !== 'ok') warn[1]++;
    const poly = () => { x.beginPath(); q.forEach((p, j) => (j ? x.lineTo(...p) : x.moveTo(...p))); x.closePath(); };
    /* Modul: Bild bzw. Zellen exakt perspektivisch (zwei Dreiecke), dunkler Rahmen, leichter Glanz */
    const src = pimg || roofCellImg(), iw2 = src.width, ih2 = src.height;
    const c = m.o === 'l' ? [q[1], q[2], q[3], q[0]] : q;            // Bildecken oben li, oben re, unten re, unten li
    roofTri(x, src, [[0, 0], [iw2, 0], [iw2, ih2]], [c[0], c[1], c[2]]); roofTri(x, src, [[0, 0], [iw2, ih2], [0, ih2]], [c[0], c[2], c[3]]);
    const gl = x.createLinearGradient(...q[0], ...q[2]); gl.addColorStop(0, 'rgba(255,255,255,.10)'); gl.addColorStop(0.5, 'rgba(255,255,255,0)'); gl.addColorStop(1, 'rgba(255,255,255,.03)');
    x.fillStyle = gl; poly(); x.fill();
    if (st === 'over') { x.fillStyle = 'rgba(229,72,77,.55)'; poly(); x.fill(); }
    roofFrame(x, q);
    if (RS.sel.has(i)) { x.strokeStyle = P; x.lineWidth = 3; poly(); x.stroke(); }
  });
  { const p = roofP(), map = V.kind === 'photo' ? roofImgMap(f, (ix, iy) => [V.ox + ix * V.k, V.oy + iy * V.k]) : (o, X, Y) => (o === f ? M(X, Y) : null); roofStrLayer(x, p, map, roofStrSize(f, map), true); }
  if (RS.drag && RS.drag.lasso) { const [a, b, c, d] = RS.drag.lasso; x.save(); x.setLineDash([5, 4]); x.strokeStyle = P; x.fillStyle = `rgba(${pc},.12)`; x.lineWidth = 1.5; x.fillRect(Math.min(a, c), Math.min(b, d), Math.abs(c - a), Math.abs(d - b)); x.strokeRect(Math.min(a, c), Math.min(b, d), Math.abs(c - a), Math.abs(d - b)); x.restore(); }
  const wEl = $('#roof-warn'); if (wEl) wEl.innerHTML = [warn[0] ? `<span style="color:#E5484D">${warn[0]} überlappen</span>` : ''].filter(Boolean).join(' · ');
  if (tip) tip.textContent = (RS.mode === 'add' ? 'Doppelt tippen bzw. doppelklicken, um ein Modul zu setzen.' : RS.mode === 'string' ? 'Module der Reihe nach antippen – der String läuft vom ersten zum nächsten Modul.' : RS.mode === 'opt' ? 'Module antippen, um einen Optimierer zu setzen oder zu entfernen.' : 'Module antippen oder Rahmen ziehen – dann verschieben.') + ' Zoomen: zwei Finger bzw. Mausrad; verschieben: zwei Finger bzw. Leertaste + ziehen.';
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
function roofZoomAt(sx, sy, f) {
  const cv = $('#roof-cv'); if (!cv) return; const cw = cv.clientWidth, ch = cv.clientHeight, Z = RS.zm, z1 = Math.min(10, Math.max(1, Z.z * f));
  Z.x = (sx - cw / 2) - (sx - cw / 2 - Z.x) * z1 / Z.z; Z.y = (sy - ch / 2) - (sy - ch / 2 - Z.y) * z1 / Z.z; Z.z = z1;
  if (z1 === 1) { Z.x = 0; Z.y = 0; }
}
function roofZoomReset() { if (RS) RS.zm = { z: 1, x: 0, y: 0 }; }
function roofBindStage() {
  const cv = $('#roof-cv'); if (!cv) return;
  if (RS.ro) RS.ro.disconnect(); RS.ro = new ResizeObserver(() => roofDraw()); RS.ro.observe(cv);
  const pinchInfo = () => { const [a, b] = [...RS.ptrs.values()]; return { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }; };
  cv.onpointerdown = e => {
    cv.setPointerCapture(e.pointerId); const [sx, sy] = evXY(e); RS.ptrs.set(e.pointerId, { x: sx, y: sy });
    if (RS.ptrs.size === 2) {                                   // zweiter Finger: Zoomen statt Bearbeiten
      const d = RS.drag; if (d && d.move && d.moved && RS.hist.length) { roofF().mods = JSON.parse(RS.hist.pop()); }
      RS.drag = null; RS.pinch = pinchInfo(); roofDraw(); return;
    }
    if (RS.ptrs.size > 2) return;
    if (e.button === 1 || e.altKey || RS.space) { RS.drag = { pan: true, lx: sx, ly: sy }; return; }
    roofDown(e);
  };
  cv.onpointermove = e => {
    if (!RS) return; const [sx, sy] = evXY(e); if (RS.ptrs.has(e.pointerId)) RS.ptrs.set(e.pointerId, { x: sx, y: sy });
    if (RS.pinch && RS.ptrs.size >= 2) { const n = pinchInfo(), o = RS.pinch; roofZoomAt(n.mx, n.my, n.d / Math.max(1, o.d)); RS.zm.x += n.mx - o.mx; RS.zm.y += n.my - o.my; RS.pinch = n; roofDraw(); return; }
    if (RS.drag && RS.drag.pan) { RS.zm.x += sx - RS.drag.lx; RS.zm.y += sy - RS.drag.ly; RS.drag.lx = sx; RS.drag.ly = sy; roofDraw(); return; }
    if (RS.drag) roofMove(e);
  };
  cv.onpointerup = cv.onpointercancel = e => {
    if (!RS) return; RS.ptrs.delete(e.pointerId);
    if (RS.pinch) { if (RS.ptrs.size < 2) RS.pinch = null; RS.drag = null; return; }
    if (RS.drag && RS.drag.pan) { RS.drag = null; return; }
    if (RS.drag) roofUp(e);
  };
  cv.onwheel = e => { e.preventDefault(); const [sx, sy] = evXY(e); roofZoomAt(sx, sy, Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0025))); roofDraw(); };
}
const evXY = e => { const r = $('#roof-cv').getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
function roofDown(e) {
  const f = roofF(), V = RS.view; if (!V) return; const [sx, sy] = evXY(e);
  if (V.kind === 'img') {
    const S = ([u, v]) => [V.ox + u * f.iw * V.k, V.oy + v * f.ih * V.k], lists = RS.step === 'ref' && f.ref ? [['ref', f.ref], ['corners', f.corners]] : [['corners', f.corners]];
    for (const [k, q] of lists) { const i = q.findIndex(p => { const [a, b] = S(p); return Math.hypot(a - sx, b - sy) < 26; }); if (i >= 0 && (RS.step === 'corners' || k === 'ref')) { RS.act = [k, i]; RS.drag = { pt: [k, i], loupe: q[i] }; roofDraw(); return; } }
    RS.drag = { pan: true, lx: sx, ly: sy }; return;
  }
  const g = faceGeom(f), [X, Y] = roofS2P(V, g, sx, sy);
  const inside = ([m]) => { const b = modBox(f, m); return X >= b.x0 && X <= b.x1 && Y >= b.y0 && Y <= b.y1; }, all = f.mods.map((m, i) => [m, i]).reverse();
  const hit = all.find(e2 => RS.sel.has(e2[1]) && inside(e2)) || all.find(inside);   // ausgewählte Module haben Vorrang
  if (RS.mode === 'string' || RS.mode === 'opt') return roofStrTap(sx, sy, hit ? hit[1] : -1);
  if (!hit && V.kind === 'photo') { const o = roofHitOther(sx, sy); if (o) { roofSwitchFace(o.fi); RS.sel = new Set([o.idx]); roofSoft(); return; } }   // Modul einer anderen Dachfläche: dorthin wechseln
  if (hit) {
    const i = hit[1], wasSel = RS.sel.has(i), multi = RS.multi || e.shiftKey || e.ctrlKey || e.metaKey;
    if (multi) RS.sel.add(i); else if (!wasSel) RS.sel = new Set([i]);
    RS.drag = { move: true, X, Y, sx, sy, hit: i, wasSel, start: [...RS.sel].map(j => [j, f.mods[j].x, f.mods[j].y]), moved: false }; roofRefreshPanel(); roofDraw(); return;
  }
  if (RS.mode === 'add') {
    /* Modul nur per Doppelklick / Doppeltipp setzen – ein einfacher Tipp wählt ab bzw. verschiebt das Bild */
    const now = performance.now(), lt = RS.lastTap, dbl = lt && now - lt.t < 420 && Math.hypot(lt.sx - sx, lt.sy - sy) < 28;
    if (!dbl) {
      RS.lastTap = { t: now, sx, sy };
      if (RS.sel.size && !RS.multi) { RS.sel = new Set(); roofRefreshPanel(); roofDraw(); }
      else if (!RS.dblHint) { RS.dblHint = true; toast('Zum Setzen eines Moduls doppelt tippen bzw. doppelklicken.'); }
      RS.drag = { pan: true, lx: sx, ly: sy }; return;
    }
    RS.lastTap = null;
    if (V.kind === 'photo' && !inPoly(g.poly, [X, Y])) {   // Doppeltipp auf einer anderen Dachfläche: dort setzen
      const o = roofFaceAt(sx, sy); if (o) { const ix = (sx - V.ox) / V.k, iy = (sy - V.oy) / V.k; roofSwitchFace(o.fi); const nf = roofF(), ng = faceGeom(nf), [X2, Y2] = ng.fromImg(ix, iy), [w2, h2] = modWH(nf, nf.orient);
        roofHist(); nf.mods.push({ x: X2 - w2 / 2, y: Y2 - h2 / 2, o: nf.orient }); RS.sel = new Set([nf.mods.length - 1]); if (RS.magnet) roofSnap(nf, ng, RS.sel); roofSave(); roofSoft(); return; }
    }
    const [w, h] = modWH(f, f.orient), m = { x: X - w / 2, y: Y - h / 2, o: f.orient };
    roofHist(); f.mods.push(m); RS.sel = new Set([f.mods.length - 1]);
    if (RS.magnet) roofSnap(f, g, RS.sel);
    roofSave(); roofSoft(); return;
  }
  if (!(RS.multi || e.shiftKey)) RS.sel = new Set();
  RS.drag = { lasso: [sx, sy, sx, sy] }; roofDraw();
}
function roofMove(e) {
  const f = roofF(), V = RS.view, d = RS.drag, [sx, sy] = evXY(e);
  if (d.pt) {
    const [k, i] = d.pt, u = Math.min(1, Math.max(0, (sx - V.ox) / (f.iw * V.k))), v = Math.min(1, Math.max(0, (sy - V.oy) / (f.ih * V.k)));
    let uv = [u, v];
    const tg = (k === 'ref' ? f.corners : []).concat(roofP().roof.faces.filter(o => o !== f && o.photo === f.photo && o.corners).flatMap(o => o.corners));
    let bd = 22; for (const c of tg) { const dd = Math.hypot((c[0] - u) * f.iw * V.k, (c[1] - v) * f.ih * V.k); if (dd < bd) { bd = dd; uv = [c[0], c[1]]; } }
    f[k][i] = uv; d.loupe = uv; if (RS.step === 'ref') { const el = $('#roof-dims'); if (el) el.innerHTML = roofDims(faceGeom(f)); } roofDraw(); return;
  }
  if (d.lasso) { d.lasso[2] = sx; d.lasso[3] = sy; roofDraw(); return; }
  if (d.move) {
    const [X, Y] = roofS2P(V, faceGeom(f), sx, sy), dx = X - d.X, dy = Y - d.Y;
    if (!d.moved && Math.hypot(sx - d.sx, sy - d.sy) < 4) return;
    if (!d.moved) { roofHist(); d.moved = true; }
    d.start.forEach(([j, x0, y0]) => { f.mods[j].x = x0 + dx; f.mods[j].y = y0 + dy; });
    if (RS.magnet) roofSnap(f, faceGeom(f), RS.sel);
    roofDraw();
  }
}
function roofUp() {
  const f = roofF(), V = RS.view, d = RS.drag; RS.drag = null;
  if (d.lasso) {
    const [a, b, c, e] = d.lasso, g = faceGeom(f), x0 = Math.min(a, c), x1 = Math.max(a, c), y0 = Math.min(b, e), y1 = Math.max(b, e);
    if (x1 - x0 > 6 || y1 - y0 > 6) f.mods.forEach((m, i) => { const bx = modBox(f, m), [px, py] = roofP2S(V, g, (bx.x0 + bx.x1) / 2, (bx.y0 + bx.y1) / 2); if (px >= x0 && px <= x1 && py >= y0 && py <= y1) RS.sel.add(i); });
    roofRefreshPanel(); roofDraw(); return;
  }
  if (d.move && !d.moved && d.wasSel) { RS.sel.delete(d.hit); roofRefreshPanel(); }   // gewähltes Modul antippen (ohne Ziehen) = abwählen
  if (d.move && d.moved) roofRefreshPanel();
  roofSave(); if (d.pt && RS.step === 'ref') roofRender(); else roofDraw();
}
/* Magnet: Gruppe an Nachbarmodulen (mit 1,5 cm Fuge) und am Randabstand ausrichten */
function roofSnap(f, g, sel) {
  if (!sel.size || !g) return;
  if (roofLattice(f, sel)) return;
  const bs = [...sel].map(i => modBox(f, f.mods[i])), G = { x0: Math.min(...bs.map(b => b.x0)), y0: Math.min(...bs.map(b => b.y0)), x1: Math.max(...bs.map(b => b.x1)), y1: Math.max(...bs.map(b => b.y1)) };
  const others = f.mods.filter((m, i) => !sel.has(i)).map(m => modBox(f, m)), T = ROOF_MAG;
  const ins = g.inset, yTop = Math.max(ins[1][1], ins[2][1]), yBot = Math.min(ins[0][1], ins[3][1]);
  const cx = [], cy = [];
  for (const o of others) {
    const nearY = o.y0 < G.y1 + T && o.y1 > G.y0 - T, nearX = o.x0 < G.x1 + T && o.x1 > G.x0 - T;
    if (nearY) cx.push(o.x1 + ROOF_GAP - G.x0, o.x0 - ROOF_GAP - G.x1, o.x0 - G.x0, o.x1 - G.x1);
    if (nearX) cy.push(o.y1 + ROOF_GAP - G.y0, o.y0 - ROOF_GAP - G.y1, o.y0 - G.y0, o.y1 - G.y1);
  }
  /* bewusst kein Einrasten am Randabstand oder an der Dachkante – nur an Modulen */
  const list = arr => [0, ...arr.filter(d => Math.abs(d) < T)].sort((a, b) => Math.abs(a) - Math.abs(b));
  const hits = (dx, dy) => bs.some(b => others.some(o => b.x0 + dx < o.x1 - 1e-4 && b.x1 + dx > o.x0 + 1e-4 && b.y0 + dy < o.y1 - 1e-4 && b.y1 + dy > o.y0 + 1e-4));
  /* Kombination mit kleinster Verschiebung wählen, die keine Überlappung erzeugt; Einrasten bevorzugt */
  const pairs = []; for (const dx of list(cx)) for (const dy of list(cy)) pairs.push([dx, dy, (dx ? 0 : 0.3) + (dy ? 0 : 0.3) + Math.abs(dx) + Math.abs(dy)]);
  pairs.sort((a, b) => a[2] - b[2]);
  const ok = pairs.find(([dx, dy]) => !hits(dx, dy)) || [0, 0];
  for (const i of sel) { f.mods[i].x += ok[0]; f.mods[i].y += ok[1]; }
}
function roofHist() { const f = roofF(); RS.hist.push(JSON.stringify(f.mods)); if (RS.hist.length > 60) RS.hist.shift(); }
function roofRefreshPanel() { roofSoft(); }
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
  if (r === 'prev') { const order = ['photo', 'corners', 'ref', 'mod'], i = order.indexOf(RS.step); if (i > 0) { a.dataset.v = order[i - 1]; } else return; }
  if (r === 'next') {
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    const order = ['photo', 'corners', 'ref', 'mod'], nx = order[order.indexOf(RS.step) + 1];
    if (RS.step === 'photo' && !f.photo) return toast('Bitte zuerst ein Foto wählen.');
    if (RS.step === 'ref') { const gg = faceGeom(f); if (!gg) return toast(f.refMode === 'len' ? 'Bitte Breite und Höhe der Referenz eingeben.' : 'Bitte die Anzahl der Pfannen waagerecht und der Reihen senkrecht eingeben.'); if (gg.bad) return toast('Die Maße wirken unplausibel – bitte Referenz-Rechteck und Anzahl prüfen (gelbes Raster muss auf den Pfannen liegen).'); }
    a.dataset.v = nx;
  }
  if ((r === 'step' || r === 'next') && (a.dataset.v === 'mod' || (r === 'next' && RS.step === 'ref')) && !p.roof.modAsked && roofMods().length && g && !g.bad) { return roofModDialog(p, () => { RS.step = 'mod'; roofRender(); }); }
  if (r === 'step' || r === 'next' || r === 'prev') { const v = a.dataset.v; roofZoomReset(); RS.act = null; RS.num = null; RS.step = v; if (v === 'ref' && !f.ref) { const c = f.corners, l = (A, B, t) => [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t]; f.ref = [l(c[1], c[3], 0.12), l(c[2], c[0], 0.12), l(c[3], c[1], 0.12), l(c[0], c[2], 0.12)]; } RS.sel = new Set(); roofSave(); return roofRender(); }
  if (r === 'face') { roofZoomReset(); RS.fi = +v; RS.sel = new Set(); RS.hist = []; RS.warp = null; const nf = roofF(); RS.step = !nf.photo ? 'photo' : faceGeom(nf) ? 'mod' : 'corners'; return roofRender(); }
  if (r === 'face-add' || r === 'face-add-photo') {
    const nf = roofNewFace(p.roof.faces.length + 1), same = r === 'face-add' && f.photo;
    if (same) Object.assign(nf, { photo: f.photo, iw: f.iw, ih: f.ih, tileId: f.tileId, prodId: f.prodId, mTop: f.mTop, mBot: f.mBot, mSide: f.mSide });
    p.roof.faces.push(nf); RS.fi = p.roof.faces.length - 1; RS.step = same ? 'corners' : 'photo'; RS.sel = new Set(); RS.hist = []; RS.warp = null; roofZoomReset(); roofSave();
    if (same) toast('Neue Fläche im selben Foto: Punkte 1–4 auf die Ecken der Fläche ziehen.', 'ok', 4500);
    return roofRender();
  }
  if (r === 'face-del') { if (!(await confirmDlg('Dachfläche löschen?', `„${f.name}“ mit ${f.mods.length} Modulen wird gelöscht.`))) return; p.roof.faces.splice(RS.fi, 1); RS.fi = 0; RS.sel = new Set(); roofSave(); return roofRender(); }
  if (r === 'refmode') { f.refMode = v; roofSave(); return roofRender(); }
  if (r === 'orient') { f.orient = v; roofSave(); return roofRefreshPanel(); }
  if (r === 'magnet') { RS.magnet = v === 'true'; return roofRefreshPanel(); }
  if (r === 'mode') { RS.mode = v; roofRefreshPanel(); return roofDraw(); }
  if (r === 'zoom') { const cv = $('#roof-cv'); if (v === 'fit') roofZoomReset(); else roofZoomAt(cv.clientWidth / 2, cv.clientHeight / 2, v === 'in' ? 1.35 : 1 / 1.35); return roofDraw(); }
  if (r === 'look') { roofZoomReset(); RS.look = v; PERSONAL.roofLook = v; savePersonal(); RS.sel = new Set(); roofRefreshPanel(); return roofDraw(); }
  if (r === 'copy' && RS.sel.size) { RS.clip = [...RS.sel].sort((a2, b2) => a2 - b2).map(i => ({ ...f.mods[i] })); toast(`${RS.clip.length} Modul${RS.clip.length > 1 ? 'e' : ''} kopiert.`); return roofSoft(); }
  if (r === 'paste' && RS.clip && RS.clip.length) { roofPaste(f, g); return roofSoft(); }
  if (r === 'all') { RS.sel = new Set(f.mods.map((m, i) => i)); RS.mode = 'select'; roofRefreshPanel(); return roofDraw(); }
  if (r === 'none') { RS.sel = new Set(); roofRefreshPanel(); return roofDraw(); }
  if (r === 'del' && RS.sel.size) { roofHist(); f.mods = f.mods.filter((m, i) => !RS.sel.has(i)); RS.sel = new Set(); roofSave(); return roofSoft(); }
  if (r === 'rotate' && RS.sel.size) { roofHist(); for (const i of RS.sel) { const m = f.mods[i], [w, h] = modWH(f, m.o); m.o = m.o === 'l' ? 'p' : 'l'; const [w2, h2] = modWH(f, m.o); m.x += (w - w2) / 2; m.y += (h - h2) / 2; } roofSave(); return roofDraw(); }
  if (r === 'undo' && RS.hist.length) { f.mods = JSON.parse(RS.hist.pop()); RS.sel = new Set(); roofSave(); return roofSoft(); }
  if (r === 'fill' && g && !g.bad) { roofHist(); const n = roofFill(f, g); toast(n ? `${n} Module ergänzt.` : 'Kein freier Platz mehr für weitere Module.'); roofSave(); return roofSoft(); }
  if (r === 'save') { p.roof.saves = p.roof.saves || []; const n = p.roof.saves.length + 1; p.roof.saves.unshift({ id: uid('rs'), name: `Stand ${n} · ${p.roof.faces.reduce((s, x) => s + x.mods.length, 0)} Module`, date: new Date().toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }), faces: clone(p.roof.faces) }); roofSave(); roofSaveSnaps(p); toast('Stand gespeichert – Foto der Belegung beim Kunden hinterlegt.'); return roofRender(); }
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
  if (el.dataset.rt) { const t = roofTiles().find(x => x.id === f.tileId); const v = pnum(el.value); if (t && !RS.rtBase) RS.rtBase = { k: el.dataset.rt, old: t[el.dataset.rt], n: el.dataset.rt === 'w' ? f.nx : f.ny }; if (t && isFinite(v) && v > 0) { t[el.dataset.rt] = v; saveSettings(); } }
  roofSave(); const d = $('#roof-dims'); if (d) d.innerHTML = roofDims(faceGeom(f));
  const ok = !!(faceGeom(f) && !faceGeom(f).bad), btn = $('#roof-ed [data-r="step"][data-v="mod"].btn-p'); if (btn) btn.disabled = !ok;
  const chip = $('#roof-ed .chip[data-r="step"][data-v="mod"]'); if (chip) chip.classList.toggle('opacity-40', !ok), chip.classList.toggle('pointer-events-none', !ok);
  roofDraw();
});
document.addEventListener('keydown', e => { if (RS && e.code === 'Space' && !/INPUT|SELECT|TEXTAREA/.test((document.activeElement || {}).tagName || '')) { RS.space = true; e.preventDefault(); } });
document.addEventListener('keyup', e => { if (RS && e.code === 'Space') RS.space = false; });
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
async function roofApply(p) {
  const by = {}; let n = 0, kwp = 0;
  for (const f of p.roof.faces) { const pr = roofProd(f); n += f.mods.length; kwp += faceKwp(f); if (pr.id) by[pr.id] = (by[pr.id] || 0) + f.mods.length; }
  if (!n) return;
  if (p.type === 'wp') p.type = 'pvwp';
  p.pv.kwp = Math.round(kwp * 1000) / 1000;
  const pr0 = roofProd(p.roof.faces.find(f => f.mods.length) || p.roof.faces[0]);
  p.pv.modules = `${n} × ${num(pr0.power)} W`;
  if (Object.keys(by).length) {
    const offerMod = (p.components || []).some(c => { const x = PRODUCTS.find(y => y.id === c.id); return x && x.cat === 'mod' && compSrc(p, c) === 'offer'; });
    p.components = (p.components || []).filter(c => { const x = PRODUCTS.find(y => y.id === c.id); return !x || x.cat !== 'mod' || compSrc(p, c) === 'offer' || compSrc(p, c) === 'manual'; }).concat(offerMod ? [] : Object.entries(by).map(([id, qty]) => ({ id, qty, src: 'roof' })));
    try { applyComponents(p); } catch (e) {}
    p.pv.kwp = Math.round(kwp * 1000) / 1000; p.pv.modules = `${n} × ${num(pr0.power)} W`;
  }
  setSrc(p, 'pv.kwp', p.pv.kwp, 'Modulplan'); setSrc(p, 'pv.modules', p.pv.modules, 'Modulplan');
  p.roof.applied = { n, kwp: p.pv.kwp, w: pr0.power, mod: pr0.name || '', date: isoToday() };
  saveProject(p); await roofSaveSnaps(p); toast(`Übernommen: ${n} Module · ${num(kwp, 2)} kWp – Foto der Belegung beim Kunden hinterlegt.`); roofClose();
}

/* ---------- Einbindung: Neue Berechnung, PV-Karte, Produkte ---------- */
function roofStartDialog() {
  modal(`<h3 class="text-[21px] font-semibold pr-8">Modulplan erstellen</h3><div class="mt-4 mb-4">${custNameField()}</div><p class="text-ink3 text-[14px] mb-3">Wofür ist die Berechnung?</p>
  <div class="grid sm:grid-cols-2 gap-3"><button class="card !shadow-none p-4 text-left hover:ring-2 hover:ring-p" data-a="roof-new" data-type="pv"><div class="text-p">${ic('sun', 24)}</div><div class="font-semibold mt-2">Photovoltaik</div></button>
  <button class="card !shadow-none p-4 text-left hover:ring-2 hover:ring-p" data-a="roof-new" data-type="pvwp"><div class="text-p flex">${ic('sun', 22)}${ic('fan', 22)}</div><div class="font-semibold mt-2">PV + Wärmepumpe</div></button></div>`);
}
function roofCard(p) {
  const r = p.roof, n = r ? r.faces.reduce((s, f) => s + f.mods.length, 0) : 0, kwp = r ? r.faces.reduce((s, f) => s + faceKwp(f), 0) : 0;
  return `<div class="mb-4 rounded-[calc(var(--r)-4px)] border ${n ? 'border-p/30' : 'border-dashed border-line2'} p-3 flex flex-wrap items-center gap-3" style="${n ? 'background:rgb(var(--p-rgb)/.06)' : ''}">
    ${r && r.snaps && Object.values(r.snaps)[0] && fileUrl(Object.values(r.snaps)[0]) ? `<img src="${fileUrl(Object.values(r.snaps)[0])}" class="w-24 h-16 object-cover rounded-lg border border-line shrink-0" alt="">` : `<div class="w-10 h-10 rounded-xl bg-raised grid place-items-center text-p shrink-0">${ic('grid', 20)}</div>`}
    <div class="flex-1 min-w-[180px] text-[13px]">${n ? `<b class="text-[14px]">Modulplan: ${n} Module · ${num(kwp, 2)} kWp</b><div class="text-ink3">${r.faces.length} Dachfläche${r.faces.length > 1 ? 'n' : ''}${r.saves && r.saves.length ? ` · ${r.saves.length} gespeicherte Stände` : ''}</div>` : `<b class="text-[14px]">Modulplan</b><div class="text-ink3">Dach per Foto aufmessen und Module belegen.</div>`}</div>
    ${roofOk() ? `<button class="btn-s !h-9 !px-3 text-[13px]" data-a="roof-open" data-id="${p.id}">${ic(n ? 'eye' : 'plus', 15)}${n ? 'Öffnen' : 'Modulplan erstellen'}</button>` : '<span class="text-[12px] text-ink3">Bearbeiten am iPad oder PC</span>'}</div>`;
}
document.addEventListener('click', async e => {
  const a = e.target.closest('[data-a^="roof-"]'); if (!a) return;
  if (a.dataset.a === 'roof-start') { roofStartDialog(); }
  else if (a.dataset.a === 'roof-open') { roofOpen(a.dataset.id); }
  else if (a.dataset.a === 'roof-new') { const cn = custNameTake(); if (!cn) return; const np = newProject(a.dataset.type); np.customer.salutation = cn.salutation; np.customer.name = cn.name; PROJECTS.push(np); await DB.put('projects', clone(np)); closeModal(); go(`projekt/${np.id}/1`); setTimeout(() => roofOpen(np.id), 250); }
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
  try { const raw = await imageKeepAlpha(el.files[0], 900); const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(raw); }); const t = roofTrim(im); const blob = t === im ? raw : await new Promise(r => t.toBlob(r, 'image/png')); if (pr.planImg) { await delFiles([pr.planImg]); delete RIMG[pr.planImg]; delete RTRIM[pr.planImg]; } pr.planImg = await putFile(blob, 'modulplan.png'); saveProducts(); productModal(id); toast('Bild für den Modulplan gespeichert.'); }
  catch (err) { toast('Bild konnte nicht gelesen werden.', 'err'); }
});
document.addEventListener('click', async e => {
  const a = e.target.closest('[data-a="planimg-del"]'); if (!a) return;
  const pr = PRODUCTS.find(x => x.id === a.dataset.id); if (!pr || !pr.planImg) return;
  await delFiles([pr.planImg]); delete RIMG[pr.planImg]; pr.planImg = ''; saveProducts(); productModal(pr.id);
});

/* Dreieck aus einem Bild affin in ein Zieldreieck zeichnen (aktuelle Canvas-Skalierung bleibt erhalten) */
function roofTri(x, img, s3, d3) {
  const [[x0, y0], [x1, y1], [x2, y2]] = s3, [[u0, v0], [u1, v1], [u2, v2]] = d3, den = x0 * (y1 - y2) + x1 * (y2 - y0) + x2 * (y0 - y1); if (Math.abs(den) < 1e-9) return;
  const a = (u0 * (y1 - y2) + u1 * (y2 - y0) + u2 * (y0 - y1)) / den, b = (u0 * (x2 - x1) + u1 * (x0 - x2) + u2 * (x1 - x0)) / den, c = (u0 * (x1 * y2 - x2 * y1) + u1 * (x2 * y0 - x0 * y2) + u2 * (x0 * y1 - x1 * y0)) / den;
  const d = (v0 * (y1 - y2) + v1 * (y2 - y0) + v2 * (y0 - y1)) / den, e = (v0 * (x2 - x1) + v1 * (x0 - x2) + v2 * (x1 - x0)) / den, f = (v0 * (x1 * y2 - x2 * y1) + v1 * (x2 * y0 - x0 * y2) + v2 * (x0 * y1 - x1 * y0)) / den;
  const cx = (u0 + u1 + u2) / 3, cy = (v0 + v1 + v2) / 3, ex = (p, q) => [p + (p - cx) * 0.02, q + (q - cy) * 0.02];
  x.save(); x.beginPath(); x.moveTo(...ex(u0, v0)); x.lineTo(...ex(u1, v1)); x.lineTo(...ex(u2, v2)); x.closePath(); x.clip();
  x.transform(a, d, b, e, c, f); x.drawImage(img, 0, 0); x.restore();
}
/* Standard-Modulbild (hochkant): dunkle Zellen mit feinen Linien */
let ROOF_CELL = null;
function roofCellImg() {
  if (ROOF_CELL) return ROOF_CELL;
  /* Full-Black-Modul (hochkant): fast schwarz, sehr feine Zellstruktur, schwarzer Rahmen */
  const c = document.createElement('canvas'); c.width = 228; c.height = 346; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 228, 346); gr.addColorStop(0, '#1a1d23'); gr.addColorStop(0.5, '#0e1014'); gr.addColorStop(1, '#14171c'); g.fillStyle = gr; g.fillRect(0, 0, 228, 346);
  g.strokeStyle = 'rgba(255,255,255,.035)'; g.lineWidth = 1;
  for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(i * 228 / 6, 3); g.lineTo(i * 228 / 6, 343); g.stroke(); }
  for (let j = 1; j < 10; j++) { g.beginPath(); g.moveTo(3, j * 346 / 10); g.lineTo(225, j * 346 / 10); g.stroke(); }
  g.strokeStyle = '#08090b'; g.lineWidth = 4; g.strokeRect(2, 2, 224, 342);
  return (ROOF_CELL = c);
}

/* Feinjustier-Kreis: Punkt bewegt sich mit 1/8 der Fingerbewegung */
function roofNudge(dxs, dys) {
  if (!RS || !RS.act || !RS.view || RS.view.kind !== 'img') return;
  const f = roofF(), V = RS.view, [k, i] = RS.act, q = f[k]; if (!q || !q[i]) return;
  q[i] = [Math.min(1, Math.max(0, q[i][0] + dxs / (f.iw * V.k))), Math.min(1, Math.max(0, q[i][1] + dys / (f.ih * V.k)))];
  if (RS.step === 'ref') { const el = $('#roof-dims'); if (el) el.innerHTML = roofDims(faceGeom(f)); }
  roofDraw();
}
document.addEventListener('pointerdown', e => {
  const ring = e.target.closest && e.target.closest('#roof-pad-ring'); if (!ring || !RS) return;
  e.preventDefault(); ring.setPointerCapture(e.pointerId); RS.fine = { lx: e.clientX, ly: e.clientY, ox: 0, oy: 0 }; roofDraw();
});
document.addEventListener('pointermove', e => {
  if (!RS || !RS.fine) return; const F = RS.fine, dx = e.clientX - F.lx, dy = e.clientY - F.ly; F.lx = e.clientX; F.ly = e.clientY;
  F.ox = Math.max(-28, Math.min(28, F.ox + dx)); F.oy = Math.max(-28, Math.min(28, F.oy + dy));
  const kn = $('#roof-pad-knob'); if (kn) { kn.style.left = (30 + F.ox) + 'px'; kn.style.top = (30 + F.oy) + 'px'; }
  roofNudge(dx / 8, dy / 8);
});
const roofFineEnd = () => { if (!RS || !RS.fine) return; RS.fine = null; const kn = $('#roof-pad-knob'); if (kn) { kn.style.left = '30px'; kn.style.top = '30px'; } roofSave(); if (RS.step === 'ref') roofRender(); else roofDraw(); };
document.addEventListener('pointerup', roofFineEnd); document.addEventListener('pointercancel', roofFineEnd);
/* Pfeiltasten (PC): ausgewählte Ecke um einen Bildpunkt verschieben, mit Umschalt schneller */
document.addEventListener('keydown', e => {
  if (!RS || !RS.act || !RS.view || RS.view.kind !== 'img' || /INPUT|SELECT|TEXTAREA/.test((document.activeElement || {}).tagName || '')) return;
  const st = e.shiftKey ? 2 : 0.25, m = { ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, -st], ArrowDown: [0, st] }[e.key]; if (!m) return;
  e.preventDefault(); roofNudge(...m); clearTimeout(RS.nt); RS.nt = setTimeout(() => { if (RS) { roofSave(); if (RS.step === 'ref') roofRender(); } }, 400);
});

/* ---------- Foto der Belegung (Originalfoto mit perspektivischen Modulen) ---------- */
/* Bild der Belegung fürs PDF: alle Dachflächen eines Fotos in EINEM Gesamtbild – mit kompletten Strings und Optimierern */
async function roofSnapshot(f, group) {
  group = (group || [f]).map(o => ({ o, g: faceGeom(o) })).filter(x => x.g && !x.g.bad);
  const img = await roofImg(f.photo), total = group.reduce((a, x) => a + x.o.mods.length, 0);
  if (!group.length || !img || !total) return null;
  /* Ausschnitt rund um alle Dachflächen */
  const xs = group.flatMap(x => x.o.corners.map(cc => cc[0] * f.iw)), ys = group.flatMap(x => x.o.corners.map(cc => cc[1] * f.ih)), bw = Math.max(...xs) - Math.min(...xs), bh = Math.max(...ys) - Math.min(...ys);
  const cx0 = Math.max(0, Math.min(...xs) - bw * 0.12), cx1 = Math.min(f.iw, Math.max(...xs) + bw * 0.12), cy0 = Math.max(0, Math.min(...ys) - bh * 0.3), cy1 = Math.min(f.ih, Math.max(...ys) + bh * 0.35);
  const k = Math.min(2, 1800 / Math.max(cx1 - cx0, cy1 - cy0)), c = document.createElement('canvas'); c.width = Math.round((cx1 - cx0) * k); c.height = Math.round((cy1 - cy0) * k);
  const x = c.getContext('2d'); x.drawImage(img, cx0, cy0, cx1 - cx0, cy1 - cy0, 0, 0, c.width, c.height);
  for (const { o, g } of group) {
    const pr = roofProd(o), pimg = pr.planImg ? await roofPlanImg(pr.planImg) : null, src = pimg || roofCellImg();
    for (const m of o.mods) {
      const b = modBox(o, m), q = [[b.x0, b.y0], [b.x1, b.y0], [b.x1, b.y1], [b.x0, b.y1]].map(([X, Y]) => { const [a, bb] = g.toImg(X, Y); return [(a - cx0) * k, (bb - cy0) * k]; });
      const cc = m.o === 'l' ? [q[1], q[2], q[3], q[0]] : q, iw2 = src.width, ih2 = src.height;
      roofTri(x, src, [[0, 0], [iw2, 0], [iw2, ih2]], [cc[0], cc[1], cc[2]]); roofTri(x, src, [[0, 0], [iw2, ih2], [0, ih2]], [cc[0], cc[2], cc[3]]);
      const gl = x.createLinearGradient(...q[0], ...q[2]); gl.addColorStop(0, 'rgba(255,255,255,.10)'); gl.addColorStop(0.5, 'rgba(255,255,255,0)'); gl.addColorStop(1, 'rgba(255,255,255,.03)');
      x.fillStyle = gl; x.beginPath(); q.forEach((pt, j) => (j ? x.lineTo(...pt) : x.moveTo(...pt))); x.closePath(); x.fill(); roofFrame(x, q);
    }
  }
  /* Strings und Optimierer über alle Flächen des Bildes */
  const pp = PROJECTS.find(q => q.roof && q.roof.faces && q.roof.faces.includes(f)); let nStr = 0;
  if (pp) {
    const G = new Map(group.map(z => [z.o, z.g])), map = (o, X, Y) => { const g = G.get(o); if (!g) return null; const [a, bb] = g.toImg(X, Y); return [(a - cx0) * k, (bb - cy0) * k]; };
    roofStrLayer(x, pp, map, roofStrSize(f, map), false);
    nStr = roofStrs(pp).filter(st => st.mods.some(r => group.some(z => z.o.id === r.f))).length;
  }
  /* Beschriftung unten */
  const kw = group.reduce((a, z) => a + faceKwp(z.o), 0), nOpt = group.reduce((a, z) => a + z.o.mods.filter(m => m.opt).length, 0), h = Math.round(c.height * 0.06);
  const names = group.length > 1 ? group.filter(z => z.o.mods.length).map(z => `${z.o.name} ${z.o.mods.length}`).join(' + ') + ` = ${total} Module` : `${f.name}: ${total} Module`;
  const prods = [...new Set(group.filter(z => z.o.mods.length).map(z => roofProd(z.o).name))].join(', ');
  x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(0, c.height - h, c.width, h); x.fillStyle = '#fff'; x.font = `600 ${Math.round(h * 0.42)}px system-ui, sans-serif`; x.textBaseline = 'middle';
  x.fillText(`${names} · ${num(kw, 2)} kWp · ${prods}${nStr ? ` · ${nStr} String${nStr > 1 ? 's' : ''}` : ''}${nOpt ? ` · ${nOpt} Optimierer` : ''}`, Math.round(h * 0.4), c.height - h / 2);
  const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.86)); return putFile(blob, 'belegung.jpg');
}
async function roofSaveSnaps(p) {
  p.roof.snaps = p.roof.snaps || {};
  for (const f of p.roof.faces) {
    /* Flächen im selben Foto: ein gemeinsames Bild an der ersten Fläche */
    const first = p.roof.faces.find(o => o.photo === f.photo);
    const id = first === f ? await roofSnapshot(f, p.roof.faces.filter(o => o.photo === f.photo)).catch(() => null) : null;
    if (p.roof.snaps[f.id] && p.roof.snaps[f.id] !== id) { try { await delFiles([p.roof.snaps[f.id]]); } catch (e) {} }
    if (id) p.roof.snaps[f.id] = id; else delete p.roof.snaps[f.id];
  }
  for (const k of Object.keys(p.roof.snaps)) if (!p.roof.faces.find(f => f.id === k)) { try { await delFiles([p.roof.snaps[k]]); } catch (e) {} delete p.roof.snaps[k]; }
  p.roof.snapDate = isoToday(); p.roof.snapV2 = true; saveProject(p);
}
/* Karte im Schritt „Angebot“: Foto der Belegung (wie die Schnellauslegung) */
function roofSnapCard(p) {
  if (!hasPV(p) || !p.roof || !p.roof.snaps || !Object.keys(p.roof.snaps).length) return '';
  /* ältere Stände: getrennte Bilder je Fläche im selben Foto einmalig zu einem Gesamtbild zusammenfassen */
  if (!p.roof.snapV2 && Object.keys(p.roof.snaps).length > 1) { p.roof.snapV2 = true; roofSaveSnaps(p).then(() => render()).catch(() => {}); }
  const ids = Object.values(p.roof.snaps); if (ids.some(id => !fileUrl(id))) { loadFiles(ids).then(() => { if (ids.every(id => fileUrl(id))) render(); }); }
  const n = p.roof.faces.reduce((a, f) => a + f.mods.length, 0), kw = p.roof.faces.reduce((a, f) => a + faceKwp(f), 0);
  return `<div class="mt-6"><div class="font-semibold text-[15px] mb-1">Modulbelegung</div>
    <div class="rounded-[calc(var(--r)-4px)] border border-p/30 p-3" style="background:rgb(var(--p-rgb)/.06)">
      <div class="flex flex-wrap items-center justify-between gap-2 mb-2"><div class="text-[14px]"><b>${n} Module · ${num(kw, 2)} kWp</b> <span class="text-ink3 text-[12px]">Stand ${deDate(p.roof.snapDate || isoToday())}</span></div>${roofOk() ? `<button class="btn-g !h-9 !px-3 text-[13px]" data-a="roof-open" data-id="${p.id}">${ic('eye', 15)}Modulplan öffnen</button>` : ''}</div>
      <div class="grid ${ids.length > 1 ? 'sm:grid-cols-2' : ''} gap-2">${ids.map(id => fileUrl(id) ? `<a href="${fileUrl(id)}" target="_blank" rel="noopener"><img src="${fileUrl(id)}" class="w-full rounded-lg border border-line" alt="Modulbelegung"></a>` : '<div class="h-40 rounded-lg bg-raised"></div>').join('')}</div>
      <div class="text-[12px] text-ink3 mt-2">Foto mit eingezeichneten Modulen – Schätzung aus dem Foto, vor Ort bitte nachmessen.</div></div></div>`;
}

/* Raster-Magnet: verschobene Gruppe auf das Raster (Modulmaß + 1,5 cm Fuge) des nächsten Nachbarmoduls setzen */
const ROOF_MAG = 0.15;   // Magnet: zieht nur bis 15 cm
function roofLattice(f, sel) {
  const ids = [...sel], m0 = f.mods[ids[0]]; if (!m0) return false;
  const others = f.mods.map((m, i) => [m, i]).filter(([m, i]) => !sel.has(i) && m.o === m0.o);
  if (!others.length || ids.some(i => f.mods[i].o !== m0.o)) return false;
  const [w, h] = modWH(f, m0.o), cw = w + ROOF_GAP, ch = h + ROOF_GAP;
  const c0 = [m0.x + w / 2, m0.y + h / 2];
  const [a] = others.map(([m]) => [m, Math.hypot(m.x + w / 2 - c0[0], m.y + h / 2 - c0[1])]).sort((p, q) => p[1] - q[1])[0];
  /* nur wenn ein Nachbarmodul wirklich nah ist (kleine Lücke) – frei platzierte Module bleiben frei beweglich */
  const b0 = modBox(f, m0), gap = o => { const q = modBox(f, o); return Math.hypot(Math.max(0, q.x0 - b0.x1, b0.x0 - q.x1), Math.max(0, q.y0 - b0.y1, b0.y0 - q.y1)); };
  if (!others.some(([m]) => gap(m) < ROOF_MAG)) return false;
  const dx = Math.round((m0.x - a.x) / cw) * cw + a.x - m0.x, dy = Math.round((m0.y - a.y) / ch) * ch + a.y - m0.y;
  const boxes = ids.map(i => modBox(f, f.mods[i])), rest = f.mods.filter((m, i) => !sel.has(i)).map(m => modBox(f, m));
  const hits = (ox, oy) => boxes.some(b => rest.some(o => b.x0 + ox < o.x1 - 1e-4 && b.x1 + ox > o.x0 + 1e-4 && b.y0 + oy < o.y1 - 1e-4 && b.y1 + oy > o.y0 + 1e-4));
  /* bevorzugt der nächste freie Rasterplatz */
  const cand = [[dx, dy]]; for (const sx of [0, cw, -cw]) for (const sy of [0, ch, -ch]) if (sx || sy) cand.push([dx + sx, dy + sy]);
  cand.sort((p, q) => Math.hypot(...p) - Math.hypot(...q));
  const lim = ROOF_MAG;
  const ok = cand.find(([ox, oy]) => Math.hypot(ox, oy) <= lim && !hits(ox, oy)); if (!ok) return false;
  for (const i of ids) { f.mods[i].x += ok[0]; f.mods[i].y += ok[1]; }
  return true;
}
/* Modulbild: weiße bzw. durchsichtige Ränder abschneiden */
function roofTrim(img) {
  const c = document.createElement('canvas'), W = c.width = img.naturalWidth || img.width, H = c.height = img.naturalHeight || img.height, x = c.getContext('2d');
  x.drawImage(img, 0, 0); let d; try { d = x.getImageData(0, 0, W, H).data; } catch (e) { return img; }
  const keep = i => d[i + 3] > 24 && !(d[i] > 232 && d[i + 1] > 232 && d[i + 2] > 232);
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y += 2) for (let xx = 0; xx < W; xx += 2) { if (keep((y * W + xx) * 4)) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
  if (x1 < 0 || (x1 - x0) < W * 0.1) return img;
  if (x0 < 3 && y0 < 3 && x1 > W - 4 && y1 > H - 4) return img;
  const o = document.createElement('canvas'); o.width = x1 - x0 + 1; o.height = y1 - y0 + 1; o.getContext('2d').drawImage(c, x0, y0, o.width, o.height, 0, 0, o.width, o.height);
  return o;
}
const RTRIM = {};
async function roofPlanImg(id) { if (!id) return null; if (RTRIM[id]) return RTRIM[id]; const im = await roofImg(id); if (!im) return null; return (RTRIM[id] = roofTrim(im)); }

/* Kopierte Module neben (sonst unter) der Vorlage einfügen – frei von Überlappungen */
function roofPaste(f, g) {
  const cl = RS.clip, bs = cl.map(m => modBox(f, m)), G = { x0: Math.min(...bs.map(b => b.x0)), y0: Math.min(...bs.map(b => b.y0)), x1: Math.max(...bs.map(b => b.x1)), y1: Math.max(...bs.map(b => b.y1)) };
  const W = G.x1 - G.x0 + ROOF_GAP, H = G.y1 - G.y0 + ROOF_GAP, all = f.mods.map(m => modBox(f, m));
  const free = (dx, dy) => bs.every(b => !all.some(o => b.x0 + dx < o.x1 - 1e-4 && b.x1 + dx > o.x0 + 1e-4 && b.y0 + dy < o.y1 - 1e-4 && b.y1 + dy > o.y0 + 1e-4) && [[b.x0 + dx, b.y0 + dy], [b.x1 + dx, b.y1 + dy]].every(pt => !g || inPoly(g.poly, pt)));
  const tries = []; for (let k = 1; k <= 8; k++) tries.push([W * k, 0], [0, H * k], [-W * k, 0], [0, -H * k]);
  const found = tries.find(([dx, dy]) => free(dx, dy)), off = found || [0.4, 0.4];
  roofHist(); const start = f.mods.length;
  cl.forEach(m => f.mods.push({ ...m, id: uid('m'), x: m.x + off[0], y: m.y + off[1] }));
  RS.sel = new Set(cl.map((m, j) => start + j)); RS.mode = 'select'; roofSave();
  toast(found ? `${cl.length} Modul${cl.length > 1 ? 'e' : ''} eingefügt – zum Platzieren verschieben.` : 'Kein freier Platz daneben – eingefügt leicht versetzt über der Vorlage. Bitte an die gewünschte Stelle schieben.');
}
document.addEventListener('keydown', e => {
  if (!RS || RS.step !== 'mod' || !(e.ctrlKey || e.metaKey) || /INPUT|SELECT|TEXTAREA/.test((document.activeElement || {}).tagName || '')) return;
  const k = e.key.toLowerCase(); if (k !== 'c' && k !== 'v') return;
  const b = $(`#roof-ed [data-r="${k === 'c' ? 'copy' : 'paste'}"]`); if (b && !b.disabled) { e.preventDefault(); b.click(); }
});

/* Nur Seitenleiste und untere Leiste neu – Bühne bleibt stabil (wichtig für Touch) */
function roofSoft() {
  if (!RS) return; const p = roofP(), f = roofF(), pn = $('#roof-panel'), ft = $('#roof-foot');
  if (pn) { const st = pn.scrollTop; pn.innerHTML = roofPanel(p, f, faceGeom(f)); pn.scrollTop = st; }
  if (ft) ft.innerHTML = roofFoot(p, f);
  roofDraw();
}

/* iPad: Zwei-Finger-Zoom im Dachbild darf nie die ganze Seite mitzoomen
   (sonst liegen Tipps im Menü rechts daneben). Gesten auf der Bühne abfangen … */
['touchstart', 'touchmove'].forEach(t => document.addEventListener(t, e => {
  if (RS && e.touches && e.touches.length > 1 && e.target.closest && e.target.closest('#roof-stage')) e.preventDefault();
}, { passive: false }));
/* … und falls das iPad doch gezoomt hat: Seite sofort auf 100 % zurücksetzen */
function pageZoomReset() {
  const vv = window.visualViewport; if (!vv || (vv.scale < 1.01 && !vv.offsetLeft)) return;
  const a = document.activeElement; if (a && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) return;
  const m = document.querySelector('meta[name=viewport]'); if (!m) return; const c = m.content;
  m.content = c.replace('maximum-scale=1,', 'maximum-scale=1.01,'); requestAnimationFrame(() => { m.content = c; if (RS) window.scrollTo(0, RS.scrollY || 0); });
}
if (window.visualViewport) { visualViewport.addEventListener('resize', () => setTimeout(pageZoomReset, 60)); visualViewport.addEventListener('scroll', () => { if (RS) setTimeout(pageZoomReset, 60); }); }
document.addEventListener('touchend', e => { if (!e.touches || !e.touches.length) setTimeout(pageZoomReset, 80); }, { passive: true });
document.addEventListener('gestureend', () => setTimeout(pageZoomReset, 80));

const ROOF_DOUBLE = ['frankfurter', 'doppels', 'harzer'];   // Pfannen mit zwei Mulden
/* ---------- Pfannen automatisch zählen ----------
   Der Referenzbereich wird entzerrt; dann wird gemessen, wie oft sich das Pfannenmuster
   waagerecht (Mulden) und senkrecht (Reihenkanten) wiederholt. Ergebnis ist ein Vorschlag. */
function roofPeriod(p, nmin, nmax) {
  /* Ableitung des Profils: betont die feinen, gleichmäßigen Pfannenkanten statt Fenster oder Schornstein */
  const n = p.length, w = Math.max(3, Math.round(n / 10)), d = new Float32Array(n - 1), r = new Float32Array(n - 1); let md = 0, mr = 0;
  for (let i = 0; i < n - 1; i++) {
    d[i] = p[i + 1] - p[i]; md += d[i];
    let s = 0, c = 0; for (let k = Math.max(0, i - w); k <= Math.min(n - 1, i + w); k++) { s += p[k]; c++; } r[i] = p[i] - s / c; mr += r[i];
  }
  md /= n - 1; mr /= n - 1; for (let i = 0; i < n - 1; i++) { d[i] -= md; r[i] -= mr; }
  const pow = (q, f) => { let a = 0, b = 0; for (let i = 0; i < n - 1; i++) { const t = 2 * Math.PI * f * i / n; a += q[i] * Math.cos(t); b += q[i] * Math.sin(t); } return a * a + b * b; };
  const near = (q, c) => { let bf = c, bv = -1; for (let f = c * 0.96; f <= c * 1.04; f += 0.25) { const v = pow(q, f); if (v > bv) { bv = v; bf = f; } } return [bf, bv]; };
  nmax = Math.min(nmax, Math.floor(n / 4)); if (nmax <= nmin) return null;
  let best = 0, bp = -1; const all = [];
  for (let f = nmin; f <= nmax; f += 0.25) { const v = pow(d, f); all.push(v); if (v > bp) { bp = v; best = f; } }
  /* Oberwelle aussortieren: Ist das Grundmuster bei der halben (oder drittel) Zahl genauso kräftig, ist das die echte Anzahl */
  /* Oberwellen und Fehlteiler aussortieren: Kandidaten (Zahl, halbe, drittel, viertel) über die
     Selbstähnlichkeit prüfen – das Muster muss sich nach genau einer Pfanne wiederholen.
     Gewählt wird der kleinste Abstand, bei dem die Wiederholung fast so stark ist wie die stärkste. */
  let e = 0; for (let i = 0; i < n - 1; i++) e += d[i] * d[i]; e = e || 1;
  const ac = L => { const l0 = Math.floor(L), t = L - l0; let s = 0; for (let i = 0; i + l0 + 1 < n - 1; i++) s += d[i] * (d[i + l0] * (1 - t) + d[i + l0 + 1] * t); return s / e * (n - 1) / Math.max(1, n - 2 - l0); };
  const cand = [1, 2, 3, 4].map(dv => best / dv).filter(h => h >= Math.max(3, nmin * 0.75)).map(h => { const [hf] = near(d, h); return { h: hf, a: ac(n / hf) }; });
  const amax = Math.max(...cand.map(c => c.a));
  if (amax > 0) { const ok = cand.filter(c => c.a >= 0.8 * amax).sort((x, y) => y.h - x.h)[0]; if (ok) best = ok.h; }
  all.sort((a, b) => a - b); const med = all[all.length >> 1] || 1;
  return { n: Math.round(best), q: bp / med };
}
async function roofAutoCount(f) {
  const img = await roofImg(f.photo); if (!img || !f.ref) return null;
  const sc = Math.min(1, 2400 / Math.max(img.naturalWidth, img.naturalHeight)), sw = Math.round(img.naturalWidth * sc), sh = Math.round(img.naturalHeight * sc);
  const c = document.createElement('canvas'); c.width = sw; c.height = sh; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, sw, sh);
  const d = x.getImageData(0, 0, sw, sh).data, P = f.ref.map(([u, v]) => [u * sw, v * sh]), H = sqToQuad(P), L = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const W = Math.round(Math.max(L(P[0], P[1]), L(P[3], P[2]))), Hh = Math.round(Math.max(L(P[0], P[3]), L(P[1], P[2])));
  if (W < 40 || Hh < 40) return null;
  const col = new Float32Array(W), row = new Float32Array(Hh);
  for (let j = 0; j < Hh; j++) for (let i = 0; i < W; i++) {
    const [px, py] = hApply(H, (i + 0.5) / W, (j + 0.5) / Hh), xi = Math.min(sw - 1, Math.max(0, px | 0)), yi = Math.min(sh - 1, Math.max(0, py | 0)), k = (yi * sw + xi) * 4;
    const v = d[k] * 0.3 + d[k + 1] * 0.59 + d[k + 2] * 0.11; col[i] += v; row[j] += v;
  }
  const a = roofPeriod(col, 4, 160), b = roofPeriod(row, 3, 90); if (!a || !b) return null;
  const dbl = ROOF_DOUBLE.includes(f.tileId);
  return { nx: a.n, dbl, ny: b.n, qx: a.q, qy: b.q };
}
document.addEventListener('click', async e => {
  const a = e.target.closest && e.target.closest('[data-r="autocount"]'); if (!a || !RS) return;
  const f = roofF(); a.disabled = true; a.innerHTML = 'Zähle …';
  let r = null; try { r = await roofAutoCount(f); } catch (err) { r = null; }
  if (!r) { toast('Automatisches Zählen hat nicht geklappt – bitte von Hand zählen.', 'warn'); roofSoft(); return; }
  f.nx = r.nx; f.ny = r.ny; roofSave(); roofSoft();
  toast(`Erkannt: ${r.nx} × ${r.ny}. Bitte am gelben Raster prüfen – jedes Kästchen muss genau eine Pfanne sein.${r.dbl ? ' Bei Doppelmulden-Pfannen liegen evtl. zwei Kästchen auf einer Pfanne – dann „÷2“.' : ''}`, r.qx < 4 || r.qy < 4 ? 'warn' : 'ok', 6000);
});

document.addEventListener('click', e => {
  const a = e.target.closest && e.target.closest('[data-r="nxdiv"],[data-r="nxmul"]'); if (!a || !RS) return;
  e.preventDefault(); const f = roofF(), v = +f.nx || 0; if (!v) return;
  roofSetCount('nx', a.dataset.r === 'nxdiv' ? Math.max(1, Math.round(v / 2)) : v * 2);
});

/* Weitere Dachflächen im selben Foto: Umriss, Name und ihre Module (zur Orientierung, nicht bearbeitbar) */
function roofOthers(x, f, S, k) {
  const p = roofP(); if (!p || !f.photo) return;
  p.roof.faces.forEach(o => {
    if (o === f || o.photo !== f.photo || !o.corners) return;
    const pts = o.corners.map(S);
    x.save(); x.setLineDash([6, 4]); x.strokeStyle = 'rgba(255,255,255,.75)'; x.lineWidth = 1.5; x.beginPath(); pts.forEach((q, j) => (j ? x.lineTo(...q) : x.moveTo(...q))); x.closePath(); x.stroke(); x.setLineDash([]);
    const g = faceGeom(o);
    if (g && !g.bad) o.mods.forEach(m => {
      const b = modBox(o, m), q = [[b.x0, b.y0], [b.x1, b.y0], [b.x1, b.y1], [b.x0, b.y1]].map(([X, Y]) => S(g.toImg(X, Y).map((v, j) => v / (j ? o.ih : o.iw))));
      x.beginPath(); q.forEach((pt, j) => (j ? x.lineTo(...pt) : x.moveTo(...pt))); x.closePath(); x.fillStyle = 'rgba(14,18,26,.88)'; x.fill(); x.strokeStyle = 'rgba(0,0,0,.9)'; x.lineWidth = 0.7; x.stroke();
    });
    const cx = pts.reduce((a, q) => a + q[0], 0) / 4, cy = pts.reduce((a, q) => a + q[1], 0) / 4;
    x.font = '600 12px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle'; const t = o.name + (o.mods.length ? ` · ${o.mods.length}` : ''), w = x.measureText(t).width + 14;
    x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(cx - w / 2, cy - 11, w, 22); x.fillStyle = '#fff'; x.fillText(t, cx, cy); x.restore();
  });
}

/* ---------- Vergleich Modulplan ↔ Angebot ---------- */
function offerPvOf(p) {
  if (p.offerPv && p.offerPv.kwp) return p.offerPv;
  if (p.from && p.from['pv.kwp'] && p.pv.kwp) return { kwp: p.pv.kwp, modules: p.pv.modules || '', n: modCount(p.pv.modules), w: modWatt(p.pv.modules) };
  return null;
}
function roofCompare(p) {
  const a = p.roof && p.roof.applied, o = offerPvOf(p); if (!a || !o) return null;
  const dn = o.n ? a.n - o.n : 0, dk = Math.round((a.kwp - o.kwp) * 100) / 100;
  if (!dn && Math.abs(dk) < 0.05) return { ok: true, a, o };
  return { ok: false, a, o, dn, dk };
}
function roofWarnCard(p) {
  const c = roofCompare(p); if (!c || c.ok) return '';
  const { a, o, dn, dk } = c, curPlan = Math.abs(+p.pv.kwp - a.kwp) < 0.01;
  const what = o.n && dn ? `${Math.abs(dn)} Module ${dn > 0 ? 'mehr' : 'weniger'}` : `${num(Math.abs(dk), 2)} kWp ${dk > 0 ? 'mehr' : 'weniger'}`;
  return `<div class="mb-4 rounded-[calc(var(--r)-4px)] p-4 border-2 border-[#D9482B]" style="background:var(--t-red)">
    <div class="flex items-center gap-2 font-semibold text-red-ink">${ic('alert', 18)}Modulplan und Angebot passen nicht zusammen – ${what}</div>
    <div class="grid sm:grid-cols-2 gap-2 mt-3 text-[14px]">
      <div class="rounded-lg bg-card p-3 ${curPlan ? 'ring-2 ring-p' : ''}"><div class="text-[12px] text-ink3">Modulplan</div><b>${num(a.n)} Module · ${num(a.kwp, 2)} kWp</b><div class="text-[12px] text-ink3">${esc(a.mod || '')}${a.w ? ` · ${num(a.w)} W` : ''}</div></div>
      <div class="rounded-lg bg-card p-3 ${curPlan ? '' : 'ring-2 ring-p'}"><div class="text-[12px] text-ink3">Angebot</div><b>${o.n ? num(o.n) + ' Module · ' : ''}${num(o.kwp, 2)} kWp</b><div class="text-[12px] text-ink3">${esc(o.modules || '')}</div></div></div>
    <div class="flex flex-wrap gap-2 mt-3"><button class="btn-s !h-9 text-[13px]" data-a="pv-use" data-v="plan" data-id="${p.id}" ${curPlan ? 'disabled' : ''}>Modulplan verwenden (${num(a.kwp, 2)} kWp)</button><button class="btn-s !h-9 text-[13px]" data-a="pv-use" data-v="offer" data-id="${p.id}" ${curPlan ? '' : 'disabled'}>Angebot verwenden (${num(o.kwp, 2)} kWp)</button>${typeof roofOk === 'function' && roofOk() ? `<button class="btn-g !h-9 text-[13px]" data-a="roof-open" data-id="${p.id}">${ic('grid', 14)}Modulplan anpassen</button>` : ''}</div>
    <p class="text-[12px] text-ink3 mt-2">Gerechnet wird mit dem markierten Wert.</p></div>`;
}
document.addEventListener('click', e => {
  const a = e.target.closest && e.target.closest('[data-a="pv-use"]'); if (!a) return;
  const p = findProject(a.dataset.id), c = p && roofCompare(p); if (!c) return;
  if (a.dataset.v === 'plan') { setSrc(p, 'pv.kwp', c.a.kwp, 'Modulplan'); setSrc(p, 'pv.modules', `${c.a.n} × ${num(c.a.w)} W`, 'Modulplan'); }
  else { setFrom(p, 'pv.kwp', c.o.kwp); setFrom(p, 'pv.modules', c.o.modules); }
  saveProject(p); render(); toast(a.dataset.v === 'plan' ? 'Gerechnet wird mit dem Modulplan.' : 'Gerechnet wird mit dem Angebot.');
});

/* ---------- „Welche Module sind geplant?“ ---------- */
function roofGuessProd(p) {
  const comp = (p.components || []).map(c => PRODUCTS.find(x => x.id === c.id)).find(x => x && x.cat === 'mod' && +x.len > 0);
  if (comp) return comp.id;
  const o = offerPvOf(p), txt = `${p.pv.modMaker || ''} ${o ? o.modules : ''}`.toLowerCase(), mods = roofMods();
  const wm = /(\d{3})\s*(?:w|wp|watt)\b/.exec(String(p.pv.modMaker || '').toLowerCase()), w = (wm && +wm[1]) || (o && o.w) || 0;
  const mk = x => x.maker && txt.includes(String(x.maker).toLowerCase());
  const hit = mods.find(x => mk(x) && w && +x.power === w) || mods.find(mk) || (w && mods.find(x => +x.power === w));
  return (hit || {}).id || '';
}
function roofModDialog(p, then) {
  const mods = roofMods(), cur = (p.roof.modAsked ? (p.roof.faces[0] || {}).prodId : roofGuessProd(p)) || (p.roof.faces[0] || {}).prodId || (mods[0] || {}).id, o = offerPvOf(p);
  modal(`<h3 class="text-[20px] font-semibold pr-8">Welche Module sind geplant?</h3><p class="text-ink3 text-[14px] mt-1">${o ? `Im Angebot: <b>${esc(o.modules || num(o.kwp, 2) + ' kWp')}</b>${p.pv.modMaker ? ` – ${esc(p.pv.modMaker)}` : ''}` : 'Das Modul bestimmt Größe und Leistung im Plan.'}</p>
    <div class="space-y-2 mt-5 max-h-[50vh] overflow-y-auto">${mods.length ? mods.map(x => `<label class="flex items-center gap-3 rounded-[var(--rb)] border border-line2 p-3 cursor-pointer has-[:checked]:border-p has-[:checked]:bg-p/10"><input type="radio" name="roof-mod" value="${x.id}" ${x.id === cur ? 'checked' : ''}><span class="flex-1"><b class="text-[14px]">${esc([x.maker, x.name].filter(Boolean).join(' – '))}</b><span class="block text-[12px] text-ink3">${num(x.power)} W · ${num(x.len)} × ${num(x.wid)} mm</span></span></label>`).join('') : '<div class="text-[14px] text-ink3">Noch keine Module mit Maßen unter „Produkte“ angelegt – bis dahin wird ein Standardmodul verwendet.</div>'}</div>
    <button class="btn-p w-full mt-5" id="roof-mod-ok">${ic('check', 16)}Übernehmen</button>`);
  $('#roof-mod-ok').onclick = () => { const v = ($('input[name="roof-mod"]:checked') || {}).value; if (v) p.roof.faces.forEach(f => { f.prodId = v; }); p.roof.modAsked = true; saveProject(p); closeModal(); then && then(); };
}

/* Deckmaß geändert: Anzahl Pfannen/Reihen umrechnen, damit das gelbe Raster die neue Pfannengröße zeigt
   (die Größe des orangen Rechtecks in Metern bleibt gleich) */
document.addEventListener('change', e => {
  const el = e.target; if (!RS || !el.dataset || !el.dataset.rt || !el.closest('#roof-ed')) return;
  const f = roofF(), b = RS.rtBase; RS.rtBase = null;
  const t = roofTiles().find(x => x.id === f.tileId), v = pnum(el.value);
  if (!b || !t || !(v > 0) || !(b.old > 0) || !(+b.n > 0) || b.old === v) return;
  const key = b.k === 'w' ? 'nx' : 'ny', max = b.k === 'w' ? 80 : 60, n = Math.max(1, Math.min(max, Math.round(+b.n * b.old / v)));
  if (n === +f[key]) return;
  f[key] = n; roofSave();
  const inp = $(`#roof-ed input[data-rf="${key}"]`); if (inp) inp.value = n;
  const d = $('#roof-dims'); if (d) d.innerHTML = roofDims(faceGeom(f));
  roofDraw();
  toast(`Raster angepasst: ${num(+b.n)} → ${num(n)} ${b.k === 'w' ? 'Pfannen waagerecht' : 'Reihen senkrecht'}. Bitte prüfen, ob es auf den Pfannenkanten liegt.`);
});

/* ---------- Pfannenkanten erkennen, Scan-Animation und Nummerierung zur Kontrolle ---------- */
/* Linien des Kontrollrasters (0…1 im Referenzrechteck): erkannte Kanten, solange Anzahl und Rechteck unverändert sind */
function roofGridLines(f, nx, ny) {
  const G = f.grid, ok = G && G.nx === nx && G.ny === ny && G.ref === JSON.stringify(f.ref);
  const uni = n => Array.from({ length: n + 1 }, (_, i) => i / Math.max(1, n));
  const edge = (L, n) => { const a = [0, ...L.filter(u => u > 0.002 && u < 0.998), 1].sort((p, q) => p - q), min = 0.3 / Math.max(1, n); return a.filter((u, i) => i === 0 || u - a[i - 1] > min || u === 1); };
  return [nx > 1 ? (ok ? edge(G.xs, nx) : uni(nx)) : [0, 1], ny > 1 ? (ok ? edge(G.ys, ny) : uni(ny)) : [0, 1]];
}
/* Kanten in einem Profil: Raster mit Periode p so verschieben, dass es auf den stärksten Kanten liegt, dann jede Linie einzeln nachjustieren */
function roofEdgeLines(prof, n) {
  const N = prof.length, p = N / n; if (!(p >= 3)) return null;
  const sm = new Float32Array(N); for (let i = 0; i < N; i++) { let s = 0, c = 0; for (let k = Math.max(0, i - 1); k <= Math.min(N - 1, i + 1); k++) { s += prof[k]; c++; } sm[i] = s / c; }
  let bf = 0, bs = -1;
  for (let ph = 0; ph < p; ph += 0.5) { let s = 0; for (let t = ph; t < N; t += p) s += sm[Math.min(N - 1, Math.round(t))]; if (s > bs) { bs = s; bf = ph; } }
  const out = [], r = Math.max(1, Math.round(p * 0.22));
  for (let t = bf; t < N; t += p) { const c = Math.round(t); let bi = c, bv = -1; for (let k = Math.max(0, c - r); k <= Math.min(N - 1, c + r); k++) if (sm[k] > bv) { bv = sm[k]; bi = k; } out.push(bi); }
  const L = [...new Set(out)].sort((a, b) => a - b), gaps = L.slice(1).map((v, i) => v - L[i]).filter(g => g > p * 0.5).sort((a, b) => a - b);
  const med = gaps.length ? gaps[gaps.length >> 1] : p;
  return { lines: L.map(v => v / N), n: Math.max(1, Math.round(N / med)) };
}
/* Profile der Kantenstärke im entzerrten Referenzbereich (senkrechte Kanten je Spalte, waagerechte je Zeile) */
async function roofEdgeProfiles(f) {
  const img = await roofImg(f.photo); if (!img || !f.ref) return null;
  const sc = Math.min(1, 2000 / Math.max(img.naturalWidth, img.naturalHeight)), sw = Math.round(img.naturalWidth * sc), sh = Math.round(img.naturalHeight * sc);
  const c = document.createElement('canvas'); c.width = sw; c.height = sh; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, sw, sh);
  const d = x.getImageData(0, 0, sw, sh).data, P = f.ref.map(([u, v]) => [u * sw, v * sh]), H = sqToQuad(P), Ln = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const W = Math.round(Math.max(Ln(P[0], P[1]), Ln(P[3], P[2]))), Hh = Math.round(Math.max(Ln(P[0], P[3]), Ln(P[1], P[2])));
  if (W < 40 || Hh < 40) return null;
  const G = new Float32Array(W * Hh);
  for (let j = 0; j < Hh; j++) for (let i = 0; i < W; i++) { const [px, py] = hApply(H, (i + 0.5) / W, (j + 0.5) / Hh), xi = Math.min(sw - 1, Math.max(0, px | 0)), yi = Math.min(sh - 1, Math.max(0, py | 0)), k = (yi * sw + xi) * 4; G[j * W + i] = d[k] * 0.3 + d[k + 1] * 0.59 + d[k + 2] * 0.11; }
  const col = new Float32Array(W), row = new Float32Array(Hh);
  for (let j = 1; j < Hh - 1; j++) for (let i = 1; i < W - 1; i++) { const o = j * W + i; col[i] += Math.abs(G[o + 1] - G[o - 1]); row[j] += Math.abs(G[o + W] - G[o - W]); }
  return { col, row };
}
/* Nach dem Zählen: Kantenlinien suchen und am Raster speichern */
async function roofDetectGrid(f, keep) {
  const nx = Math.round(+f.nx || 0), ny = Math.round(+f.ny || 0); if (!(nx > 1 && ny > 1)) return false;
  const pr = await roofEdgeProfiles(f); if (!pr) return false;
  const a = roofEdgeLines(pr.col, nx), b = roofEdgeLines(pr.row, ny); if (!a || !b) return false;
  /* Anzahl nur übernehmen, wenn sie nah an der gezählten liegt (sonst bleibt der Zählwert) */
  const fx = keep ? nx : Math.abs(a.n - nx) <= Math.max(1, nx * 0.12) ? a.n : nx, fy = keep ? ny : Math.abs(b.n - ny) <= Math.max(1, ny * 0.12) ? b.n : ny;
  f.nx = fx; f.ny = fy;
  f.grid = { nx: Math.min(80, fx), ny: Math.min(60, fy), xs: a.lines, ys: b.lines, ref: JSON.stringify(f.ref) };
  return true;
}
/* Nummern 1 … n in jede Pfanne, Reihe für Reihe – mit Scan-Animation */
function roofNumbers(x, Hq, LX, LY) {
  const A = RS.num, now = performance.now(), calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tScan = calm ? 0 : 2600, tCount = calm ? 0 : 1600, e = now - A.t0;
  if (e < tScan) {
    /* Scanner wie bei einem QR-Code-Leser: leuchtende Eckwinkel, Laserlinie fährt runter und wieder hoch */
    const s = e / tScan, y = 0.5 - 0.5 * Math.cos(2 * Math.PI * s), dir = s < 0.5 ? 1 : -1, poly = (v0, v1) => { x.beginPath(); [[0, v0], [1, v0], [1, v1], [0, v1]].map(([u, v]) => hApply(Hq, u, v)).forEach((pt, i) => (i ? x.lineTo(...pt) : x.moveTo(...pt))); x.closePath(); };
    x.save();
    poly(0, 1); x.fillStyle = 'rgba(5,10,20,.32)'; x.fill();
    const tr = 0.12; for (let k = 0; k < 8; k++) { const a0 = y - dir * tr * (k + 1) / 8, a1 = y - dir * tr * k / 8, v0 = Math.max(0, Math.min(1, Math.min(a0, a1))), v1 = Math.max(0, Math.min(1, Math.max(a0, a1))); if (v1 <= v0) continue; poly(v0, v1); x.fillStyle = `rgba(60,255,170,${(0.26 * (1 - k / 8)).toFixed(3)})`; x.fill(); }
    const a = hApply(Hq, 0, y), b = hApply(Hq, 1, y);
    x.shadowColor = 'rgba(60,255,170,1)'; x.shadowBlur = 24; x.strokeStyle = 'rgba(190,255,225,1)'; x.lineWidth = 3; x.beginPath(); x.moveTo(...a); x.lineTo(...b); x.stroke();
    x.shadowBlur = 10; x.fillStyle = '#E8FFF4';
    for (const u of LX) for (const v of LY) { const d = (y - v) * dir; if (d >= 0 && d < 0.06) { const pt = hApply(Hq, u, v); x.globalAlpha = 1 - d / 0.06; x.beginPath(); x.arc(pt[0], pt[1], 2.6 * (1 - d / 0.06) + 0.6, 0, 7); x.fill(); } }
    x.globalAlpha = 1;
    /* Eckwinkel, leicht pulsierend */
    const pl = 1 + 0.05 * Math.sin(e / 140), C = [[0, 0, 1, 1], [1, 0, -1, 1], [1, 1, -1, -1], [0, 1, 1, -1]], L = 0.13 * pl, o = -0.02 * pl;
    x.shadowBlur = 16; x.strokeStyle = '#3CFFAA'; x.lineWidth = 4.5; x.lineCap = 'round'; x.lineJoin = 'round';
    for (const [u, v, su, sv] of C) { const cu = u - su * -o, cv = v - sv * -o; x.beginPath(); x.moveTo(...hApply(Hq, cu + su * L, cv)); x.lineTo(...hApply(Hq, cu, cv)); x.lineTo(...hApply(Hq, cu, cv + sv * L * 1.6)); x.stroke(); }
    x.shadowBlur = 0; const lab = 'Pfannen werden gescannt …', top = hApply(Hq, 0.5, 0); x.font = '700 14px system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; const tw = x.measureText(lab).width + 22; x.fillStyle = 'rgba(12,20,28,.88)'; x.beginPath(); x.roundRect ? x.roundRect(top[0] - tw / 2, top[1] - 46, tw, 26, 13) : x.rect(top[0] - tw / 2, top[1] - 46, tw, 26); x.fill(); x.fillStyle = '#3CFFAA'; x.fillText(lab, top[0], top[1] - 33);
    x.restore();
  } else {
    /* Nur oberste Reihe (Pfannen 1 … n, weiß) und linke Spalte (Reihen 2 … m, gelb) beschriften */
    /* nur ganze Pfannen nummerieren – angeschnittene Randstücke auslassen */
    const full = L => { const g = L.slice(1).map((v, i) => v - L[i]), m = g.slice().sort((p, q) => p - q)[g.length >> 1] || 1; return g.map((w, i) => (w >= m * 0.6 ? i : -1)).filter(i => i >= 0); };
    const fc = full(LX), fr = full(LY), r0 = fr[0] || 0, c0 = fc[0] || 0, labs = [], f0 = roofF(), nC = Math.round(+f0.nx) || fc.length, nR = Math.round(+f0.ny) || fr.length;
    fc.forEach((i, k) => labs.push([LX[i], LY[r0], LX[i + 1], LY[r0 + 1], String(k + 1), '#ffffff']));
    fr.slice(1).forEach((j, k) => labs.push([LX[c0], LY[j], LX[c0 + 1], LY[j + 1], String(k + 2), '#FFD166']));
    const shown = e >= tScan + tCount ? labs.length : Math.ceil(labs.length * (e - tScan) / tCount);
    x.save(); x.textAlign = 'center'; x.textBaseline = 'middle';
    for (let k = 0; k < shown; k++) {
      const [u0, v0, u1, v1, t, col] = labs[k], c = hApply(Hq, (u0 + u1) / 2, (v0 + v1) / 2), w = Math.hypot(...[0, 1].map(q => hApply(Hq, u1, (v0 + v1) / 2)[q] - hApply(Hq, u0, (v0 + v1) / 2)[q])), h = Math.hypot(...[0, 1].map(q => hApply(Hq, (u0 + u1) / 2, v1)[q] - hApply(Hq, (u0 + u1) / 2, v0)[q]));
      const fs = Math.min(w / (t.length * 0.62 + 0.2), h * 0.7, 22); if (fs < 4.5) continue;
      x.font = `800 ${fs.toFixed(1)}px system-ui, sans-serif`; x.lineWidth = Math.max(1.5, fs / 4); x.strokeStyle = 'rgba(0,0,0,.8)'; x.strokeText(t, c[0], c[1]); x.fillStyle = k === shown - 1 && shown < labs.length ? '#7DFFE6' : col; x.fillText(t, c[0], c[1]);
    }
    const top = hApply(Hq, 0.5, 0), lab = shown === labs.length ? `${num(nC)} Pfannen × ${num(nR)} Reihen = ${num(nC * nR)} Pfannen` : 'Zähle …';
    x.font = '700 14px system-ui, sans-serif'; const tw = x.measureText(lab).width + 22; x.fillStyle = 'rgba(12,20,28,.88)'; x.beginPath(); x.roundRect ? x.roundRect(top[0] - tw / 2, top[1] - 40, tw, 26, 13) : x.rect(top[0] - tw / 2, top[1] - 40, tw, 26); x.fill(); x.fillStyle = '#7DFFE6'; x.fillText(lab, top[0], top[1] - 27);
    if (shown === labs.length && !A.small && !RS.smallShown) { A.small = true; const w0 = Math.hypot(...[0, 1].map(q => hApply(Hq, LX[1], 0)[q] - hApply(Hq, LX[0], 0)[q])); if (w0 < 9) RS.smallShown = true, toast('Die Nummern sind zum Lesen zu klein – bitte ins Bild hineinzoomen.'); }
    x.restore();
  }
  if (e < tScan + tCount + 50 && !RS.numRaf) RS.numRaf = requestAnimationFrame(() => { RS.numRaf = 0; if (RS && RS.num === A && RS.step === 'ref') roofDraw(); });
}
function roofStartNumbers() { if (!RS) return; RS.num = { t0: performance.now() }; roofSoft(); }

/* „Automatisch zählen“: zählen, Kanten suchen, dann scannen und nummerieren */
const _roofAutoCount224 = roofAutoCount;
roofAutoCount = async function (f) {
  const r = await _roofAutoCount224(f); if (!r) return r;
  const keep = [f.nx, f.ny]; f.nx = r.nx; f.ny = r.ny;
  try { if (await roofDetectGrid(f)) { r.nx = f.nx; r.ny = f.ny; } } catch (e) {}
  f.scanN = r.nx;
  f.nx = keep[0]; f.ny = keep[1];
  setTimeout(roofStartNumbers, 60);
  return r;
};
/* Knopf „Pfannen nummerieren“ (ohne neu zu zählen) und Umschalten der Anzeige */
document.addEventListener('click', async e => {
  const a = e.target.closest && e.target.closest('[data-r="numtiles"]'); if (!a || !RS) return;
  e.preventDefault(); const f = roofF();
  if (RS.num) { RS.num = null; roofSoft(); return; }
  if (!(+f.nx > 0 && +f.ny > 0)) return toast('Bitte zuerst die Pfannen zählen oder eintragen.', 'warn');
  a.disabled = true; a.textContent = 'Suche Pfannenkanten …';
  const g = f.grid; if (!(g && g.nx === Math.round(+f.nx) && g.ny === Math.round(+f.ny) && g.ref === JSON.stringify(f.ref))) { try { await roofDetectGrid(f); } catch (err) {} }
  roofSave(); roofStartNumbers();
});

/* Alternativen zur gezählten Pfannenzahl: Mulden werden oft als eigene Pfanne erkannt (dann ½, ⅔ oder ¾ der Zahl) */
function roofCands(n) {
  n = Math.round(n); const out = new Set([0.5, 2 / 3, 0.75, 1, 4 / 3, 1.5].map(k => Math.round(n * k)).filter(v => v >= 2 && v <= 160));
  return [...out].sort((a, b) => a - b);
}
/* Anzahl setzen, Raster neu auf die Kanten legen, Nummern ohne Animation zeigen */
async function roofSetCount(k, v) {
  const f = roofF(); f[k] = Math.max(1, Math.min(k === 'nx' ? 160 : 90, Math.round(v)));
  try { await roofDetectGrid(f, true); } catch (e) {}
  roofSave(); if (RS) RS.num = { t0: performance.now() - 1e6 }; roofSoft();
}
document.addEventListener('click', e => {
  const a = e.target.closest && e.target.closest('[data-r="ncand"],[data-r="nstep"]'); if (!a || !RS) return;
  e.preventDefault(); const f = roofF();
  if (a.dataset.r === 'ncand') return roofSetCount('nx', +a.dataset.v);
  const k = a.dataset.k; roofSetCount(k, (+f[k] || 0) + (+a.dataset.d));
});

/* =========================================================
   Stringplan und Optimierer
   Strings laufen über Modul-Kennungen (auch über mehrere Dachflächen).
   ========================================================= */
const STR_COLS = ['#FF9F1C', '#2EC4FF', '#FF4D6D', '#3DDC97', '#B983FF', '#FFD60A', '#FF7AE0', '#9CFF57'];
const roofStrs = p => (p.roof.strings = p.roof.strings || []);
function roofIds(p) { const seen = new Set(); p.roof.faces.forEach(o => o.mods.forEach(m => { if (!m.id || seen.has(m.id)) m.id = uid('m'); seen.add(m.id); })); }
function roofModRef(p, r) { const o = p.roof.faces.find(x => x.id === r.f); const m = o && o.mods.find(x => x.id === r.m); return m ? { o, m } : null; }
function roofCleanStrs(p) { roofStrs(p).forEach(s => { s.mods = s.mods.filter(r => roofModRef(p, r)); }); }
/* Abbildung Dachebene → Bildschirm für alle Dachflächen im selben Foto */
function roofImgMap(f, toS) {
  const G = new Map();
  return (o, X, Y) => { if (o.photo !== f.photo) return null; if (!G.has(o)) G.set(o, faceGeom(o)); const g = G.get(o); if (!g || g.bad) return null; const [ix, iy] = g.toImg(X, Y); return toS(ix, iy); };
}
function roofStrSize(f, map) { const [mw] = modWH(f, 'p'), a = map(f, 0, 0), b = map(f, mw, 0); return a && b ? Math.max(3, Math.min(16, Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.13)) : 6; }
function roofStrLayer(x, p, map, z, live) {
  if (!p) return; roofCleanStrs(p);
  x.save(); x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round'; x.lineCap = 'round';
  /* Optimierer: kleines Kästchen unten im Modul */
  p.roof.faces.forEach(o => o.mods.forEach(m => {
    if (!m.opt) return; const b = modBox(o, m), cx = (b.x0 + b.x1) / 2, cy = b.y0 + (b.y1 - b.y0) * 0.82, c = map(o, cx, cy), r = map(o, cx + (b.x1 - b.x0) * 0.2, cy); if (!c || !r) return;
    const w = Math.max(5, Math.hypot(r[0] - c[0], r[1] - c[1])), h = w * 0.55;
    x.fillStyle = '#20262E'; x.strokeStyle = '#3DDC97'; x.lineWidth = Math.max(1, w * 0.08); x.beginPath(); x.roundRect ? x.roundRect(c[0] - w / 2, c[1] - h / 2, w, h, h * 0.25) : x.rect(c[0] - w / 2, c[1] - h / 2, w, h); x.fill(); x.stroke();
    if (w >= 16) { x.fillStyle = '#3DDC97'; x.font = `700 ${(h * 0.62).toFixed(1)}px system-ui, sans-serif`; x.fillText('OPT', c[0], c[1] + 0.5); }
  }));
  /* Strings: Linie von Modul zu Modul, nummerierte Punkte, Name am Anfang */
  roofStrs(p).forEach((s, si) => {
    const col = STR_COLS[s.c % STR_COLS.length], cur = live && RS && RS.mode === 'string' && RS.str === s.id;
    const pts = s.mods.map(r => { const q = roofModRef(p, r); if (!q) return null; const b = modBox(q.o, q.m); return map(q.o, (b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2); });
    for (const [lw, st] of [[z * 0.5 + 3, 'rgba(0,0,0,.6)'], [z * 0.32 + 1.5, col]]) { x.strokeStyle = st; x.lineWidth = lw; x.beginPath(); let on = false; pts.forEach(pt => { if (!pt) { on = false; return; } if (on) x.lineTo(...pt); else { x.moveTo(...pt); on = true; } }); x.stroke(); }
    const rr = Math.max(5, z * 0.6);
    pts.forEach((pt, k) => { if (!pt) return; x.beginPath(); x.arc(pt[0], pt[1], rr, 0, 7); x.fillStyle = col; x.fill(); x.strokeStyle = '#fff'; x.lineWidth = Math.max(1.2, rr * 0.18); x.stroke(); if (rr >= 7) { x.fillStyle = '#111'; x.font = `800 ${(rr * 1.05).toFixed(1)}px system-ui, sans-serif`; x.fillText(String(k + 1), pt[0], pt[1] + 0.5); } });
    const f0 = pts.find(Boolean);
    if (f0) { const t = `String ${si + 1}`, fs = Math.max(10, rr * 1.2); x.font = `800 ${fs.toFixed(1)}px system-ui, sans-serif`; const tw = x.measureText(t).width + fs; x.fillStyle = col; x.beginPath(); x.roundRect ? x.roundRect(f0[0] - tw / 2, f0[1] - rr - fs * 1.9, tw, fs * 1.5, fs * 0.75) : x.rect(f0[0] - tw / 2, f0[1] - rr - fs * 1.9, tw, fs * 1.5); x.fill(); x.fillStyle = '#111'; x.fillText(t, f0[0], f0[1] - rr - fs * 1.15); }
    if (cur) { const l = [...pts].reverse().find(Boolean); if (l) { const k = 1 + 0.25 * Math.sin(performance.now() / 160); x.beginPath(); x.arc(l[0], l[1], rr * 1.7 * k, 0, 7); x.strokeStyle = '#fff'; x.lineWidth = 2; x.stroke(); if (!RS.strRaf) RS.strRaf = requestAnimationFrame(() => { RS.strRaf = 0; if (RS && RS.mode === 'string') roofDraw(); }); } }
  });
  x.restore();
}
/* Welche Dachfläche bzw. welches Modul liegt unter dem Finger (Fotoansicht, alle Flächen im selben Foto) */
function roofHitOther(sx, sy) {
  const p = roofP(), f = roofF(), V = RS.view; if (!V || V.kind !== 'photo') return null;
  const ix = (sx - V.ox) / V.k, iy = (sy - V.oy) / V.k;
  for (let fi = 0; fi < p.roof.faces.length; fi++) {
    const o = p.roof.faces[fi]; if (o === f || o.photo !== f.photo) continue; const g = faceGeom(o); if (!g || g.bad) continue;
    for (let i = o.mods.length - 1; i >= 0; i--) { const b = modBox(o, o.mods[i]), q = [[b.x0, b.y0], [b.x1, b.y0], [b.x1, b.y1], [b.x0, b.y1]].map(([X, Y]) => g.toImg(X, Y)); if (inPoly(q, [ix, iy])) return { fi, idx: i }; }
  }
  return null;
}
function roofFaceAt(sx, sy) {
  const p = roofP(), f = roofF(), V = RS.view; if (!V || V.kind !== 'photo') return null;
  const ix = (sx - V.ox) / V.k, iy = (sy - V.oy) / V.k;
  for (let fi = 0; fi < p.roof.faces.length; fi++) { const o = p.roof.faces[fi]; if (o === f || o.photo !== f.photo || !o.corners) continue; const g = faceGeom(o); if (!g || g.bad) continue; if (inPoly(o.corners.map(([u, v]) => [u * o.iw, v * o.ih]), [ix, iy])) return { fi }; }
  return null;
}
/* Dachfläche wechseln, ohne dass das Bild springt */
function roofSwitchFace(fi) {
  if (!RS || fi === RS.fi) return;
  const cv = $('#roof-cv'), old = RS.view, p = roofP(), nf = p.roof.faces[fi], ng = faceGeom(nf);
  RS.fi = fi; RS.sel = new Set(); RS.hist = []; RS.warp = null; RS.lastTap = null;
  if (old && old.kind === 'photo' && cv && ng && !ng.bad) { const V0 = roofView0(cv, nf, ng, true); if (V0 && V0.kind === 'photo') { const cw = cv.clientWidth, ch = cv.clientHeight, z = old.k / V0.k; RS.zm = { ...(RS.zm || {}), z, x: old.ox - cw / 2 - (V0.ox - cw / 2) * z, y: old.oy - ch / 2 - (V0.oy - ch / 2) * z }; } }
}
/* Tippen im Modus Strings / Optimierer */
function roofStrTap(sx, sy, idx) {
  const p = roofP(); let fi = RS.fi;
  if (idx < 0) { const o = roofHitOther(sx, sy); if (o) { fi = o.fi; idx = o.idx; } }
  if (idx < 0) { RS.drag = { pan: true, lx: sx, ly: sy }; return; }
  roofIds(p); const face = p.roof.faces[fi], m = face.mods[idx];
  if (RS.mode === 'opt') m.opt = !m.opt;
  else {
    const strs = roofStrs(p); let S = strs.find(s => s.id === RS.str);
    if (!S) { const used = new Set(strs.map(s => s.c)); let c = 0; while (used.has(c)) c++; S = { id: uid('st'), c, mods: [] }; strs.push(S); RS.str = S.id; }
    const ref = { f: face.id, m: m.id }, same = r => r.f === ref.f && r.m === ref.m, k = S.mods.findIndex(same);
    if (k >= 0 && k === S.mods.length - 1) S.mods.pop();
    else if (k >= 0) { toast(`Dieses Modul ist schon Nr. ${k + 1} in diesem String.`); return; }
    else { strs.forEach(s => { if (s !== S) s.mods = s.mods.filter(r => !same(r)); }); S.mods.push(ref); }
  }
  if (fi !== RS.fi) roofSwitchFace(fi);
  roofSave(); roofSoft();
}
function roofStrPanel(p) {
  if (!p) return ''; roofCleanStrs(p); const strs = roofStrs(p);
  const wp = s => s.mods.reduce((a, r) => { const q = roofModRef(p, r); return a + (q ? nz(roofProd(q.o).power) : 0); }, 0);
  return `<div class="mt-3 rounded-[calc(var(--r)-4px)] bg-raised p-3 text-[13px]"><div class="font-semibold">Stringplan</div><div class="text-[12px] text-ink3 mt-0.5 leading-snug">Ein String darf auch über mehrere Dachflächen laufen (Ansicht „Wie auf dem Foto“).</div>
    <div class="space-y-1.5 mt-2">${strs.map((s, i) => `<div class="flex items-center gap-2 rounded-lg px-2 py-1.5 ${RS.str === s.id ? 'bg-bg ring-1 ring-p' : ''}"><span class="w-3 h-3 rounded-full shrink-0" style="background:${STR_COLS[s.c % STR_COLS.length]}"></span><button type="button" class="flex-1 text-left" data-r="strsel" data-v="${s.id}"><b>String ${i + 1}</b> <span class="text-ink3">· ${s.mods.length} Module · ${num(wp(s) / 1000, 2)} kWp</span></button><button type="button" class="text-ink3 hover:text-ink px-1" data-r="strdel" data-v="${s.id}" title="String löschen">${ic('trash', 14)}</button></div>`).join('') || '<div class="text-[12px] text-ink3">Noch kein String – einfach das erste Modul antippen.</div>'}</div>
    <button type="button" class="btn-s w-full !h-9 mt-2 text-[13px]" data-r="strnew">${ic('plus', 15)}Neuer String</button></div>`;
}
function roofOptPanel(p, f) {
  if (!p) return ''; const all = p.roof.faces.reduce((a, o) => a + o.mods.filter(m => m.opt).length, 0), here = f.mods.filter(m => m.opt).length;
  return `<div class="mt-3 rounded-[calc(var(--r)-4px)] bg-raised p-3 text-[13px]"><div class="font-semibold">Optimierer</div><div class="text-[12px] text-ink3 mt-0.5">Modul antippen = Optimierer setzen bzw. entfernen.</div>
    <div class="mt-2"><b>${here}</b> auf ${esc(f.name)}${p.roof.faces.length > 1 ? ` · <b>${all}</b> gesamt` : ''}</div>
    <div class="grid grid-cols-2 gap-2 mt-2"><button type="button" class="btn-s !h-9 text-[13px]" data-r="optall">Alle auf dieser Fläche</button><button type="button" class="btn-g !h-9 text-[13px]" data-r="optnone">Alle entfernen</button></div></div>`;
}
document.addEventListener('click', e => {
  const a = e.target.closest && e.target.closest('#roof-ed [data-r="strnew"],#roof-ed [data-r="strsel"],#roof-ed [data-r="strdel"],#roof-ed [data-r="optall"],#roof-ed [data-r="optnone"]'); if (!a || !RS) return;
  e.preventDefault(); const p = roofP(), f = roofF(), r = a.dataset.r, strs = roofStrs(p);
  if (r === 'strnew') { const used = new Set(strs.map(s => s.c)); let c = 0; while (used.has(c)) c++; const S = { id: uid('st'), c, mods: [] }; strs.push(S); RS.str = S.id; RS.mode = 'string'; }
  if (r === 'strsel') RS.str = a.dataset.v;
  if (r === 'strdel') { p.roof.strings = strs.filter(s => s.id !== a.dataset.v); if (RS.str === a.dataset.v) RS.str = null; }
  if (r === 'optall') f.mods.forEach(m => { m.opt = true; });
  if (r === 'optnone') f.mods.forEach(m => { delete m.opt; });
  roofSave(); roofSoft();
});

/* Kurze Anleitung je Werkzeug (Seitenleiste und Schild im Bild) */
const ROOF_HOW = {
  add: 'Doppelt tippen bzw. doppelklicken = Modul setzen. Ziehen = Bild verschieben. Module anderer Dachflächen antippen = dorthin wechseln.',
  select: 'Modul antippen = auswählen. Rahmen ziehen = mehrere auswählen. Ausgewählte Module ziehen = verschieben.',
  string: 'Module der Reihe nach antippen: 1 → 2 → 3 … Das letzte nochmal antippen = zurück. „Neuer String“ für den nächsten.',
  opt: 'Modul antippen = Optimierer setzen, nochmal antippen = entfernen.'
};
const ROOF_BADGE = { add: 'Setzen: doppelt tippen', select: 'Auswählen: antippen oder Rahmen ziehen', string: 'Strings: Module der Reihe nach antippen', opt: 'Optimierer: Modul antippen' };
const _roofDraw226 = roofDraw;
roofDraw = async function () {
  const r = await _roofDraw226.apply(this, arguments);
  const b = $('#roof-badge'); if (b && RS) { const on = RS.step === 'mod'; b.classList.toggle('hidden', !on); if (on) { let t = ROOF_BADGE[RS.mode] || ''; if (RS.mode === 'string') { const p = roofP(), i = roofStrs(p).findIndex(s => s.id === RS.str); t = i >= 0 ? `String ${i + 1}: nächstes Modul antippen` : 'Strings: erstes Modul antippen'; } if (b.textContent !== t) b.textContent = t; } }
  return r;
};

/* Modulrahmen: dunkler Rahmen nur nach innen (die Lücke zum Nachbarmodul bleibt frei), außen eine feine helle Alu-Kante */
function roofFrame(x, q) {
  const fw = Math.max(0.8, Math.hypot(q[1][0] - q[0][0], q[1][1] - q[0][1]) * 0.018), poly = () => { x.beginPath(); q.forEach((p, j) => (j ? x.lineTo(...p) : x.moveTo(...p))); x.closePath(); };
  x.save(); poly(); x.clip(); x.strokeStyle = '#0B0D10'; x.lineJoin = 'round'; x.lineWidth = fw * 2; poly(); x.stroke(); x.restore();
  x.save(); x.strokeStyle = 'rgba(205,214,224,.55)'; x.lineWidth = Math.max(0.6, fw * 0.35); x.lineJoin = 'round'; poly(); x.stroke(); x.restore();
}
