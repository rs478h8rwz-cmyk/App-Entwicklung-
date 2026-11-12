/* ---------- Modulplan: Maße mit der Karte abgleichen ----------
   Über die Adresse des Kunden oder den eigenen Standort holt lumbra.desk den Hausumriss aus OpenStreetMap
   (Server-Schnittstelle „haus“). Die App vergleicht die Trauflänge aus dem Foto mit der Hauslänge (+ Dachüberstand)
   und die Hanglänge mit der halben Hausbreite (Satteldach). Passt es nicht, lässt sich der Maßstab anpassen. */
if (!IP.pin) IP.pin = '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>';
const GEO_OVER = 0.6;   // Dachüberstand an den Giebeln zusammen (2 × ca. 30 cm)

function geoLocal(pts, lat0, lon0) { const k = Math.cos(lat0 * Math.PI / 180) * 111320; return pts.map(([la, lo]) => [(lo - lon0) * k, (la - lat0) * 110540]); }
function geoHull(P) {
  const p = [...P].sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = []; for (const q of p) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
/* kleinstes umschließendes Rechteck → Länge × Breite des Hauses */
function geoRect(P) {
  const h = geoHull(P); let best = null;
  for (let i = 0; i < h.length; i++) {
    const a = h[i], b = h[(i + 1) % h.length], t = Math.atan2(b[1] - a[1], b[0] - a[0]), c = Math.cos(t), s = Math.sin(t);
    const xs = h.map(q => q[0] * c + q[1] * s), ys = h.map(q => -q[0] * s + q[1] * c), w = Math.max(...xs) - Math.min(...xs), hh = Math.max(...ys) - Math.min(...ys);
    if (!best || w * hh < best.a) best = { a: w * hh, L: Math.max(w, hh), B: Math.min(w, hh) };
  }
  return best;
}
const geoInPoly = (P, [x, y]) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };

async function roofGeoLoad(params) {
  const r = await ldApi('haus&' + new URLSearchParams(params).toString());
  if (!r.ok) throw new Error((r.j && r.j.error) || (r.status === 401 ? 'Bitte in lumbra.desk anmelden.' : 'Kartendienst nicht erreichbar.'));
  const d = r.j, list = d.buildings.map(b => { const P = geoLocal(b.pts, d.lat, d.lon), R = geoRect(P), cx = P.reduce((s, q) => s + q[0], 0) / P.length, cy = P.reduce((s, q) => s + q[1], 0) / P.length; return { P, L: R.L, B: R.B, area: R.a, d: Math.hypot(cx, cy), inside: geoInPoly(P, [0, 0]), typ: b.typ }; });
  if (!list.length) throw new Error('An dieser Stelle ist kein Gebäude in der Karte eingetragen – bitte selbst messen.');
  const main = list.filter(b => b.area > 30), pick = (main.find(b => b.inside) || [...(main.length ? main : list)].sort((a, b) => a.d - b.d)[0]);
  RS.geoList = { name: d.name, list, fi: RS.fi };
  const f = roofF(); f.geo = { ...(f.geo || {}), name: d.name, L: +pick.L.toFixed(2), B: +pick.B.toFixed(2), sel: list.indexOf(pick) }; roofSave();
}

/* Vergleich Foto ↔ Karte */
function roofGeoEval(f) {
  const G = f.geo || {}, g0 = faceGeom({ ...f, kx: 1, ky: 1 }), g = faceGeom(f); if (!g0 || g0.bad) return null;
  const man = +G.man > 0 ? +G.man : 0, wall = G.side === 'kurz' ? G.B : G.L, depth = G.side === 'kurz' ? G.L : G.B;
  if (!man && !(wall > 0)) return null;
  const expE = man || wall + GEO_OVER, kx = expE / g0.eave, out = { lines: [], kx: null, ky: null };
  const q = g.eave / expE, okE = q > 0.92 && q < 1.09;
  out.lines.push({ ok: okE, t: `Traufe laut Foto ${num(g.eave, 2)} m – ${man ? 'selbst gemessen' : `Haus laut Karte ${num(wall, 1)} m + ca. ${num(GEO_OVER, 1)} m Überstand =`} ${num(expE, 1)} m${okE ? ' – passt.' : ` – weicht ${num(Math.abs(q - 1) * 100, 0)} % ab.`}` });
  if (!okE) {
    const k = kx, t = roofTiles().find(x => x.id === f.tileId) || roofTiles()[0];
    if (k > 0.42 && k < 0.58) out.lines.push({ ok: null, t: 'Sieht aus, als wären doppelt so viele Pfannen gezählt (Mulden statt Pfannen) – „÷2“ prüfen.' });
    else if (k > 1.7 && k < 2.35) out.lines.push({ ok: null, t: 'Sieht aus, als wäre nur jede zweite Pfanne gezählt – „×2“ prüfen.' });
    else if (f.refMode !== 'len') out.lines.push({ ok: null, t: `Passt zu einer Deckbreite von ca. ${num(t.w * k, 1)} cm statt ${num(t.w, 1)} cm – Pfannentyp/Deckbreite prüfen.` });
    out.kx = +k.toFixed(4);
  }
  /* Hanglänge (Satteldach, Traufe an der langen Seite): halbe Hausbreite + Überstand, je nach Neigung */
  if (!man && depth > 0) {
    const run = depth / 2 + 0.4, pt = +G.pitch > 0 && +G.pitch < 75 ? +G.pitch : 0, cos = a => Math.cos(a * Math.PI / 180);
    const lo = pt ? run / cos(pt) * 0.95 : run / cos(25), hi = pt ? run / cos(pt) * 1.05 : run / cos(52);
    const okS = g.slope >= lo && g.slope <= hi;
    out.lines.push({ ok: okS ? true : null, t: `Hanglänge laut Foto ${num(g.slope, 2)} m – bei Satteldach ${pt ? `und ${num(pt, 0)}° Neigung ca. ${num(run / cos(pt), 1)} m` : `und 25–52° Neigung ${num(lo, 1)}–${num(hi, 1)} m`}${okS ? ' – passt.' : ' – bitte prüfen (Walmdach, Gaube oder andere Dachform? Dann gilt das nicht).'}` });
    if (pt && !okS) out.ky = +((run / cos(pt)) / g0.slope).toFixed(4);
  }
  return out;
}

