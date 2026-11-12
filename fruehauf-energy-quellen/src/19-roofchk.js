/* ---------- Modulplan: Pfanne & Deckmaß grob prüfen ----------
   Ein Foto hat keinen Maßstab – das Deckmaß lässt sich nicht messen, aber plausibilisieren:
   1. Muster: Doppelmulde, einfache Welle, flach oder Biber (versetzt) → passende Pfannengruppe
   2. Seitenverhältnis: aus der Perspektive des Referenz-Rechtecks (Kamera-Modell) und den gezählten
      Pfannen ergibt sich Breite : Länge einer Pfanne → passt es zur gewählten Pfanne?
   3. Dachfenster (beim Füllen erkannt) als grober Maßstab – siehe roofSkyCheck. */
const TILE_GROUPS = { doppel: ['frankfurter', 'doppels', 'harzer'], einfach: ['hohlfalz', 'reform'], flach: ['tegalit'], biber: ['biber'] };
const TILE_GL = { doppel: 'Doppelmulde (z. B. Frankfurter, Doppel-S, Harzer)', einfach: 'einfache Welle (z. B. Hohlfalz, Reform)', flach: 'flache Pfanne (z. B. Tegalit)', biber: 'Biberschwanz (versetzt)' };

/* 2. Wahres Seitenverhältnis (Breite : Hanglänge) des Referenz-Rechtecks – Bildmitte als Hauptpunkt */
function roofRefAspect(f) {
  if (!f.ref || !f.iw) return null;
  const cx = f.iw / 2, cy = f.ih / 2, diag = Math.hypot(f.iw, f.ih);
  const m = sqToQuad(f.ref.map(([u, v]) => [u * f.iw - cx, v * f.ih - cy]));
  const h1 = [m[0], m[3], m[6]], h2 = [m[1], m[4], m[7]];
  const ar = F => Math.sqrt((h1[0] ** 2 + h1[1] ** 2) / (F * F) + h1[2] ** 2) / Math.sqrt((h2[0] ** 2 + h2[1] ** 2) / (F * F) + h2[2] ** 2);
  const f2 = -(h1[0] * h2[0] + h1[1] * h2[1]) / (h1[2] * h2[2]), Fs = f2 > 0 ? Math.sqrt(f2) : 0;
  if (+f.f35 > 8 && +f.f35 < 300) {   // Brennweite aus dem Foto (EXIF, Kleinbild-äquivalent)
    const F = +f.f35 / 43.27 * diag, r = ar(F), a = ar(F * 0.92), b = ar(F * 1.08);
    return { r, sure: true, f: F / diag, exif: true, spread: Math.max(a, b) / Math.min(a, b) };
  }
  if (Fs > 0.3 * diag && Fs < 2 * diag) {   // Brennweite aus der Perspektive selbst bestimmbar
    const r = ar(Fs), lo = ar(Fs * 0.8), hi = ar(Fs * 1.25);
    return { r, sure: Math.max(lo, hi) / Math.min(lo, hi) < 1.2, f: Fs / diag };
  }
  const r = ar(0.6 * diag), a = ar(0.42 * diag), b = ar(0.9 * diag);   // übliche Handy-Hauptkamera
  return { r, sure: Math.max(a, b) / Math.min(a, b) < 1.12, f: 0.6 };
}

