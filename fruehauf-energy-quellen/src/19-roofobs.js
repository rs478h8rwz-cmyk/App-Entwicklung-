/* ---------- Modulplan: Störstellen aussparen, maximal belegen, Feinjustier-Rad mittig ----------
   Störstellen (Dachfenster, Schornstein, Gaube, Lüfter, Satellitenschüssel …) werden NUR beim Drücken
   von „Füllen“ bzw. „Maximal“ im entzerrten Dachbild gesucht: Stellen, deren Farbe und Struktur deutlich
   von den Dachpfannen abweichen. Sie liegen als rote Flächen im Plan (antippen im Auswahl-Modus = entfernen). */
const OBS_CELL = 0.1;      // Raster der Erkennung: 10 cm
const OBS_PAD = 0.1;       // Sicherheitsabstand um jede Störstelle: 10 cm

const obsKey = f => JSON.stringify([f.photo, f.corners, f.ref, f.refMode, f.nx, f.ny, f.lw, f.lh, f.tileId]);
const rgb2lab = (r, g, b) => {
  const l = c => { c /= 255; return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92; };
  const R = l(r), G = l(g), B = l(b), X = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047, Y = R * 0.2126 + G * 0.7152 + B * 0.0722, Z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const f = t => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116, fx = f(X), fy = f(Y), fz = f(Z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
};
const median = a => { const s = Float64Array.from(a).sort(); return s.length ? s[s.length >> 1] : 0; };
const mad = (a, m) => median(a.map(v => Math.abs(v - m))) * 1.4826;

async function roofObsDetect(f, g) {
  const img = await roofImg(f.photo); if (!img || !g || g.bad) return null;
  const wc = roofWarp(f, g, img), ppm = wc.width / g.W, W = wc.width, H = wc.height;
  const d = wc.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W, H).data;
  const zone = g.inset, cs = OBS_CELL, nx = Math.ceil(g.W / cs), ny = Math.ceil(g.H / cs);
  const cells = [];   // {i, j, L, a, b, s}
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const X0 = i * cs, Y0 = j * cs, X1 = X0 + cs, Y1 = Y0 + cs;
    if (![[X0, Y0], [X1, Y0], [X1, Y1], [X0, Y1]].every(p => inPoly(zone, p))) continue;
    const px0 = Math.floor(X0 * ppm), py0 = Math.floor(Y0 * ppm), px1 = Math.min(W, Math.ceil(X1 * ppm)), py1 = Math.min(H, Math.ceil(Y1 * ppm)), st = Math.max(1, Math.round((px1 - px0) / 8));
    let n = 0, r = 0, gg = 0, b = 0, y = 0, y2 = 0;
    for (let py = py0; py < py1; py += st) for (let px = px0; px < px1; px += st) {
      const k = (py * W + px) * 4; if (d[k + 3] < 200) continue;
      r += d[k]; gg += d[k + 1]; b += d[k + 2]; const v = d[k] * 0.299 + d[k + 1] * 0.587 + d[k + 2] * 0.114; y += v; y2 += v * v; n++;
    }
    if (n < 6) continue;
    const [L, A, B] = rgb2lab(r / n, gg / n, b / n), sd = Math.sqrt(Math.max(0, y2 / n - (y / n) ** 2));
    cells.push({ i, j, L, a: A, b: B, s: Math.log(1 + sd) });
  }
  if (cells.length < 40) return null;
  /* Dachfarbe und -struktur robust schätzen (Median), Abweichung je Zelle als Punktzahl */
  const ms = ['L', 'a', 'b', 's'].map(k => { const v = cells.map(c => c[k]), m = median(v); return [k, m, mad(v, m)]; });
  const [[, mL, sL], [, mA, sA], [, mB, sB], [, mS, sS]] = ms;
  const SL = Math.max(7, sL), SA = Math.max(3, sA), SB = Math.max(3, sB), SS = Math.max(0.25, sS);
  for (const c of cells) {
    const dL = (c.L - mL) / SL, dA = (c.a - mA) / SA, dB = (c.b - mB) / SB, dS = (c.s - mS) / SS;
    /* Helligkeit allein zählt nur halb (Schatten), Farbe und Struktur voll */
    c.z = Math.sqrt(0.45 * dL * dL + dA * dA + dB * dB + 0.5 * dS * dS);
  }
  const grid = new Map(cells.map(c => [c.i + ',' + c.j, c])), at = (i, j) => grid.get(i + ',' + j);
  const flag = c => c && c.z > 3.4;
  /* Rauschen entfernen: einzelne Zellen nur, wenn sie sehr stark abweichen */
  const hot = cells.filter(c => { if (!flag(c)) return false; let k = 0; for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) if ((di || dj) && flag(at(c.i + di, c.j + dj))) k++; return k >= 2 || c.z > 6; });
  const hs = new Set(hot.map(c => c.i + ',' + c.j)), seen = new Set(), rects = [];
  for (const c of hot) {
    const key = c.i + ',' + c.j; if (seen.has(key)) continue;
    const st = [c], comp = []; seen.add(key);
    while (st.length) { const q = st.pop(); comp.push(q); for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) { const k2 = (q.i + di) + ',' + (q.j + dj); if (hs.has(k2) && !seen.has(k2)) { seen.add(k2); st.push(at(q.i + di, q.j + dj)); } } }
    const zmax = Math.max(...comp.map(x => x.z));
    if (comp.length < 2 && zmax < 7) continue;
    const i0 = Math.min(...comp.map(x => x.i)), i1 = Math.max(...comp.map(x => x.i)), j0 = Math.min(...comp.map(x => x.j)), j1 = Math.max(...comp.map(x => x.j));
    /* Schmaler Streifen am Rand (Himmel, Firstziegel, Ortgang, ungenaue Ecke) ist keine Störstelle */
    const edge = comp.some(q => [[-1, 0], [1, 0], [0, -1], [0, 1]].some(([di, dj]) => !at(q.i + di, q.j + dj)));
    const lw = i1 - i0 + 1, lh = j1 - j0 + 1, fill = comp.length / (lw * lh);
    if (edge && (Math.min(lw, lh) <= 3 && Math.max(lw, lh) >= 4 * Math.min(lw, lh) || fill < 0.25)) continue;
    rects.push({ x0: i0 * cs - OBS_PAD, y0: j0 * cs - OBS_PAD, x1: (i1 + 1) * cs + OBS_PAD, y1: (j1 + 1) * cs + OBS_PAD, n: comp.length });
  }
  /* Unplausibel viel gefunden (z. B. zweifarbiges Dach): lieber nichts aussparen */
  if (hot.length > cells.length * 0.3) return { rects: [], unsure: true };
  /* Überlappende Rechtecke zusammenfassen */
  let merged = true;
  while (merged) {
    merged = false;
    for (let a = 0; a < rects.length && !merged; a++) for (let b = a + 1; b < rects.length && !merged; b++) {
      const A = rects[a], B = rects[b];
      if (A.x0 < B.x1 && A.x1 > B.x0 && A.y0 < B.y1 && A.y1 > B.y0) { rects[a] = { x0: Math.min(A.x0, B.x0), y0: Math.min(A.y0, B.y0), x1: Math.max(A.x1, B.x1), y1: Math.max(A.y1, B.y1), n: A.n + B.n }; rects.splice(b, 1); merged = true; }
    }
  }
  return { rects: rects.map(r => ({ x0: +r.x0.toFixed(3), y0: +r.y0.toFixed(3), x1: +r.x1.toFixed(3), y1: +r.y1.toFixed(3) })) };
}
/* Störstellen der Fläche – einmal je Foto/Geometrie suchen; vom Nutzer entfernte bleiben entfernt */
async function roofObs(f, g) {
  const k = obsKey(f);
  if (f.obsKey === k && Array.isArray(f.obs)) return { rects: f.obs, cached: true };
  const r = await roofObsDetect(f, g); if (!r) return { rects: [] };
  f.obs = r.rects; f.obsKey = k; return r;
}
const obsHit = (f, b) => (f.obs || []).some(o => b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0);

