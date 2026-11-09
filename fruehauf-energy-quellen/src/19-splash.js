/* Startanimation: Haus → Photovoltaik → Speicher → Wärmepumpe → E-Auto → Zoom → Logo → Zoom → App */
const SPLASH = { ready: false, done: false, skip: false };
const splashCfg = () => Object.assign({ on: true, logo: 'company', file: '' }, S.design.splash || {});
function splashLogoHTML() {
  const c = splashCfg(), url = c.logo === 'custom' ? fileUrl(c.file) : c.logo === 'company' ? (fileUrl(S.company.logoFile) || S.company.logoUrl) : '';
  if (url) return `<img class="sp-img" src="${esc(url)}" alt="">`;
  return `${typeof sunMark === 'function' ? sunMark(96) : ''}<div class="sp-name">${esc(S.company.name || 'Frühauf Energy')}</div>`;
}
const spWait = t => new Promise(r => { const id = setTimeout(r, t); SPLASH.timers = (SPLASH.timers || []).concat(id); });
async function splashRun(el, replay) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, k = reduce ? 0.25 : 1, W = t => (SPLASH.skip ? Promise.resolve() : spWait(t * k));
  const c = splashCfg(); if (c.logo === 'custom' && c.file) await loadFiles([c.file]);
  el.classList.toggle('sp-light', !appDark());
  $('#sp-stage', el).innerHTML = houseSVG({ anim: true, car: true, bat: true, inv: true, style: 'modern', wide: false }).replace(' data-sky="1"', '');
  $('#sp-stage', el).classList.add('hero-anim');
  $('#sp-logo', el).innerHTML = splashLogoHTML();
  /* Module nacheinander einblenden */
  const mods = [...el.querySelectorAll('.spk-pv polygon, .spk-pv rect')].filter(m => !m.closest('.ha-lit') && !m.classList.contains('ha-glint')), modsAll = [...el.querySelectorAll('.spk-pv polygon, .spk-pv rect')]; modsAll.forEach(m => { const i = mods.indexOf(m); m.style.transitionDelay = ((i < 0 ? mods.length : i) * 0.04 * k).toFixed(3) + 's'; });
  await W(60); el.classList.add('s-in');
  await W(1100); el.classList.add('s-pv');                                   // Photovoltaik
  await W(mods.length * 40 + 450); el.classList.add('s-bat');                // Speicher
  await W(900); el.classList.add('s-hp');                                    // Wärmepumpe
  await W(900); el.classList.add('s-car');                                   // E-Auto
  await W(1300);
  while (!SPLASH.ready && !replay) await spWait(80);                 // App fertig geladen?
  el.classList.add('s-zoom'); await W(650);
  el.classList.add('s-logo'); await W(1100);
  el.classList.add('s-out');
  const app = $('#app'); if (app && !reduce) app.animate([{ transform: 'scale(1.05)', opacity: 0.3 }, { transform: 'scale(1)', opacity: 1 }], { duration: 650, easing: 'cubic-bezier(.2,.8,.2,1)' });
  await spWait(reduce ? 150 : 700); el.remove(); SPLASH.done = true; SPLASH.skip = false;
}
function splashStart() {
  const el = $('#splash'); if (!el) return;
  if (!splashCfg().on) { el.remove(); SPLASH.done = true; return; }
  el.addEventListener('click', () => { SPLASH.skip = true; (SPLASH.timers || []).forEach(clearTimeout); SPLASH.timers = []; splashFinishNow(el); });
  splashRun(el).catch(() => el.remove());
}
function splashFinishNow(el) { el.classList.add('s-zoom', 's-logo', 's-out'); setTimeout(() => { el.remove(); SPLASH.done = true; SPLASH.skip = false; }, 450); }
function splashDone() { SPLASH.ready = true; }
/* Erneut ansehen (Einstellungen) */
function splashReplay() {
  if ($('#splash')) return;
  document.body.insertAdjacentHTML('beforeend', '<div id="splash" aria-hidden="true"><div class="sp-stage" id="sp-stage"></div><div class="sp-logo" id="sp-logo"></div><div class="sp-skip">Tippen zum Überspringen</div></div>');
  const el = $('#splash'); el.addEventListener('click', () => { SPLASH.skip = true; (SPLASH.timers || []).forEach(clearTimeout); splashFinishNow(el); });
  splashRun(el, true).catch(() => el.remove());
}
/* Sicherheitsnetz */
setTimeout(() => { const el = $('#splash'); if (el && !SPLASH.done && !el.classList.contains('s-zoom')) { SPLASH.ready = true; } }, 9000);
setTimeout(() => { const el = $('#splash'); if (el && !SPLASH.done) splashFinishNow(el); }, 14000);