function roofGeoCard(p, f) {
  const G = f.geo || {}, L = RS.geoList && RS.geoList.fi === RS.fi ? RS.geoList : null, ev = roofGeoEval(f), c = p.customer || {};
  const adr = [c.street, [c.zip, c.city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  let svg = '';
  if (L) {
    const all = L.list.flatMap(b => b.P), xs = all.map(q => q[0]), ys = all.map(q => q[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), pad = 3;
    svg = `<svg viewBox="${x0 - pad} ${-y1 - pad} ${x1 - x0 + 2 * pad} ${y1 - y0 + 2 * pad}" class="w-full mt-2 rounded-lg bg-raised" style="height:150px">${L.list.map((b, i) => `<path data-r="geosel" data-v="${i}" d="M${b.P.map(q => `${q[0].toFixed(2)},${(-q[1]).toFixed(2)}`).join('L')}Z" style="cursor:pointer;fill:${i === G.sel ? 'rgb(var(--p-rgb)/.45)' : 'rgba(140,150,160,.25)'};stroke:${i === G.sel ? 'rgb(var(--p-rgb))' : 'rgba(140,150,160,.7)'};stroke-width:${(x1 - x0) / 220}"/>`).join('')}<circle cx="0" cy="0" r="${(x1 - x0) / 90}" fill="#E5484D"/></svg>
      <div class="text-[11.5px] text-ink3 mt-1">Roter Punkt = Adresse/Standort. Anderes Haus? Einfach antippen.</div>`;
  }
  const kOn = (+f.kx > 0 && +f.kx !== 1) || (+f.ky > 0 && +f.ky !== 1);
  return `<div class="mt-3 rounded-[calc(var(--r)-4px)] border border-line p-3" id="roof-geo"><div class="text-[13px] font-semibold">Mit Karte abgleichen</div>
    <div class="text-[12px] text-ink3 mt-0.5">Prüft die Dachmaße am echten Hausumriss (OpenStreetMap) – passt die Länge vom Haus?</div>
    <div class="grid grid-cols-2 gap-2 mt-2"><button type="button" class="btn-s !h-9 text-[12.5px]" data-r="geoadr" ${adr ? '' : 'disabled'}>${ic('home', 14)}Kundenadresse</button><button type="button" class="btn-s !h-9 text-[12.5px]" data-r="geopos">${ic('pin', 14)}Mein Standort</button></div>
    ${adr ? `<div class="text-[11.5px] text-ink3 mt-1 truncate">${esc(adr)}</div>` : '<div class="text-[11.5px] text-ink3 mt-1">Beim Kunden ist keine Adresse eingetragen – Standort nutzen oder selbst messen.</div>'}
    ${svg}
    ${G.L ? `<div class="text-[12.5px] mt-2">Haus laut Karte: <b>${num(G.L, 1)} × ${num(G.B, 1)} m</b> (Außenwände)</div>
      <div class="seg mt-2 w-full">${[['lang', 'Traufe an langer Seite'], ['kurz', 'an kurzer Seite']].map(([k, l]) => `<button type="button" class="flex-1 !text-[12px] ${(G.side || 'lang') === k ? 'on' : ''}" data-r="geoside" data-v="${k}">${l}</button>`).join('')}</div>` : ''}
    <div class="grid grid-cols-2 gap-2 mt-2"><label><span class="text-[11px] text-ink3">Oder selbst gemessen: Traufe</span><div class="relative"><input class="inp pr-8" inputmode="decimal" data-geo="man" value="${+G.man > 0 ? inputFmt(+G.man, 'n') : ''}" placeholder="z. B. Google Maps"><span class="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-ink4">m</span></div></label>
      <label><span class="text-[11px] text-ink3">Dachneigung (falls bekannt)</span><div class="relative"><input class="inp pr-8" inputmode="decimal" data-geo="pitch" value="${+G.pitch > 0 ? inputFmt(+G.pitch, 'n') : ''}"><span class="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-ink4">°</span></div></label></div>
    ${ev ? `<div class="mt-2 space-y-1.5">${ev.lines.map(l => `<div class="flex gap-2 text-[12.5px] leading-snug"><span class="shrink-0" style="color:${l.ok === true ? '#2E9E6A' : l.ok === false ? '#C7792F' : 'var(--ink3)'}">${l.ok === true ? '✓' : l.ok === false ? '!' : '·'}</span><span>${esc(l.t)}</span></div>`).join('')}</div>
      ${ev.kx || ev.ky ? `<button type="button" class="btn-p w-full mt-2 !h-10 text-[13px]" data-r="geoapply">Maßstab an ${+G.man > 0 ? 'Messung' : 'Karte'} anpassen</button>` : ''}` : ''}
    ${kOn ? `<div class="flex items-center justify-between gap-2 mt-2 text-[12px] rounded-lg bg-raised px-3 py-2"><span>Maßstab angepasst: Breite ×${num(+f.kx || 1, 2)}${+f.ky > 0 && +f.ky !== 1 ? `, Hang ×${num(+f.ky, 2)}` : ''}</span><button type="button" class="chip !h-7 !px-2 text-[11.5px]" data-r="georeset">Zurücksetzen</button></div>` : ''}
    <div class="text-[11px] text-ink3 mt-2">Kartendaten © OpenStreetMap-Mitwirkende. Die Adresse wird dafür an OpenStreetMap gesendet.</div></div>`;
}

const _roofPanelGeo = roofPanel;
roofPanel = function (p, f, g) {
  const h = _roofPanelGeo(p, f, g); if (!RS || !g || g.bad || (RS.step !== 'ref' && RS.step !== 'mod')) return h;
  const card = roofGeoCard(p, f);
  return RS.step === 'ref' && h.includes('<div id="roof-dims"') ? h.replace('<div id="roof-dims"', card + '<div id="roof-dims"') : h + card;
};

document.addEventListener('click', async e => {
  const a = e.target.closest && e.target.closest('#roof-ed [data-r^="geo"]'); if (!a || !RS) return;
  e.preventDefault(); e.stopImmediatePropagation();
  const f = roofF(), r = a.dataset.r;
  if (r === 'geosel') { const b = RS.geoList && RS.geoList.list[+a.dataset.v]; if (b) { f.geo = { ...(f.geo || {}), L: +b.L.toFixed(2), B: +b.B.toFixed(2), sel: +a.dataset.v }; roofSave(); } return roofSoft(); }
  if (r === 'geoside') { f.geo = { ...(f.geo || {}), side: a.dataset.v }; roofSave(); return roofSoft(); }
  if (r === 'georeset') { f.kx = null; f.ky = null; RS.warp = null; roofSave(); toast('Maßstab wieder aus den Pfannen.'); return roofSoft(); }
  if (r === 'geoapply') {
    const ev = roofGeoEval(f); if (!ev) return;
    if (ev.kx) f.kx = ev.kx; if (ev.ky) f.ky = ev.ky; RS.warp = null; roofSave();
    toast(`Maßstab angepasst – Traufe jetzt ${num(faceGeom(f).eave, 2)} m. Bitte „Füllen“ bzw. „Maximal“ neu drücken.`, 'ok', 5000); return roofSoft();
  }
  const busy = a.innerHTML; a.disabled = true; a.textContent = 'Suche …';
  try {
    if (r === 'geoadr') { const c = roofP().customer || {}; await roofGeoLoad({ q: [c.street, c.zip, c.city].filter(Boolean).join(', ') }); }
    if (r === 'geopos') {
      const pos = await new Promise((res, rej) => navigator.geolocation ? navigator.geolocation.getCurrentPosition(res, () => rej(new Error('Standort nicht freigegeben – bitte in den Einstellungen erlauben oder die Adresse nutzen.')), { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }) : rej(new Error('Standort ist auf diesem Gerät nicht verfügbar.')));
      await roofGeoLoad({ lat: pos.coords.latitude.toFixed(6), lon: pos.coords.longitude.toFixed(6) });
    }
    roofSoft(); const el = $('#roof-geo'); if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  } catch (err) { a.disabled = false; a.innerHTML = busy; toast(err.message, 'warn', 5000); }
}, true);
document.addEventListener('change', e => {
  const el = e.target; if (!RS || !el.dataset || !el.dataset.geo || !el.closest('#roof-ed')) return;
  const f = roofF(), v = parseFloat(String(el.value).replace(',', '.')); f.geo = { ...(f.geo || {}), [el.dataset.geo]: isFinite(v) && v > 0 ? v : null }; roofSave(); roofSoft();
});