/* „Füllen“: wie bisher Reihen mittig, aber ohne Module auf Störstellen */
const _roofFillObs = roofFill;
roofFill = function (f, g) {
  const before = f.mods.length, n = _roofFillObs(f, g);
  if (!(f.obs || []).length) return n;
  const keep = f.mods.slice(0, before), add = f.mods.slice(before).filter(m => !obsHit(f, modBox(f, m)));
  f.mods = keep.concat(add); return add.length;
};

/* „Maximal“: so viele Module wie möglich – Reihen hochkant und/oder quer frei kombiniert (kein Raster/Magnet),
   in jeder Reihe die freien Stücke zwischen Störstellen einzeln dicht belegt. Rechnet in 1-cm-Schritten. */
function roofMaxPlan(f, g) {
  const ins = g.inset, yTop = Math.max(ins[1][1], ins[2][1]), yBot = Math.min(ins[0][1], ins[3][1]), GAP = ROOF_GAP, dy = 0.01;
  const O = { p: modWH(f, 'p'), l: modWH(f, 'l') }, obs = f.obs || [];
  const row = (y, o) => {
    const [w, h] = O[o]; if (y + h > yBot + 1e-6) return null;
    const a = xRange(ins, y + 1e-4), b = xRange(ins, y + h - 1e-4); if (!a || !b) return { n: 0, mods: [] };
    let iv = [[Math.max(a[0], b[0]), Math.min(a[1], b[1])]];
    for (const ob of obs) if (ob.y0 < y + h && ob.y1 > y) iv = iv.flatMap(([s, e]) => [[s, Math.min(e, ob.x0 - GAP)], [Math.max(s, ob.x1 + GAP), e]]).filter(([s, e]) => e - s >= w);
    const mods = [];
    for (const [s, e] of iv) { const k = Math.floor((e - s + GAP) / (w + GAP)); if (k < 1) continue; const st = s + (e - s - (k * w + (k - 1) * GAP)) / 2; for (let c = 0; c < k; c++) mods.push({ x: +(st + c * (w + GAP)).toFixed(4), y: +y.toFixed(4), o }); }
    return { n: mods.length, mods };
  };
  const N = Math.max(0, Math.floor((yBot - yTop) / dy)) + 1, best = new Float64Array(N + 1), pick = new Array(N + 1).fill(null);
  /* von unten nach oben: bester Wert ab Höhe y (eine Reihe legen oder 1 cm weiter) */
  for (let s = N - 1; s >= 0; s--) {
    const y = yTop + s * dy; best[s] = best[s + 1] - 1e-6; pick[s] = null;   // Lücke kostet minimal → Reihen bleiben dicht
    for (const o of ['p', 'l']) {
      const r = row(y, o); if (!r || !r.n) continue;
      const nxt = Math.min(N, s + Math.ceil((O[o][1] + GAP) / dy - 1e-9)), v = r.n + best[nxt] + (o === f.orient ? 1e-4 : 0);
      if (v > best[s] + 1e-9) { best[s] = v; pick[s] = [o, nxt, r.mods]; }
    }
  }
  const out = []; for (let s = 0; s < N;) { const p = pick[s]; if (!p) { s++; continue; } out.push(...p[2]); s = p[1]; }
  return out;
}