/* 1. Muster im entzerrten Referenzbereich */
async function roofTilePattern(f) {
  const nx = Math.round(+f.nx || 0), ny = Math.round(+f.ny || 0); if (nx < 3 || ny < 2) return null;
  const img = await roofImg(f.photo); if (!img || !f.ref) return null;
  const sc = Math.min(1, 2000 / Math.max(img.naturalWidth, img.naturalHeight)), sw = Math.round(img.naturalWidth * sc), sh = Math.round(img.naturalHeight * sc);
  const c = document.createElement('canvas'); c.width = sw; c.height = sh; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, sw, sh);
  const d = x.getImageData(0, 0, sw, sh).data, H = sqToQuad(f.ref.map(([u, v]) => [u * sw, v * sh]));
  const W = Math.min(1600, nx * 16), Hh = Math.min(1200, ny * 16), lum = new Float32Array(W * Hh);
  for (let j = 0; j < Hh; j++) for (let i = 0; i < W; i++) {
    const [px, py] = hApply(H, (i + 0.5) / W, (j + 0.5) / Hh), k = (Math.min(sh - 1, Math.max(0, py | 0)) * sw + Math.min(sw - 1, Math.max(0, px | 0))) * 4;
    lum[j * W + i] = d[k] * 0.3 + d[k + 1] * 0.59 + d[k + 2] * 0.11;
  }
  const prof = (rows, cols) => { const p = new Float64Array(cols ? W : Hh); for (let j = 0; j < Hh; j++) { if (rows && !rows(j)) continue; for (let i = 0; i < W; i++) p[cols ? i : j] += lum[j * W + i]; } const m = p.reduce((a, b) => a + b, 0) / p.length; return p.map(v => v - m); };
  const pw = (p, k) => { let best = 0; for (let kk = k * 0.97; kk <= k * 1.03; kk += k / 200) { let a = 0, b = 0; for (let i = 0; i < p.length; i++) { const t = 2 * Math.PI * kk * i / p.length; a += p[i] * Math.cos(t); b += p[i] * Math.sin(t); } best = Math.max(best, a * a + b * b); } const e = p.reduce((s, v) => s + v * v, 0) || 1; return best / (e * p.length / 2); };
  const col = prof(null, true), row = prof(null, false);
  const sd = p => Math.sqrt(p.reduce((s, v) => s + v * v, 0) / p.length);
  /* versetzte Reihen (Biber): gerade und ungerade Reihen um eine halbe Pfanne verschoben */
  const rh = Hh / ny, even = prof(j => Math.floor(j / rh) % 2 === 0, true), odd = prof(j => Math.floor(j / rh) % 2 === 1, true);
  const corr = s => { let a = 0, n1 = 0, n2 = 0; for (let i = 0; i < W; i++) { const o = odd[(i + s + W) % W]; a += even[i] * o; n1 += even[i] ** 2; n2 += o * o; } return a / Math.sqrt(n1 * n2 || 1); };
  const tw = W / nx, c0 = corr(0), cHalf = corr(Math.round(tw / 2));
  const p1 = pw(col, nx), p2 = pw(col, 2 * nx), p3 = pw(col, 3 * nx), flat = sd(col) / (sd(row) || 1);
  /* Doppelmulde: zweite Oberwelle dominiert; einfache Welle: Grundwelle dominiert;
     flach: nur schmale Fugen → alle Oberwellen etwa gleich schwach */
  let kind = null;
  if (cHalf > 0.25 && cHalf > c0 + 0.25) kind = 'biber';
  else if (p1 + p2 + p3 < 0.03) kind = null;                       // kein Pfannenmuster bei dieser Anzahl
  else if (p2 > 2 * p1 && p2 > 1.5 * p3) kind = 'doppel';
  else if (p1 > 2 * p2 && p1 > 1.5 * p3) kind = 'einfach';
  else if (Math.max(p1, p2, p3) < 0.35) kind = 'flach';
  return { kind, p1, p2, p3, flat, c0, cHalf };
}

async function roofTileCheck(f) {
  const tiles = roofTiles(), t = tiles.find(x => x.id === f.tileId) || tiles[0], nx = +f.nx || 0, ny = +f.ny || 0;
  const out = { key: JSON.stringify([f.photo, f.ref, f.nx, f.ny, f.tileId, t.w, t.l]), lines: [], sugg: null };
  let pat = null; try { pat = await roofTilePattern(f); } catch (e) {}
  const asp = roofRefAspect(f);
  /* 1. Muster */
  if (pat && !pat.kind) out.lines.push({ ok: false, t: 'Muster: bei dieser Pfannenzahl kein regelmäßiges Pfannenmuster erkennbar – bitte Anzahl prüfen (gelbes Raster).' });
  if (pat && pat.kind) {
    const fits = (TILE_GROUPS[pat.kind] || []).includes(t.id) || t.id === 'custom';
    out.lines.push({ ok: fits, t: `Muster: ${TILE_GL[pat.kind]}${fits ? ' – passt zur Auswahl.' : ` – gewählt ist „${t.name}“.`}` });
    if (!fits) out.sugg = tiles.find(x => x.id === TILE_GROUPS[pat.kind][0]);
  }
  /* 2. Seitenverhältnis einer Pfanne (Breite : Länge) */
  if (asp && nx > 0 && ny > 0) {
    const m = asp.r * ny / nx, e = t.w / t.l, q = m / e;
    const near = tiles.filter(x => x.id !== 'custom').map(x => ({ x, d: Math.abs(Math.log(m / (x.w / x.l))) })).sort((a, b) => a.d - b.d)[0];
    let ok = q > 0.85 && q < 1.18, txt = `Seitenverhältnis: Pfanne wirkt etwa ${num(m, 2)} : 1 (Breite : Länge), erwartet ${num(e, 2)} : 1`;
    if (ok) txt += ' – passt.';
    else if (q > 0.42 && q < 0.58) { txt += ' – vermutlich doppelt gezählt (Mulden statt Pfannen). Bitte „÷2“ prüfen.'; out.sugg = null; out.cnt = true; }
    else if (q > 1.7 && q < 2.35) { txt += ' – vermutlich nur jede zweite Pfanne gezählt. Bitte „×2“ prüfen.'; out.sugg = null; out.cnt = true; }
    else if (near && near.d < 0.12 && near.x.id !== t.id) { txt += ` – passt eher zu „${near.x.name}“ (${num(near.x.w, 1)} × ${num(near.x.l, 1)} cm).`; if (!out.sugg || (pat && TILE_GROUPS[pat.kind].includes(near.x.id))) out.sugg = near.x; }
    else txt += ' – bitte Pfannenzahl, Reihen und Deckmaß prüfen.';
    if (!asp.sure) { txt += asp.exif ? ' (Perspektive schwach – nur grobe Aussage.)' : ' (Brennweite des Fotos unbekannt – nur grobe Aussage. Am genauesten: Foto direkt mit der Kamera, 1×, kein 0,5×.)'; ok = ok || null; }
    out.lines.push({ ok, t: txt });
  }
  if (out.cnt && out.lines[0] && /^Muster/.test(out.lines[0].t)) out.lines[0] = { ok: null, t: out.lines[0].t.replace(/ – gewählt ist.*$/, ' – nach dem Korrigieren der Anzahl neu prüfen.') };
  /* 3. Dachfenster als Maßstab (aus dem letzten „Füllen“) */
  if (f.skyChk && f.skyChk.key === obsKeyChk(f)) out.lines.push({ ok: f.skyChk.ok, t: f.skyChk.t });
  if (!out.lines.length) out.lines.push({ ok: null, t: 'Für die Prüfung bitte zuerst Pfannen und Reihen zählen.' });
  return out;
}
const obsKeyChk = f => JSON.stringify([f.photo, f.corners, f.ref, f.refMode, f.nx, f.ny, f.lw, f.lh, f.tileId, f.kx, f.ky]);