/* Einstellungen → Startseite & Wetter: Startanimation */
{
  const _st = SET.startseite;
  SET.startseite = () => {
    const c = splashCfg(), chip = (k, l) => `<button class="chip ${c.logo === k ? '!border-p !text-ink !bg-p/10' : ''}" data-a="sp-logo" data-v="${k}">${l}</button>`;
    const cu = c.file && fileUrl(c.file);
    if (c.file && !cu) loadFiles([c.file]).then(() => { if (fileUrl(c.file)) render(); });
    return _st() + sCard('sparkle', 'Startanimation', 'Beim Öffnen: Haus mit Photovoltaik, Speicher, Wärmepumpe und E-Auto – dann Zoom auf Ihr Logo und hinein in die App.',
      toggleRow('Startanimation zeigen', '', 'Mit einem Tipp lässt sie sich jederzeit überspringen.', { action: 'sp-on', on: c.on }) +
      `<div class="mt-2"><span class="lbl">Logo in der Animation</span><div class="flex flex-wrap gap-2">${chip('company', 'Firmenlogo')}${chip('mark', 'Signet')}${chip('custom', 'Eigenes Bild')}</div>
      ${c.logo === 'custom' ? `<div class="flex items-center gap-3 mt-3">${cu ? `<img src="${esc(cu)}" class="h-14 rounded-lg bg-white p-1.5 border border-line">` : ''}<label class="btn-s btn-sm cursor-pointer">${ic('upload', 15)}${cu ? 'Ersetzen' : 'Bild wählen'}<input type="file" accept="image/*" class="hidden" data-splashlogo="1"></label></div>` : ''}
      ${c.logo === 'company' && !(fileUrl(S.company.logoFile) || S.company.logoUrl) ? '<p class="hint">Noch kein Firmenlogo hinterlegt (Einstellungen → Unternehmen) – bis dahin erscheinen Signet und Firmenname.</p>' : ''}</div>
      <button class="btn-s mt-4" data-a="sp-play">${ic('eye', 16)}Startanimation ansehen</button>`);
  };
}
document.addEventListener('click', e => {
  const a = e.target.closest && e.target.closest('[data-a^="sp-"]'); if (!a) return;
  const c = splashCfg();
  if (a.dataset.a === 'sp-on') { S.design.splash = { ...c, on: !c.on }; saveSettings(); render(); }
  else if (a.dataset.a === 'sp-logo') { S.design.splash = { ...c, logo: a.dataset.v }; saveSettings(); render(); }
  else if (a.dataset.a === 'sp-play') splashReplay();
});
document.addEventListener('change', async e => {
  const el = e.target; if (!el.dataset || !el.dataset.splashlogo || !el.files || !el.files[0]) return;
  try { const blob = await imageKeepAlpha(el.files[0], 800), c = splashCfg(); if (c.file) await delFiles([c.file]); S.design.splash = { ...c, logo: 'custom', file: await putFile(blob, 'startlogo.png') }; saveSettings(); render(); toast('Logo für die Startanimation gespeichert.'); }
  catch (err) { toast('Bild konnte nicht gelesen werden.', 'err'); }
});
