/* Wetter und Jahreszeit für das Start-Haus.
   Regler „Echte Wetterdaten“: holt das aktuelle Wetter (Open-Meteo, ohne Konto) für den
   Handy-Standort oder die Firmen-PLZ. Aus: Wetter und Jahreszeit selbst wählen. */
const WX_KINDS = [['sun', 'Sonne'], ['cloud', 'Bewölkt'], ['rain', 'Regen'], ['snow', 'Schnee'], ['wind', 'Wind'], ['storm', 'Gewitter'], ['fog', 'Nebel']];
const WX_SEASONS = [['auto', 'Automatisch'], ['spring', 'Frühling'], ['summer', 'Sommer'], ['autumn', 'Herbst'], ['winter', 'Winter']];
const WX_LABEL = Object.fromEntries(WX_KINDS);
const WX = { live: null, busy: false, err: '' };
try { WX.live = JSON.parse(localStorage.getItem('wxLive') || 'null'); } catch (e) {}

const seasonNow = () => { const m = new Date().getMonth() + 1; return m <= 2 || m === 12 ? 'winter' : m <= 5 ? 'spring' : m <= 8 ? 'summer' : 'autumn'; };
const wxLiveOn = () => PERSONAL.wxMode !== 'preset';
function wxState() {
  const live = wxLiveOn();
  const kind = live ? (WX.live && WX.live.kind) || 'sun' : PERSONAL.wxKind || 'sun';
  const season = live || !PERSONAL.wxSeason || PERSONAL.wxSeason === 'auto' ? seasonNow() : PERSONAL.wxSeason;
  const d = new Date(), md = (d.getMonth() + 1) * 100 + d.getDate();
  const xmas = PERSONAL.xmas === 'on' || (PERSONAL.xmas !== 'off' && (md >= 1201 || md <= 106));
  return { kind, season, xmas, snow: kind === 'snow', dim: ['cloud', 'rain', 'snow', 'storm', 'fog'].includes(kind) };
}
/* WMO-Wettercode → Wetterart */
function wxFromCode(c, wind) {
  let k = c >= 95 ? 'storm' : (c >= 71 && c <= 77) || c === 85 || c === 86 ? 'snow' : (c >= 51 && c <= 67) || (c >= 80 && c <= 82) ? 'rain' : c === 45 || c === 48 ? 'fog' : c >= 2 ? 'cloud' : 'sun';
  if ((k === 'sun' || k === 'cloud') && wind >= 30) k = 'wind';
  return k;
}
async function wxFetch(force) {
  if (!wxLiveOn() || WX.busy || !navigator.onLine) return;
  if (!force && WX.live && Date.now() - WX.live.at < 30 * 60 * 1000) return;
  WX.busy = true; WX.err = '';
  try {
    let c = PERSONAL.wxGeo && PERSONAL.wxPos ? PERSONAL.wxPos : null, place = c ? 'Ihrem Standort' : '';
    if (!c && S.company.zip) { c = await plzCoords(S.company.zip); place = S.company.city || S.company.zip; }
    if (!c) { c = [52.28, 8.05]; place = 'Osnabrück'; }
    const r = await fetch(`/wetter/v1/forecast?latitude=${c[0]}&longitude=${c[1]}&current=weather_code,temperature_2m,wind_speed_10m&timezone=auto`, { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const cur = (await r.json()).current;
    WX.live = { kind: wxFromCode(cur.weather_code, cur.wind_speed_10m), temp: cur.temperature_2m, wind: cur.wind_speed_10m, place, at: Date.now() };
    try { localStorage.setItem('wxLive', JSON.stringify(WX.live)); } catch (e) {}
  } catch (e) { WX.err = 'Wetterdaten gerade nicht erreichbar – es wird das zuletzt bekannte Wetter bzw. Sonne gezeigt.'; }
  WX.busy = false;
  if (UI.route === 'kunden' || UI.route === 'einstellungen') render();
}
setTimeout(() => wxFetch(), 1500);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') wxFetch(); });

/* Ebene über dem Haus: Regen, Schnee, Wind, Gewitter, Nebel, Wolkendecke */
function wxLayer(W, dawn, wx) {
  let seed = 11; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  let out = '';
  if (wx.dim) {
    const c = dawn ? '#2A3344' : wx.kind === 'storm' ? '#7D8794' : '#C9D2DC';
    out += `<g class="wx-bank" fill="${c}" opacity="${dawn ? 0.7 : 0.92}">${Array.from({ length: Math.round(W / 70) }, (_, i) => `<ellipse cx="${(i * 70 + rnd() * 30).toFixed(0)}" cy="${(18 + rnd() * 30).toFixed(0)}" rx="${(46 + rnd() * 30).toFixed(0)}" ry="${(16 + rnd() * 10).toFixed(0)}"/>`).join('')}</g>`;
  }
  if (wx.kind === 'rain' || wx.kind === 'storm') {
    const n = Math.round(W / 8);
    out += `<g class="wx-rain" stroke="${dawn ? '#8FA6C2' : '#4F6F96'}" stroke-width="${dawn ? 1.3 : 1.6}" stroke-linecap="round" opacity="${dawn ? 0.75 : 0.8}">${Array.from({ length: n }, () => { const x = Math.round(rnd() * (W + 40)); return `<line x1="${x}" y1="-14" x2="${x - 4}" y2="0" style="animation-delay:-${(rnd() * 1).toFixed(2)}s;animation-duration:${(0.6 + rnd() * 0.35).toFixed(2)}s"/>`; }).join('')}</g>`;
  }
  if (wx.kind === 'storm') {
    const bx = Math.round(W * 0.7);
    out += `<rect class="wx-flash" width="${W}" height="400" fill="#fff" opacity="0"/><polygon class="wx-bolt" points="${bx},40 ${bx - 22},118 ${bx - 6},118 ${bx - 26},196 ${bx + 14},100 ${bx - 2},100 ${bx + 16},40" fill="#FFE27A" stroke="#FFF6C8" stroke-width="2" opacity="0"/>`;
  }
  if (wx.kind === 'snow') {
    const n = Math.round(W / 9);
    out += `<g class="wx-snow" fill="#fff"${dawn ? '' : ' stroke="#9FB2C8" stroke-width="0.7"'}>${Array.from({ length: n }, () => `<circle cx="${(rnd() * W).toFixed(0)}" cy="-6" r="${(1.2 + rnd() * 2).toFixed(1)}" opacity="${(0.6 + rnd() * 0.4).toFixed(2)}" style="animation-delay:-${(rnd() * 8).toFixed(2)}s;animation-duration:${(6 + rnd() * 4).toFixed(2)}s"/>`).join('')}</g>`;
  }
  if (wx.kind === 'wind') {
    out += `<g class="wx-gust" stroke="${dawn ? '#9FB0C6' : '#FFFFFF'}" stroke-width="2.6" stroke-linecap="round" fill="none" opacity=".9">${Array.from({ length: Math.round(W / 120) + 3 }, () => { const y = (40 + rnd() * 230).toFixed(0), x = (rnd() * W).toFixed(0); return `<path d="M${x} ${y} q30 -8 60 0 t60 0" style="animation-delay:-${(rnd() * 3).toFixed(2)}s"/>`; }).join('')}</g>`;
  }
  if (wx.kind === 'fog') {
    out += `<rect width="${W}" height="400" fill="${dawn ? '#5B6678' : '#FFFFFF'}" opacity="${dawn ? 0.18 : 0.35}"/><g class="wx-fog" fill="${dawn ? '#8794A8' : '#FFFFFF'}" opacity="${dawn ? 0.35 : 0.6}">${[250, 290, 330].map((y, i) => `<ellipse cx="${(W * (0.2 + i * 0.3)).toFixed(0)}" cy="${y}" rx="${(W * 0.45).toFixed(0)}" ry="14" style="animation-delay:-${i * 4}s"/>`).join('')}</g>`;
  }
  out += wxSeasonLayer(W, dawn, wx, rnd);
  return out;
}
function wxSeasonLayer(W, dawn, wx, rnd) {
  let out = '';
  const fall = (cls, n, colors, shape) => `<g class="${cls}">${Array.from({ length: n }, () => `<g style="animation-delay:-${(rnd() * 9).toFixed(2)}s;animation-duration:${(7 + rnd() * 5).toFixed(2)}s"><g transform="translate(${(rnd() * W * 0.9 - W * 0.15).toFixed(0)} ${(-10 - rnd() * 30).toFixed(0)})">${shape(colors[Math.floor(rnd() * colors.length)])}</g></g>`).join('')}</g>`;
  if (wx.season === 'autumn' && wx.kind !== 'snow') {
    out += fall('wx-leaves', Math.round(W / 30), ['#D98C3A', '#C4552D', '#E3B341', '#9C5A2A'], c => `<path d="M0 0 C4 -5 10 -4 12 0 C10 4 4 5 0 0Z" fill="${c}"/><line x1="0" y1="0" x2="12" y2="0" stroke="#7A3E15" stroke-width=".6"/>`);
  }
  if (wx.season === 'spring') {
    out += fall('wx-petals', Math.round(W / 40), ['#F6B8C8', '#FFFFFF', '#F9D3DE'], c => `<ellipse rx="3.2" ry="1.8" fill="${c}"/>`);
    out += `<g>${Array.from({ length: Math.round(W / 14) }, () => { const x = (rnd() * W).toFixed(0), y = (350 + rnd() * 45).toFixed(0), c = ['#F6B8C8', '#FFE27A', '#FFFFFF', '#C9A7F0'][Math.floor(rnd() * 4)]; return `<circle cx="${x}" cy="${y}" r="2.6" fill="${c}" opacity="${dawn ? 0.55 : 0.95}"/><circle cx="${x}" cy="${y}" r="1" fill="#E3A21A" opacity="${dawn ? 0.55 : 1}"/>`; }).join('')}</g>`;
  }
  if (wx.season === 'summer' && !wx.dim) {
    out += `<g class="wx-birds" fill="none" stroke="${dawn ? '#0B1220' : '#3A4A5C'}" stroke-width="1.8" stroke-linecap="round">${Array.from({ length: 4 }, (_, i) => `<g style="animation-delay:-${(i * 3.5 + rnd() * 2).toFixed(2)}s"><path transform="translate(${-30 - i * 22} ${(40 + rnd() * 70).toFixed(0)})" d="M0 0 q5 -5 9 0 q4 -5 9 0"/></g>`).join('')}</g>`;
  }
  if (wx.season === 'winter' && !wx.snow) {
    out += `<path d="M0 340 C150 305 300 320 420 335 S560 318 600 324 V400 H0Z" transform="${W > 600 ? 'scale(2 1)' : ''}" fill="#FFFFFF" opacity="${dawn ? 0.12 : 0.45}"/>`;
    out += `<g class="wx-snow" fill="#fff"${dawn ? '' : ' stroke="#9FB2C8" stroke-width="0.7"'}>${Array.from({ length: Math.round(W / 40) }, () => `<circle cx="${(rnd() * W).toFixed(0)}" cy="-6" r="${(1.2 + rnd() * 1.4).toFixed(1)}" opacity=".8" style="animation-delay:-${(rnd() * 10).toFixed(2)}s;animation-duration:${(9 + rnd() * 4).toFixed(2)}s"/>`).join('')}</g>`;
  }
  return out;
}

/* Farben der Bäume je Jahreszeit [hell, dunkel] */
const WX_TREE = { spring: ['#6CC07A', '#1C3A28'], summer: null, autumn: ['#D98C3A', '#5A3A1E'], winter: ['#8FA39A', '#24312B'] };

document.head.insertAdjacentHTML('beforeend', `<style>
@media (prefers-reduced-motion: no-preference) {
  .hero-anim .wx-rain line{animation:wxRain .8s linear infinite}
  .hero-anim .wx-snow circle{animation:wxSnow 8s linear infinite}
  .hero-anim .wx-flash{animation:wxFlash 4.5s linear infinite}
  .hero-anim .wx-bolt{animation:wxFlash 4.5s linear infinite}
  .hero-anim .wx-leaves>g,.hero-anim .wx-petals>g{animation-name:wxLeaf;animation-timing-function:linear;animation-iteration-count:infinite}
  .hero-anim .wx-leaves>g>g>*,.hero-anim .wx-petals>g>g>*{transform-box:fill-box;transform-origin:center;animation:wxSpin 2.4s linear infinite}
  .hero-anim .wx-birds>g{animation:wxBird 14s linear infinite}
  .hero-anim .wx-gust path{stroke-dasharray:40 400;animation:wxGust 3s linear infinite}
  .hero-anim .wx-fog ellipse{animation:wxFog 12s ease-in-out infinite alternate}
  .hero-anim .wx-bank{animation:haDrift 30s ease-in-out infinite alternate}
  .hero-anim svg.wxk-wind .ha-clouds{animation-duration:5s}
  .hero-anim svg.wxk-wind .ha-trees,.hero-anim svg.wxk-storm .ha-trees,.hero-anim svg.wxs-autumn .ha-trees{transform-box:fill-box;transform-origin:50% 100%;animation:wxSway 1.6s ease-in-out infinite alternate}
}
.hero-anim svg.wxk-dim .ha-sunpos{opacity:.35}
.hero-anim svg.wxk-dim .ha-rays{opacity:.3}
@keyframes wxRain{from{transform:translate(0,0)}to{transform:translate(-24px,420px)}}
@keyframes wxSnow{0%{transform:translate(0,0)}25%{transform:translate(10px,105px)}50%{transform:translate(-6px,210px)}75%{transform:translate(8px,315px)}100%{transform:translate(0,420px)}}
@keyframes wxFlash{0%,80%,85%,90%,100%{opacity:0}81%{opacity:.9}86%{opacity:.6}}
@keyframes wxGust{from{stroke-dashoffset:440}to{stroke-dashoffset:0}}
@keyframes wxFog{from{transform:translateX(-40px)}to{transform:translateX(40px)}}
@keyframes wxLeaf{0%{transform:translate(0,0)}25%{transform:translate(60px,105px)}50%{transform:translate(90px,210px)}75%{transform:translate(160px,315px)}100%{transform:translate(200px,430px)}}
@keyframes wxSpin{to{transform:rotate(360deg)}}
@keyframes wxBird{from{transform:translateX(0)}to{transform:translateX(1400px)}}
@keyframes wxSway{from{transform:rotate(-3deg)}to{transform:rotate(3deg)}}
</style>`);

/* Einstellungen → Ansicht: Wetter auf der Startseite */
const STAB_HOME = ['startseite', 'Startseite & Wetter', 'sun'];
STABS_ME.splice(1, 0, STAB_HOME); STABS.splice(STABS.findIndex(t => t[0] === 'ansicht') + 1, 0, STAB_HOME);
SET.startseite = () => {
  const live = wxLiveOn(), st = wxState(), L = WX.live;
  const chip = (a, k, l, on) => `<button class="chip ${on ? '!border-p !text-ink' : ''}" data-a="${a}" data-v="${k}">${l}</button>`;
  const liveBox = `<div class="rounded-[calc(var(--r)-4px)] bg-raised p-3 text-[13px] text-ink2">${WX.busy ? 'Wetter wird geladen …' : L ? `Aktuell bei ${esc(L.place)}: <b>${WX_LABEL[L.kind]}</b>, ${num(L.temp, 1)} °C, Wind ${num(L.wind)} km/h <span class="text-ink3">· Stand ${new Date(L.at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>` : 'Noch keine Wetterdaten geladen.'}${WX.err ? `<div class="text-[12px] text-ink3 mt-1">${WX.err}</div>` : ''}</div>
    <div class="flex flex-wrap items-center gap-2 mt-3"><span class="text-[13px] text-ink3 mr-1">Ort</span>${chip('wx-src', 'zip', 'Firmen-PLZ' + (S.company.zip ? ' ' + esc(S.company.zip) : ''), !PERSONAL.wxGeo)}${chip('wx-src', 'geo', 'Handy-Standort', !!PERSONAL.wxGeo)}<button class="btn-g !h-9 !px-3 text-[13px]" data-a="wx-refresh">${ic('refresh', 15)}Aktualisieren</button></div>
    <p class="hint">Die Jahreszeit (Bäume im Frühling, Sommer, Herbst, Winter) richtet sich automatisch nach dem Datum.</p>`;
  const presetBox = `<div class="flex flex-wrap items-center gap-2"><span class="text-[13px] text-ink3 mr-1 w-full sm:w-auto">Wetter</span>${WX_KINDS.map(([k, l]) => chip('wx-kind', k, l, (PERSONAL.wxKind || 'sun') === k)).join('')}</div>
    <div class="flex flex-wrap items-center gap-2 mt-3"><span class="text-[13px] text-ink3 mr-1 w-full sm:w-auto">Jahreszeit</span>${WX_SEASONS.map(([k, l]) => chip('wx-season', k, l, (PERSONAL.wxSeason || 'auto') === k)).join('')}</div>`;
  const prev = `<div class="hero-anim rounded-[calc(var(--r)-4px)] overflow-hidden border border-line aspect-[16/9] max-w-xl">${houseSVG({ anim: true, car: true }).replace(/ data-sky="1"/, '')}</div>`;
  const xm = PERSONAL.xmas || 'auto';
  const xmasCard = sCard('gift', 'Weihnachtsschmuck', 'Lichterkette, Kranz an der Tür und geschmückter Tannenbaum – automatisch vom 1. Dezember bis 6. Januar.',
    `<div class="flex flex-wrap items-center gap-2">${[['auto', 'Automatisch (1.12.–6.1.)'], ['on', 'Immer an (zum Testen)'], ['off', 'Aus']].map(([k, l]) => chip('wx-xmas', k, l, xm === k)).join('')}</div><p class="hint">Gerade ${wxState().xmas ? '<b>geschmückt</b>' : 'nicht geschmückt'}.</p>`);
  return `<div class="card p-5 sm:p-6">${cardHead('home', 'Vorschau', 'So sieht das Haus auf der Startseite gerade aus – nur in der App, nicht im PDF.')}${prev}</div>` + sCard('sun', 'Wetter und Jahreszeit', 'Echtes Wetter vor Ort oder selbst gewählt.',
    toggleRow('Echte Wetterdaten', '', live ? 'An: aktuelles Wetter vor Ort wird automatisch geladen.' : 'Aus: Sie wählen Wetter und Jahreszeit selbst.', { action: 'wx-live', on: live }) + `<div class="mt-2">${live ? liveBox : presetBox}</div>`) + xmasCard;
};

document.addEventListener('click', e => {
  const a = e.target.closest('[data-a^="wx-"]'); if (!a) return;
  const act = a.dataset.a, v = a.dataset.v;
  if (act === 'wx-live') { PERSONAL.wxMode = wxLiveOn() ? 'preset' : 'live'; savePersonal(); render(); if (wxLiveOn()) wxFetch(true); }
  else if (act === 'wx-kind') { PERSONAL.wxKind = v; savePersonal(); render(); }
  else if (act === 'wx-season') { PERSONAL.wxSeason = v; savePersonal(); render(); }
  else if (act === 'wx-xmas') { PERSONAL.xmas = v; savePersonal(); render(); }
  else if (act === 'wx-refresh') { wxFetch(true); render(); }
  else if (act === 'wx-src') {
    if (v === 'zip') { PERSONAL.wxGeo = false; savePersonal(); wxFetch(true); render(); return; }
    if (!navigator.geolocation) { toast('Standort ist auf diesem Gerät nicht verfügbar.'); return; }
    navigator.geolocation.getCurrentPosition(pos => {
      PERSONAL.wxGeo = true; PERSONAL.wxPos = [Math.round(pos.coords.latitude * 100) / 100, Math.round(pos.coords.longitude * 100) / 100];
      savePersonal(); wxFetch(true); render();
    }, () => toast('Standort nicht freigegeben – es wird die Firmen-PLZ verwendet.'), { timeout: 10000, maximumAge: 3600000 });
  }
});

/* Weihnachtsschmuck: Lichterkette an der Traufe, Kranz an der Tür, Tannenbaum mit Lichtern und Stern */
function xmasDeco(style, top, bot, dawn) {
  const cols = ['#FF4D4D', '#FFD34D', '#4DD2FF', '#7CFF6B'];
  const chain = (x0, x1, y, sag) => {
    let pts = '', bulbs = '', n = Math.round((x1 - x0) / 14);
    for (let i = 0; i <= n; i++) {
      const x = x0 + (x1 - x0) * i / n, k = (i % 4) / 4, yy = y + Math.sin(k * Math.PI) * sag;
      pts += `${x.toFixed(1)},${yy.toFixed(1)} `;
      bulbs += `<circle class="xm-bulb" style="animation-delay:-${((i % 3) * 0.6).toFixed(1)}s" cx="${x.toFixed(1)}" cy="${(yy + 2.5).toFixed(1)}" r="2.6" fill="${cols[i % 4]}"/>`;
    }
    return `<polyline points="${pts}" fill="none" stroke="#1E2A22" stroke-width="1"/>${bulbs}`;
  };
  const door = style === 'modern' ? [382, 292] : [300, 302];
  const wreath = `<g transform="translate(${door[0]} ${door[1]})"><circle r="9" fill="none" stroke="#1F6B3A" stroke-width="5"/>${[0, 1, 2, 3, 4, 5].map(i => { const a = i * Math.PI / 3; return `<circle cx="${(Math.cos(a) * 9).toFixed(1)}" cy="${(Math.sin(a) * 9).toFixed(1)}" r="1.4" fill="#E23B3B"/>`; }).join('')}<path d="M-4 -10 L0 -7 L4 -10 L3 -5 L0 -7 L-3 -5Z" fill="#E23B3B"/></g>`;
  const tx = 568, ty = 330;
  const tree = `<g transform="translate(${tx} ${ty})"><rect x="-3" y="-2" width="6" height="8" fill="#5A3A1E"/>
<polygon points="0,-62 -16,-34 -9,-34 -21,-12 -12,-12 -26,8 26,8 12,-12 21,-12 9,-34 16,-34" fill="${dawn ? '#1C5A34' : '#2E8B4E'}"/>
${[[-6, -40], [7, -30], [-11, -20], [4, -14], [14, -4], [-16, 0], [0, -2], [10, -46]].map(([x, y], i) => `<circle class="xm-bulb" style="animation-delay:-${(i * 0.4).toFixed(1)}s" cx="${x}" cy="${y}" r="2.4" fill="${cols[i % 4]}"/>`).join('')}
<polygon class="xm-star" points="0,-72 2.6,-66 9,-66 4,-62 6,-56 0,-60 -6,-56 -4,-62 -9,-66 -2.6,-66" fill="#FFD34D"/></g>`;
  const lights = style === 'modern' ? chain(194, 438, 192, 5) : chain(bot.l - 8, bot.r + 8, bot.y + 6, 6);
  return `<g class="xm">${lights}${wreath}${tree}</g>`;
}
document.head.insertAdjacentHTML('beforeend', `<style>
@media (prefers-reduced-motion: no-preference) {
  .hero-anim .xm-bulb{animation:xmBlink 1.8s ease-in-out infinite alternate}
  .hero-anim .xm-star{transform-box:fill-box;transform-origin:center;animation:xmStar 2.4s ease-in-out infinite alternate}
}
@keyframes xmBlink{from{opacity:1}to{opacity:.3}}
@keyframes xmStar{from{transform:scale(1);opacity:1}to{transform:scale(1.25);opacity:.75}}
</style>`);
