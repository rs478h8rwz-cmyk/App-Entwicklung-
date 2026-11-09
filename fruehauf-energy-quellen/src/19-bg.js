/* Sanft animierter App-Hintergrund: große, weiche Farbflächen in den Firmenfarben,
   die sehr langsam wandern. Nur in der App (nicht im PDF), ruhig bei „Bewegung reduzieren“. */
document.head.insertAdjacentHTML('beforeend', `<style>
#bg-anim{position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden}
#bg-anim i{position:absolute;border-radius:50%;opacity:var(--bgo,.16);will-change:transform;transform:translateZ(0);backface-visibility:hidden}
#bg-anim i:nth-child(1){width:70vmax;height:70vmax;left:-25vmax;top:-30vmax;background:radial-gradient(circle,rgb(var(--p-rgb)) 0%,transparent 70%);animation:bgA 46s ease-in-out infinite alternate}
#bg-anim i:nth-child(2){width:60vmax;height:60vmax;right:-25vmax;top:20vh;background:radial-gradient(circle,rgb(var(--s-rgb)) 0%,transparent 70%);animation:bgB 58s ease-in-out infinite alternate;opacity:calc(var(--bgo,.16) * .7)}
#bg-anim i:nth-child(3){width:55vmax;height:55vmax;left:10vw;bottom:-30vmax;background:radial-gradient(circle,rgb(var(--p-rgb)) 0%,transparent 70%);animation:bgC 64s ease-in-out infinite alternate;opacity:calc(var(--bgo,.16) * .8)}
@keyframes bgA{to{transform:translate3d(18vw,22vh,0) scale(1.15)}}
@keyframes bgB{to{transform:translate3d(-22vw,-14vh,0) scale(.9)}}
@keyframes bgC{to{transform:translate3d(16vw,-18vh,0) scale(1.1)}}
@media (prefers-reduced-motion: reduce){#bg-anim i{animation:none}}
@media print{#bg-anim{display:none}}
</style>`);
function bgAnimOn() { if (typeof PERSONAL === 'undefined' || !PERSONAL) return true; if (PERSONAL.bgAnim === false) return false; if (PERSONAL.bgAnim === true) return true; return !(matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) >= 700); }
function bgAnimApply() { const el = document.getElementById('bg-anim'); if (bgAnimOn()) { if (!el) document.body.insertAdjacentHTML('afterbegin', '<div id="bg-anim" aria-hidden="true"><i></i><i></i><i></i></div>'); bgAnimTone && bgAnimTone(); } else if (el) el.remove(); }
document.body.insertAdjacentHTML('afterbegin', '<div id="bg-anim" aria-hidden="true"><i></i><i></i><i></i></div>');
/* Stärke je Ansicht: im dunklen Modus etwas kräftiger, im hellen sehr zart */
function bgAnimTone() { const el = $('#bg-anim'); if (el) el.style.setProperty('--bgo', appDark() ? '.24' : '.15'); }
{ const _at = applyTheme; applyTheme = function () { const r = _at.apply(this, arguments); bgAnimTone(); return r; }; }
bgAnimTone();
setTimeout(() => { try { bgAnimApply(); } catch (e) {} }, 0);

/* Leistung: Haus-Animation pausieren, solange das Haus nicht zu sehen ist; nur jeder dritte Stern funkelt;
   im Hintergrund (App nicht sichtbar) alles anhalten */
document.head.insertAdjacentHTML('beforeend', `<style>
.hero-anim svg.hero-off *{animation-play-state:paused!important}
.hero-anim .ha-star:not(:nth-of-type(3n)){animation:none!important}
.app-hidden *{animation-play-state:paused!important}
</style>`);
const heroIO = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('hero-off', !e.isIntersecting)), { rootMargin: '40px' }) : null;
function heroWatch() { if (!heroIO) return; heroIO.disconnect(); $$('#app .hero-anim svg, #modal .hero-anim svg').forEach(s => heroIO.observe(s)); }
{ const _rh = render; render = function () { const r = _rh.apply(this, arguments); heroWatch(); return r; }; }
document.addEventListener('visibilitychange', () => document.documentElement.classList.toggle('app-hidden', document.hidden));

/* Modulplan offen: nach dem Schließen der Tastatur Ansicht oben halten (Seite ist dort fixiert) */


/* Einstellungen → Ansicht: Tastatur-Hilfe (zum Eingrenzen auf dem iPad) */
{
  const _sa = SET.ansicht;
  SET.ansicht = () => {
    const tab = isTablet ? isTablet() : false, row = (k, l, h, on) => toggleRow(l, '', h, { action: 'kbdh', data: `data-k="${k}"`, on });
    const pillOn = PERSONAL.kbdPill === true || (PERSONAL.kbdPill !== false && !tab), bgOn = bgAnimOn(), spOn = (S.design.splash || {}).on !== false;
    return _sa() + sCard('info', 'Tastatur-Hilfe', 'Öffnet sich auf dem iPad keine Tastatur? Hier testen und einzeln abschalten.',
      `<label class="block"><span class="lbl">Testfeld – hier antippen</span><input class="inp" id="kbd-test" placeholder="Hier tippen …" autocomplete="off"></label>
      ${row('kbdPill', 'Knopf „ABC Buchstaben“ bei Zahlenfeldern', 'Auf dem iPad standardmäßig aus.', pillOn)}
      ${row('bgAnim', 'Bewegter Hintergrund', 'Auf dem iPad standardmäßig aus.', bgOn)}
      ${row('splash', 'Startanimation', 'Haus und Logo beim Öffnen der App.', spOn)}`);
  };
}
document.addEventListener('click', e => {
  const a = e.target.closest && e.target.closest('[data-a="kbdh"]'); if (!a) return;
  const k = a.dataset.k;
  if (k === 'kbdPill') { const tab = isTablet(), cur = PERSONAL.kbdPill === true || (PERSONAL.kbdPill !== false && !tab); PERSONAL.kbdPill = !cur; savePersonal(); }
  else if (k === 'bgAnim') { PERSONAL.bgAnim = !bgAnimOn(); savePersonal(); bgAnimApply(); }
  else if (k === 'splash') { S.design.splash = { ...(S.design.splash || {}), on: (S.design.splash || {}).on === false }; saveSettings(); }
  render();
});

/* Sicherheitsnetz: kein fixierter body außerhalb des Modulplans */
window.addEventListener('hashchange', () => { if (!document.getElementById('roof-ed') && document.body.style.position === 'fixed') { document.body.style.position = ''; document.body.style.top = ''; } });
