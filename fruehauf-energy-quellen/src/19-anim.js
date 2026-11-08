/* Animationen in der App (nicht im PDF): lebendiges Start-Haus, sanfte Seitenwechsel,
   Karten blenden nacheinander ein, Kennzahlen zählen hoch. Wer „Bewegung reduzieren“
   am Gerät eingestellt hat, bekommt alles ruhig. */
document.head.insertAdjacentHTML('beforeend', `<style>
@media (prefers-reduced-motion: no-preference) {
  /* Start-Haus */
  .hero-anim .ha-sun{animation:haRise 1.6s cubic-bezier(.2,.8,.2,1) both}
  .hero-anim .ha-rays{transform-box:fill-box;transform-origin:center;animation:haSpin 60s linear infinite}
  .hero-anim .ha-clouds{animation:haDrift 18s ease-in-out infinite alternate}
  .hero-anim .ha-house{animation:haUp .9s .15s cubic-bezier(.2,.8,.2,1) both}
  .hero-anim .ha-fan{transform-box:fill-box;transform-origin:center;animation:haSpin 1.4s linear infinite}
  .hero-anim .ha-led{animation:haBlink 2.4s ease-in-out infinite}
  .hero-anim .ha-glow{animation:haGlow 4s ease-in-out infinite alternate}
  .hero-anim .ha-star{animation:haTwinkle 3.5s ease-in-out infinite}
  .hero-anim .ha-glint{opacity:0;animation:haGlint 7s ease-in-out 1.2s infinite}
  .hero-anim .ha-flow{animation:haFlow 1.2s linear infinite}
  .hero-anim .ha-shoot{opacity:0;transform-box:fill-box;animation:haShoot 13s ease-out infinite}
  /* Seitenwechsel und Karten */
  .pg-in{animation:pgIn .35s cubic-bezier(.2,.8,.2,1) both}
  .st-in>*{animation:pgIn .45s cubic-bezier(.2,.8,.2,1) both}
  ${Array.from({ length: 12 }, (_, i) => `.st-in>*:nth-child(${i + 1}){animation-delay:${(i * 0.05).toFixed(2)}s}`).join('')}
  /* Rückmeldung beim Tippen */
  .btn,.btn-p,.btn-s,.btn-g,.chip,.seg button,[data-a=open]{transition:transform .12s ease,background-color .15s,color .15s,border-color .15s}
  .btn:active,.btn-p:active,.btn-s:active,.btn-g:active,.chip:active,.seg button:active{transform:scale(.96)}
  @media (hover:hover){#cust-list>.card{transition:transform .2s ease,box-shadow .2s ease}#cust-list>.card:hover{transform:translateY(-2px);box-shadow:0 14px 30px -18px rgba(0,0,0,.6)}}
  .tgl,.tgl::after{transition:all .22s cubic-bezier(.2,.8,.2,1)}
  #modal .card{animation:mdIn .28s cubic-bezier(.2,.8,.2,1) both}
}
@keyframes haRise{from{transform:translateY(60px);opacity:0}to{transform:none;opacity:1}}
@keyframes haUp{from{transform:translateY(14px);opacity:0}to{transform:none;opacity:1}}
@keyframes haSpin{to{transform:rotate(360deg)}}
@keyframes haDrift{from{transform:translateX(-18px)}to{transform:translateX(26px)}}
@keyframes haBlink{0%,100%{opacity:1}50%{opacity:.25}}
@keyframes haGlow{from{opacity:.1}to{opacity:.3}}
@keyframes haTwinkle{0%,100%{opacity:.8}50%{opacity:.15}}
@keyframes haGlint{0%,70%,100%{opacity:0}78%{opacity:.32}86%{opacity:0}}
@keyframes haFlow{to{stroke-dashoffset:-20}}
@keyframes haShoot{0%{opacity:0;transform:translate(0,0)}2%{opacity:1}8%{opacity:0;transform:translate(140px,50px)}100%{opacity:0;transform:translate(140px,50px)}}
@keyframes pgIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes mdIn{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}
</style>`);