/* Zeichnen: Störstellen rot schraffiert im Belegungsplan */
const _roofDrawObs = roofDraw;
roofDraw = async function () {
  const r = await _roofDrawObs.apply(this, arguments);
  try {
    const cv = $('#roof-cv'); if (!cv || !RS) return r;
    const f = roofF(), g = faceGeom(f), V = RS.view;
    if (RS.step === 'mod' && g && !g.bad && V && V.kind !== 'img' && (f.obs || []).length && f.obsKey === obsKey(f)) {
      const x = cv.getContext('2d'), M = (a, b) => roofP2S(V, g, a, b);
      for (const o of f.obs) {
        const q = [[o.x0, o.y0], [o.x1, o.y0], [o.x1, o.y1], [o.x0, o.y1]].map(p => M(...p));
        x.save(); x.beginPath(); q.forEach((p, i) => (i ? x.lineTo(...p) : x.moveTo(...p))); x.closePath();
        x.fillStyle = 'rgba(229,72,77,.22)'; x.fill(); x.clip();
        const xs = q.map(p => p[0]), ys = q.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
        x.strokeStyle = 'rgba(229,72,77,.7)'; x.lineWidth = 1.2; x.beginPath(); for (let t = x0 - (y1 - y0); t < x1; t += 7) { x.moveTo(t, y1); x.lineTo(t + (y1 - y0), y0); } x.stroke(); x.restore();
        x.save(); x.strokeStyle = 'rgba(229,72,77,.95)'; x.lineWidth = 1.5; x.setLineDash([4, 3]); x.beginPath(); q.forEach((p, i) => (i ? x.lineTo(...p) : x.moveTo(...p))); x.closePath(); x.stroke(); x.restore();
      }
    }
    /* Feinjustier-Rad mittig auf der Dachfläche – weg von den Ecken, die man gerade setzt */
    const pad = $('#roof-pad');
    if (pad && !pad.classList.contains('hidden') && V && V.kind === 'img' && RS.act && f.corners) {
      const S = ([u, v]) => [V.ox + u * f.iw * V.k, V.oy + v * f.ih * V.k], cs = f.corners.map(S);
      const cx = cs.reduce((s, p) => s + p[0], 0) / 4, cy = cs.reduce((s, p) => s + p[1], 0) / 4;
      const pts = cs.concat(f.ref && RS.step === 'ref' ? f.ref.map(S) : []), cw = cv.clientWidth, ch = cv.clientHeight, pw = 96, ph = 118, R = 64;
      /* Platz suchen: so nah wie möglich an der Dachmitte, aber kein Eck- oder Referenzpunkt unter dem Rad */
      let best = null;
      for (let dy = -240; dy <= 240; dy += 12) for (let dx = -300; dx <= 300; dx += 12) {
        const x0 = cx + dx, y0 = cy + dy; if (x0 - pw / 2 < 8 || x0 + pw / 2 > cw - 8 || y0 - pw / 2 < 8 || y0 - pw / 2 + ph > ch - 8) continue;
        const free = Math.min(...pts.map(q => Math.hypot(q[0] - x0, q[1] - y0))), cost = Math.hypot(dx, dy) + (free < R ? 10000 - free * 50 : 0);
        if (!best || cost < best[2]) best = [x0, y0, cost];
      }
      const L = best ? best[0] - pw / 2 : Math.max(8, Math.min(cw - pw - 8, cx - pw / 2)), T = best ? best[1] - pw / 2 : Math.max(8, Math.min(ch - ph - 8, cy - pw / 2));
      Object.assign(pad.style, { left: L + 'px', top: T + 'px', right: '', bottom: '' });
    }
  } catch (e) {}
  return r;
};

