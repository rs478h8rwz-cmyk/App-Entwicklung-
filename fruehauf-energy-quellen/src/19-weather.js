/* Wetter und Jahreszeit für das Start-Haus.
   Regler „Echte Wetterdaten“: holt das aktuelle Wetter (Open-Meteo, ohne Konto) für den
   Handy-Standort oder die Firmen-PLZ. Aus: Wetter und Jahreszeit selbst wählen. */
const WX_KINDS = [['sun', 'Sonne'], ['cloud', 'Bewölkt'], ['rain', 'Regen'], ['snow', 'Schnee'], ['wind', 'Wind'], ['storm', 'Gewitter'], ['fog', 'Nebel']];
const WX_SEASONS = [['auto', 'Automatisch'], ['spring', 'Frühling'], ['summer', 'Sommer'], ['autumn', 'Herbst'], ['winter', 'Winter']];
const WX_LABEL = Object.fromEntries(WX_KINDS);
const WX = { live: null, busy: false, err: '' };
try { WX.live = JSON.parse(localStorage.getItem('wxLive') || 'null'); } catch (e) {}

/* Ostersonntag (Gaußsche Osterformel, gregorianisch) */
function easterSunday(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, month - 1, day);
}
const seasonNow = () => { const m = new Date().getMonth() + 1; return m <= 2 || m === 12 ? 'winter' : m <= 5 ? 'spring' : m <= 8 ? 'summer' : 'autumn'; };
const wxLiveOn = () => PERSONAL.wxMode !== 'preset';
function wxState() {
  const live = wxLiveOn();
  const kind = live ? (WX.live && WX.live.kind) || 'sun' : PERSONAL.wxKind || 'sun';
  const season = live || !PERSONAL.wxSeason || PERSONAL.wxSeason === 'auto' ? seasonNow() : PERSONAL.wxSeason;
  const d = new Date(), md = (d.getMonth() + 1) * 100 + d.getDate();
  const fest = (k, auto) => PERSONAL[k] === 'on' || (PERSONAL[k] !== 'off' && auto);
  const es = easterSunday(d.getFullYear()), dd = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - es) / 864e5);
  const xmas = fest('xmas', md >= 1201 || md <= 106), easter = fest('easter', dd >= -14 && dd <= 1), halloween = fest('halloween', md >= 1020 && md <= 1101);
  return { kind, season, xmas, easter, halloween, snow: kind === 'snow', dim: ['cloud', 'rain', 'snow', 'storm', 'fog'].includes(kind) };
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
  const ws = wxState(), es = (() => { const y = new Date().getFullYear(), e = easterSunday(y); return Date.now() > +e + 2 * 864e5 ? easterSunday(y + 1) : e; })(), esTxt = d => `${d.getDate()}.${d.getMonth() + 1}.`;
  const FESTS = [
    ['xmas', 'Weihnachten', 'Lichterkette, Kranz an der Tür, Tannenbaum mit Stern', '1.12.–6.1.'],
    ['easter', 'Ostern', 'Bunte Eier im Gras und am Baum, hoppelnder Osterhase', `${esTxt(new Date(es - 14 * 864e5))}–${esTxt(new Date(+es + 864e5))}`],
    ['halloween', 'Halloween', 'Leuchtende Kürbisse an der Tür, Fledermäuse und ein kleines Gespenst', '20.10.–1.11.']
  ];
  const xmasCard = sCard('gift', 'Feiertags-Schmuck', 'Das Haus schmückt sich automatisch zur passenden Zeit. Zum Testen einzeln einschalten.',
    FESTS.map(([k, t, d, range], i) => { const cur = PERSONAL[k] || 'auto'; return `<div class="${i ? 'mt-4 pt-4 border-t border-line' : ''}"><div class="flex flex-wrap items-baseline gap-x-2"><span class="text-[14px] font-semibold">${t}</span><span class="text-[12px] text-ink3">${d}</span>${ws[k] ? '<span class="badge bg-p/10 text-p !py-0 !text-[11px]">gerade aktiv</span>' : ''}</div>
      <div class="flex flex-wrap items-center gap-2 mt-2">${[['auto', `Automatisch (${range})`], ['on', 'Immer an'], ['off', 'Aus']].map(([v, l]) => `<button class="chip ${cur === v ? '!border-p !text-ink' : ''}" data-a="wx-fest" data-k="${k}" data-v="${v}">${l}</button>`).join('')}</div></div>`; }).join(''));
  return `<div class="card p-5 sm:p-6">${cardHead('home', 'Vorschau', 'So sieht das Haus auf der Startseite gerade aus – nur in der App, nicht im PDF.')}${prev}</div>` + sCard('sun', 'Wetter und Jahreszeit', 'Echtes Wetter vor Ort oder selbst gewählt.',
    toggleRow('Echte Wetterdaten', '', live ? 'An: aktuelles Wetter vor Ort wird automatisch geladen.' : 'Aus: Sie wählen Wetter und Jahreszeit selbst.', { action: 'wx-live', on: live }) + `<div class="mt-2">${live ? liveBox : presetBox}</div>`) + xmasCard;
};