const animOk = () => !matchMedia('(prefers-reduced-motion: reduce)').matches;
/* Zahlen in einem Element von 0 hochzählen (deutsches Format, Einheiten bleiben stehen) */
function countUp(el, ms = 750) {
  const nodes = [], w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) if (/\d/.test(w.currentNode.nodeValue)) nodes.push({ n: w.currentNode, t: w.currentNode.nodeValue });
  if (!nodes.length) return;
  const re = /\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?/g;
  const fmt = (v, dec) => new Intl.NumberFormat('de-DE', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(v);
  const t0 = performance.now();
  const step = now => {
    const k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 3);
    nodes.forEach(({ n, t }) => { n.nodeValue = k >= 1 ? t : t.replace(re, m => { const dec = (m.split(',')[1] || '').length; return fmt(+m.replace(/\./g, '').replace(',', '.') * e, dec); }); });
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
/* Nach einem Seitenwechsel: Inhalt einblenden, Kartenlisten gestaffelt, Kennzahlen hochzählen */
{
  const _render = render;
  render = function (nav) {
    _render.apply(this, arguments);
    if (!nav || !animOk()) return;
    const main = $('#app main') || $('#app');
    if (main) { main.classList.remove('pg-in'); void main.offsetWidth; main.classList.add('pg-in'); }
    $$('#cust-list, #app .grid').forEach(g => { if (g.children.length > 1 && g.children.length <= 40 && !g.closest('.page')) g.classList.add('st-in'); });
  };
}

/* Tag und Nacht beim Scrollen: dunkel – Sonne geht unter, Mond auf, Licht an;
   hell – umgekehrt (Mond geht unter, Sonne auf, Licht aus). */
function heroSky() {
  $$('.hero-anim svg[data-sky]').forEach(svg => {
    const r = svg.getBoundingClientRect(); if (!r.width) return;
    const docTop = r.top + scrollY, vh = innerHeight, head = 80;
    const start = Math.max(0, docTop + r.height - vh);
    let end = docTop - head - 10;
    if (end - start < 220) end = start + Math.max(220, r.height * 0.45);
    const t = Math.min(1, Math.max(0, (scrollY - start) / (end - start))), e = t * t * (3 - 2 * t);
    const step = (a, b) => { const k = Math.min(1, Math.max(0, (t - a) / (b - a))); return k * k * (3 - 2 * k); };
    const d = svg.dataset, dawn = d.dawn === '1', mx = +d.mx;
    const sun = svg.querySelector('.ha-sunpos'), moon = svg.querySelector('.ha-moon'), night = svg.querySelector('.ha-night'), lit = svg.querySelector('.ha-lit');
    if (!sun || !moon || !night || !lit) return;
    const lerp = (a, b, k) => a + (b - a) * k;
    if (dawn) {
      sun.setAttribute('transform', `translate(0 ${(e * 120).toFixed(1)})`);
      moon.setAttribute('transform', `translate(${mx} ${lerp(340, 90, e).toFixed(1)})`); moon.setAttribute('opacity', '1');
      night.setAttribute('opacity', (e * 0.55).toFixed(3)); lit.setAttribute('opacity', step(0.15, 0.55).toFixed(3));
    } else {
      sun.setAttribute('transform', `translate(${lerp(-70, 0, e).toFixed(1)} ${lerp(200, 0, e).toFixed(1)})`);
      moon.setAttribute('transform', `translate(${mx} ${lerp(80, 340, e).toFixed(1)})`); moon.setAttribute('opacity', '1');
      night.setAttribute('opacity', ((1 - e) * 0.55).toFixed(3)); lit.setAttribute('opacity', (1 - step(0.25, 0.65)).toFixed(3));
    }
  });
}
let skyQueued = false;
window.addEventListener('scroll', () => { if (skyQueued) return; skyQueued = true; requestAnimationFrame(() => { skyQueued = false; heroSky(); }); }, { passive: true });
window.addEventListener('resize', () => heroSky());
{
  const _render2 = render;
  render = function () { _render2.apply(this, arguments); heroSky(); };
}

/* Zahlen bauen sich auf, sobald sie beim Scrollen ins Bild kommen – jedes Mal neu:
   aus dem Bild gescrollt → zurück auf 0, wieder sichtbar → zählt erneut hoch. */
const CU_STATE = new Map(); let cuRoute = '';
const CU_RE = /^[–−+-]?\s*\d[\d.,]*\s*(€|%|kWh|kWp|kW|t|J\.|Jahre|ct|Stk\.?|W|°C|dB\(A\))?(\s*\/\s*(Jahr|Monat|kWh))?$/;
const CU_NUM = /\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?/g;
function cuNodes(el) { const a = [], w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); while (w.nextNode()) if (/\d/.test(w.currentNode.nodeValue)) a.push(w.currentNode); return a; }
function cuZero(el) {
  el._cuTok = (el._cuTok || 0) + 1;
  el._cuOrig.forEach(([n, t]) => { n.nodeValue = t.replace(CU_NUM, m => { const dec = (m.split(',')[1] || '').length; return dec ? '0,' + '0'.repeat(dec) : '0'; }); });
}
function cuRun(el, ms = 750) {
  const tok = el._cuTok = (el._cuTok || 0) + 1, t0 = performance.now();
  const fmt = (v, dec) => new Intl.NumberFormat('de-DE', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(v);
  const step = now => {
    if (el._cuTok !== tok) return;
    const k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 3);
    el._cuOrig.forEach(([n, t]) => { n.nodeValue = k >= 1 ? t : t.replace(CU_NUM, m => { const dec = (m.split(',')[1] || '').length; return fmt(+m.replace(/\./g, '').replace(',', '.') * e, dec); }); });
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const cuIO = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(en => {
  const el = en.target, key = el.dataset.cu;
  if (en.isIntersecting && en.intersectionRatio >= 0.5) {
    if (el._cuSkip) { el._cuSkip = false; CU_STATE.set(key, 'in'); return; }
    if (CU_STATE.get(key) !== 'in') { CU_STATE.set(key, 'in'); cuRun(el); }
  } else if (!en.isIntersecting) {
    el._cuSkip = false;
    if (CU_STATE.get(key) !== 'out') { CU_STATE.set(key, 'out'); cuZero(el); }
  }
}), { threshold: [0, 0.5] }) : null;
function markNumbers() {
  const route = location.hash; if (route !== cuRoute) { cuRoute = route; CU_STATE.clear(); }
  if (!cuIO || !animOk()) return;
  cuIO.disconnect();
  let i = 0;
  const cands = $$('#app main [data-countup], #app main :is(div,span,b,strong,td)').filter(el => {
    if (el.closest('.page, svg, label, button, select, textarea, #modal, .hint, [contenteditable]')) return false;
    if (el.hasAttribute('data-countup')) return true;
    if (el.childElementCount > 2) return false;
    const t = el.textContent.trim();
    if (!t || t.length > 22 || !CU_RE.test(t)) return false;
    return parseFloat(getComputedStyle(el).fontSize) >= 16;
  });
  cands.forEach(el => {
    if (el.parentElement && el.parentElement.closest('[data-cu]')) return;
    const key = (i++) + '|' + el.textContent.trim(); el.dataset.cu = key;
    el._cuOrig = cuNodes(el).map(n => [n, n.nodeValue]);
    /* Schon sichtbare Zahl bei einer Eingabe nicht erneut zählen lassen */
    if (CU_STATE.get(key) === 'in') el._cuSkip = true;
    else { CU_STATE.set(key, 'out'); cuZero(el); }
    cuIO.observe(el);
  });
}
{
  const _render3 = render;
  render = function () { _render3.apply(this, arguments); markNumbers(); };
}