/* 3. Dachfenster als grober Maßstab: übliche Breiten (Außenmaß) 55 / 66 / 78 / 94 / 114 / 134 cm */
function roofSkyCheck(f, g) {
  const ins = g.inset, top = Math.min(ins[1][1], ins[2][1]), PAD = typeof OBS_PAD === 'number' ? OBS_PAD : 0.1;
  const c = (f.obs || []).map(o => ({ o, w: o.x1 - o.x0 - 2 * PAD, h: o.y1 - o.y0 - 2 * PAD }))
    .filter(({ o, w, h }) => o.y0 + PAD > top + 0.3 && w >= 0.4 && w <= 1.7 && h >= 0.5 && h <= 2 && h / w > 0.6 && h / w < 2.8)
    .sort((a, b) => b.w * b.h - a.w * a.h)[0];
  if (!c) return null;
  const w = Math.max(0.3, c.w - 0.1), STD = [0.55, 0.66, 0.78, 0.94, 1.14, 1.34], n = STD.reduce((a, b) => Math.abs(b - w) < Math.abs(a - w) ? b : a);
  const ok = Math.abs(n - w) <= 0.15 && w <= 1.45;
  return { key: obsKeyChk(f), ok, t: ok ? `Dachfenster: grob ${num(w * 100, 0)} cm breit – liegt bei einer üblichen Größe (z. B. ${num(n * 100, 0)} cm). Maßstab wirkt plausibel.`
    : `Dachfenster: grob ${num(w * 100, 0)} cm breit – ungewöhnlich. Bitte Pfannenzahl und Deckmaß prüfen.` };
}