document.addEventListener('click', e => {
  const a = e.target.closest('[data-a^="wx-"]'); if (!a) return;
  const act = a.dataset.a, v = a.dataset.v;
  if (act === 'wx-live') { PERSONAL.wxMode = wxLiveOn() ? 'preset' : 'live'; savePersonal(); render(); if (wxLiveOn()) wxFetch(true); }
  else if (act === 'wx-kind') { PERSONAL.wxKind = v; savePersonal(); render(); }
  else if (act === 'wx-season') { PERSONAL.wxSeason = v; savePersonal(); render(); }
  else if (act === 'wx-fest') { PERSONAL[a.dataset.k] = v; savePersonal(); render(); }
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
  /* Rentier mit roter Nase (Kopf rechts), wiederverwendbar */
  const deer = (red, legs = 0) => `<g><ellipse cx="0" cy="0" rx="11" ry="5.2" fill="#8A5A34"/><path d="M8 -2 L12 -9 L15 -8 L13 -1Z" fill="#8A5A34"/><circle cx="15" cy="-10" r="3.6" fill="#8A5A34"/>
<path d="M14 -13 l-2 -6 m1 3 l-3 -1 M17 -13 l2 -6 m-1 3 l3 -1" stroke="#5A3A1E" stroke-width="1.2" fill="none" stroke-linecap="round"/><circle cx="16.4" cy="-10.8" r=".8" fill="#1B1B1B"/>
<circle cx="18.6" cy="-9" r="${red ? 2 : 1.2}" fill="${red ? '#FF2E2E' : '#3A2414'}"${red ? ' class="xm-nose"' : ''}/>
<path d="M-7 3 l${-2 - legs} 8 M-3 3 l${1 + legs} 8 M5 3 l${-2 - legs} 8 M9 3 l${1 + legs} 8" stroke="#6B4426" stroke-width="1.6" stroke-linecap="round"/><circle cx="-11" cy="-2" r="1.6" fill="#F4EDE2"/></g>`;
  const sleigh = `<g class="xm-sleigh"><g class="xm-bob">
<g transform="translate(64 0)">${deer(true, 2)}</g><g transform="translate(36 2)">${deer(false, 2)}</g>
<path d="M47 0 L30 4 M75 -2 L52 2 M24 6 L8 8" stroke="#C9A227" stroke-width=".9" fill="none"/>
<path d="M-26 0 L6 0 Q10 0 10 4 L10 8 L-22 8 Q-28 8 -28 2Z" fill="#C8102E"/><path d="M-30 12 L12 12 Q16 12 16 8" stroke="#E3B341" stroke-width="1.6" fill="none" stroke-linecap="round"/>
<path d="M-24 8 V12 M4 8 V12" stroke="#E3B341" stroke-width="1.4"/>
<ellipse cx="-20" cy="-4" rx="7" ry="6" fill="#7A5230"/>
<circle cx="-4" cy="-4" r="6.5" fill="#C8102E"/><circle cx="-2" cy="-12" r="4" fill="#F2C9A8"/><path d="M-6 -11 Q-2 -2 2 -11 Q0 -8 -2 -8 Q-4 -8 -6 -11Z" fill="#fff"/>
<path d="M-6 -14 L-1 -22 L3 -14Z" fill="#C8102E"/><rect x="-7" y="-15" width="11" height="2.6" rx="1.3" fill="#fff"/><circle cx="-1" cy="-22.5" r="1.6" fill="#fff"/>
</g></g>`;
  /* Rentier im Hintergrund, das ab und zu auftaucht */
  const bgDeer = `<g class="xm-deer"><g transform="translate(498 270) scale(.9)">${deer(true)}</g></g>`;
  return `<g class="xm">${bgDeer}${lights}${wreath}${tree}<g transform="translate(0 100) scale(1.3)">${sleigh}</g></g>`;
}
document.head.insertAdjacentHTML('beforeend', `<style>
@media (prefers-reduced-motion: no-preference) {
  .hero-anim .xm-bulb{animation:xmBlink 1.8s ease-in-out infinite alternate}
  .hero-anim .xm-sleigh{animation:xmSleigh 24s linear infinite}
  .hero-anim .xm-bob{animation:xmBob 1.4s ease-in-out infinite alternate}
  .hero-anim .xm-nose{animation:xmNose 1s ease-in-out infinite alternate}
  .hero-anim .xm-deer{animation:xmDeer 19s ease-in-out infinite}
  .hero-anim .xm-star{transform-box:fill-box;transform-origin:center;animation:xmStar 2.4s ease-in-out infinite alternate}
}
.hero-anim .xm-sleigh{transform:translate(-900px,0)}
.hero-anim .xm-deer{opacity:0}
@keyframes xmSleigh{0%{transform:translate(-900px,30px)}40%{transform:translate(760px,-28px)}100%{transform:translate(760px,-28px)}}
@keyframes xmBob{from{transform:translateY(0)}to{transform:translateY(-5px)}}
@keyframes xmNose{from{opacity:1}to{opacity:.45}}
@keyframes xmDeer{0%,55%{opacity:0}62%,88%{opacity:1}95%,100%{opacity:0}}
@keyframes xmBlink{from{opacity:1}to{opacity:.3}}
@keyframes xmStar{from{transform:scale(1);opacity:1}to{transform:scale(1.25);opacity:.75}}
</style>`);

/* Ostern: bunte Eier im Gras und am Baum, hoppelnder Hase */
function easterDeco(style, dawn) {
  const ec = ['#FF7AA8', '#7FD3FF', '#FFD34D', '#8CE07A', '#C9A7F0', '#FF9F5A'];
  const egg = (x, y, i, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse rx="4.2" ry="5.6" fill="${ec[i % ec.length]}"/><path d="M-4 0 q2 -2 4 0 t4 0" fill="none" stroke="#fff" stroke-width="1.1" opacity=".9"/><circle cx="0" cy="-3" r=".9" fill="#fff" opacity=".9"/></g>`;
  const grass = [[236, 340], [256, 346], [342, 342], [430, 346], [462, 344], [496, 349], [210, 349]].map(([x, y], i) => egg(x, y, i, 1.45)).join('');
  const onTree = [[532, 330], [546, 326], [538, 342], [550, 339]].map(([x, y], i) => egg(x, y, i + 2, 0.95)).join('');
  const fur = dawn ? '#B9A48C' : '#E9DCC8', furD = dawn ? '#9C8870' : '#D2C1A8';
  const bunny = `<g class="ea-bunny"><g transform="translate(572 338) scale(1.6)"><ellipse cx="0" cy="-2" rx="10" ry="8" fill="${fur}"/><circle cx="8" cy="-11" r="5.6" fill="${fur}"/>
<ellipse cx="6" cy="-22" rx="2.2" ry="7" fill="${fur}" transform="rotate(-12 6 -22)"/><ellipse cx="11" cy="-22" rx="2.2" ry="7" fill="${fur}" transform="rotate(10 11 -22)"/>
<ellipse cx="6" cy="-22" rx="1" ry="4.6" fill="#F4B8C8" transform="rotate(-12 6 -22)"/><ellipse cx="11" cy="-22" rx="1" ry="4.6" fill="#F4B8C8" transform="rotate(10 11 -22)"/>
<circle cx="10.5" cy="-12" r="1" fill="#2B2B2B"/><circle cx="13.2" cy="-10" r=".9" fill="#F4A0B4"/><circle cx="-10" cy="-4" r="3.2" fill="#fff"/><ellipse cx="4" cy="5" rx="4" ry="2" fill="${furD}"/></g></g>`;
  return `<g class="ea">${grass}${onTree}${bunny}</g>`;
}
/* Halloween: Kürbisse mit flackerndem Licht, Fledermäuse, kleines Gespenst */
function halloweenDeco(style, dawn) {
  const pump = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="-5" cy="0" rx="6" ry="7.5" fill="#E07B1F"/><ellipse cx="5" cy="0" rx="6" ry="7.5" fill="#E07B1F"/><ellipse cx="0" cy="0" rx="6.5" ry="8" fill="#F08A24"/>
<rect x="-1.2" y="-11" width="2.4" height="4" rx="1" fill="#4E6B2A"/><g class="hw-glow" fill="#FFE27A"><polygon points="-6,-3 -3,-3 -4.5,-0.5"/><polygon points="3,-3 6,-3 4.5,-0.5"/><path d="M-6 2 L-4 4 L-2 2.6 L0 4.4 L2 2.6 L4 4 L6 2 L4 5.6 L-4 5.6Z"/></g></g>`;
  const door = style === 'modern' ? [364, 400] : [276, 324];
  const pumps = pump(door[0] - 12, 326, 1.15) + pump(door[1] + 12, 327, 1) + pump(door[1] + 26, 330, 0.75) + pump(436, 333, 0.9);
  const bat = `<path d="M0 0 C-4 -5 -9 -5 -13 -1 C-10 -1 -9 1 -8 3 C-6 1 -3 1 -2 3 L0 1 L2 3 C3 1 6 1 8 3 C9 1 10 -1 13 -1 C9 -5 4 -5 0 0Z" fill="${dawn ? '#05070C' : '#2B2233'}"/>`;
  const bats = `<g class="hw-bats">${[[0, 60, 0], [-40, 95, -3], [-90, 40, -6], [-20, 120, -8], [-70, 75, -10]].map(([x, y, d]) => `<g style="animation-delay:${d}s"><g transform="translate(${x} ${y}) scale(1.8)"><g class="hw-flap">${bat}</g></g></g>`).join('')}</g>`;
  const ghost = `<g class="hw-ghost"><g transform="translate(112 218) scale(1.5)"><path d="M-10 10 L-10 -4 C-10 -14 10 -14 10 -4 L10 10 L6 7 L3 10 L0 7 L-3 10 L-6 7Z" fill="#F4F6FA" opacity=".92"/><circle cx="-3.5" cy="-3" r="1.6" fill="#1B2230"/><circle cx="3.5" cy="-3" r="1.6" fill="#1B2230"/><ellipse cx="0" cy="2" rx="1.6" ry="2" fill="#1B2230"/></g></g>`;
  return `<g class="hw">${bats}${ghost}${pumps}</g>`;
}
document.head.insertAdjacentHTML('beforeend', `<style>
@media (prefers-reduced-motion: no-preference) {
  .hero-anim .ea-bunny{transform-box:fill-box;transform-origin:center;animation:eaHop 11s linear infinite}
  .hero-anim .hw-glow{animation:hwFlicker 1.3s ease-in-out infinite alternate}
  .hero-anim .hw-bats>g{animation:hwBat 11s ease-in-out infinite}
  .hero-anim .hw-flap{transform-box:fill-box;transform-origin:center;animation:hwFlap .2s ease-in-out infinite alternate}
  .hero-anim .hw-ghost{transform-box:fill-box;transform-origin:center;animation:hwGhost 9s ease-in-out infinite}
}
@keyframes eaHop{0.0%{transform:translate(0px,0px) scaleX(-1)}5.0%{transform:translate(-18px,-16px) scaleX(-1)}10.0%{transform:translate(-36px,0px) scaleX(-1)}15.0%{transform:translate(-54px,-16px) scaleX(-1)}20.0%{transform:translate(-72px,0px) scaleX(-1)}25.0%{transform:translate(-90px,-16px) scaleX(-1)}30.0%{transform:translate(-108px,0px) scaleX(-1)}35.0%{transform:translate(-126px,-16px) scaleX(-1)}40.0%{transform:translate(-144px,0px) scaleX(-1)}43%{transform:translate(-144px,0) scaleX(1)}45.0%{transform:translate(-144px,0px) scaleX(1)}50.0%{transform:translate(-126px,-16px) scaleX(1)}55.0%{transform:translate(-108px,0px) scaleX(1)}60.0%{transform:translate(-90px,-16px) scaleX(1)}65.0%{transform:translate(-72px,0px) scaleX(1)}70.0%{transform:translate(-54px,-16px) scaleX(1)}75.0%{transform:translate(-36px,0px) scaleX(1)}80.0%{transform:translate(-18px,-16px) scaleX(1)}85.0%{transform:translate(0px,0px) scaleX(1)}100%{transform:translate(0,0) scaleX(1)}}
@keyframes hwFlicker{0%{opacity:1}40%{opacity:.7}60%{opacity:.95}100%{opacity:.6}}
@keyframes hwBat{0%{transform:translate(-60px,0)}20%{transform:translate(90px,-34px)}40%{transform:translate(240px,14px)}60%{transform:translate(390px,-38px)}80%{transform:translate(540px,8px)}100%{transform:translate(720px,-22px)}}
@keyframes hwFlap{from{transform:scaleY(1)}to{transform:scaleY(.2)}}
@keyframes hwGhost{0%{transform:translate(0,0) rotate(0);opacity:.95}20%{transform:translate(36px,-26px) rotate(8deg);opacity:.6}40%{transform:translate(80px,-8px) rotate(-6deg);opacity:.95}60%{transform:translate(56px,18px) rotate(5deg);opacity:.45}80%{transform:translate(18px,8px) rotate(-8deg);opacity:.9}100%{transform:translate(0,0) rotate(0);opacity:.95}}
</style>`);
