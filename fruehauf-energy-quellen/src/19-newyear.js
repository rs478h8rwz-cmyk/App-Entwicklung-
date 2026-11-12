/* =========================================================
   Neujahr: Beim ersten Öffnen im neuen Jahr (im Januar) ein Feuerwerk
   über den ganzen Bildschirm mit Neujahrsgruß – einmal pro Jahr und Gerät.
   ========================================================= */
const nyMode = () => PERSONAL.newyear || 'auto';
function nyDue() {
  const d = new Date();
  return nyMode() !== 'off' && d.getMonth() === 0 && PERSONAL.nyShown !== d.getFullYear();
}
let NY = null;
function showNewYear(done) {
  if (NY) return;
  const year = new Date().getFullYear(), first = String((PERSONAL.profile && PERSONAL.profile.name) || '').trim().split(/\s+/)[0];
  PERSONAL.nyShown = year; savePersonal();
  const el = document.createElement('div');
  el.id = 'newyear';
  el.setAttribute('role', 'dialog');
  el.style.cssText = 'position:fixed;inset:0;z-index:200;background:radial-gradient(120% 90% at 50% 100%,#1B2550 0%,#0B1030 45%,#04060F 100%);overflow:hidden;touch-action:none';
  el.innerHTML = `<canvas style="position:absolute;inset:0;width:100%;height:100%;display:block"></canvas>
    <div class="ny-txt" style="position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);text-align:center;padding:0 24px;color:#fff;opacity:0;transition:opacity 1.2s ease .5s">
      <div style="font-size:clamp(14px,2.2vw,18px);letter-spacing:.18em;text-transform:uppercase;color:#FFD98A;font-weight:600">${first ? `Hallo ${esc(first)}` : esc(coName())}</div>
      <div class="h-font" style="font-size:clamp(40px,9vw,92px);line-height:1.05;margin-top:12px;font-weight:700;background:linear-gradient(180deg,#FFF6D8 0%,#FFD166 45%,#F5A524 100%);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:0 0 40px rgba(255,200,90,.25)">Frohes neues Jahr ${year}!</div>
      <div style="font-size:clamp(16px,2.6vw,22px);margin-top:16px;color:rgba(255,255,255,.9);max-width:640px;margin-left:auto;margin-right:auto;line-height:1.45">Wir wünschen ein gesundes und erfolgreiches Jahr ${year} – mit vielen zufriedenen Kunden und jeder Menge Sonne auf den Dächern.</div>
      <div style="margin-top:8px;font-size:14px;color:rgba(255,255,255,.6)">Ihr Team von ${esc(coName())}</div>
      <button data-ny-close style="margin-top:28px;height:48px;padding:0 26px;border-radius:999px;border:0;background:#FFD166;color:#1B1B1B;font-weight:700;font-size:16px;cursor:pointer;box-shadow:0 8px 30px rgba(255,200,90,.35)">Auf ein erfolgreiches ${year}!</button>
    </div>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => { const t = el.querySelector('.ny-txt'); if (t) t.style.opacity = '1'; });

  const cv = el.querySelector('canvas'), ctx = cv.getContext('2d');
  const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, dpr = 1;
  const size = () => { dpr = Math.min(2, window.devicePixelRatio || 1); W = el.clientWidth; H = el.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size(); window.addEventListener('resize', size);
  const COLS = ['#FFD166', '#FF6B6B', '#4FD1C5', '#7AA2FF', '#F78FB3', '#B794F4', '#FFFFFF', '#9AE6B4', S.design.secondary, S.design.primary];
  const rockets = [], parts = [], rnd = (a, b) => a + Math.random() * (b - a), t0 = performance.now();
  let last = t0, nextLaunch = t0 + 150, raf = 0;
  const launch = () => { const x = rnd(W * 0.1, W * 0.9); rockets.push({ x, y: H + 10, vx: rnd(-0.6, 0.6), vy: -rnd(H * 0.0105, H * 0.0135) - 5, ty: rnd(H * 0.12, H * 0.45), col: COLS[(Math.random() * COLS.length) | 0] }); };
  const burst = r => {
    const n = calm ? 40 : (70 + Math.random() * 60) | 0, sp = rnd(2.6, 4.6), ring = Math.random() < 0.3, c2 = COLS[(Math.random() * COLS.length) | 0];
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + rnd(-0.05, 0.05), v = ring ? sp : sp * Math.sqrt(Math.random()); parts.push({ x: r.x, y: r.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, dec: rnd(0.009, 0.016), col: Math.random() < 0.25 ? c2 : r.col, s: rnd(1.4, 2.6), tw: Math.random() < 0.3 }); }
  };
  const frame = now => {
    const dt = Math.min(2.5, (now - last) / 16.7); last = now;
    ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    if (now > nextLaunch) { launch(); if (!calm && Math.random() < 0.35) launch(); nextLaunch = now + (calm ? 1400 : rnd(380, 900)); }
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i]; r.x += r.vx * dt; r.y += r.vy * dt; r.vy += 0.12 * dt;
      ctx.fillStyle = '#FFE8B0'; ctx.beginPath(); ctx.arc(r.x, r.y, 2, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,200,120,.35)'; ctx.beginPath(); ctx.arc(r.x - r.vx * 2, r.y - r.vy * 2, 1.4, 0, 7); ctx.fill();
      if (r.y <= r.ty || r.vy >= 0) { burst(r); rockets.splice(i, 1); }
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.985; p.vy = p.vy * 0.985 + 0.045 * dt; p.life -= p.dec * dt;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      ctx.globalAlpha = Math.max(0, p.tw ? p.life * (0.5 + 0.5 * Math.sin(now / 40 + i)) : p.life);
      ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  const close = () => {
    if (!NY) return;
    NY = null; cancelAnimationFrame(raf); window.removeEventListener('resize', size);
    el.style.transition = 'opacity .5s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 520);
    if (typeof done === 'function') done();
  };
  NY = { close };
  el.addEventListener('click', e => { if (e.target.closest('[data-ny-close]') || performance.now() - t0 > 2500) close(); });
}

/* Vor „Neu in dieser Version“ zuerst das Feuerwerk zeigen */
const _maybeWhatsNewNY = maybeWhatsNew;
maybeWhatsNew = function () {
  if (nyDue()) { if ($('#modal') && $('#modal').innerHTML.trim()) return void setTimeout(maybeWhatsNew, 1500); return showNewYear(() => setTimeout(_maybeWhatsNewNY, 600)); }
  return _maybeWhatsNewNY.apply(this, arguments);
};

/* Einstellungen → Ansicht & Tutorial: ein-/ausschalten und testen */
const _setAnsichtNY = SET.ansicht;
SET.ansicht = () => _setAnsichtNY() + sCard('sparkle', 'Neujahrs-Feuerwerk', 'Beim ersten Öffnen im neuen Jahr: Feuerwerk über den ganzen Bildschirm und ein Neujahrsgruß.',
  `<div class="flex flex-wrap items-center gap-2">${[['auto', 'Automatisch (einmal im Januar)'], ['off', 'Aus']].map(([v, l]) => `<button class="chip ${nyMode() === v ? '!border-p !text-ink' : ''}" data-a="ny-mode" data-v="${v}">${l}</button>`).join('')}<button class="btn-s !h-9 !px-3 text-[13px]" data-a="ny-test">${ic('sparkle', 15)}Jetzt ansehen</button></div>`);
document.addEventListener('click', e => {
  const a = e.target.closest('[data-a="ny-mode"],[data-a="ny-test"]'); if (!a) return;
  if (a.dataset.a === 'ny-test') { const keep = PERSONAL.nyShown; showNewYear(); PERSONAL.nyShown = keep; savePersonal(); return; }
  PERSONAL.newyear = a.dataset.v; savePersonal(); render();
});
document.addEventListener('keydown', e => { if (NY && e.key === 'Escape') NY.close(); });

/* Bild für „Was ist neu“ */
WN_IMG.fireworks = () => `<svg viewBox="0 0 120 80" width="100%" height="100%"><rect width="120" height="80" fill="#0B1030"/>${[[30, 26, '#FFD166'], [78, 20, '#4FD1C5'], [96, 44, '#F78FB3'], [52, 46, '#7AA2FF']].map(([x, y, c]) => Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2; return `<line x1="${x + Math.cos(a) * 3}" y1="${y + Math.sin(a) * 3}" x2="${x + Math.cos(a) * 11}" y2="${y + Math.sin(a) * 11}" stroke="${c}" stroke-width="1.4" stroke-linecap="round"/>`; }).join('')).join('')}<text x="60" y="72" text-anchor="middle" font-size="8" font-weight="700" fill="#FFD166" font-family="Inter, Arial, sans-serif">Frohes neues Jahr!</text></svg>`;
WN_BG.fireworks = '#0B1030';