/* Anzeige im Schritt „Referenz“ */
const _roofPanelChk = roofPanel;
roofPanel = function (p, f, g) {
  let h = _roofPanelChk(p, f, g);
  if (!RS || RS.step !== 'ref' || f.refMode === 'len') return h;
  const r = RS.tchk && RS.tchk.fi === RS.fi ? RS.tchk : null, cur = r && r.key === JSON.stringify([f.photo, f.ref, f.nx, f.ny, f.tileId, ...(() => { const t = roofTiles().find(x => x.id === f.tileId) || roofTiles()[0]; return [t.w, t.l]; })()]);
  const card = `<div class="mt-2 rounded-[calc(var(--r)-4px)] border border-line p-3"><div class="flex items-center justify-between gap-2"><div class="text-[13px] font-semibold">Pfanne &amp; Deckmaß prüfen</div><button type="button" class="chip !h-8 !px-3 text-[12.5px] whitespace-nowrap shrink-0" data-r="tilechk">${ic('sparkle', 14)}${r ? 'Neu prüfen' : 'Prüfen'}</button></div>
    ${r ? `<div class="mt-2 space-y-1.5 ${cur ? '' : 'opacity-50'}">${r.lines.map(l => `<div class="flex gap-2 text-[12.5px] leading-snug"><span class="shrink-0" style="color:${l.ok === true ? '#2E9E6A' : l.ok === false ? '#C7792F' : 'var(--ink3)'}">${l.ok === true ? '✓' : l.ok === false ? '!' : '·'}</span><span>${esc(l.t)}</span></div>`).join('')}</div>
      ${r.sugg && r.sugg.id !== f.tileId && cur ? `<button type="button" class="btn-s w-full mt-2 !h-auto py-2 text-[13px] whitespace-normal text-center leading-snug" data-r="tileuse" data-v="${r.sugg.id}">${esc(r.sugg.name)} übernehmen<br><span class="text-ink3 text-[12px]">${num(r.sugg.w, 1)} × ${num(r.sugg.l, 1)} cm</span></button>` : ''}
      ${cur ? '' : '<div class="text-[12px] text-ink3 mt-1">Angaben geändert – bitte neu prüfen.</div>'}` : '<div class="text-[12px] text-ink3 mt-1">Erkennt grob die Pfannenart und prüft, ob Deckmaß und Anzahl zum Foto passen.</div>'}
    <div class="text-[11.5px] text-ink3 mt-2">Nur eine Schätzung – das Deckmaß bitte vor Ort (Zollstock) oder im Datenblatt bestätigen.</div></div>`;
  return h.replace('<button class="btn-g w-full mt-1" data-r="numtiles">', card + '<button class="btn-g w-full mt-1" data-r="numtiles">');
};
async function roofRunTileCheck() {
  if (!RS) return; const f = roofF();
  try { const r = await roofTileCheck(f); RS.tchk = { ...r, fi: RS.fi }; } catch (e) { RS.tchk = { fi: RS.fi, key: '', lines: [{ ok: null, t: 'Prüfung hat nicht geklappt.' }] }; }
  roofSoft();
}
document.addEventListener('click', async e => {
  const a = e.target.closest && e.target.closest('#roof-ed [data-r="tilechk"],#roof-ed [data-r="tileuse"]'); if (!a || !RS) return;
  e.preventDefault(); e.stopImmediatePropagation();
  if (a.dataset.r === 'tileuse') { const f = roofF(); f.tileId = a.dataset.v; RS.warp = null; roofSave(); toast('Pfannentyp übernommen – Deckmaß bitte vor Ort bestätigen.', 'ok', 4000); return roofRunTileCheck(); }
  a.disabled = true; a.textContent = 'Prüfe …'; await roofRunTileCheck();
}, true);
/* Nach „Automatisch zählen“ gleich mitprüfen */
const _roofAutoCountChk = roofAutoCount;
roofAutoCount = async function (f) { const r = await _roofAutoCountChk(f); if (r) setTimeout(() => { if (RS && RS.step === 'ref') roofRunTileCheck(); }, 2900); return r; };

/* Brennweite (Kleinbild-äquivalent) aus den EXIF-Daten des Originalfotos lesen – vor dem Verkleinern */
async function roofExifF35(file) {
  try {
    const v = new DataView(await file.slice(0, 256 * 1024).arrayBuffer()); if (v.getUint16(0) !== 0xFFD8) return null;
    let o = 2;
    while (o + 4 < v.byteLength) {
      const mk = v.getUint16(o), len = v.getUint16(o + 2);
      if (mk === 0xFFE1 && v.getUint32(o + 4) === 0x45786966) {
        const t = o + 10, le = v.getUint16(t) === 0x4949, u16 = p => v.getUint16(p, le), u32 = p => v.getUint32(p, le);
        const ifd = (p, want) => { const n = u16(p); for (let i = 0; i < n; i++) { const e = p + 2 + i * 12; if (u16(e) === want) return e; } return 0; };
        const e0 = ifd(t + u32(t + 4), 0x8769); if (!e0) return null;
        const ex = t + u32(e0 + 8), e1 = ifd(ex, 0xA405); if (e1) { const val = u16(e1 + 8); if (val) return val; }
        return null;
      }
      if ((mk & 0xFF00) !== 0xFF00) break; o += 2 + len;
    }
  } catch (e) {}
  return null;
}
const _roofPhotoChk = roofPhoto;
roofPhoto = async function (file) {
  const f35 = await roofExifF35(file), ph = await _roofPhotoChk(file);
  setTimeout(() => { try { if (RS) { const f = roofF(); if (f.photo === ph.id) { f.f35 = f35 || null; roofSave(); } } } catch (e) {} }, 0);
  return ph;
};
