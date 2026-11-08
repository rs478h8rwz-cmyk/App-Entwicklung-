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
@keyframes haShoot{0%{opacity:0;transform:translate(0,0)}2%{opacity:1}8%{opacity:0;transform:translate(-140px,50px)}100%{opacity:0;transform:translate(-140px,50px)}}
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
    $$('#app [data-countup]').forEach(el => countUp(el));
  };
}