/* Knöpfe: Füllen (mit Störstellen) und Maximal */
document.addEventListener('click', async e => {
  const a = e.target.closest && e.target.closest('#roof-ed [data-r="fill"],#roof-ed [data-r="maxfill"]'); if (!a || !RS) return;
  e.stopImmediatePropagation(); e.preventDefault();
  const f = roofF(), g = faceGeom(f); if (!g || g.bad) return;
  const busy = a.innerHTML; a.disabled = true;
  let o = { rects: [] }; try { o = await roofObs(f, g); } catch (err) { o = { rects: [] }; }
  a.disabled = false; a.innerHTML = busy;
  const so = o.unsure ? ' Störstellen waren nicht sicher erkennbar – bitte selbst prüfen.' : (f.obs || []).length ? ` ${f.obs.length} Störstelle${f.obs.length > 1 ? 'n' : ''} ausgespart (rot).` : '';
  if (a.dataset.r === 'fill') {
    roofHist(); const n = roofFill(f, g); roofSave(); roofSoft();
    return toast((n ? `${n} Module ergänzt.` : 'Kein freier Platz mehr für weitere Module.') + so, 'ok', 4500);
  }
  const plan = roofMaxPlan(f, g), had = f.mods.length;
  if (!plan.length) return toast('Hier passt kein Modul hin – Randabstände und Störstellen prüfen.', 'warn');
  if (had && plan.length < had && !(await confirmDlg('Weniger als jetzt?', `Die freie Maximal-Belegung ergibt ${plan.length} Module – jetzt liegen ${had}. Trotzdem ersetzen?`, 'Ersetzen', false))) return;
  roofHist(); f.mods = plan; RS.sel = new Set(); try { roofCleanStrs(roofP()); } catch (err) {} roofSave(); roofSoft();
  const q = plan.filter(m => m.o === 'l').length, h = plan.length - q;
  toast(`Maximal: ${plan.length} Module${had ? ` (vorher ${had})` : ''}${q && h ? ` – ${h} hochkant, ${q} quer` : ''}.${so}`, 'ok', 5000);
}, true);

/* Störstelle antippen (Werkzeug „Auswählen“, kein Modul darunter) = entfernen */
document.addEventListener('pointerdown', async e => {
  if (!RS || RS.step !== 'mod' || RS.mode !== 'select' || !e.target || e.target.id !== 'roof-cv') return;
  const f = roofF(), g = faceGeom(f), V = RS.view; if (!g || !V || !(f.obs || []).length) return;
  const r = e.target.getBoundingClientRect(), [X, Y] = roofS2P(V, g, e.clientX - r.left, e.clientY - r.top);
  if (f.mods.some(m => { const b = modBox(f, m); return X >= b.x0 && X <= b.x1 && Y >= b.y0 && Y <= b.y1; })) return;
  const i = f.obs.findIndex(o => X >= o.x0 && X <= o.x1 && Y >= o.y0 && Y <= o.y1); if (i < 0) return;
  e.stopImmediatePropagation(); e.preventDefault();
  if (!(await confirmDlg('Störstelle entfernen?', 'Die rote Fläche wird beim nächsten „Füllen“ bzw. „Maximal“ wieder belegt.', 'Entfernen', false))) return;
  f.obs.splice(i, 1); roofSave(); roofDraw();
}, true);
